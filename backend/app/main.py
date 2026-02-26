from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
from app.db.mongodb import init_db
from app.db.redis import redis_client

app = FastAPI(
    title="Ping Tree Distribution API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
# Set up CORS
# For Public Lead Ingestion, we should allow any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files for JS Tracking Script
from fastapi.staticfiles import StaticFiles
import os

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.on_event("startup")
async def startup_event():
    await init_db()
    await redis_client.connect()

@app.on_event("shutdown")
async def shutdown_event():
    await redis_client.close()

@app.get("/")
async def root():
    return {"message": "Ping Tree API is running"}

app.include_router(api_router, prefix=settings.API_V1_STR)
