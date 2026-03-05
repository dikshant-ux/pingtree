from typing import List, Dict, Optional, Any
from beanie import Document
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from enum import Enum

class BuyerType(str, Enum):
    PING_POST = "ping_post"
    FULL_POST = "full_post"
    REDIRECT = "redirect"

class BuyerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PAUSED = "paused"

class FilterNode(BaseModel):
    type: str = "rule" # "rule" or "group"
    # Rule fields
    field: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[Any] = None
    # Group fields
    conjunction: Optional[str] = "AND" # "AND" or "OR"
    children: Optional[List["FilterNode"]] = []

FilterNode.update_forward_refs()

class FilterRule(BaseModel):
    field: str
    operator: str
    value: Any

class FilterConfig(BaseModel):
    states: Optional[List[str]] = []
    zip_codes: Optional[List[str]] = []
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    rules: Optional[List[FilterRule]] = [] # Legacy / Flat support
    filter_root: Optional[FilterNode] = None # New Recursive Root
    custom_conditions: Optional[Dict[str, Any]] = {}

class CapConfig(BaseModel):
    daily_cap: int = 0
    hourly_cap: int = 0
    total_cap: int = 0
    throttle_per_minute: int = 0

class FieldMapping(BaseModel):
    internal_field: str
    buyer_field: str
    static_value: Optional[Any] = None # If set, use this value instead of looking up internal_field

class ResponseParsingRule(BaseModel):
    success_field: str
    success_value: str
    price_field: Optional[str] = None
    redirect_url_field: Optional[str] = None
    reason_field: Optional[str] = None
    custom_fields: Optional[Dict[str, str]] = {} # Map[OutputName, JsonPath]

class ContextExtractionRule(BaseModel):
    """Extracts data from Ping Response to use in Post Request"""
    response_field: str # e.g. "response.id"
    context_key: str # e.g. "lead_id" (to be mapped in Post)

class Buyer(Document):
    name: str = Field(..., min_length=1)
    type: BuyerType = BuyerType.PING_POST
    ping_url: Optional[str] = None
    post_url: Optional[str] = None
    headers: Dict[str, str] = {} # Custom headers (Auth etc)
    
    payout: float = 0.0
    priority: int = 10
    timeout_ms: int = 1000
    
    filters: FilterConfig = Field(default_factory=FilterConfig)
    caps: CapConfig = Field(default_factory=CapConfig)
    
    field_mapping: List[FieldMapping] = [] # Legacy / Shared
    ping_mapping: List[FieldMapping] = []  # New: Partial Data for Ping
    post_mapping: List[FieldMapping] = []  # New: Full Data for Post
    
    response_parsing: Optional[ResponseParsingRule] = None
    context_extraction: List[ContextExtractionRule] = [] # New: Extract data for Post
    
    status: BuyerStatus = BuyerStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    
    # Enterprise Fields
    tier: int = 1 # 1=Premium, 2=Standard, 3=Salvage
    scoring_weights: Optional[Dict[str, float]] = {
        "price": 0.6,
        "speed": 0.15, 
        "accept_rate": 0.15,
        "priority": 0.1
    }
    capabilities: Optional[Dict[str, Any]] = {
        "supports_fallback": True,
        "supports_reping": False,
        "max_ping_age_seconds": 5,
        "requires_exclusive": False
    }
    performance_metrics: Optional[Dict[str, Any]] = {
        "avg_latency_ms": 0,
        "accept_rate_24h": 0.0,
        "post_success_rate_24h": 0.0,
        "timeout_rate_24h": 0.0
    }

    class Settings:
        name = "buyers"
