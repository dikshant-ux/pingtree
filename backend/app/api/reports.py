# Version: 2026-02-26-v2 - Direct Motor Aggregation Fix
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter
from app.models.lead import Lead, LeadStatus
from app.models.buyer import Buyer

logger = logging.getLogger(__name__)
router = APIRouter()

def get_date_match(start_date: Optional[datetime], end_date: Optional[datetime]) -> Dict[str, Any]:
    match = {}
    if start_date or end_date:
        match["created_at"] = {}
        if start_date:
            match["created_at"]["$gte"] = start_date
        if end_date:
            match["created_at"]["$lte"] = end_date
    return match

@router.get("/stats")
async def get_dashboard_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    try:
        match_query = {}
        date_match = get_date_match(start_date, end_date)
        if date_match:
            match_query.update(date_match)
            
        total_leads = await Lead.find(match_query).count()
        sold_leads = await Lead.find({"status": LeadStatus.SOLD, **match_query}).count()
        rejected_leads = await Lead.find({"status": LeadStatus.REJECTED, **match_query}).count()
        
        pipeline = [
            {"$match": {"status": LeadStatus.SOLD, **match_query}},
            {"$group": {"_id": None, "total": {"$sum": "$sold_price"}}}
        ]
        
        # FIX: Using get_motor_collection() to bypass Beanie cursor TypeError in production
        revenue_result = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0.0
        
        return {
            "total_leads": total_leads,
            "sold_leads": sold_leads,
            "rejected_leads": rejected_leads,
            "total_revenue": total_revenue,
            "conversion_rate": (sold_leads / total_leads * 100) if total_leads > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {str(e)}", exc_info=True)
        return {"error": str(e), "total_leads": 0, "sold_leads": 0, "rejected_leads": 0, "total_revenue": 0.0, "conversion_rate": 0}

@router.get("/stats/today")
async def get_today_stats() -> Dict[str, Any]:
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        match_today = {"created_at": {"$gte": today_start}}
        
        total_leads = await Lead.find(match_today).count()
        sold_leads = await Lead.find({"status": LeadStatus.SOLD, **match_today}).count()
        rejected_leads = await Lead.find({"status": LeadStatus.REJECTED, **match_today}).count()
        
        pipeline = [
            {"$match": {"status": LeadStatus.SOLD, **match_today}},
            {"$group": {"_id": None, "total": {"$sum": "$sold_price"}}}
        ]
        
        # FIX: Using get_motor_collection() to bypass Beanie cursor TypeError in production
        revenue_result = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0.0
        
        return {
            "total_leads": total_leads,
            "sold_leads": sold_leads,
            "rejected_leads": rejected_leads,
            "total_revenue": total_revenue,
            "conversion_rate": (sold_leads / total_leads * 100) if total_leads > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error in get_today_stats: {str(e)}", exc_info=True)
        return {"error": str(e), "total_leads": 0, "sold_leads": 0, "rejected_leads": 0, "total_revenue": 0.0, "conversion_rate": 0}

@router.get("/activity")
async def get_activity_stats() -> Dict[str, Any]:
    try:
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"},
                        "day": {"$dayOfMonth": "$created_at"},
                        "hour": {"$hour": "$created_at"},
                        "status": "$status"
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        # FIX: Using get_motor_collection() to bypass Beanie cursor TypeError in production
        raw_data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
        return {"data": raw_data}
    except Exception as e:
        logger.error(f"Error in get_activity_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

@router.get("/recent")
async def get_recent_leads(limit: int = 50):
    return await Lead.find_all().sort("-created_at").limit(limit).to_list()

@router.get("/revenue-over-time")
async def get_revenue_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    try:
        match_stage = {"status": LeadStatus.SOLD}
        date_match = get_date_match(start_date, end_date)
        if date_match:
            match_stage.update(date_match)

        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"},
                        "day": {"$dayOfMonth": "$created_at"},
                    },
                    "revenue": {"$sum": "$sold_price"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        # FIX: Using get_motor_collection() to bypass Beanie cursor TypeError in production
        data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
        return {"data": data}
    except Exception as e:
        logger.error(f"Error in get_revenue_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

@router.get("/buyer-performance")
async def get_buyer_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    try:
        match_stage = {"status": LeadStatus.SOLD}
        date_match = get_date_match(start_date, end_date)
        if date_match:
            match_stage.update(date_match)

        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": "$buyer_id",
                    "snapshot_name": {"$first": "$buyer_name"},
                    "revenue": {"$sum": "$sold_price"},
                    "sold_count": {"$sum": 1},
                    "avg_price": {"$avg": "$sold_price"}
                }
            },
            {
                "$addFields": {
                    "buyer_oid": {"$toObjectId": "$_id"}
                }
            },
            {
                "$lookup": {
                    "from": "buyers", 
                    "localField": "buyer_oid",
                    "foreignField": "_id",
                    "as": "buyer_info"
                }
            },
            {"$unwind": {"path": "$buyer_info", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "revenue": 1,
                    "sold_count": 1,
                    "avg_price": 1,
                    "buyer_name": {
                        "$ifNull": [
                            "$buyer_info.name", 
                            {"$ifNull": ["$snapshot_name", "Unknown Buyer"]}
                        ]
                    }
                }
            },
            {"$sort": {"revenue": -1}}
        ]
        # FIX: Using get_motor_collection() to bypass Beanie cursor TypeError in production
        data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
        return {"data": data}
    except Exception as e:
        logger.error(f"Error in get_buyer_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

@router.get("/errors")
async def get_error_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    try:
        match_stage = {"status": {"$in": [LeadStatus.REJECTED, LeadStatus.ERROR]}}
        date_match = get_date_match(start_date, end_date)
        if date_match:
            match_stage.update(date_match)
            
        pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        # FIX: Using get_motor_collection() to bypass Beanie cursor TypeError in production
        data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
        return {"data": data}
    except Exception as e:
        logger.error(f"Error in get_error_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}
