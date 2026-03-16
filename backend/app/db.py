"""Supabase PostgREST helpers.

We call the Supabase REST API (PostgREST) directly with httpx using the
service role key so FastAPI stays the sole authorisation enforcement point.
"""
import httpx

from app.config import settings

POSTGREST_URL = f"{settings.supabase_url}/rest/v1"

# Service role bypasses RLS — FastAPI owns all authorisation checks.
_SERVICE_HEADERS = {
    "apikey": settings.supabase_service_role_key,
    "Authorization": f"Bearer {settings.supabase_service_role_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def _headers(extra: dict | None = None) -> dict:
    return {**_SERVICE_HEADERS, **(extra or {})}


async def db_insert(table: str, record: dict) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{POSTGREST_URL}/{table}",
            headers=_headers(),
            json=record,
        )
    r.raise_for_status()
    return r.json()[0]


async def db_select(table: str, filters: dict) -> list[dict]:
    params = {k: f"eq.{v}" for k, v in filters.items()}
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{POSTGREST_URL}/{table}",
            headers=_headers({"Prefer": ""}),
            params=params,
        )
    r.raise_for_status()
    return r.json()


async def db_query(table: str, params: dict[str, str]) -> list[dict]:
    """Flexible query — values must include the PostgREST operator prefix.

    e.g. {"user_id": "eq.abc", "created_at": "gte.2024-01-01T00:00:00Z"}
    """
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{POSTGREST_URL}/{table}",
            headers=_headers({"Prefer": ""}),
            params=params,
        )
    r.raise_for_status()
    return r.json()


async def db_update(table: str, filters: dict, data: dict) -> list[dict]:
    params = {k: f"eq.{v}" for k, v in filters.items()}
    async with httpx.AsyncClient() as client:
        r = await client.patch(
            f"{POSTGREST_URL}/{table}",
            headers=_headers(),
            params=params,
            json=data,
        )
    r.raise_for_status()
    return r.json()


async def db_delete(table: str, filters: dict) -> None:
    params = {k: f"eq.{v}" for k, v in filters.items()}
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            f"{POSTGREST_URL}/{table}",
            headers=_headers({"Prefer": ""}),
            params=params,
        )
    r.raise_for_status()
