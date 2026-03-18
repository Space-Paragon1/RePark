from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import db_insert, db_query, db_update
from app.dependencies.auth import get_current_user
from app.schemas.reports import ReportCreate, ReportResponse
from app.services.push import send_push_notifications

ABUSE_BLOCK_THRESHOLD = 5
ABUSE_WINDOW_HOURS = 24

router = APIRouter(prefix="/reports", tags=["reports"])

RATE_LIMIT_PER_HOUR = 3
COOLDOWN_MINUTES = 15


@router.post("", response_model=ReportResponse, status_code=201)
async def create_report(
    body: ReportCreate,
    user: dict = Depends(get_current_user),
) -> ReportResponse:
    user_id: str = user["sub"]

    # ── Abuse block: too many violations in the last 24 hours ────────────────
    one_day_ago = (datetime.now(timezone.utc) - timedelta(hours=ABUSE_WINDOW_HOURS)).isoformat()
    abuse_events = await db_query("abuse_events", {
        "user_id": f"eq.{user_id}",
        "created_at": f"gte.{one_day_ago}",
    })
    if len(abuse_events) >= ABUSE_BLOCK_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been temporarily restricted due to suspicious activity.",
        )

    # ── Rate limit: max 3 reports per hour ───────────────────────────────────
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    recent = await db_query("reports", {
        "reporter_user_id": f"eq.{user_id}",
        "created_at": f"gte.{one_hour_ago}",
    })
    if len(recent) >= RATE_LIMIT_PER_HOUR:
        await db_insert("abuse_events", {
            "user_id": user_id,
            "event_type": "rate_limit_exceeded",
            "metadata": {"limit": RATE_LIMIT_PER_HOUR, "window": "1h"},
        })
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Maximum {RATE_LIMIT_PER_HOUR} reports per hour. Please try again later.",
        )

    # ── Cooldown: 1 report per plate per 15 minutes ──────────────────────────
    fifteen_min_ago = (datetime.now(timezone.utc) - timedelta(minutes=COOLDOWN_MINUTES)).isoformat()
    recent_plate = await db_query("reports", {
        "reporter_user_id": f"eq.{user_id}",
        "plate_number": f"eq.{body.plate_number}",
        "created_at": f"gte.{fifteen_min_ago}",
    })
    if recent_plate:
        await db_insert("abuse_events", {
            "user_id": user_id,
            "event_type": "cooldown_exceeded",
            "metadata": {"plate": body.plate_number, "cooldown_minutes": COOLDOWN_MINUTES},
        })
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You already reported this plate recently. Please wait {COOLDOWN_MINUTES} minutes.",
        )

    # ── Create report ─────────────────────────────────────────────────────────
    report = await db_insert("reports", {
        "plate_number": body.plate_number,
        "reporter_user_id": user_id,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "issue_type": body.issue_type,
        "message": body.message,
        "status": "submitted",
    })

    # ── Plate lookup → create alert if vehicle is registered ─────────────────
    owner_notified = False
    vehicles = await db_query("vehicles", {"plate_number": f"eq.{body.plate_number}"})

    if vehicles:
        vehicle = vehicles[0]
        await db_insert("alerts", {
            "vehicle_id": vehicle["id"],
            "report_id": report["id"],
            "delivery_status": "pending",
        })
        await db_update("reports", {"id": report["id"]}, {"status": "notified"})
        report["status"] = "notified"
        owner_notified = True

        # ── Push notification to vehicle owner ────────────────────────────────
        token_rows = await db_query("push_tokens", {"user_id": f"eq.{vehicle['user_id']}"})
        tokens = [r["token"] for r in token_rows]
        issue_label = {
            "blocking_driveway":    "Blocking driveway / access",
            "construction_access":  "Construction access blocked",
            "garbage_pickup":       "Garbage pickup obstruction",
            "restricted_zone":      "Restricted parking zone",
            "emergency_access":     "Emergency access blocked",
        }.get(body.issue_type, body.issue_type)
        await send_push_notifications(
            tokens,
            title=f"⚠️ Alert for {body.plate_number}",
            body=issue_label,
            data={"report_id": report["id"]},
        )

    return ReportResponse(**report, owner_notified=owner_notified)


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    user: dict = Depends(get_current_user),
) -> list[ReportResponse]:
    user_id: str = user["sub"]
    records = await db_query("reports", {"reporter_user_id": f"eq.{user_id}"})
    return [ReportResponse(**r, owner_notified=(r["status"] != "submitted")) for r in records]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    user: dict = Depends(get_current_user),
) -> ReportResponse:
    user_id: str = user["sub"]
    records = await db_query("reports", {
        "id": f"eq.{report_id}",
        "reporter_user_id": f"eq.{user_id}",
    })
    if not records:
        raise HTTPException(status_code=404, detail="Report not found")
    r = records[0]
    return ReportResponse(**r, owner_notified=(r["status"] != "submitted"))
