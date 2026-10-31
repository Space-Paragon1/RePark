"""Alert delivery: Expo push first, SMS through Twilio when push isn't possible.

Functions that run as background tasks catch their own errors, because a
failure there can no longer reach the client.
"""
import logging

import httpx

from app.config import settings
from app.db import db_delete, db_insert, db_query, db_update

log = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
TWILIO_URL = "https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"

ISSUE_LABELS = {
    "blocking_driveway":   "Blocking driveway / access",
    "construction_access": "Construction access blocked",
    "garbage_pickup":      "Garbage pickup obstruction",
    "restricted_zone":     "Restricted parking zone",
    "emergency_access":    "Emergency access blocked",
}

RESPONSE_MESSAGES = {
    "moving_now":       "The owner of {plate} is moving their vehicle now.",
    "already_moved":    "The owner of {plate} says the vehicle has already moved.",
    "incorrect_report": "The owner of {plate} says this report was incorrect.",
    "abuse_reported":   "The owner of {plate} says this report was incorrect.",
}


# ─── Channels ─────────────────────────────────────────────────────────────────

async def send_push(
    tokens: list[str], title: str, body: str, data: dict | None = None,
) -> tuple[list[str], list[str]]:
    """Send one push per token. Returns (accepted_tokens, dead_tokens).

    "Accepted" means Expo took the message for delivery. Dead tokens belong to
    devices that uninstalled the app or turned notifications off.
    """
    if not tokens:
        return [], []

    messages = [
        {"to": t, "title": title, "body": body, "data": data or {}, "sound": "default"}
        for t in tokens
    ]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(EXPO_PUSH_URL, json=messages)
        r.raise_for_status()
        tickets = r.json().get("data", [])
    except Exception as e:
        log.warning("Expo push request failed: %s", e)
        return [], []

    accepted, dead = [], []
    for token, ticket in zip(tokens, tickets):
        if ticket.get("status") == "ok":
            accepted.append(token)
        elif (ticket.get("details") or {}).get("error") == "DeviceNotRegistered":
            dead.append(token)
        else:
            log.warning("Expo push rejected: %s", ticket.get("message"))
    return accepted, dead


def sms_configured() -> bool:
    return bool(
        settings.twilio_account_sid
        and settings.twilio_auth_token
        and (settings.twilio_messaging_service_sid or settings.twilio_from_number)
    )


async def send_sms(to: str, body: str) -> bool:
    if not sms_configured():
        log.warning("SMS fallback skipped: Twilio is not configured")
        return False

    data = {"To": to, "Body": body}
    if settings.twilio_messaging_service_sid:
        data["MessagingServiceSid"] = settings.twilio_messaging_service_sid
    else:
        data["From"] = settings.twilio_from_number

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                TWILIO_URL.format(sid=settings.twilio_account_sid),
                data=data,
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
            )
    except Exception as e:
        log.warning("Twilio request failed: %s", e)
        return False

    if r.status_code != 201:
        log.warning("Twilio rejected SMS (%s): %s", r.status_code, r.text[:200])
        return False
    return True


async def get_user_phone(user_id: str) -> str | None:
    """Phone number from Supabase Auth, in E.164 format (+15551234567)."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
            },
        )
    if r.status_code != 200:
        return None
    phone = r.json().get("phone")
    if not phone:
        return None
    return phone if phone.startswith("+") else f"+{phone}"


async def push_to_user(user_id: str, title: str, body: str, data: dict | None = None) -> bool:
    """Push to all of a user's devices, dropping dead tokens. True if any accepted."""
    rows = await db_query("push_tokens", {"user_id": f"eq.{user_id}"})
    accepted, dead = await send_push([r["token"] for r in rows], title, body, data)
    for token in dead:
        await db_delete("push_tokens", {"user_id": user_id, "token": token})
    return bool(accepted)


# ─── Alert lifecycle ──────────────────────────────────────────────────────────

async def open_alert(report_id: str, vehicle_id: str) -> dict:
    """Create the alert for a report and mark the report as notified."""
    alert = await db_insert("alerts", {
        "vehicle_id": vehicle_id,
        "report_id": report_id,
        "delivery_status": "pending",
    })
    await db_update("reports", {"id": report_id}, {"status": "notified", "owner_notified": True})
    return alert


async def deliver_alert(
    alert_id: str, owner_user_id: str, plate: str, issue_type: str, report_id: str,
) -> None:
    """Tell the owner about a report: push first, SMS if no push was accepted.
    Records the outcome on the alert. Runs as a background task."""
    try:
        label = ISSUE_LABELS.get(issue_type, issue_type)
        channel = None

        if await push_to_user(
            owner_user_id,
            title=f"⚠️ Alert for {plate}",
            body=label,
            data={"type": "alert", "report_id": report_id, "alert_id": alert_id},
        ):
            channel = "push"
        else:
            phone = await get_user_phone(owner_user_id)
            if phone and await send_sms(
                phone,
                f"RePark: your vehicle {plate} was reported ({label}). "
                "Open the RePark app to respond.",
            ):
                channel = "sms"

        await db_update("alerts", {"id": alert_id}, {
            "delivery_status": "sent" if channel else "failed",
            "delivery_channel": channel,
        })
    except Exception:
        log.exception("Delivering alert %s failed", alert_id)


async def notify_reporter(reporter_user_id: str, plate: str, response: str, report_id: str) -> None:
    """Push the owner's response to the reporter. Push only, no SMS. Runs as a background task."""
    try:
        await push_to_user(
            reporter_user_id,
            title=f"Update on {plate}",
            body=RESPONSE_MESSAGES.get(response, "The owner has responded to your report.").format(plate=plate),
            data={"type": "report_update", "report_id": report_id},
        )
    except Exception:
        log.exception("Notifying reporter about report %s failed", report_id)
