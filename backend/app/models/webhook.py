from typing import List, Optional
from pydantic import Field, HttpUrl
from datetime import datetime
from enum import Enum
from beanie import Document

class WebhookEvent(str, Enum):
    LEAD_SOLD = "lead_sold"
    LEAD_UNSOLD = "lead_unsold"
    LEAD_REJECTED = "lead_rejected"

class WebhookConfig(Document):
    name: str
    url: str
    event_types: List[WebhookEvent] = Field(default_factory=list)
    secret_key: Optional[str] = None
    is_active: bool = True
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "webhook_configs"
