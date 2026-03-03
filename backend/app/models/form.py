from pydantic import Field, BaseModel
from typing import Optional, List
from beanie import Document
from datetime import datetime
 
class ClickIdConfig(BaseModel):
    key: str  # The field name in lead_data (e.g. "click_id")
    method: str # "url" or "rtk"
    param_name: Optional[str] = None # For "url" method
    script_url: Optional[str] = None # For "rtk" method

class LeadForm(Document):
    user_id: str
    name: str = Field(..., description="Internal reference name")
    title: str = Field(..., description="Public form title displayed to user")
    primary_color: str = Field(default="#28a745")
    style: str = Field(default="multi-step", description="Form display style: 'multi-step' or 'single-step'")
    allowed_domains: list[str] = Field(default_factory=list, description="List of domains allowed to embed this form")
    is_active: bool = True
    reject_redirect_url: Optional[str] = Field(None, description="URL to redirect user if lead is rejected")
    click_id_configs: List[ClickIdConfig] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lead_forms"
