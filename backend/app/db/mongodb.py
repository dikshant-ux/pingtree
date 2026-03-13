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

async def init_db():
    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=500, # Increased for 1L high-concurrency scaling
        minPoolSize=50   # Keep connections warm
    )
    db = client[settings.DATABASE_NAME]
    
    await init_beanie(database=db, document_models=[User, Buyer, Lead, LeadForm, LeadValidationConfig, DomainTokenMapping, Counter])
    await init_beanie(database=db, document_models=[User, Buyer, Lead, LeadForm, LeadValidationConfig, DomainTokenMapping, Counter, WebhookConfig, SyncTask])
