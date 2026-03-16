import httpx
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.auth import StartOTPRequest, VerifyOTPRequest, VerifyOTPResponse

router = APIRouter(prefix="/auth", tags=["auth"])

SUPABASE_AUTH_URL = f"{settings.supabase_url}/auth/v1"
SUPABASE_HEADERS = {
    "apikey": settings.supabase_anon_key,
    "Content-Type": "application/json",
}


@router.post("/start-phone-otp", status_code=204)
async def start_phone_otp(body: StartOTPRequest) -> None:
    """Send a one-time code to the given phone number via Supabase Auth."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_AUTH_URL}/otp",
            headers=SUPABASE_HEADERS,
            json={"phone": body.phone, "channel": "sms"},
        )

    if response.status_code not in (200, 204):
        detail = response.json().get("msg") or response.json().get("error_description") or "Failed to send OTP"
        raise HTTPException(status_code=response.status_code, detail=detail)


@router.post("/verify-phone-otp", response_model=VerifyOTPResponse)
async def verify_phone_otp(body: VerifyOTPRequest) -> VerifyOTPResponse:
    """Verify the OTP and return a Supabase session (access + refresh tokens)."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_AUTH_URL}/verify",
            headers=SUPABASE_HEADERS,
            json={"phone": body.phone, "token": body.token, "type": "sms"},
        )

    if response.status_code not in (200, 204):
        detail = response.json().get("msg") or response.json().get("error_description") or "Invalid or expired code"
        raise HTTPException(status_code=400, detail=detail)

    data = response.json()
    return VerifyOTPResponse(
        access_token=data["access_token"],
        refresh_token=data["refresh_token"],
    )
