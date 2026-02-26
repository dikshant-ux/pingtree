import logging
from fastapi import APIRouter
from app.models.lead import Lead, LeadStatus
from app.models.buyer import Buyer
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    # Aggregate basic stats with date filter
    match_query = {}
    date_match = get_date_match(start_date, end_date)
    if date_match:
        match_query.update(date_match)
        
    total_leads = await Lead.find(match_query).count()
    
    sold_query = {"status": LeadStatus.SOLD}
    sold_query.update(match_query)
    sold_leads = await Lead.find(sold_query).count()
    
    rejected_query = {"status": LeadStatus.REJECTED}
    rejected_query.update(match_query)
    rejected_leads = await Lead.find(rejected_query).count()
    
    # Calculate Revenue (Sum of sold_price)
    pipeline = [
        {"$match": sold_query},
        {"$group": {"_id": None, "total": {"$sum": "$sold_price"}}}
    ]
    # Use motor collection directly for stable aggregation in all environments
    revenue_result = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0.0
    
    return {
        "total_leads": total_leads,
        "sold_leads": sold_leads,
        "rejected_leads": rejected_leads,
        "total_revenue": total_revenue,
        "conversion_rate": (sold_leads / total_leads * 100) if total_leads > 0 else 0
    }

@router.get("/recent")
async def get_recent_leads(limit: int = 50):
    return await Lead.find_all().sort("-created_at").limit(limit).to_list()


@router.get("/activity")
async def get_activity_stats() -> Dict[str, Any]:
    """
    Returns lead activity volume for the last 24 hours (or just recent buckets).
    Aggregates by hour.
    """
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
        
        raw_data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
        return {"data": raw_data}
    except Exception as e:
        logger.error(f"Error in get_activity_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}


from datetime import datetime, timedelta

# ... imports ...

@router.get("/stats/today")
async def get_today_stats() -> Dict[str, Any]:
    """
    Returns summary stats for the current day (UTC).
    """
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Filter for today
        match_today = {"created_at": {"$gte": today_start}}
        
        total_leads = await Lead.find(match_today).count()
        sold_leads = await Lead.find({"status": "sold", "created_at": {"$gte": today_start}}).count()
        rejected_leads = await Lead.find({"status": "rejected", "created_at": {"$gte": today_start}}).count()
        
        # Revenue today
        pipeline = [
            {"$match": {"status": "sold", "created_at": {"$gte": today_start}}},
            {"$group": {"_id": None, "total": {"$sum": "$sold_price"}}}
        ]
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
        return {
            "total_leads": 0,
            "sold_leads": 0,
            "rejected_leads": 0,
            "total_revenue": 0.0,
            "conversion_rate": 0,
            "error": str(e) # Send error to help debug
        }

def get_date_match(start_date: Optional[datetime], end_date: Optional[datetime]) -> Dict[str, Any]:
    match = {}
    if start_date or end_date:
        match["created_at"] = {}
        if start_date:
            match["created_at"]["$gte"] = start_date
        if end_date:
            # inclusive end date if it's just a date, usually UI sends midnight
            match["created_at"]["$lte"] = end_date
    return match

@router.get("/revenue-over-time")
async def get_revenue_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    match_stage = {"status": "sold"}
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
    data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
    return {"data": data}


@router.get("/buyer-performance")
async def get_buyer_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    match_stage = {"status": "sold"}
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
    data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
    return {"data": data}


@router.get("/errors")
async def get_error_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    match_stage = {"status": {"$in": ["rejected", "error"]}}
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
    data = await Lead.get_motor_collection().aggregate(pipeline).to_list(length=None)
    return {"data": data}
