"""
Tests that all protected endpoints reject unauthenticated requests.
"""


PROTECTED_ENDPOINTS = [
    ("GET",    "/vehicles"),
    ("POST",   "/vehicles"),
    ("GET",    "/reports"),
    ("POST",   "/reports"),
    ("GET",    "/alerts"),
    ("POST",   "/alerts/some-id/respond"),
    ("GET",    "/account/export"),
    ("DELETE", "/account"),
]


async def test_no_token_rejected(unauth_client):
    """Every protected endpoint returns 403 when no Authorization header is sent."""
    for method, path in PROTECTED_ENDPOINTS:
        res = await unauth_client.request(method, path)
        assert res.status_code == 403, (
            f"{method} {path} should return 403 without token, got {res.status_code}"
        )


async def test_invalid_token_rejected(unauth_client):
    """Every protected endpoint returns 401 when a malformed token is sent."""
    headers = {"Authorization": "Bearer this.is.not.a.valid.jwt"}
    for method, path in PROTECTED_ENDPOINTS:
        res = await unauth_client.request(method, path, headers=headers)
        assert res.status_code == 401, (
            f"{method} {path} should return 401 with invalid token, got {res.status_code}"
        )
