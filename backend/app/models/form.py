from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

class LeadForm(Document):
    user_id: str
    name: str = Field(..., description="Internal reference name")
    title: str = Field(..., description="Public form title displayed to user")
    primary_color: str = Field(default="#28a745")
    allowed_domains: list[str] = Field(default_factory=list, description="List of domains allowed to embed this form")
    is_active: bool = True
    reject_redirect_url: Optional[str] = Field(None, description="URL to redirect user if lead is rejected")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lead_forms"
