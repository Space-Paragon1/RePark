"""CORS: only listed websites may call the API from a browser."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from httpx import ASGITransport, AsyncClient

from app.config import Settings


def test_origin_list_parsing():
    s = Settings(cors_origins=" https://repark.app/ , http://localhost:3000,, ")
    assert s.cors_origin_list == ["https://repark.app", "http://localhost:3000"]


async def test_only_listed_origin_allowed():
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=Settings(cors_origins="https://repark.app").cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/ping")
    def ping():
        return {}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        ok = await c.get("/ping", headers={"Origin": "https://repark.app"})
        other = await c.get("/ping", headers={"Origin": "https://evil.example"})

    assert ok.headers.get("access-control-allow-origin") == "https://repark.app"
    assert "access-control-allow-origin" not in other.headers
