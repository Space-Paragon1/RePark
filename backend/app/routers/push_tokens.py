from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import db_insert, db_query
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/push-tokens", tags=["push-tokens"])


class PushTokenBody(BaseModel):
    token: str


@router.post("", status_code=204)
async def register_push_token(
    body: PushTokenBody,
    user: dict = Depends(get_current_user),
) -> None:
    user_id: str = user["sub"]
    existing = await db_query("push_tokens", {
        "user_id": f"eq.{user_id}",
        "token": f"eq.{body.token}",
    })
    if not existing:
        await db_insert("push_tokens", {"user_id": user_id, "token": body.token})
