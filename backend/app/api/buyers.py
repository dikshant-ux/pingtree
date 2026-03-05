from typing import List, Dict, Any, Optional
import httpx
import json
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models.buyer import Buyer, BuyerStatus

router = APIRouter()

class BuyerTestRequest(BaseModel):
    buyer_config: Dict[str, Any] # Accept raw dict to allow partial/unsaved config
    payload: Dict[str, Any]
    mode: str = "ping" # ping | post | full

@router.post("/", response_model=Buyer)
async def create_buyer(buyer: Buyer):
    await buyer.create()
    return buyer

@router.get("/", response_model=List[Buyer])
async def list_buyers(status: BuyerStatus = None):
    if status:
        return await Buyer.find(Buyer.status == status).to_list()
    return await Buyer.find_all().to_list()

@router.get("/{buyer_id}", response_model=Buyer)
async def get_buyer(buyer_id: str):
    buyer = await Buyer.get(buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    return buyer

@router.put("/{buyer_id}", response_model=Buyer)
async def update_buyer(buyer_id: str, buyer_update: Dict[str, Any]):
    buyer = await Buyer.get(buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    # Exclude system-managed fields
    excluded_fields = {"id", "created_at", "performance_metrics", "scoring_weights"}
    
    for key, value in buyer_update.items():
        if key not in excluded_fields and hasattr(buyer, key):
            setattr(buyer, key, value)
    
    buyer.updated_at = datetime.utcnow()
    await buyer.save()
    return buyer

@router.delete("/{buyer_id}")
async def delete_buyer(buyer_id: str):
    buyer = await Buyer.get(buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    await buyer.delete()
    return {"message": "Buyer deleted"}

@router.post("/{buyer_id}/clone", response_model=Buyer)
async def clone_buyer(buyer_id: str):
    existing_buyer = await Buyer.get(buyer_id)
    if not existing_buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    # Create a copy by excluding the ID and other system fields
    buyer_dict = existing_buyer.dict(exclude={"id", "created_at", "updated_at", "performance_metrics"})
    buyer_dict["name"] = f"{buyer_dict['name']} (Copy)"
    buyer_dict["status"] = BuyerStatus.INACTIVE # Set copy to inactive by default
    
    new_buyer = Buyer(**buyer_dict)
    await new_buyer.create()
    return new_buyer

# --- Test Console Logic ---

@router.post("/test")
async def test_buyer_integration(request: BuyerTestRequest):
    """
    Simulates a request to the buyer using the provided configuration (unsaved).
    Performs mapping, request construction, and response parsing.
    """
    logs = []
    logs.append(f"[INIT] Starting {request.mode.upper()} simulation")
    
    try:
        # 1. Parse Config
        # We try to load it into the Pydantic model to validate, but handle it loosely if needed
        # For mapping logic, we just need the dict structure mostly
        config = request.buyer_config
        target_url = config.get("ping_url") if request.mode == "ping" else (config.get("post_url") or config.get("ping_url"))
        
        if not target_url:
             return {
                "status": "failure",
                "error": "No URL configured for this mode",
                "logs": logs
            }
            
        logs.append(f"[CONFIG] Target URL: {target_url}")
        
        # 2. Apply Mapping (Bypassed for Test Input)
        mapped_payload = request.payload.copy()
        logs.append(f"[MAPPING] Bypassed mapping rules. Using raw input payload.")
        
        # 3. Prepare Request (Headers)
        headers = config.get("headers", {}).copy()
        
        # 4. Send Request
        start_time = time.time()
        logs.append(f"[NET] Sending POST to {target_url}...")
        
        async with httpx.AsyncClient() as client:
            try:
                # Basic timeout from config or default 5s
                response = await client.post(
                    target_url,
                    json=mapped_payload,
                    headers=headers,
                    timeout=5.0 
                )
                duration = (time.time() - start_time) * 1000
                logs.append(f"[NET] Response received: {response.status_code} ({duration:.0f}ms)")
                
                resp_body = {}
                try:
                    resp_body = response.json()
                except:
                    resp_body = {"raw": response.text}
                
                # 5. Parse Response using BuyerClient logic
                from app.services.ping.buyer_client import BuyerClient
                buyer_client = BuyerClient()
                
                # Mock a Buyer object for parse_response
                # We can't easily valid_config = Buyer(**config) if it's partial
                # but parse_response only needs buyer.response_parsing and buyer.payout
                class MockBuyer:
                    def __init__(self, cfg):
                        from app.models.buyer import ResponseParsingRule
                        self.payout = cfg.get("payout", 0.0)
                        rp = cfg.get("response_parsing")
                        self.response_parsing = ResponseParsingRule(**rp) if rp else None
                
                temp_buyer = MockBuyer(config)
                is_success, price, redirect, reason, _ = buyer_client.parse_response(temp_buyer, response)
                
                parsed_result = {
                    "price": price,
                    "redirect_url": redirect,
                    "reason": reason
                }

                # Custom Fields Extraction
                custom_fields = config.get("response_parsing", {}).get("custom_fields", {})
                if custom_fields:
                    parsed_result["custom"] = {}
                    for key, path in custom_fields.items():
                        parsed_result["custom"][key] = buyer_client.get_nested(resp_body, path)

                logs.append(f"[PARSER] Result: {'Success' if is_success else 'Failed'}")
                logs.append(f"[PARSER] Reason: {reason}")
                if price: logs.append(f"[PARSER] Price: {price}")

                return {
                    "status": "success" if is_success else "rejected",
                    "request": {
                        "url": target_url,
                        "method": "POST",
                        "headers": headers,
                        "body": mapped_payload
                    },
                    "response": {
                        "status_code": response.status_code,
                        "body": resp_body,
                        "duration_ms": duration
                    },
                    "parsed_output": parsed_result,
                    "logs": logs
                }

            except httpx.RequestError as e:
                logs.append(f"[NET] Request Error: {str(e)}")
                return {
                    "status": "error",
                    "error": str(e),
                    "logs": logs
                }
                
    except Exception as e:
        logs.append(f"[sys] System Error: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "logs": logs
        }
