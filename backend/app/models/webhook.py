from typing import Optional, List, Dict, Any
from beanie import Document
from pydantic import Field
from datetime import datetime


class Webhook(Document):
    """Webhook configuration to send live leads to external platforms with filtering."""
    user_id: str
    name: str = Field(..., description="Internal reference name")
    url: str = Field(..., description="Webhook endpoint URL (POST)")
    is_active: bool = True

    # Content type for POST body
    content_type: str = Field(
        default="application/json",
        description="application/json or application/x-www-form-urlencoded"
    )

    # Filters - empty list means "all" (no filtering on that dimension)
    status_filters: List[str] = Field(
        default_factory=lambda: ["sold"],
        description="Lead statuses that trigger webhook (e.g. ['sold', 'rejected']). Empty = all."
    )
    source_filters: List[str] = Field(
        default_factory=list,
        description="Only send leads from these sources (lead_data.source). Empty = all sources."
    )
    source_domain_filters: List[str] = Field(
        default_factory=list,
        description="Only send leads from these source domains. Empty = all domains."
    )

    # Optional custom headers (e.g. Authorization)
    headers: Dict[str, str] = Field(default_factory=dict)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "webhooks"
        indexes = ["user_id", "is_active"]
