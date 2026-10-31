"""
Tests for alert delivery (app.services.notify).
Covers: Expo ticket parsing, dead token cleanup, push → SMS fallback,
delivery status recording, Twilio requests, reporter updates.
"""
from unittest.mock import AsyncMock, patch

import httpx

from app.services import notify


def _client_returning(handler):
    """Patch notify's httpx.AsyncClient so requests go to `handler` instead of the network."""
    real_client = httpx.AsyncClient

    def factory(*args, **kwargs):
        kwargs.pop("timeout", None)
        return real_client(transport=httpx.MockTransport(handler))

    return patch("app.services.notify.httpx.AsyncClient", side_effect=factory)


# ─── send_push ────────────────────────────────────────────────────────────────

async def test_send_push_sorts_tickets():
    tickets = {"data": [
        {"status": "ok", "id": "t1"},
        {"status": "error", "message": "gone", "details": {"error": "DeviceNotRegistered"}},
        {"status": "error", "message": "rate limited", "details": {"error": "MessageRateExceeded"}},
    ]}
    with _client_returning(lambda req: httpx.Response(200, json=tickets)):
        accepted, dead = await notify.send_push(["a", "b", "c"], "title", "body")

    assert accepted == ["a"]
    assert dead == ["b"]


async def test_send_push_network_error_counts_as_not_accepted():
    def boom(req):
        raise httpx.ConnectError("down")

    with _client_returning(boom):
        accepted, dead = await notify.send_push(["a"], "title", "body")

    assert accepted == [] and dead == []


async def test_send_push_no_tokens_makes_no_request():
    with _client_returning(lambda req: (_ for _ in ()).throw(AssertionError("no request expected"))):
        assert await notify.send_push([], "title", "body") == ([], [])


async def test_push_to_user_removes_dead_tokens():
    with (
        patch("app.services.notify.db_query", new_callable=AsyncMock, return_value=[{"token": "a"}, {"token": "b"}]),
        patch("app.services.notify.send_push", new_callable=AsyncMock, return_value=([], ["b"])),
        patch("app.services.notify.db_delete", new_callable=AsyncMock) as mock_delete,
    ):
        assert await notify.push_to_user("owner-1", "t", "b") is False

    mock_delete.assert_awaited_once_with("push_tokens", {"user_id": "owner-1", "token": "b"})


# ─── deliver_alert ────────────────────────────────────────────────────────────

async def _deliver(push_ok: bool, phone: str | None, sms_ok: bool):
    with (
        patch("app.services.notify.push_to_user", new_callable=AsyncMock, return_value=push_ok),
        patch("app.services.notify.get_user_phone", new_callable=AsyncMock, return_value=phone),
        patch("app.services.notify.send_sms", new_callable=AsyncMock, return_value=sms_ok) as mock_sms,
        patch("app.services.notify.db_update", new_callable=AsyncMock) as mock_update,
    ):
        await notify.deliver_alert("alert-1", "owner-1", "ABC123", "blocking_driveway", "report-1")
    return mock_sms, mock_update.call_args.args[2]


async def test_deliver_by_push_skips_sms():
    mock_sms, update = await _deliver(push_ok=True, phone="+15550000000", sms_ok=True)
    mock_sms.assert_not_called()
    assert update == {"delivery_status": "sent", "delivery_channel": "push"}


async def test_deliver_falls_back_to_sms():
    mock_sms, update = await _deliver(push_ok=False, phone="+15550000000", sms_ok=True)
    to, body = mock_sms.call_args.args
    assert to == "+15550000000"
    assert "ABC123" in body and "Blocking driveway" in body
    assert update == {"delivery_status": "sent", "delivery_channel": "sms"}


async def test_deliver_records_failure_when_nothing_works():
    _, update = await _deliver(push_ok=False, phone="+15550000000", sms_ok=False)
    assert update == {"delivery_status": "failed", "delivery_channel": None}


async def test_deliver_without_phone_records_failure():
    mock_sms, update = await _deliver(push_ok=False, phone=None, sms_ok=True)
    mock_sms.assert_not_called()
    assert update["delivery_status"] == "failed"


async def test_deliver_swallows_errors():
    """Runs as a background task, so it must never raise."""
    with patch("app.services.notify.push_to_user", new_callable=AsyncMock, side_effect=RuntimeError("db down")):
        await notify.deliver_alert("alert-1", "owner-1", "ABC123", "blocking_driveway", "report-1")


# ─── send_sms / get_user_phone ────────────────────────────────────────────────

async def test_send_sms_skipped_when_twilio_not_configured():
    with (
        patch.object(notify.settings, "twilio_account_sid", None),
        _client_returning(lambda req: (_ for _ in ()).throw(AssertionError("no request expected"))),
    ):
        assert await notify.send_sms("+15550000000", "hi") is False


async def test_send_sms_uses_messaging_service():
    seen = {}

    def handler(req: httpx.Request):
        seen["url"] = str(req.url)
        seen["form"] = dict(httpx.QueryParams(req.content.decode()))
        return httpx.Response(201, json={"sid": "SM1"})

    with (
        patch.object(notify.settings, "twilio_account_sid", "AC123"),
        patch.object(notify.settings, "twilio_auth_token", "secret"),
        patch.object(notify.settings, "twilio_messaging_service_sid", "MG456"),
        patch.object(notify.settings, "twilio_from_number", None),
        _client_returning(handler),
    ):
        assert await notify.send_sms("+15550000000", "hello") is True

    assert "/Accounts/AC123/Messages.json" in seen["url"]
    assert seen["form"] == {"To": "+15550000000", "Body": "hello", "MessagingServiceSid": "MG456"}


async def test_send_sms_reports_twilio_rejection():
    with (
        patch.object(notify.settings, "twilio_account_sid", "AC123"),
        patch.object(notify.settings, "twilio_auth_token", "secret"),
        patch.object(notify.settings, "twilio_from_number", "+15551112222"),
        _client_returning(lambda req: httpx.Response(400, json={"message": "bad number"})),
    ):
        assert await notify.send_sms("+15550000000", "hello") is False


async def test_get_user_phone_adds_plus():
    with _client_returning(lambda req: httpx.Response(200, json={"phone": "15550000000"})):
        assert await notify.get_user_phone("owner-1") == "+15550000000"


# ─── notify_reporter ──────────────────────────────────────────────────────────

async def test_notify_reporter_pushes_response():
    with patch("app.services.notify.push_to_user", new_callable=AsyncMock, return_value=True) as mock_push:
        await notify.notify_reporter("reporter-1", "ABC123", "moving_now", "report-1")

    user_id = mock_push.call_args.args[0]
    body = mock_push.call_args.kwargs["body"]
    assert user_id == "reporter-1"
    assert body == "The owner of ABC123 is moving their vehicle now."
