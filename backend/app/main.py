from fastapi import FastAPI, Response
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
    allow_credentials=False,
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

@app.get("/static/pingtree.js")
async def get_pingtree_js():
    js_path = os.path.join(static_dir, "pingtree.js")
    if not os.path.exists(js_path):
        return Response(content="// PingTree script not found", media_type="application/javascript")
    
    with open(js_path, "r") as f:
        content = f.read()
    
    # Inject the environment-specific endpoint
    endpoint = f"{settings.BASE_URL}{settings.API_V1_STR}/public/leads/ingest"
    content = content.replace("{{PT_ENDPOINT}}", endpoint)
    
    return Response(content=content, media_type="application/javascript")

import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    try:
        logger.info("🚀 Starting up... connecting to MongoDB")
        await init_db()
        logger.info("✅ MongoDB Connected")
        
        logger.info("🔗 Connecting to Redis")
        await redis_client.connect()
        logger.info("✅ Redis Connected")
    except Exception as e:
        logger.error(f"❌ Startup Error: {str(e)}", exc_info=True)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Shutting down...")
    await redis_client.close()

@app.get("/")
async def root():
    return {"status": "ok", "message": "Ping Tree API is operational"}

app.include_router(api_router, prefix=settings.API_V1_STR)
