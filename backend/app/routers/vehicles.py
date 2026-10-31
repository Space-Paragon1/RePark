from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.db import db_delete, db_insert, db_query, db_select
from app.dependencies.auth import get_current_user
from app.routers.reports import UNREGISTERED_WAIT_HOURS
from app.schemas.vehicles import (
    PlateClaimCreate,
    PlateClaimResponse,
    VehicleCreate,
    VehicleResponse,
)
from app.services.notify import deliver_alert, open_alert

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

MAX_VEHICLES_PER_USER = 10
MAX_CLAIMS_PER_DAY = 3

# Sent as the X-Error-Code header so clients can offer "file a claim" without
# parsing the message. The detail stays a plain string for older app builds.
PLATE_TAKEN_CODE = "plate_taken"
PLATE_TAKEN_DETAIL = (
    "This plate is registered to another RePark account. "
    "If it's your vehicle, you can file an ownership claim."
)


def _plate_taken() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=PLATE_TAKEN_DETAIL,
        headers={"X-Error-Code": PLATE_TAKEN_CODE},
    )


@router.post("", response_model=VehicleResponse, status_code=201)
async def register_vehicle(
    body: VehicleCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
) -> VehicleResponse:
    user_id: str = user["sub"]

    existing = await db_select("vehicles", {"user_id": user_id})
    if len(existing) >= MAX_VEHICLES_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maximum of {MAX_VEHICLES_PER_USER} vehicles per account",
        )

    # A plate can belong to only one account, so alerts reach one owner.
    same_plate = await db_query("vehicles", {"plate_number": f"eq.{body.plate_number}"})
    if same_plate:
        if same_plate[0]["user_id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This plate is already registered to your account",
            )
        raise _plate_taken()

    try:
        record = await db_insert(
            "vehicles",
            {
                "user_id": user_id,
                "plate_number": body.plate_number,
                "make": body.make,
                "model": body.model,
                "color": body.color,
                "parking_zone": body.parking_zone,
            },
        )
    except httpx.HTTPStatusError as e:
        # Unique index caught a registration that raced the check above.
        if e.response.status_code == status.HTTP_409_CONFLICT:
            raise _plate_taken()
        raise

    # Reports filed on this plate shortly before it was registered still reach
    # the new owner, so a reporter's effort isn't wasted.
    since = (datetime.now(timezone.utc) - timedelta(hours=UNREGISTERED_WAIT_HOURS)).isoformat()
    waiting = await db_query("reports", {
        "plate_number": f"eq.{body.plate_number}",
        "status": "eq.submitted",
        "created_at": f"gte.{since}",
    })
    for report in waiting:
        if report["reporter_user_id"] == user_id:
            continue
        alert = await open_alert(report["id"], record["id"])
        background_tasks.add_task(
            deliver_alert, alert["id"], user_id, body.plate_number, report["issue_type"], report["id"],
        )

    return VehicleResponse(**record)


@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(
    user: dict = Depends(get_current_user),
) -> list[VehicleResponse]:
    user_id: str = user["sub"]
    records = await db_select("vehicles", {"user_id": user_id})
    return [VehicleResponse(**r) for r in records]


@router.post("/claims", response_model=PlateClaimResponse, status_code=201)
async def create_plate_claim(
    body: PlateClaimCreate,
    user: dict = Depends(get_current_user),
) -> PlateClaimResponse:
    """Dispute ownership of a plate registered to someone else.

    Claims are reviewed manually. The claimant never learns who holds the
    plate, and the current holder is not contacted automatically.
    """
    user_id: str = user["sub"]

    holders = await db_query("vehicles", {"plate_number": f"eq.{body.plate_number}"})
    if not holders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This plate isn't registered yet. You can add it as a vehicle.",
        )
    if holders[0]["user_id"] == user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This plate is already registered to your account",
        )

    pending = await db_query("plate_claims", {
        "claimant_user_id": f"eq.{user_id}",
        "plate_number": f"eq.{body.plate_number}",
        "status": "eq.pending",
    })
    if pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending claim for this plate",
        )

    one_day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    recent = await db_query("plate_claims", {
        "claimant_user_id": f"eq.{user_id}",
        "created_at": f"gte.{one_day_ago}",
    })
    if len(recent) >= MAX_CLAIMS_PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Maximum {MAX_CLAIMS_PER_DAY} ownership claims per day. Please try again later.",
        )

    claim = await db_insert("plate_claims", {
        "plate_number": body.plate_number,
        "claimant_user_id": user_id,
        "current_vehicle_id": holders[0]["id"],
        "make": body.make,
        "model": body.model,
        "color": body.color,
        "note": body.note,
        "status": "pending",
    })
    return PlateClaimResponse(**claim)


@router.get("/claims", response_model=list[PlateClaimResponse])
async def list_plate_claims(
    user: dict = Depends(get_current_user),
) -> list[PlateClaimResponse]:
    records = await db_query("plate_claims", {"claimant_user_id": f"eq.{user['sub']}"})
    return [PlateClaimResponse(**r) for r in records]


@router.delete("/{vehicle_id}", status_code=204)
async def delete_vehicle(
    vehicle_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    user_id: str = user["sub"]

    matches = await db_select("vehicles", {"id": vehicle_id, "user_id": user_id})
    if not matches:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    await db_delete("vehicles", {"id": vehicle_id, "user_id": user_id})
