from fastapi import APIRouter, Depends, HTTPException, status

from app.db import db_delete, db_insert, db_select
from app.dependencies.auth import get_current_user
from app.schemas.vehicles import VehicleCreate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

MAX_VEHICLES_PER_USER = 10


@router.post("", response_model=VehicleResponse, status_code=201)
async def register_vehicle(
    body: VehicleCreate,
    user: dict = Depends(get_current_user),
) -> VehicleResponse:
    user_id: str = user["sub"]

    existing = await db_select("vehicles", {"user_id": user_id})
    if len(existing) >= MAX_VEHICLES_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Maximum of {MAX_VEHICLES_PER_USER} vehicles per account",
        )

    # Prevent duplicate plate for same user
    for v in existing:
        if v["plate_number"] == body.plate_number:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This plate is already registered to your account",
            )

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
    return VehicleResponse(**record)


@router.get("", response_model=list[VehicleResponse])
async def list_vehicles(
    user: dict = Depends(get_current_user),
) -> list[VehicleResponse]:
    user_id: str = user["sub"]
    records = await db_select("vehicles", {"user_id": user_id})
    return [VehicleResponse(**r) for r in records]


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
