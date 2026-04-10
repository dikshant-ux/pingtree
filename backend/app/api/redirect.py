from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from app.models.lead import Lead
from datetime import datetime
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/r/{lead_id}")
async def lead_redirection_proxy(lead_id: str, request: Request):
    """
    Server-side redirection proxy.
    Toggled when a user clicks/is redirected to a lender.
    Logs the event and performs a 302 redirect.
    Now forwards all query parameters for prepop.
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
    
    # Forward query parameters for prepop
    final_url = lead.redirect_url
    incoming_params = dict(request.query_params)
    if incoming_params:
        try:
            parsed = urlparse(final_url)
            existing_params = dict(parse_qsl(parsed.query))
            # Merge incoming params, prioritizing them or destination ones?
            # Usually we forward incoming trackers to the lender.
            existing_params.update(incoming_params)
            
            final_url = urlunparse((
                parsed.scheme, parsed.netloc, parsed.path,
                parsed.params, urlencode(existing_params), parsed.fragment
            ))
        except Exception as e:
            logger.error(f"Error forwarding query params: {e}")

    logger.info(f"Redirect Proxy: Success for lead {lead_id} -> {final_url}")
    
    # 302 Redirect to the actual lender URL
    return RedirectResponse(url=final_url, status_code=302)
