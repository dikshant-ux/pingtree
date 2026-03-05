from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

class DomainTokenMapping(Document):
    user_id: str
    domain_name: str = Field(..., description="The source domain (normalized)")
    api_token: str = Field(..., description="The API token to inject for this domain")
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "domain_token_mappings"
        indexes = ["user_id", "domain_name"]
