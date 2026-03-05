from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.buyer import Buyer
from app.models.lead import Lead

from app.models.form import LeadForm
from app.models.validation import LeadValidationConfig
from app.models.domain_mapping import DomainTokenMapping

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    await init_beanie(database=db, document_models=[User, Buyer, Lead, LeadForm, LeadValidationConfig, DomainTokenMapping])
