from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.db import db_insert, db_query, db_select, db_update
from app.dependencies.auth import get_current_user
from app.schemas.alerts import AlertDetail, RespondRequest

router = APIRouter(prefix="/alerts", tags=["alerts"])


async def _alerts_for_user(user_id: str) -> list[AlertDetail]:
    """Return all alerts for every vehicle owned by user_id, enriched with vehicle + report data."""
    vehicles = await db_select("vehicles", {"user_id": user_id})
    if not vehicles:
        return []

    vehicle_map = {v["id"]: v for v in vehicles}

    # Fetch alerts per vehicle (avoids URL-encoding issues with PostgREST `in` operator)
    raw_alerts: list[dict] = []
    for vehicle in vehicles:
        batch = await db_query("alerts", {"vehicle_id": f"eq.{vehicle['id']}"})
        raw_alerts.extend(batch)

    # Sort newest first
    raw_alerts.sort(key=lambda a: a["created_at"], reverse=True)

    result: list[AlertDetail] = []
    for alert in raw_alerts:
        reports = await db_query("reports", {"id": f"eq.{alert['report_id']}"})
        if not reports:
            continue
        report = reports[0]
        vehicle = vehicle_map[alert["vehicle_id"]]
        result.append(
            AlertDetail(
                **alert,
                plate_number=vehicle["plate_number"],
                make=vehicle["make"],
                model=vehicle["model"],
                color=vehicle["color"],
                issue_type=report["issue_type"],
                reported_at=report["created_at"],
            )
        )

    return result


@router.get("", response_model=list[AlertDetail])
async def list_alerts(user: dict = Depends(get_current_user)) -> list[AlertDetail]:
    return await _alerts_for_user(user["sub"])


@router.post("/{alert_id}/respond", response_model=AlertDetail)
async def respond_to_alert(
    alert_id: str,
    body: RespondRequest,
    user: dict = Depends(get_current_user),
) -> AlertDetail:
    user_id: str = user["sub"]

    # Verify alert belongs to one of the user's vehicles
    vehicles = await db_select("vehicles", {"user_id": user_id})
    vehicle_ids = {v["id"] for v in vehicles}

    alerts = await db_query("alerts", {"id": f"eq.{alert_id}"})
    if not alerts or alerts[0]["vehicle_id"] not in vehicle_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert = alerts[0]

    if alert["owner_response"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already responded to this alert",
        )

    now = datetime.now(timezone.utc).isoformat()

    await db_update(
        "alerts",
        {"id": alert_id},
        {
            "owner_response": body.response,
            "responded_at": now,
            "delivery_status": "sent",
        },
    )

    # Update report status so reporter sees the change
    new_report_status = (
        "rejected" if body.response == "incorrect_report" else "responded"
    )
    await db_update("reports", {"id": alert["report_id"]}, {"status": new_report_status})

    # Log abuse event so the reporter accumulates violations
    if body.response == "incorrect_report":
        report_rows = await db_query("reports", {"id": f"eq.{alert['report_id']}"})
        if report_rows:
            reporter_id = report_rows[0]["reporter_user_id"]
            await db_insert("abuse_events", {
                "user_id": reporter_id,
                "report_id": alert["report_id"],
                "event_type": "incorrect_report",
                "metadata": {"alert_id": alert_id},
            })

    # Return enriched alert
    enriched = await _alerts_for_user(user_id)
    for a in enriched:
        if a.id == alert_id:
            return a

    raise HTTPException(status_code=500, detail="Failed to fetch updated alert")
