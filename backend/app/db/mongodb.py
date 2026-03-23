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
        connectTimeoutMS=10000,
        serverSelectionTimeoutMS=5000,
        socketTimeoutMS=45000,
        retryReads=True,
        retryWrites=True,
        tls=True,
        tlsAllowInvalidCertificates=True
    )
    db = client[settings.DATABASE_NAME]
    
    await init_beanie(database=db, document_models=[User, Buyer, Lead, LeadForm, LeadValidationConfig, DomainTokenMapping, Counter, Webhook])
