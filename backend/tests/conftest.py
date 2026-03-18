import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.dependencies.auth import get_current_user

FAKE_USER = {"sub": "user-abc123", "phone": "+1234567890"}

FAKE_VEHICLE = {
    "id": "vehicle-1",
    "user_id": "user-abc123",
    "plate_number": "ABC123",
    "make": "Toyota",
    "model": "Camry",
    "color": "Blue",
    "parking_zone": None,
    "created_at": "2024-01-01T00:00:00+00:00",
}

FAKE_REPORT = {
    "id": "report-1",
    "plate_number": "ABC123",
    "reporter_user_id": "user-abc123",
    "latitude": 1.0,
    "longitude": 1.0,
    "issue_type": "blocking_driveway",
    "message": None,
    "status": "submitted",
    "created_at": "2024-01-01T00:00:00+00:00",
}

FAKE_ALERT = {
    "id": "alert-1",
    "vehicle_id": "vehicle-1",
    "report_id": "report-1",
    "delivery_status": "pending",
    "owner_response": None,
    "responded_at": None,
    "created_at": "2024-01-01T00:00:00+00:00",
}


@pytest.fixture
def auth_client():
    """AsyncClient with authentication overridden to FAKE_USER."""
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER

    async def _client():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            yield c

    yield _client
    app.dependency_overrides.clear()


@pytest.fixture
async def client():
    """Authenticated client ready to use directly in tests."""
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def unauth_client():
    """Client with no auth override — real bearer check applies."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
