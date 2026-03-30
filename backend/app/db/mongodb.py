from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.buyer import Buyer
from app.models.lead import Lead

from app.models.form import LeadForm
from app.models.validation import LeadValidationConfig
from app.models.domain_mapping import DomainTokenMapping
from app.models.counter import Counter
from app.models.webhook import Webhook

async def init_db():
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=200,
        minPoolSize=0,
        connectTimeoutMS=30000,
        serverSelectionTimeoutMS=30000,
        socketTimeoutMS=45000,
        retryReads=True,
        retryWrites=True,
        tls=True,
        tlsAllowInvalidCertificates=True
    )
    db = client[settings.DATABASE_NAME]

    await init_beanie(database=db, document_models=[User, Buyer, Lead, LeadForm, LeadValidationConfig, DomainTokenMapping, Counter, Webhook])

    # ── One-time migration: backfill timezone field on old User documents ──────
    # Beanie doesn't auto-add new fields to existing documents.
    # This is idempotent: only touches docs that don't have the field yet.
    result = await db["users"].update_many(
        {"timezone": {"$exists": False}},
        {"$set": {"timezone": "UTC"}}
    )
    if result.modified_count:
        import logging
        logging.getLogger(__name__).info(f"✅ Migrated {result.modified_count} user(s): added timezone field.")

