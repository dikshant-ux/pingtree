import httpx
import logging
import time
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from app.models.buyer import Buyer, BuyerStatus, BuyerType
from app.models.lead import Lead, LeadStatus
from app.db.redis import redis_client

logger = logging.getLogger(__name__)

class PingService:
    async def process_lead(self, lead_data: Dict[str, Any]) -> Lead:
        start_time = time.time()
        trace = []
        
        # Helper to add trace
        def add_trace(stage: str, status: str, buyer_id: str = None, buyer_name: str = None, details: str = None):
            trace.append({
                "timestamp": datetime.utcnow().isoformat(),
                "stage": stage,
                "status": status,
                "buyer_id": buyer_id,
                "buyer_name": buyer_name,
                "details": details
            })
            
        add_trace("Ingestion", "Received", details="Lead received by system")

        # 1. Create Lead Record
        lead = Lead(lead_data=lead_data, status=LeadStatus.PROCESSING, trace=trace)
        await lead.create()
        
        logger.info(f"Processing lead {lead.id}")
        
        # 2. Fetch Active Buyers
        buyers = await Buyer.find(Buyer.status == BuyerStatus.ACTIVE).to_list()
        
        # 3. Sort Buyers (Payout DESC, Priority DESC (lower is better? usually, but user said Priority ASC in request))
        # User request: "Sort buyers by: payout DESC, priority ASC"
        # Assuming priority 1 is higher than priority 10.
        buyers.sort(key=lambda x: (-x.payout, x.priority))
        
        logger.info(f"Found {len(buyers)} active buyers: {[b.name for b in buyers]}")
        for b in buyers:
             logger.info(f"Buyer details {b.name}: Status={b.status}, Payout={b.payout}, ID={b.id}")
        
        # 4. Iterate and Ping
        for buyer in buyers:
            logger.info(f"Evaluating buyer: {buyer.name} ({buyer.id})")
            
            # Check filters
            if not self.check_filters(buyer, lead_data):
                # check_filters now ideally returns specific reason, but for now we generalize.
                # To make it "why", let's inspect simple conditions here or update check_filters to return reason.
                # For quick win: checks age/state mismatch manually for log?
                # Better: Update check_filters to return (bool, reason)
                # But to avoid big refactor, I'll log "Filter mismatch (State/Zip/Age)" based on quick check.
                reason = "Criteria mismatch"
                if buyer.filters.states and lead_data.get("state") not in buyer.filters.states:
                    reason = f"State {lead_data.get('state')} not in {buyer.filters.states}"
                elif buyer.filters.min_age and lead_data.get("age") < buyer.filters.min_age:
                     reason = f"Age {lead_data.get('age')} < Min {buyer.filters.min_age}"
                
                logger.info(f"Buyer {buyer.name} skipped: {reason}")
                add_trace("Filter", "Skipped", str(buyer.id), buyer.name, reason)
                continue
            
            # Check caps (Redis)
            if not await self.check_caps(buyer):
                logger.info(f"Buyer {buyer.name} skipped: Cap reached")
                add_trace("Cap", "Skipped", str(buyer.id), buyer.name, "Cap limit reached")
                continue
            
            # Ping
            try:
                success, price, redirect_url, reason = await self.ping_buyer(buyer, lead_data)
                
                if success:
                    logger.info(f"Buyer {buyer.name} ACCEPTED lead {lead.id}")
                    
                    # If Ping-Post and accepted, we might need to send the full post now
                    # Or was the ping actually the full post?
                    # "Send ping (partial lead) -> On accept → send full lead (post)"
                    
                    if buyer.type == BuyerType.PING_POST and buyer.post_url:
                         # Execute Post step
                         post_success, post_redirect = await self.post_lead(buyer, lead_data)
                         if not post_success:
                             logger.warning(f"Buyer {buyer.name} failed at POST stage")
                             continue
                         
                         if post_redirect:
                             redirect_url = post_redirect

                    lead.status = LeadStatus.SOLD
                    lead.buyer_id = str(buyer.id)
                    lead.buyer_name = buyer.name
                    lead.sold_price = price if price is not None else buyer.payout
                    lead.latency_ms = int((time.time() - start_time) * 1000)
                    lead.redirect_url = redirect_url
                    
                    add_trace("Sales", "Sold", str(buyer.id), buyer.name, f"Accepted with price ${lead.sold_price}")
                    lead.trace = trace # Update trace before save
                    await lead.save()
                    
                    # Update Caps
                    await self.increment_cap(buyer)
                    
                    return lead
                else:
                    logger.info(f"Buyer {buyer.name} REJECTED lead {lead.id}")
                    reason_msg = reason if reason else "Buyer declined"
                    add_trace("Ping", "Rejected", str(buyer.id), buyer.name, reason_msg)
                    
            except Exception as e:
                logger.error(f"Error pinging buyer {buyer.name}: {e}")
                add_trace("Ping", "Error", str(buyer.id), buyer.name, str(e))
                continue
                
        # 5. If no buyer found
        logger.info(f"No buyer found for lead {lead.id}")
        add_trace("Completion", "Rejected", details="No buyer accepted the lead")
        
        lead.trace = trace
        lead.status = LeadStatus.REJECTED
        lead.latency_ms = int((time.time() - start_time) * 1000)
        await lead.save()
        return lead

    def check_filters(self, buyer: Buyer, lead_data: Dict[str, Any]) -> bool:
        # State Filter
        if buyer.filters.states:
            lead_state = lead_data.get("state", "").upper()
            if lead_state not in [s.upper() for s in buyer.filters.states]:
                return False
        
        # Zip Filter
        if buyer.filters.zip_codes:
            lead_zip = str(lead_data.get("zip_code", ""))
            if lead_zip not in buyer.filters.zip_codes:
                return False
        
        # Age Filter
        # Assuming lead_data has "dob" (YYYY-MM-DD) or "age" (int)
        lead_age = lead_data.get("age")
        if lead_age is None and "dob" in lead_data:
            try:
                dob = datetime.strptime(lead_data["dob"], "%Y-%m-%d")
                today = datetime.today()
                lead_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except:
                pass # Invalid DOB format
        
        if lead_age is not None:
            if buyer.filters.min_age is not None and lead_age < buyer.filters.min_age:
                return False
            if buyer.filters.max_age is not None and lead_age > buyer.filters.max_age:
                return False
                
        # Custom Conditions (Simple exact match for now)
        if buyer.filters.custom_conditions:
            for key, value in buyer.filters.custom_conditions.items():
                if lead_data.get(key) != value:
                    return False

        return True

    async def check_caps(self, buyer: Buyer) -> bool:
        try:
            # Keys: buyer:{id}:daily, buyer:{id}:hourly
            daily_key = f"buyer:{buyer.id}:daily"
            hourly_key = f"buyer:{buyer.id}:hourly"
            
            # Daily Cap
            if buyer.caps.daily_cap > 0:
                current_daily = await redis_client.get(daily_key)
                if current_daily and int(current_daily) >= buyer.caps.daily_cap:
                    return False
            
            # Hourly Cap
            if buyer.caps.hourly_cap > 0:
                 current_hourly = await redis_client.get(hourly_key)
                 if current_hourly and int(current_hourly) >= buyer.caps.hourly_cap:
                     return False
                     
            return True
        except Exception as e:
            logger.error(f"Redis check_caps failed for buyer {buyer.id}: {e}")
            # Fail Open: Allow traffic if Redis is down to avoid stopping revenue/tests
            return True

    async def increment_cap(self, buyer: Buyer):
        try:
            daily_key = f"buyer:{buyer.id}:daily"
            hourly_key = f"buyer:{buyer.id}:hourly"
            
            # Increment Daily
            await redis_client.incr(daily_key)
            
            # Increment Hourly
            await redis_client.incr(hourly_key)
        except Exception as e:
            logger.error(f"Redis increment_cap failed for buyer {buyer.id}: {e}")
        
    def transform_payload(self, lead_data: Dict[str, Any], mapping: List[Any]) -> Dict[str, Any]:
        if not mapping:
            return lead_data.copy()
            
        payload = {}
        # 1. Map explicit fields
        for map_rule in mapping:
            internal = map_rule.internal_field
            external = map_rule.buyer_field
            if internal in lead_data:
                payload[external] = lead_data[internal]
        
        # 2. What about unmapped fields? 
        # Usually ping trees either send ONLY mapped fields, or EVERYTHING with mapped fields renamed.
        # Let's assume ONLY mapped fields for strict control, unless mapping is empty.
        
        return payload

    async def ping_buyer(self, buyer: Buyer, lead_data: Dict[str, Any]) -> Tuple[bool, Optional[float], Optional[str], Optional[str]]:
        # Prepare payload
        payload = self.transform_payload(lead_data, buyer.field_mapping)
        
        # Request
        url = buyer.ping_url
        timeout = buyer.timeout_ms / 1000.0
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=timeout)
                return self.parse_response(buyer, response)
        except Exception as e:
            logger.warning(f"Ping request failed for {buyer.name}: {repr(e)}")
            return False, None, None, str(e)

    async def post_lead(self, buyer: Buyer, lead_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        # Usually POST sends more data, maybe we transform again?
        # For now assuming same transformation logic
        payload = self.transform_payload(lead_data, buyer.field_mapping)
        
        url = buyer.post_url
        timeout = buyer.timeout_ms / 1000.0
        
        logger.info(f"POSTing lead to {buyer.name} at {url}")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=timeout)
                logger.info(f"POST Response for {buyer.name}: {response.status_code} {response.text}")
                success, _, redirect, _ = self.parse_response(buyer, response)
                return success, redirect
        except Exception as e:
             logger.warning(f"Post request failed for {buyer.name}: {e}")
             return False, None

    def parse_response(self, buyer: Buyer, response: httpx.Response) -> Tuple[bool, Optional[float], Optional[str], Optional[str]]:
        logger.info(f"Parsing response for {buyer.name}: Status={response.status_code}, Body={response.text}")
        
        if not buyer.response_parsing:
            # Default success check: 2xx status code
            if 200 <= response.status_code < 300:
                # OPTIONAL: Simulator Fallback
                # If the response is {"status": "accepted", ...} we should parse it even if no rules are set.
                try:
                    data = response.json()
                    logger.info(f"Checking simulator fallback. Status in body: {data.get('status')}")
                    if data.get("status") == "accepted":
                         price = float(data.get("price", 0.0))
                         redirect = data.get("redirect_url")
                         return True, price, redirect, "Accepted (Simulator Default)"
                except Exception as e:
                    logger.warning(f"Fallback parsing failed: {e}")
                    pass
                
                return True, None, None, "Success (Status 2xx)"
            return False, None, None, f"Failed (Status {response.status_code})"
            
        rules = buyer.response_parsing
        
        try:
            data = response.json()
        except:
            # If not JSON, maybe simple string match?
            # For now assume JSON
            return False, None, None, "Invalid JSON response"
            
        # Check Success Field
        # Support dot notation for nested fields e.g. "response.status"
        success_val = self.get_nested_value(data, rules.success_field)
        logger.info(f"Parsing rule check: Detected {rules.success_field}={success_val}, Expected={rules.success_value}")
        if str(success_val) != rules.success_value:
             # Try to find reason
             reason = None
             if rules.reason_field:
                 reason = self.get_nested_value(data, rules.reason_field)
             return False, None, None, str(reason) if reason else "Success condition failed"
             
        # Extract Price
        price = None
        if rules.price_field:
            price_val = self.get_nested_value(data, rules.price_field)
            if price_val:
                try:
                    price = float(price_val)
                except:
                    pass
                    
        # Extract Redirect
        redirect = None
        if rules.redirect_url_field:
            redirect = self.get_nested_value(data, rules.redirect_url_field)
            
        return True, price, redirect, "Accepted"

    def get_nested_value(self, data: Any, path: str) -> Any:
        keys = path.split('.')
        curr = data
        for k in keys:
            if isinstance(curr, dict) and k in curr:
                curr = curr[k]
            else:
                return None
        return curr

ping_service = PingService()
