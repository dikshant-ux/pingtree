from typing import Dict, Any, Optional
from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field

class LeadValidationConfig(Document):
    user_id: Optional[str] = None
    name: str = "Default Validator"
    is_active: bool = True
    
    # API Configuration
    api_url: str  # e.g., https://lvt.vellko.com/api/validate
    api_key: Optional[str] = None
    method: str = "GET"  # "GET" or "POST"
    
    # Parameter Mapping
    # Maps Lead field (e.g., "phone") to API parameter name (e.g., "phone_number")
    param_mappings: Dict[str, str] = Field(default_factory=dict)
    
    # Static Parameters (e.g., publisher, api_key if passed in URL)
    static_params: Dict[str, str] = Field(default_factory=dict)
    
    # Success Criteria
    # e.g., {"field": "status", "operator": "==", "value": "valid"}
    success_criteria_field: str = "status"
    success_criteria_value: str = "valid"
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lead_validation_configs"
