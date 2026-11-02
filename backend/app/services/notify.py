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

# Wording follows the design handoff's copy deck (design_handoff_repark_redesign/copy.md).

# Lower-case issue forms for sentences: "8KTR214, your silver Toyota Corolla, is blocking a driveway or access."
ISSUE_PHRASES = {
    "blocking_driveway":   "blocking a driveway or access",
    "construction_access": "blocking construction access",
    "garbage_pickup":      "blocking garbage pickup",
    "restricted_zone":     "parked in a restricted zone",
    "emergency_access":    "blocking emergency access",
}

# The app registers this notification category with Moving now / Already moved buttons.
# Incorrect report is deliberately not offered from a notification.
ALERT_CATEGORY = "alert"

# Pushes to the reporter, as (title, body). The copy deck adds "at {time}"; it's left out
# because the server doesn't know the reporter's time zone, and the push arrives right away.
RESPONSE_MESSAGES = {
    "moving_now":       ("The owner is moving their car.", "{plate} · replied Moving now."),
    "already_moved":    ("The owner says the car has moved.", "{plate} · replied Already moved."),
    "incorrect_report": ("The owner marked your report as incorrect.",
                         "{plate} · if the car is still there, check the plate and report it again."),
    "abuse_reported":   ("The owner marked your report as incorrect.",
                         "{plate} · if the car is still there, check the plate and report it again."),
}


# ─── Channels ─────────────────────────────────────────────────────────────────

async def send_push(
    tokens: list[str], title: str, body: str, data: dict | None = None, category: str | None = None,
) -> tuple[list[str], list[str]]:
    """Send one push per token. Returns (accepted_tokens, dead_tokens).

    "Accepted" means Expo took the message for delivery. Dead tokens belong to
    devices that uninstalled the app or turned notifications off.
    """
    if not tokens:
        return [], []

    messages = [
        {"to": t, "title": title, "body": body, "data": data or {}, "sound": "default"}
        | ({"categoryId": category} if category else {})
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


async def push_to_user(
    user_id: str, title: str, body: str, data: dict | None = None, category: str | None = None,
) -> bool:
    """Push to all of a user's devices, dropping dead tokens. True if any accepted."""
    rows = await db_query("push_tokens", {"user_id": f"eq.{user_id}"})
    accepted, dead = await send_push([r["token"] for r in rows], title, body, data, category)
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


def describe_car(vehicle: dict | None) -> str | None:
    """'silver Toyota Corolla', or None without vehicle details."""
    if not vehicle:
        return None
    parts = [(vehicle.get("color") or "").strip().lower(), vehicle.get("make") or "", vehicle.get("model") or ""]
    car = " ".join(p.strip() for p in parts if p and p.strip())
    return car or None


async def deliver_alert(
    alert_id: str, owner_user_id: str, plate: str, issue_type: str, report_id: str,
    vehicle: dict | None = None,
) -> None:
    """Tell the owner about a report: push first, SMS if no push was accepted.
    `vehicle` (colour, make, model) makes the wording name the car.
    Records the outcome on the alert. Runs as a background task."""
    try:
        phrase = ISSUE_PHRASES.get(issue_type, issue_type.replace("_", " "))
        car = describe_car(vehicle)
        channel = None

        if await push_to_user(
            owner_user_id,
            title="Someone's blocked in by your car.",
            body=(f"{plate}, your {car}, is {phrase}." if car else f"{plate} is {phrase}.")
            + " Let them know what's happening.",
            data={"type": "alert", "report_id": report_id, "alert_id": alert_id},
            category=ALERT_CATEGORY,
        ):
            channel = "push"
        else:
            phone = await get_user_phone(owner_user_id)
            link = f"{settings.site_url.rstrip('/')}/alerts"
            if phone and await send_sms(
                phone,
                f"RePark: Someone's blocked in by your {car or 'car'}, {plate}. "
                f"Let them know what's happening at {link}. They won't see who you are.",
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
        title, body = RESPONSE_MESSAGES.get(response, ("The owner replied to your report.", "{plate}"))
        await push_to_user(
            reporter_user_id,
            title=title,
            body=body.format(plate=plate),
            data={"type": "report_update", "report_id": report_id},
        )
    except Exception:
        log.exception("Notifying reporter about report %s failed", report_id)
