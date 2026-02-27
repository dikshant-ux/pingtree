import httpx
import logging
from typing import Dict, Any, Tuple, Optional
from app.models.buyer import Buyer, BuyerStatus

logger = logging.getLogger(__name__)

class BuyerClient:
    async def ping_buyer(self, buyer: Buyer, lead_data: Dict[str, Any]) -> Tuple[bool, float, Optional[str], str, Dict[str, Any]]:
        """
        Returns (Success, Price, Redirect, Reason, Context)
        Context is data extracted from response (e.g. Lead_ID) to be used in Post.
        """
        # Feature: Separate Ping Mapping
        mapping = buyer.ping_mapping if buyer.ping_mapping else buyer.field_mapping
        payload = self.transform_payload(lead_data, mapping)
        
        # Inject Mode
        payload["mode"] = "ping"
        
        # Inject TrustedForm if present
        if lead_data.get("trusted_form_url"):
            payload["trustedform_cert_url"] = lead_data["trusted_form_url"]
        if lead_data.get("trusted_form_token"):
            payload["trusted_form_token"] = lead_data["trusted_form_token"]
        
        url = buyer.ping_url
        timeout = buyer.timeout_ms / 1000.0
        headers = buyer.headers or {}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=timeout)
                success, price, redirect, reason, raw_data = self.parse_response(buyer, response)
                
                # Extract Context
                context = {}
                print(f"DEBUG INFO: Success={success}, HasRules={bool(buyer.context_extraction)}, HasData={bool(raw_data)}")
                if buyer.context_extraction:
                    print(f"DEBUG Rules: {buyer.context_extraction}")
                
                if success and buyer.context_extraction and raw_data:
                    print(f"DEBUG: Extracting context from rules: {buyer.context_extraction}")
                    print(f"DEBUG: Raw Data: {raw_data}")
                    for rule in buyer.context_extraction:
                        val = self.get_nested(raw_data, rule.response_field)
                        print(f"DEBUG: Rule {rule.response_field} -> {val}")
                        if val is not None:
                            context[rule.context_key] = val
                print(f"DEBUG: Final Context: {context}")
                            
                return success, price, redirect, reason, context
                
        except httpx.TimeoutException:
            return False, 0.0, None, "Timeout", {}
        except Exception as e:
            logger.error(f"Ping error for {buyer.name}: {e}")
            return False, 0.0, None, f"Error: {str(e)}", {}

    async def post_buyer(self, buyer: Buyer, lead_data: Dict[str, Any], context: Dict[str, Any] = {}) -> Tuple[bool, float, Optional[str]]:
        """
        Returns (Success, Price, RedirectURL)
        """
        if not buyer.post_url:
            return True, buyer.payout, None # Maybe ping was enough?
            
        # Feature: Separate Post Mapping
        mapping = buyer.post_mapping if buyer.post_mapping else buyer.field_mapping
        
        payload = self.transform_payload(lead_data, mapping)
        
        # Inject Context directly into payload (bypassing mapping whitelist)
        # This ensures dynamic fields extracted from Ping (e.g. lead_id) are sent.
        if context:
            payload.update(context)
        
        # Inject Mode
        payload["mode"] = "post"

        # # Inject TrustedForm if present
        # if lead_data.get("trusted_form_url"):
        #     payload["trustedform_cert_url"] = lead_data["trusted_form_url"]
        # if lead_data.get("trusted_form_token"):
        #     payload["trusted_form_token"] = lead_data["trusted_form_token"]
        
        url = buyer.post_url
        timeout = buyer.timeout_ms / 1000.0
        headers = buyer.headers or {}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=timeout)
                success, price, redirect, _, _ = self.parse_response(buyer, response)
                return success, price, redirect
        except Exception as e:
            logger.error(f"Post failed for {buyer.name}: {e}")
            return False, 0.0, None

    def transform_payload(self, lead_data: Dict[str, Any], mapping: list) -> Dict[str, Any]:
        if not mapping:
            return lead_data.copy()
        
        payload = {}
        # Create a lowercase map for case-insensitive lookup
        lead_data_lower = {k.lower(): v for k, v in lead_data.items()}
        
        for rule in mapping:
            # Handle both object attributes and dictionary keys (for Test Console support)
            internal_field = getattr(rule, "internal_field", None) or (rule.get("internal_field") if isinstance(rule, dict) else None)
            buyer_field = getattr(rule, "buyer_field", None) or (rule.get("buyer_field") if isinstance(rule, dict) else None)
            static_value = getattr(rule, "static_value", None) if not isinstance(rule, dict) else rule.get("static_value")

            if buyer_field is None:
                continue

            if static_value is not None:
                payload[buyer_field] = static_value
            elif internal_field:
                # 1. Try exact match
                if internal_field in lead_data:
                    payload[buyer_field] = lead_data[internal_field]
                # 2. Try case-insensitive match
                elif internal_field.lower() in lead_data_lower:
                    payload[buyer_field] = lead_data_lower[internal_field.lower()]
        return payload

    def parse_response(self, buyer: Buyer, response: httpx.Response) -> Tuple[bool, float, Optional[str], str, Optional[Dict]]:
        # Check HTTP Status first
        if not (200 <= response.status_code < 300):
             return False, 0.0, None, f"HTTP Error {response.status_code}", None

        try:
            # If body is empty, treat as failure (Unsold)
            if not response.text or not response.text.strip():
                return False, 0.0, None, "Empty Response", {}
                
            data = response.json()
        except:
             # Stricter: Non-JSON response is now a failure
             return False, 0.0, None, "Invalid JSON Response", {"raw": response.text[:200]}

        # Default Parsing (If no specific rules provided)
        if not buyer.response_parsing:
            status_val = str(data.get("status", "")).lower()
            if "status" in data:
                if status_val in ["accepted", "success", "matched", "sold"]:
                    return True, float(data.get("price", 0) or buyer.payout), data.get("redirect_url"), "Accepted", data
                else:
                    return False, 0.0, None, data.get("reason") or f"Rejected ({status_val})", data
            
            # If no status field and no rules, let's treat as failure to avoid false positives
            return False, 0.0, None, "No success indicator in response", data

        # Custom Rules Parsing
        rules = buyer.response_parsing
        
        success_val = self.get_nested(data, rules.success_field)
        # Convert both to string for comparison to handle int/str mismatch
        if str(success_val).lower() != str(rules.success_value).lower():
            reason = self.get_nested(data, rules.reason_field) if rules.reason_field else "Field Value Mismatch"
            return False, 0.0, None, str(reason), data
            
        price = 0.0
        if rules.price_field:
            try:
                price = float(self.get_nested(data, rules.price_field))
            except:
                pass
                
        redirect = None
        if rules.redirect_url_field:
            redirect = self.get_nested(data, rules.redirect_url_field)
            
        return True, price, redirect, "Accepted", data

    def get_nested(self, data: Any, path: str) -> Any:
        try:
            keys = path.split('.')
            curr = data
            for k in keys:
                if isinstance(curr, dict):
                    curr = curr.get(k)
                else:
                    return None
            return curr
        except:
            return None
