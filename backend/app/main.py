from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.admin_bootstrap import ensure_initial_admin
from app.api import api_router
from app.api.routes import health
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_initial_admin()
    yield


app = FastAPI(
    title="MIYAO WORLD",
    description="MIYAO WORLD API",
    version="1.0.0",
    lifespan=lifespan,
    # Hide the interactive docs in production
    docs_url=None if settings.environment == "production" else "/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(api_router)

# Uploaded product images (the frontend proxies /uploads/* here)
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "MIYAO WORLD API"}
