from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.db import db_delete, db_query, db_select
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/export")
async def export_data(user: dict = Depends(get_current_user)) -> dict:
    user_id: str = user["sub"]

    vehicles = await db_select("vehicles", {"user_id": user_id})
    reports = await db_query("reports", {"reporter_user_id": f"eq.{user_id}"})

    alerts: list[dict] = []
    for vehicle in vehicles:
        batch = await db_query("alerts", {"vehicle_id": f"eq.{vehicle['id']}"})
        alerts.extend(batch)

    return {
        "user_id": user_id,
        "phone": user.get("phone"),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "vehicles": vehicles,
        "reports": reports,
        "alerts": alerts,
    }


@router.delete("", status_code=204)
async def delete_account(user: dict = Depends(get_current_user)) -> None:
    user_id: str = user["sub"]

    # Delete push tokens (no FK cascade on this table)
    await db_delete("push_tokens", {"user_id": user_id})

    # Delete the auth user — cascades to vehicles, reports, alerts, abuse_events
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
            },
        )

    if r.status_code not in (200, 204):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account. Please try again.",
        )
