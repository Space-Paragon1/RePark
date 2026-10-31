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
        patch("app.routers.reports.open_alert", new_callable=AsyncMock) as mock_open,
        patch("app.routers.reports.deliver_alert", new_callable=AsyncMock) as mock_deliver,
    ):
        res = await client.post("/reports", json=REPORT_BODY)

    assert res.status_code == 201
    assert res.json()["owner_notified"] is False
    assert res.json()["status"] == "submitted"
    mock_open.assert_not_called()
    mock_deliver.assert_not_called()


async def test_registered_plate_alerts_owner(client):
    with (
        patch("app.routers.reports.db_query", new_callable=AsyncMock, side_effect=[
            [], [], [],      # abuse, hourly, cooldown checks
            [FAKE_VEHICLE],  # plate lookup
        ]),
        patch("app.routers.reports.db_insert", new_callable=AsyncMock, return_value=dict(FAKE_REPORT)) as mock_insert,
        patch("app.routers.reports.open_alert", new_callable=AsyncMock, return_value={"id": "alert-1"}) as mock_open,
        patch("app.routers.reports.deliver_alert", new_callable=AsyncMock) as mock_deliver,
    ):
        res = await client.post("/reports", json=REPORT_BODY)

    assert res.status_code == 201
    assert res.json()["owner_notified"] is True
    assert res.json()["status"] == "notified"
    assert mock_insert.call_args.args[1]["plate_number"] == "ABC123"
    mock_open.assert_awaited_once_with("report-1", "vehicle-1")
    # Delivery runs as a background task for the vehicle's owner
    mock_deliver.assert_awaited_once_with(
        "alert-1", "user-abc123", "ABC123", "blocking_driveway", "report-1",
    )


async def test_list_reports_uses_stored_owner_notified(client):
    """A closed report only counts as notified if an alert was actually created."""
    unmatched = {**FAKE_REPORT, "status": "closed", "owner_notified": False}
    unanswered = {**FAKE_REPORT, "id": "report-2", "status": "closed", "owner_notified": True}
    with patch("app.routers.reports.db_query", new_callable=AsyncMock, return_value=[unmatched, unanswered]):
        res = await client.get("/reports")

    assert res.status_code == 200
    assert [r["owner_notified"] for r in res.json()] == [False, True]
