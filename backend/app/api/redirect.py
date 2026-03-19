from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from app.models.lead import Lead
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/r/{lead_id}")
async def lead_redirection_proxy(lead_id: str):
    """
    Server-side redirection proxy.
    Toggled when a user clicks/is redirected to a lender.
    Logs the event and performs a 302 redirect.
    """
    lead = await Lead.get(lead_id)
    if not lead:
        logger.warning(f"Redirect Proxy: Lead not found {lead_id}")
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if not lead.redirect_url:
        logger.warning(f"Redirect Proxy: Lead {lead_id} has no redirect_url")
        raise HTTPException(status_code=400, detail="No redirection URL found for this lead")

    # Log the redirection event
    lead.is_redirected = True
    lead.redirected_at = datetime.utcnow()
    
    # Add to trace if not already present for this stage
    already_tracked = any(t.get("stage") == "Redirection" for t in lead.trace)
    if not already_tracked:
        lead.trace.append({
            "timestamp": lead.redirected_at.isoformat(),
            "stage": "Redirection",
            "status": "Transferred",
            "details": "User transferred via server-side proxy"
        })
    
    await lead.save()
    
    logger.info(f"Redirect Proxy: Success for lead {lead_id} -> {lead.redirect_url}")
    
    # 302 Redirect to the actual lender URL
    return RedirectResponse(url=lead.redirect_url, status_code=302)
