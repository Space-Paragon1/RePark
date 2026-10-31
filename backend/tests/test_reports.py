"""
Tests for POST /reports.
Covers: abuse block, hourly rate limit, per-plate cooldown, owner notification.
"""
from unittest.mock import AsyncMock, patch

from tests.conftest import FAKE_REPORT, FAKE_VEHICLE

REPORT_BODY = {
    "plate_number": "abc 123",
    "latitude": 1.0,
    "longitude": 1.0,
    "issue_type": "blocking_driveway",
}


async def test_abuse_block(client):
    with patch("app.routers.reports.db_query", new_callable=AsyncMock, return_value=[{}] * 5):
        res = await client.post("/reports", json=REPORT_BODY)

    assert res.status_code == 403


async def test_hourly_rate_limit_logs_abuse_event(client):
    with (
        patch("app.routers.reports.db_query", new_callable=AsyncMock, side_effect=[
            [],                 # abuse events
            [FAKE_REPORT] * 3,  # reports in the last hour
        ]),
        patch("app.routers.reports.db_insert", new_callable=AsyncMock, return_value={}) as mock_insert,
    ):
        res = await client.post("/reports", json=REPORT_BODY)

    assert res.status_code == 429
    assert mock_insert.call_args.args[1]["event_type"] == "rate_limit_exceeded"


async def test_plate_cooldown(client):
    with (
        patch("app.routers.reports.db_query", new_callable=AsyncMock, side_effect=[
            [],             # abuse events
            [],             # reports in the last hour
            [FAKE_REPORT],  # same plate in the last 15 minutes
        ]),
        patch("app.routers.reports.db_insert", new_callable=AsyncMock, return_value={}) as mock_insert,
    ):
        res = await client.post("/reports", json=REPORT_BODY)

    assert res.status_code == 429
    assert mock_insert.call_args.args[1]["event_type"] == "cooldown_exceeded"


async def test_unregistered_plate_not_notified(client):
    with (
        patch("app.routers.reports.db_query", new_callable=AsyncMock, side_effect=[[], [], [], []]),
        patch("app.routers.reports.db_insert", new_callable=AsyncMock, return_value=dict(FAKE_REPORT)),
        patch("app.routers.reports.send_push_notifications", new_callable=AsyncMock) as mock_push,
    ):
        res = await client.post("/reports", json=REPORT_BODY)

    assert res.status_code == 201
    assert res.json()["owner_notified"] is False
    mock_push.assert_not_called()


async def test_registered_plate_notifies_owner(client):
    with (
        patch("app.routers.reports.db_query", new_callable=AsyncMock, side_effect=[
            [], [], [],                      # abuse, hourly, cooldown checks
            [FAKE_VEHICLE],                  # plate lookup
            [{"token": "ExponentPushToken[x]"}],  # owner's push tokens
        ]),
        patch("app.routers.reports.db_insert", new_callable=AsyncMock, side_effect=[dict(FAKE_REPORT), {}]) as mock_insert,
        patch("app.routers.reports.db_update", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.reports.send_push_notifications", new_callable=AsyncMock) as mock_push,
    ):
        res = await client.post("/reports", json=REPORT_BODY)

    assert res.status_code == 201
    assert res.json()["owner_notified"] is True
    assert res.json()["status"] == "notified"
    assert mock_insert.call_args_list[0].args[1]["plate_number"] == "ABC123"
    assert mock_insert.call_args_list[1].args[0] == "alerts"
    assert mock_push.call_args.args[0] == ["ExponentPushToken[x]"]
