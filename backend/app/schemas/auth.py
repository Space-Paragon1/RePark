from pydantic import BaseModel, field_validator
import re


class StartOTPRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def phone_must_be_e164(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\+[1-9]\d{6,14}$", v):
            raise ValueError("Phone number must be in E.164 format, e.g. +12345678900")
        return v


class VerifyOTPRequest(BaseModel):
    phone: str
    token: str

    @field_validator("phone")
    @classmethod
    def phone_must_be_e164(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\+[1-9]\d{6,14}$", v):
            raise ValueError("Phone number must be in E.164 format, e.g. +12345678900")
        return v

    @field_validator("token")
    @classmethod
    def token_must_be_six_digits(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\d{6}$", v):
            raise ValueError("OTP token must be exactly 6 digits")
        return v


class VerifyOTPResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
