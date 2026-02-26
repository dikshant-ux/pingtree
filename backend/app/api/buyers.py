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
        
        # 2. Apply Mapping
        mapped_payload = {}
        mappings = []
        if request.mode == "ping":
            mappings = config.get("ping_mapping", [])
        else:
            mappings = config.get("post_mapping", [])
            
        # Fallback to field_mapping if specific ones are empty
        if not mappings:
             mappings = config.get("field_mapping", [])

        logs.append(f"[MAPPING] Found {len(mappings)} mapping rules")
        
        for rule in mappings:
            internal = rule.get("internal_field")
            buyer_field = rule.get("buyer_field")
            static_val = rule.get("static_value")
            
            val = None
            if static_val is not None:
                val = static_val
            else:
                # Simple lookup (nested support could be added)
                val = request.payload.get(internal)
            
            if val is not None:
                mapped_payload[buyer_field] = val
        
        logs.append(f"[MAPPING] Generated payload with {len(mapped_payload)} keys")
        
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
                
                # 5. Parse Response
                parsed_result = {}
                parse_rules = config.get("response_parsing")
                is_success = False
                
                if parse_rules:
                    success_field = parse_rules.get("success_field")
                    success_val = parse_rules.get("success_value")
                    
                    # Logic to find field in response (simple flat or nested)
                    # For now assumes flat or simple dot notation for top level
                    actual_val = resp_body.get(success_field) # TODO: Support nested path
                    
                    if str(actual_val) == str(success_val):
                        is_success = True
                        logs.append(f"[PARSER] Success matched: {success_field}={actual_val}")
                    else:
                        logs.append(f"[PARSER] Success failed: Expected {success_field}={success_val}, got {actual_val}")
                        
                    # Extraction
                    if parse_rules.get("price_field"):
                        parsed_result["price"] = resp_body.get(parse_rules.get("price_field"))
                    if parse_rules.get("redirect_url_field"):
                        parsed_result["redirect_url"] = resp_body.get(parse_rules.get("redirect_url_field"))
                        
                    # Custom Fields Extraction
                    custom_fields = parse_rules.get("custom_fields", {})
                    if custom_fields:
                        parsed_result["custom"] = {}
                        for key, path in custom_fields.items():
                            # Simple flat extraction for now, can extend to nested if needed
                            parsed_result["custom"][key] = resp_body.get(path)
                else:
                    # Default success if 200 OK and no rules
                    is_success = response.status_code >= 200 and response.status_code < 300
                    logs.append(f"[PARSER] No rules. defaulted success based on status code.")

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
