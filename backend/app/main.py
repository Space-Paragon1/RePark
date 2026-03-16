from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, vehicles, reports, alerts, push_tokens

app = FastAPI(title="RePark API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to specific origins before production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(reports.router)
app.include_router(alerts.router)
app.include_router(push_tokens.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
