"""
Tests for vehicle registration and plate ownership claims.
Covers: one account per plate, race on the unique index, claim rules, privacy.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx

from tests.conftest import FAKE_USER, FAKE_VEHICLE

NEW_VEHICLE = {"plate_number": "abc-123", "make": "Toyota", "model": "Camry", "color": "Blue"}
OTHER_OWNERS_VEHICLE = {**FAKE_VEHICLE, "id": "vehicle-other", "user_id": "someone-else"}
CLAIM_BODY = {**NEW_VEHICLE, "note": "I bought this car last month"}
FAKE_CLAIM = {
    "id": "claim-1",
    "plate_number": "ABC123",
    "claimant_user_id": FAKE_USER["sub"],
    "current_vehicle_id": "vehicle-other",
    "make": "Toyota",
    "model": "Camry",
    "color": "Blue",
    "note": None,
    "status": "pending",
    "reviewed_at": None,
    "created_at": "2024-01-01T00:00:00+00:00",
}


def _conflict_error() -> httpx.HTTPStatusError:
    response = MagicMock(status_code=409)
    return httpx.HTTPStatusError("conflict", request=MagicMock(), response=response)


# ─── POST /vehicles ───────────────────────────────────────────────────────────

async def test_register_new_plate(client):
    with (
        patch("app.routers.vehicles.db_select", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.vehicles.db_query", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.vehicles.db_insert", new_callable=AsyncMock, return_value=FAKE_VEHICLE) as mock_insert,
    ):
        res = await client.post("/vehicles", json=NEW_VEHICLE)

    assert res.status_code == 201
    assert mock_insert.call_args.args[1]["plate_number"] == "ABC123"


async def test_register_plate_already_on_own_account(client):
    with (
        patch("app.routers.vehicles.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.vehicles.db_query", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]),
        patch("app.routers.vehicles.db_insert", new_callable=AsyncMock) as mock_insert,
    ):
        res = await client.post("/vehicles", json=NEW_VEHICLE)

    assert res.status_code == 409
    assert "your account" in res.json()["detail"]
    assert "x-error-code" not in res.headers
    mock_insert.assert_not_called()


async def test_register_plate_owned_by_someone_else(client):
    with (
        patch("app.routers.vehicles.db_select", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.vehicles.db_query", new_callable=AsyncMock, return_value=[OTHER_OWNERS_VEHICLE]),
        patch("app.routers.vehicles.db_insert", new_callable=AsyncMock) as mock_insert,
    ):
        res = await client.post("/vehicles", json=NEW_VEHICLE)

    assert res.status_code == 409
    assert res.headers["x-error-code"] == "plate_taken"
    # The response must not reveal anything about the other account.
    assert "someone-else" not in res.text
    mock_insert.assert_not_called()


async def test_register_race_caught_by_unique_index(client):
    """If another user registers the plate between the check and the insert,
    the database rejects the insert and the user still gets plate_taken."""
    with (
        patch("app.routers.vehicles.db_select", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.vehicles.db_query", new_callable=AsyncMock, return_value=[]),
        patch("app.routers.vehicles.db_insert", new_callable=AsyncMock, side_effect=_conflict_error()),
    ):
        res = await client.post("/vehicles", json=NEW_VEHICLE)

    assert res.status_code == 409
    assert res.headers["x-error-code"] == "plate_taken"


async def test_register_vehicle_limit(client):
    with patch("app.routers.vehicles.db_select", new_callable=AsyncMock, return_value=[FAKE_VEHICLE] * 10):
        res = await client.post("/vehicles", json=NEW_VEHICLE)

    assert res.status_code == 422


# ─── POST /vehicles/claims ────────────────────────────────────────────────────

async def test_claim_created(client):
    with (
        patch("app.routers.vehicles.db_query", new_callable=AsyncMock, side_effect=[
            [OTHER_OWNERS_VEHICLE],  # current holder of the plate
            [],                      # no pending claim for this plate
            [],                      # no claims in the last day
        ]),
        patch("app.routers.vehicles.db_insert", new_callable=AsyncMock, return_value=FAKE_CLAIM) as mock_insert,
    ):
        res = await client.post("/vehicles/claims", json=CLAIM_BODY)

    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "pending"
    assert "current_vehicle_id" not in body
    record = mock_insert.call_args.args[1]
    assert record["current_vehicle_id"] == "vehicle-other"
    assert record["claimant_user_id"] == FAKE_USER["sub"]


async def test_claim_unregistered_plate_rejected(client):
    with patch("app.routers.vehicles.db_query", new_callable=AsyncMock, return_value=[]):
        res = await client.post("/vehicles/claims", json=CLAIM_BODY)

    assert res.status_code == 409
    assert "isn't registered" in res.json()["detail"]


async def test_claim_own_plate_rejected(client):
    with patch("app.routers.vehicles.db_query", new_callable=AsyncMock, return_value=[FAKE_VEHICLE]):
        res = await client.post("/vehicles/claims", json=CLAIM_BODY)

    assert res.status_code == 409


async def test_claim_duplicate_pending_rejected(client):
    with patch("app.routers.vehicles.db_query", new_callable=AsyncMock, side_effect=[
        [OTHER_OWNERS_VEHICLE],
        [FAKE_CLAIM],
    ]):
        res = await client.post("/vehicles/claims", json=CLAIM_BODY)

    assert res.status_code == 409
    assert "pending claim" in res.json()["detail"]


async def test_claim_daily_limit(client):
    with patch("app.routers.vehicles.db_query", new_callable=AsyncMock, side_effect=[
        [OTHER_OWNERS_VEHICLE],
        [],
        [FAKE_CLAIM] * 3,
    ]):
        res = await client.post("/vehicles/claims", json=CLAIM_BODY)

    assert res.status_code == 429


async def test_list_claims_hides_current_vehicle(client):
    with patch("app.routers.vehicles.db_query", new_callable=AsyncMock, return_value=[FAKE_CLAIM]):
        res = await client.get("/vehicles/claims")

    assert res.status_code == 200
    assert res.json()[0]["id"] == "claim-1"
    assert "current_vehicle_id" not in res.json()[0]
