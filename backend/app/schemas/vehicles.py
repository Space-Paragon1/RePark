from pydantic import BaseModel, field_validator
import re


class VehicleCreate(BaseModel):
    plate_number: str
    make: str
    model: str
    color: str
    parking_zone: str | None = None

    @field_validator("plate_number")
    @classmethod
    def normalise_plate(cls, v: str) -> str:
        normalised = re.sub(r"[\s\-]", "", v).upper()
        if len(normalised) < 2 or len(normalised) > 10:
            raise ValueError("Plate number must be between 2 and 10 characters")
        return normalised

    @field_validator("make", "model", "color")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field must not be empty")
        return v


class VehicleResponse(BaseModel):
    id: str
    plate_number: str
    make: str
    model: str
    color: str
    parking_zone: str | None
    created_at: str
