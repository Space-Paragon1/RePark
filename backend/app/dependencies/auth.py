import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

bearer_scheme = HTTPBearer()

# In-memory JWKS cache — refreshed if a key is not found
_jwks_cache: list[dict] = []


async def _get_jwks() -> list[dict]:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{settings.supabase_url}/auth/v1/.well-known/jwks.json",
            headers={"apikey": settings.supabase_anon_key},
        )
        r.raise_for_status()
        _jwks_cache = r.json()["keys"]
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg", "ES256")

        keys = await _get_jwks()
        key = next((k for k in keys if k.get("kid") == kid), None)

        if not key:
            # Key not in cache — refresh and retry once
            _jwks_cache.clear()
            keys = await _get_jwks()
            key = next((k for k in keys if k.get("kid") == kid), None)

        if not key:
            raise JWTError("No matching public key found for kid")

        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
        )
    except JWTError as e:
        print(f"JWT ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
