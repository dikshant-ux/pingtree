from typing import Dict, Optional, Any, List
from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum

class LeadStatus(str, Enum):
    NEW = "new"
    PROCESSING = "processing"
    SOLD = "sold"
    REJECTED = "rejected"
    UNSOLD = "unsold"
    ERROR = "error"
    INVALID = "Invalid Lead"

class Lead(Document):
    lead_data: Dict[str, Any]
    status: LeadStatus = LeadStatus.NEW
    buyer_id: Optional[str] = None # ID of the buyer it was sold to
    buyer_name: Optional[str] = None
    sold_price: float = 0.0
    latency_ms: int = 0
    redirect_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    trace: List[Dict[str, Any]] = [] # [{timestamp, stage, buyer_id, status, details}]
    validation_results: List[Dict[str, Any]] = [] # [{validator_name, success, response_body, timestamp}]
    
    # Enterprise Fields
    quality_score: float = 0.0 # 0-100
    risk_flags: List[str] = []
    auction_trace: List[Dict[str, Any]] = [] # Detailed auction logs
    
    # Tracking Fields
    form_id: Optional[str] = None
    source_domain: Optional[str] = None
    source_url: Optional[str] = None
    ip_address: Optional[str] = None
    trusted_form_url: Optional[str] = None
    trusted_form_token: Optional[str] = None

    class Settings:
        name = "leads"
