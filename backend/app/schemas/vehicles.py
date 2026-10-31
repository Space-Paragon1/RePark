import re

from pydantic import BaseModel, Field, field_validator


def normalise_plate(v: str) -> str:
    normalised = re.sub(r"[\s\-]", "", v).upper()
    if len(normalised) < 2 or len(normalised) > 10:
        raise ValueError("Plate number must be between 2 and 10 characters")
    return normalised


def strip_not_empty(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("Field must not be empty")
    return v


class VehicleCreate(BaseModel):
    plate_number: str
    make: str
    model: str
    color: str
    parking_zone: str | None = None

    _plate = field_validator("plate_number")(normalise_plate)
    _required = field_validator("make", "model", "color")(strip_not_empty)


class VehicleResponse(BaseModel):
    id: str
    plate_number: str
    make: str
    model: str
    color: str
    parking_zone: str | None
    created_at: str


class PlateClaimCreate(BaseModel):
    """A request to take over a plate that is registered to another account."""
    plate_number: str
    make: str
    model: str
    color: str
    note: str | None = Field(default=None, max_length=500)

    _plate = field_validator("plate_number")(normalise_plate)
    _required = field_validator("make", "model", "color")(strip_not_empty)


class PlateClaimResponse(BaseModel):
    id: str
    plate_number: str
    status: str
    created_at: str
