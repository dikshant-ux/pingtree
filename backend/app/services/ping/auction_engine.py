import asyncio
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.models.lead import Lead, LeadStatus
from app.models.buyer import Buyer, BuyerStatus
from app.models.counter import Counter
from app.db.redis import redis_client

from app.services.ping.quality_engine import QualityScoringEngine
from app.services.ping.dedupe_engine import DuplicateDetectionEngine
from app.services.ping.filter_engine import FilterEngine
from app.services.ping.ranking_engine import RankingEngine
from app.services.ping.buyer_client import BuyerClient
from app.services.ping.metrics_engine import MetricsEngine

logger = logging.getLogger(__name__)

class AuctionEngine:
    def __init__(self):
        self.buyer_client = BuyerClient()

    async def run_auction(self, lead_data: Dict[str, Any], metadata: Dict[str, Any] = {}) -> Lead:
        start_time = time.time()
        trace = []
        
        def add_trace(stage: str, status: str, buyer_id: str = None, buyer_name: str = None, details: str = None, raw_response: Any = None):
            trace.append({
                "timestamp": datetime.utcnow().isoformat(),
                "stage": stage,
                "status": status,
                "buyer_id": buyer_id,
                "buyer_name": buyer_name,
                "details": details,
                "raw_response": raw_response
            })

        add_trace("Ingestion", "Received", details="Auction started")
        
        # 1. Quality Check
        q_score, flags = QualityScoringEngine.calculate_score(lead_data)
        lead_data["quality_score"] = q_score
        
        # if q_score < 30: # Hard threshold
        #      add_trace("Quality", "Rejected", details=f"Score {q_score} too low. Flags: {flags}")
        #      return await self.create_lead(lead_data, LeadStatus.REJECTED, trace, start_time, metadata)

        # 2. Dedupe Check
        if await DuplicateDetectionEngine.is_duplicate(lead_data):
            add_trace("Dedupe", "Rejected", details="Duplicate lead detected")
            return await self.create_lead(lead_data, LeadStatus.REJECTED, trace, start_time, metadata)
            
        # 3. Fetch Candidates & Group by Tier
        buyers = await Buyer.find(Buyer.status == BuyerStatus.ACTIVE).to_list()
        
        # Group by Tier
        tiers = {1: [], 2: [], 3: []}
        
        for buyer in buyers:
            # Filter Check
            passed, reason = FilterEngine.check_filters(buyer, lead_data)
            if not passed:
                add_trace("Filter", "Skipped", str(buyer.id), buyer.name, reason)
                continue
                
            # Throttle Check
            throttle_limit = getattr(buyer.caps, "throttle_per_minute", 0)
            if throttle_limit > 0:
                if not await redis_client.throttle_check(f"buyer:{buyer.id}:throttle:minute", throttle_limit, 60):
                    add_trace("Throttle", "Skipped", str(buyer.id), buyer.name, f"Rate limit {throttle_limit}/min exceeded")
                    continue
                
            # Add to Tier (default Tier 2 if None)
            tier_id = getattr(buyer, "tier", 2) 
            # Ensure tier_id is valid key
            if tier_id not in tiers:
                tiers[2].append(buyer) # Fallback to standard
            else:
                tiers[tier_id].append(buyer)

        # 4. Tiered Execution Loop
        for tier_level in sorted(tiers.keys()):
            candidates = tiers[tier_level]
            if not candidates:
                continue
                
            add_trace("Auction", f"Tier {tier_level} Start", details=f"Pinging {len(candidates)} buyers in Tier {tier_level}")
            
            # Split candidates into Ping and Direct
            ping_candidates = [b for b in candidates if b.type == "ping_post" and b.ping_url]
            direct_candidates = [b for b in candidates if b.type in ["full_post", "redirect"]]
            
            accepted_bids = []
            
            # 1. Handle Direct Bids (Immediate Accept at Payout)
            for buyer in direct_candidates:
                price = buyer.payout
                score = RankingEngine.calculate_score(buyer, price)
                add_trace("Auction", "Accepted (Direct)", str(buyer.id), buyer.name, f"Price: ${price}, Score: {score}")
                accepted_bids.append({
                    "buyer": buyer,
                    "price": price,
                    "redirect": None,
                    "score": score,
                    "context": {}
                })

            # 2. Parallel Ping for Ping & Post Candidates
            if ping_tasks := [self.ping_safe(b, lead_data, metadata=metadata) for b in ping_candidates]:
                results = await asyncio.gather(*ping_tasks)
                for buyer, success, price, redirect, reason, context, raw_data in results:
                    if success:
                        score = RankingEngine.calculate_score(buyer, price)
                        add_trace("Ping", "Accepted", str(buyer.id), buyer.name, f"Price: ${price}, Score: {score}", raw_response=raw_data)
                        accepted_bids.append({
                            "buyer": buyer,
                            "price": price,
                            "redirect": redirect,
                            "score": score,
                            "context": context,
                            "raw_data": raw_data
                        })
                    else:
                        add_trace("Ping", "Rejected", str(buyer.id), buyer.name, reason, raw_response=raw_data)

            if not accepted_bids:
                add_trace("Auction", f"Tier {tier_level} Failed", details="No accepted bids in this tier")
                continue # Try next tier

            # Ranking
            ranked_bids = RankingEngine.rank_buyers(accepted_bids)
            
            # Waterfall Execution (Post)
            for bid in ranked_bids:
                buyer = bid["buyer"]
                context = bid.get("context", {})
                add_trace("Post", "Attempting", str(buyer.id), buyer.name, f"Rank 1 in Tier {tier_level}. Score: {bid['score']}")
                
                final_redirect = bid["redirect"]
                
                if (buyer.type == "ping_post" and buyer.post_url) or buyer.type in ["full_post", "redirect"]:
                    success, post_price, post_redirect, post_reason, post_data = await self.buyer_client.post_buyer(buyer, lead_data, context=context, metadata=metadata)
                    if not success:
                        add_trace("Post", "Failed", str(buyer.id), buyer.name, f"Post request failed: {post_reason}", raw_response=post_data)
                        continue # Failover to next in this tier
                    
                    # Update with dynamic price if supplied in post response
                    if post_price > 0:
                        add_trace("Post", "Dynamic Payout", str(buyer.id), buyer.name, f"Extracted Price: ${post_price}")
                        bid["price"] = post_price
                        
                    if post_redirect:
                        final_redirect = post_redirect
                    
                    add_trace("Post", "Success", str(buyer.id), buyer.name, "Lead sold", raw_response=post_data)
                
                # SOLD
                lead = await self.create_lead(lead_data, LeadStatus.SOLD, trace, start_time, metadata)
                lead.buyer_id = str(buyer.id)
                lead.buyer_name = buyer.name
                lead.sold_price = bid["price"]
                lead.redirect_url = final_redirect
                await lead.save()
                
                await DuplicateDetectionEngine.register_lead(lead_data)
                
                asyncio.create_task(MetricsEngine.update_metrics(str(buyer.id), bid["price"], True, is_post=True))
                
                return lead
            
            # If all posts failed in this tier
            add_trace("Auction", f"Tier {tier_level} Exhausted", details="All accepted bids failed Post")
            # Continue to next tier
            
        # If we get here, no one bought it
        add_trace("Completion", "Unsold", details="All tiers exhausted")
        
        # Logical Fix: Register duplicate even if rejected to prevent spam execution
        await DuplicateDetectionEngine.register_lead(lead_data, lookback_days=30)
        
        return await self.create_lead(lead_data, LeadStatus.UNSOLD, trace, start_time, metadata)

    async def ping_safe(self, buyer: Buyer, lead_data: Dict[str, Any], metadata: Dict[str, Any] = {}):
        try:
            success, price, redirect, reason, context, raw_data = await self.buyer_client.ping_buyer(buyer, lead_data, metadata=metadata)
            return buyer, success, price, redirect, reason, context, raw_data
        except Exception as e:
            return buyer, False, 0.0, None, str(e), {}, None

    async def create_lead(self, data: Dict[str, Any], status, trace: List, start_time: float = None, metadata: Dict[str, Any] = {}):
        try:
            if start_time is None:
                start_time = time.time()
            latency = int((time.time() - start_time) * 1000)
            
            # Increment and get new value atomically
            from pymongo import ReturnDocument
            counter_col = Counter.get_pymongo_collection()
            updated_counter = await counter_col.find_one_and_update(
                {"collection_name": "leads"},
                {"$inc": {"last_value": 1}},
                upsert=True,
                return_document=ReturnDocument.AFTER
            )
            
            new_val = 1
            if updated_counter and "last_value" in updated_counter:
                new_val = updated_counter["last_value"]
            
            readable_id = f"LD-{new_val}"
            
            lead = Lead(
                lead_data=data,
                status=status,
                readable_id=readable_id,
                latency_ms=latency,
                trace=trace,
                quality_score=data.get("quality_score", 0.0),
                form_id=metadata.get("form_id"),
                source_domain=metadata.get("source_domain"),
                source_url=metadata.get("source_url"),
                ip_address=metadata.get("ip_address"),
                trusted_form_url=metadata.get("trusted_form_url"),
                trusted_form_token=metadata.get("trusted_form_token"),
                validation_results=metadata.get("validation_results", [])
            )
            await lead.insert()
            return lead
        except Exception as e:
            logger.error(f"Error in create_lead: {str(e)}", exc_info=True)
            raise e

auction_engine = AuctionEngine()
