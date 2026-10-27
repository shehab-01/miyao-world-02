from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class HealthCheck(BaseModel):
    status: str = "ok"


app = FastAPI(
    title="MIYAO WORLD",
    description="MIYAO WORLD API",
    version="1.0.0",
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3010",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Hello World"}


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    return HealthCheck(status="ok")
