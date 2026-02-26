from fastapi import APIRouter, Depends, BackgroundTasks
from app.api import auth
from app.services.ping.auction_engine import auction_engine
from app.models.lead import Lead
from typing import Dict, Any

router = APIRouter()

@router.post("/", response_model=Lead)
async def ingest_lead(lead_data: Dict[str, Any]):
    # TODO: Auth check (API Key or similar)
    # Run synchronously for now to return result immediately, 
    # but for high throughput we might want to queue it or return a transaction ID.
    # The requirement says "Ping tree execution under 800ms", so synchronous is expected.
    
    result = await auction_engine.run_auction(lead_data)
    return result

@router.get("/fields")
async def get_lead_fields():
    # Fetch the most recent lead to get available fields
    # Utilizing the schema-less nature to discover fields dynamically
    recent_lead = await Lead.find_one(sort=[("created_at", -1)])
    
    if recent_lead and recent_lead.lead_data:
        # Convert keys to Title Case for UI consistency if needed, or keep raw
        # The user seems to prefer Title Case mapping inputs
        return sorted(list(recent_lead.lead_data.keys()))
        
    # Fallback to defaults if no data exists yet (Bootstrap)
    return [
        "First_Name", "Last_Name", "Email", "Phone", "Address", "City", "State", "Zip",
        "Dob", "Gender", "Ip_Address", "User_Agent"
    ]

from beanie import PydanticObjectId

@router.get("/{id}", response_model=Lead)
async def get_lead(id: str):
    try:
        oid = PydanticObjectId(id)
    except:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    lead = await Lead.get(oid)
    if not lead:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead
