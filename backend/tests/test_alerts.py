"""
Tests for GET /alerts and POST /alerts/{id}/respond
Covers: list alerts, respond, duplicate response, incorrect_report abuse logging.
"""
from unittest.mock import AsyncMock, patch

from tests.conftest import FAKE_ALERT, FAKE_REPORT, FAKE_VEHICLE


# ─── GET /alerts ──────────────────────────────────────────────────────────────

async def test_list_alerts_no_vehicles(client):
    """User with no vehicles gets an empty alert list."""
    with patch("app.routers.alerts.db_select", new_callable=AsyncMock, return_value=[]):
        res = await client.get("/alerts")

    assert res.status_code == 200
    assert res.json() == []


async def test_list_alerts_returns_enriched_data(client):
    """Alerts are enriched with vehicle and report data."""
    with (
        patch("app.routers.alerts.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.alerts.db_query", new_callable=AsyncMock, side_effect=[
            [FAKE_ALERT],   # alerts for vehicle-1
            [FAKE_REPORT],  # report for alert
        ]),
    ):
        res = await client.get("/alerts")

    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["plate_number"] == "ABC123"
    assert data[0]["make"] == "Toyota"
    assert data[0]["issue_type"] == "blocking_driveway"
    assert data[0]["owner_response"] is None


# ─── POST /alerts/{id}/respond ────────────────────────────────────────────────

async def test_respond_to_alert_success(client):
    """Owner can respond to a pending alert."""
    responded_alert = {**FAKE_ALERT, "owner_response": "moving_now", "delivery_status": "sent"}

    with (
        patch("app.routers.alerts.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.alerts.db_query", new_callable=AsyncMock, side_effect=[
            [FAKE_ALERT],           # fetch alert by id
            [responded_alert],      # re-fetch for enriched response (alerts for vehicle)
            [FAKE_REPORT],          # report for enriched alert
        ]),
        patch("app.routers.alerts.db_update", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.alerts.db_insert", new_callable=AsyncMock, return_value={}),
    ):
        res = await client.post("/alerts/alert-1/respond", json={"response": "moving_now"})

    assert res.status_code == 200
    assert res.json()["owner_response"] == "moving_now"


async def test_respond_to_alert_not_found(client):
    """Responding to an alert that doesn't belong to the user returns 404."""
    with (
        patch("app.routers.alerts.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.alerts.db_query", new_callable=AsyncMock, return_value=[]),
    ):
        res = await client.post("/alerts/nonexistent/respond", json={"response": "moving_now"})

    assert res.status_code == 404


async def test_respond_duplicate_returns_409(client):
    """Responding to an already-responded alert returns 409."""
    already_responded = {**FAKE_ALERT, "owner_response": "already_moved"}

    with (
        patch("app.routers.alerts.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.alerts.db_query", new_callable=AsyncMock, return_value=[already_responded]),
    ):
        res = await client.post("/alerts/alert-1/respond", json={"response": "moving_now"})

    assert res.status_code == 409


async def test_incorrect_report_logs_abuse_event(client):
    """Marking a report as incorrect_report creates an abuse_event for the reporter."""
    responded_alert = {**FAKE_ALERT, "owner_response": "incorrect_report", "delivery_status": "sent"}
    reporter_report = {**FAKE_REPORT, "reporter_user_id": "reporter-xyz"}

    with (
        patch("app.routers.alerts.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.alerts.db_query", new_callable=AsyncMock, side_effect=[
            [FAKE_ALERT],           # fetch alert
            [reporter_report],      # fetch report to get reporter_user_id
            [responded_alert],      # re-fetch enriched alert
            [reporter_report],      # report for enriched alert
        ]),
        patch("app.routers.alerts.db_update", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.alerts.db_insert", new_callable=AsyncMock, return_value={}) as mock_insert,
    ):
        res = await client.post("/alerts/alert-1/respond", json={"response": "incorrect_report"})

    assert res.status_code == 200

    # Abuse event was logged against the reporter
    mock_insert.assert_called_once()
    call_args = mock_insert.call_args.args
    assert call_args[0] == "abuse_events"
    assert call_args[1]["event_type"] == "incorrect_report"
    assert call_args[1]["user_id"] == "reporter-xyz"


async def test_non_incorrect_report_does_not_log_abuse(client):
    """Responding with moving_now does NOT create an abuse event."""
    responded_alert = {**FAKE_ALERT, "owner_response": "moving_now", "delivery_status": "sent"}

    with (
        patch("app.routers.alerts.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.alerts.db_query", new_callable=AsyncMock, side_effect=[
            [FAKE_ALERT],
            [responded_alert],
            [FAKE_REPORT],
        ]),
        patch("app.routers.alerts.db_update", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.alerts.db_insert", new_callable=AsyncMock) as mock_insert,
    ):
        res = await client.post("/alerts/alert-1/respond", json={"response": "moving_now"})

    assert res.status_code == 200
    mock_insert.assert_not_called()
