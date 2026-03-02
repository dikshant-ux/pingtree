import httpx
import logging
from typing import Dict, Any, Tuple, Optional
from app.models.buyer import Buyer, BuyerStatus

logger = logging.getLogger(__name__)

class BuyerClient:
    async def ping_buyer(self, buyer: Buyer, lead_data: Dict[str, Any]) -> Tuple[bool, float, Optional[str], str, Dict[str, Any], Optional[Dict]]:
        """
        Returns (Success, Price, Redirect, Reason, Context, RawData)
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
                            
                return success, price, redirect, reason, context, raw_data
                
        except httpx.TimeoutException:
            return False, 0.0, None, "Timeout", {}, None
        except Exception as e:
            logger.error(f"Ping error for {buyer.name}: {e}")
            return False, 0.0, None, f"Error: {str(e)}", {}, None

    async def post_buyer(self, buyer: Buyer, lead_data: Dict[str, Any], context: Dict[str, Any] = {}) -> Tuple[bool, float, Optional[str], str, Optional[Dict]]:
        """
        Returns (Success, Price, RedirectURL, Reason, Data)
        """
        if not buyer.post_url:
            return True, buyer.payout, None, "Success (No Post URL)", {} # Return 5-tuple
            
        # Feature: Separate Post Mapping
        mapping = buyer.post_mapping if buyer.post_mapping else buyer.field_mapping
        
        payload = self.transform_payload(lead_data, mapping)
        
        # Inject Context directly into payload (bypassing mapping whitelist)
        # This ensures dynamic fields extracted from Ping (e.g. lead_id) are sent.
        if context:
            payload.update(context)
        
        # Inject Mode
        payload["mode"] = "post"

        # Inject TrustedForm if present
        if lead_data.get("trusted_form_url"):
            payload["trustedform_cert_url"] = lead_data["trusted_form_url"]
        if lead_data.get("trusted_form_token"):
            payload["trusted_form_token"] = lead_data["trusted_form_token"]
        
        url = buyer.post_url
        timeout = buyer.timeout_ms / 1000.0
        headers = buyer.headers or {}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=timeout)
                success, price, redirect, reason, data = self.parse_response(buyer, response)
                return success, price, redirect, reason, data
        except Exception as e:
            logger.exception(f"Post failed for {buyer.name}: {e}")
            return False, 0.0, None, f"Error: {repr(e)}", {}

    def transform_payload(self, lead_data: Dict[str, Any], mapping: list) -> Dict[str, Any]:
        if not mapping:
            # Fallback for when no mapping is provided - still apply capitalization
            payload = lead_data.copy()
            return self._capitalize_payload(payload)
            
        payload = {}
        for rule in mapping:
            val = None
            if rule.static_value is not None:
                val = rule.static_value
            elif rule.internal_field in lead_data:
                val = lead_data[rule.internal_field]
            
            if val is not None:
                payload[rule.buyer_field] = val
                
        return self._capitalize_payload(payload)

    def _capitalize_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Uppercases all string values in the payload except for system fields.
        """
        exclude_fields = {
            "User_Agent", "user_agent", "UA", 
            "source_url", "source_domain", 
            "trusted_form_url", "trusted_form_token", "xxTrustedFormCertUrl",
            "cert_url", "ping_url", "redirect_url", "click_id", "rtkclickid",
            "gclid", "fbp", "fbc"
        }
        
        capitalized = {}
        for k, v in payload.items():
            if isinstance(v, str) and k not in exclude_fields and not v.startswith("http"):
                capitalized[k] = v.upper()
            else:
                capitalized[k] = v
        return capitalized

    def parse_response(self, buyer: Buyer, response: httpx.Response) -> Tuple[bool, float, Optional[str], str, Optional[Dict]]:
        # Check HTTP Status first
        if not (200 <= response.status_code < 300):
             return False, 0.0, None, f"Status {response.status_code}", None

        try:
            data = response.json()
        except:
             # If not JSON, but 200 OK, treat as success but no data
             return True, buyer.payout, None, "Success (Non-JSON)", {}

        # Default Parsing (Simulator / Simple)
        if not buyer.response_parsing:
            if data.get("status") in ["accepted", "success", "matched"]:
                 return True, float(data.get("price", 0) or buyer.payout), data.get("redirect_url"), "Accepted", data
            # Fallback for simple success if no specific status field check required? 
            # Ideally strict, but for legacy compatibility we might keep loose.
            # Let's assume if 'status' exists it must be positive, else if 200 OK it's good.
            if "status" in data and data["status"] not in ["accepted", "success", "matched"]:
                 return False, 0.0, None, data.get("reason", "Rejected"), data
            
            return True, float(data.get("price", 0) or buyer.payout), data.get("redirect_url"), "Accepted", data

        # Custom Rules
        rules = buyer.response_parsing
        
        success_val = self.get_nested(data, rules.success_field)
        # Convert both to string for comparison to handle int/str mismatch
        if str(success_val).lower() != str(rules.success_value).lower():
            reason = self.get_nested(data, rules.reason_field) if rules.reason_field else None
            return False, 0.0, None, str(reason or "Rejected"), data
            
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
