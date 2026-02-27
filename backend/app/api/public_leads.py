from fastapi import APIRouter, Header, HTTPException, status, Request
from app.models.user import User
from app.models.form import LeadForm
from app.services.ping.auction_engine import auction_engine
from datetime import datetime
from typing import Dict, Any, Optional

router = APIRouter()

@router.post("/ingest")
async def public_ingest_lead(
    request: Request,
    lead_data: Dict[str, Any],
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key required (X-API-Key header)"
        )
    
    user = await User.find_one(User.api_key == api_key)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    
    if not user.is_active:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )

    # Metadata extraction
    referer = request.headers.get("referer")
    
    # Robust IP extraction from headers (for VPS/Docker/Nginx)
    forwarded_for = request.headers.get("x-forwarded-for")
    header_ip = None
    if forwarded_for:
        header_ip = forwarded_for.split(",")[0].strip()
    else:
        header_ip = request.headers.get("x-real-ip") or (request.client.host if request.client else None)
    
    # Prioritize client-side captured IP/UA if provided
    ip_address = lead_data.pop("Ip_Address", header_ip)
    user_agent = lead_data.get("User_Agent") or request.headers.get("user-agent")
    
    # Inject into lead data for processing/filtering/mapping
    lead_data["Ip_Address"] = ip_address
    lead_data["User_Agent"] = user_agent
    
    metadata = {
        "form_id": lead_data.pop("form_id", None),
        "source_url": referer,
        "source_domain": referer.split('/')[2] if referer and '//' in referer else None,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "trusted_form_url": lead_data.get("trusted_form_url"),
        "trusted_form_token": lead_data.get("trusted_form_token")
    }

    # Helper for unified response and redirection
    async def generate_response(status: str, lead_id: Optional[str] = None, processed_at: Optional[datetime] = None, redirect_url: Optional[str] = None, reason: Optional[str] = None):
        final_redirect = redirect_url
        if status != "sold" and metadata.get("form_id"):
            try:
                form = await LeadForm.get(metadata["form_id"])
                if form and form.reject_redirect_url:
                    final_redirect = form.reject_redirect_url
            except:
                pass
        
        return {
            "status": status,
            "lead_id": lead_id,
            "processed_at": processed_at or datetime.utcnow(),
            "redirect_url": final_redirect,
            **({"reason": reason} if reason else {})
        }

    # Execute Validation (Optional)
    from app.models.validation import LeadValidationConfig
    from app.services.validator_service import validator_service
    
    validation_config = await LeadValidationConfig.find_one(
        LeadValidationConfig.user_id == str(user.id),
        LeadValidationConfig.is_active == True
    )
    
    if validation_config:
        is_valid = await validator_service.validate_lead(validation_config, lead_data, metadata=metadata)
        if not is_valid:
            return await generate_response(status="rejected", reason="Validation Failed")

    # Execute Auction
    result = await auction_engine.run_auction(lead_data, metadata=metadata)
    
    return await generate_response(
        status=result.status.value if hasattr(result.status, 'value') else result.status,
        lead_id=str(result.id),
        processed_at=result.created_at,
        redirect_url=result.redirect_url
    )
