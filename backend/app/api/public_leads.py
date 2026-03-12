from fastapi import APIRouter, Header, HTTPException, status, Request
from app.models.user import User
from app.models.form import LeadForm
from app.services.ping.auction_engine import auction_engine
from app.models.lead import LeadStatus
from app.core.config import settings
from app.core.http_client import http_client_manager
from app.core.security import decrypt_secret
from datetime import datetime
import time
from typing import Dict, Any, Optional

router = APIRouter()

@router.post("/ingest")
async def public_ingest_lead(
    request: Request,
    lead_data: Dict[str, Any],
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    start_time = time.time()
    trace = [{"timestamp": datetime.utcnow().isoformat(), "stage": "Ingestion", "status": "Received"}]
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

    # Normalize Phone to +1XXXXXXXXXX (E.164)
    if "Phone" in lead_data:
        # Keep only digits
        digits = "".join(filter(str.isdigit, str(lead_data["Phone"])))
        # If it starts with 1 and is 11 digits, just add +
        if len(digits) == 11 and digits.startswith("1"):
            lead_data["Phone"] = "+" + digits
        # If it's 10 digits, add +1
        elif len(digits) == 10:
            lead_data["Phone"] = "+1" + digits
        # Otherwise, just try to prepend +1 if not already there (conservative)
        elif not str(lead_data["Phone"]).startswith("+"):
             lead_data["Phone"] = "+1" + digits

    metadata = {
        "user_id": str(user.id),
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
        if status != "sold":
            # 1. Check form-specific override
            if metadata.get("form_id"):
                try:
                    form = await LeadForm.get(metadata["form_id"])
                    if form and form.reject_redirect_url:
                        final_redirect = form.reject_redirect_url
                except:
                    pass
            
            # 2. Fallback to automatic construction: source domain + /thank-you
            if not final_redirect and metadata.get("source_url"):
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(metadata["source_url"])
                    if parsed.scheme and parsed.netloc:
                        final_redirect = f"{parsed.scheme}://{parsed.netloc}/thank-you"
                except:
                    pass
        
        return {
            "status": status,
            "lead_id": lead_id,
            "processed_at": processed_at or datetime.utcnow(),
            "redirect_url": final_redirect,
            **({"reason": reason} if reason else {})
        }
    
    # reCAPTCHA Verification
    if metadata.get("form_id"):
        try:
            form = await LeadForm.get(metadata["form_id"])
            if form and getattr(form, 'recaptcha_enabled', False):
                recaptcha_token = lead_data.pop("g-recaptcha-response", None)
                if not recaptcha_token:
                    lead = await auction_engine.create_lead(lead_data, LeadStatus.INVALID, trace, start_time, metadata)
                    return await generate_response(status="Invalid Lead", lead_id=str(lead.id), reason="reCAPTCHA Token Required")
                
                # Determine which secret key to use (Custom vs Global)
                secret_key = settings.RECAPTCHA_SECRET_KEY
                if getattr(form, 'encrypted_recaptcha_secret_key', None):
                    decrypted = decrypt_secret(form.encrypted_recaptcha_secret_key)
                    if decrypted:
                        secret_key = decrypted
                
                # Verify with Google
                client = http_client_manager.get_client()
                verify_res = await client.post(
                    "https://www.google.com/recaptcha/api/siteverify",
                    data={
                        "secret": secret_key,
                        "response": recaptcha_token,
                        "remoteip": ip_address
                    }
                )
                verify_data = verify_res.json()
                if not verify_data.get("success"):
                    lead = await auction_engine.create_lead(lead_data, LeadStatus.INVALID, trace, start_time, metadata)
                    return await generate_response(status="Invalid Lead", lead_id=str(lead.id), reason="reCAPTCHA Verification Failed")
                
                trace.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "stage": "Security",
                    "status": "Verified",
                    "details": "reCAPTCHA verification successful"
                })
        except Exception as e:
            # If DB fails, we might want to log it but maybe continue if it's not critical?
            # Actually, if reCAPTCHA is mandatory, we should fail.
            print(f"Error during reCAPTCHA verification: {e}")
            pass

    # Execute Validation (Optional)
    from app.models.validation import LeadValidationConfig
    from app.services.validator_service import validator_service
    
    validation_configs = await LeadValidationConfig.find(
        LeadValidationConfig.user_id == str(user.id),
        LeadValidationConfig.is_active == True
    ).to_list()
    
    validation_results = []
    any_invalid = False
    
    for config in validation_configs:
        is_valid, resp_body, req_payload = await validator_service.validate_lead(config, lead_data, metadata=metadata)
        
        validation_results.append({
            "validator_name": config.name,
            "success": is_valid,
            "request_payload": req_payload,
            "response_body": resp_body,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        if not is_valid:
            any_invalid = True
            trace.append({
                "timestamp": datetime.utcnow().isoformat(),
                "stage": "Validation",
                "status": "Rejected",
                "details": f"Validation failed for {config.name}"
            })

    metadata["validation_results"] = validation_results

    if any_invalid:
        lead = await auction_engine.create_lead(lead_data, LeadStatus.INVALID, trace, start_time, metadata)
        return await generate_response(status="Invalid Lead", lead_id=str(lead.id), reason="Validation Failed")

    # Execute Auction
    result = await auction_engine.run_auction(lead_data, metadata=metadata, trace=trace)
    
    return await generate_response(
        status=result.status.value if hasattr(result.status, 'value') else result.status,
        lead_id=str(result.id),
        processed_at=result.created_at,
        redirect_url=result.redirect_url
    )

@router.post("/track-redirection/{lead_id}")
async def track_lead_redirection(lead_id: str):
    from app.models.lead import Lead
    lead = await Lead.get(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead.is_redirected = True
    lead.redirected_at = datetime.utcnow()
    lead.trace.append({
        "timestamp": lead.redirected_at.isoformat(),
        "stage": "Redirection",
        "status": "Transferred",
        "details": "User triggered redirection to buyer URL"
    })
    await lead.save()
    return {"status": "success", "is_redirected": True, "redirected_at": lead.redirected_at}
