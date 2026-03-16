from enum import Enum

import re
from pydantic import BaseModel, field_validator


class IssueType(str, Enum):
    blocking_driveway = "blocking_driveway"
    construction_access = "construction_access"
    garbage_pickup = "garbage_pickup"
    restricted_zone = "restricted_zone"
    emergency_access = "emergency_access"


class ReportCreate(BaseModel):
    plate_number: str
    latitude: float
    longitude: float
    issue_type: IssueType
    message: str | None = None

    @field_validator("plate_number")
    @classmethod
    def normalise_plate(cls, v: str) -> str:
        normalised = re.sub(r"[\s\-]", "", v).upper()
        if len(normalised) < 2 or len(normalised) > 10:
            raise ValueError("Plate number must be between 2 and 10 characters")
        return normalised

    @field_validator("latitude")
    @classmethod
    def valid_latitude(cls, v: float) -> float:
        if not -90 <= v <= 90:
            raise ValueError("Invalid latitude")
        return v

    @field_validator("longitude")
    @classmethod
    def valid_longitude(cls, v: float) -> float:
        if not -180 <= v <= 180:
            raise ValueError("Invalid longitude")
        return v


class ReportResponse(BaseModel):
    id: str
    plate_number: str
    issue_type: str
    status: str
    owner_notified: bool
    created_at: str
