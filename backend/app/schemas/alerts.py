from enum import Enum
from pydantic import BaseModel


class OwnerResponseType(str, Enum):
    moving_now = "moving_now"
    already_moved = "already_moved"
    incorrect_report = "incorrect_report"
    abuse_reported = "abuse_reported"


class RespondRequest(BaseModel):
    response: OwnerResponseType


class AlertDetail(BaseModel):
    id: str
    vehicle_id: str
    report_id: str
    delivery_status: str
    owner_response: str | None
    responded_at: str | None
    created_at: str
    # enriched from vehicles + reports
    plate_number: str
    make: str
    model: str
    color: str
    issue_type: str
    reported_at: str
