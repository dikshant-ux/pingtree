"""
Webhook service: fires lead_sold (and other) events to configured webhook URLs
with status, source, and source_domain filtering.
"""
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

import httpx

from app.models.lead import Lead
from app.models.webhook import Webhook

logger = logging.getLogger(__name__)


def build_webhook_payload(lead: Lead) -> Dict[str, Any]:
    """Build the standardized webhook payload from a lead."""
    ld = lead.lead_data or {}
    status_val = lead.status.value if hasattr(lead.status, "value") else str(lead.status)

    payload = {
        "event": "lead_sold" if status_val == "sold" else f"lead_{status_val}",
        "timestamp": datetime.utcnow().isoformat(),
        "lead_id": str(lead.id),
        "readable_id": lead.readable_id,
        "status": status_val,
        # Lead data fields (merge from lead_data)
        "loanAmount": ld.get("loanAmount"),
        "loanPurpose": ld.get("loanPurpose"),
        "Email": ld.get("Email"),
        "First_Name": ld.get("First_Name"),
        "Last_Name": ld.get("Last_Name"),
        "dob": ld.get("dob"),
        "Phone": ld.get("Phone"),
        "SSN": ld.get("SSN"),
        "Zip": ld.get("Zip"),
        "city": ld.get("city"),
        "state": ld.get("state"),
        "fullState": ld.get("fullState"),
        "Address": ld.get("Address"),
        "payFrequency": ld.get("payFrequency"),
        "nextPayDate": ld.get("nextPayDate"),
        "bankAccountType": ld.get("bankAccountType"),
        "incomeMethod": ld.get("incomeMethod"),
        "incomeType": ld.get("incomeType"),
        "isMilitary": ld.get("isMilitary"),
        "Employer": ld.get("Employer"),
        "incomeNetMonthly": ld.get("incomeNetMonthly"),
        "debtAssistance": ld.get("debtAssistance"),
        "creditRating": ld.get("creditRating"),
        "ownVehicle": ld.get("ownVehicle"),
        "bankName": ld.get("bankName"),
        "bankState": ld.get("bankState"),
        "routingNumber": ld.get("routingNumber"),
        "accountNumber": ld.get("accountNumber"),
        # TrustedForm
        "xxTrustedFormCertUrl": ld.get("xxTrustedFormCertUrl") or lead.trusted_form_url,
        "xxTrustedFormToken": ld.get("xxTrustedFormToken") or lead.trusted_form_token,
        "xxTrustedFormPingUrl": ld.get("xxTrustedFormPingUrl"),
        "trusted_form_url": lead.trusted_form_url or ld.get("trusted_form_url"),
        "trusted_form_token": lead.trusted_form_token or ld.get("trusted_form_token"),
        # Source / tracking
        "source_url": lead.source_url or ld.get("source_url"),
        "source_domain": lead.source_domain or ld.get("source_domain"),
        "User_Agent": ld.get("User_Agent"),
        "gclid": ld.get("gclid", ""),
        "fbp": ld.get("fbp", ""),
        "fbc": ld.get("fbc", ""),
        "utm_source": ld.get("utm_source", ""),
        "utm_medium": ld.get("utm_medium", ""),
        "utm_campaign": ld.get("utm_campaign", ""),
        "utm_term": ld.get("utm_term", ""),
        "utm_content": ld.get("utm_content", ""),
        "eventid": ld.get("eventid", ""),
        "unique_id": ld.get("unique_id", ""),
        "subsource": ld.get("subsource", ""),
        "source": ld.get("source", ""),
        "Ip_Address": lead.ip_address or ld.get("Ip_Address"),
        "quality_score": lead.quality_score or ld.get("quality_score"),
        # Sale info
        "buyer_id": lead.buyer_id,
        "buyer_name": lead.buyer_name,
        "price": lead.sold_price,
        "redirect_url": lead.redirect_url,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
    }
    return payload


def _matches_filters(webhook: Webhook, lead: Lead, status_val: str) -> bool:
    """Check if lead matches webhook status, source, and source_domain filters."""
    # Status filter: empty = all; otherwise must be in list
    if webhook.status_filters and status_val not in webhook.status_filters:
        return False

    # Source filter: from lead_data.source
    source = (lead.lead_data or {}).get("source") or ""
    if webhook.source_filters:
        # Normalize: empty string or None should match "empty" filter if explicitly listed
        sources_to_match = {s.strip().lower() for s in webhook.source_filters if s}
        if sources_to_match and (source or "").strip().lower() not in sources_to_match:
            return False

    # Source domain filter
    domain = lead.source_domain or (lead.lead_data or {}).get("source_domain") or ""
    if webhook.source_domain_filters:
        domains_to_match = {d.strip().lower() for d in webhook.source_domain_filters if d}
        if domains_to_match and (domain or "").strip().lower() not in domains_to_match:
            return False

    return True


async def fire_webhooks_for_lead(lead: Lead) -> None:
    """
    Find active webhooks for the lead's user that match filters, and POST payload to each.
    Runs fire-and-forget (non-blocking); errors are logged only.
    """
    user_id = getattr(lead, "user_id", None)
    if not user_id:
        logger.debug("Lead has no user_id, skipping webhooks")
        return

    webhooks = await Webhook.find(
        Webhook.user_id == user_id,
        Webhook.is_active == True
    ).to_list()

    status_val = lead.status.value if hasattr(lead.status, "value") else str(lead.status)
    payload = build_webhook_payload(lead)

    for wh in webhooks:
        if not _matches_filters(wh, lead, status_val):
            logger.debug(f"Webhook {wh.name} skipped: lead did not match filters")
            continue

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                content_type = getattr(wh, "content_type", None) or "application/json"
                headers = {**wh.headers}
                if "Content-Type" not in headers:
                    headers["Content-Type"] = content_type

                if content_type == "application/x-www-form-urlencoded":
                    # Flatten payload to key=value strings for form data
                    form_data = {
                        k: ("" if v is None else str(v))
                        for k, v in payload.items()
                    }
                    resp = await client.post(wh.url, data=form_data, headers=headers)
                else:
                    resp = await client.post(wh.url, json=payload, headers=headers)
                if resp.status_code >= 400:
                    logger.warning(
                        f"Webhook {wh.name} ({wh.url}) returned {resp.status_code}: {resp.text[:200]}"
                    )
                else:
                    logger.info(f"Webhook {wh.name} fired successfully for lead {lead.id}")
        except Exception as e:
            logger.warning(f"Webhook {wh.name} ({wh.url}) failed: {e}")

