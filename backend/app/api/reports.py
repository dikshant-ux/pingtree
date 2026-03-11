# Version: 2026-02-26-v4 - Robust Motor Fix
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter
from app.models.lead import Lead, LeadStatus
from app.models.buyer import Buyer
from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)
router = APIRouter()

# Global cached motor client for reports to bypass Beanie version issues
_motor_client = None

def get_leads_collection():
    global _motor_client
    if _motor_client is None:
        _motor_client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _motor_client[settings.DATABASE_NAME]["leads"]

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
        rejected_leads = await Lead.find({"status": {"$in": [LeadStatus.REJECTED, LeadStatus.INVALID]}, **match_query}).count()
        
        pipeline = [
            {"$match": {"status": LeadStatus.SOLD, **match_query}},
            {"$group": {"_id": None, "total": {"$sum": "$sold_price"}}}
        ]
        
        # UNIVERSAL FIX: Use direct Motor collection to avoid Beanie version conflicts
        coll = get_leads_collection()
        revenue_result = await coll.aggregate(pipeline).to_list(length=None)
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
        rejected_leads = await Lead.find({"status": {"$in": [LeadStatus.REJECTED, LeadStatus.INVALID]}, **match_today}).count()
        
        pipeline = [
            {"$match": {"status": LeadStatus.SOLD, **match_today}},
            {"$group": {"_id": None, "total": {"$sum": "$sold_price"}}}
        ]
        
        # UNIVERSAL FIX: Use direct Motor collection to avoid Beanie version conflicts
        coll = get_leads_collection()
        revenue_result = await coll.aggregate(pipeline).to_list(length=None)
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
        # Last 24 hours only
        from datetime import timedelta
        since = datetime.utcnow() - timedelta(hours=24)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": since}}},
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
        
        # UNIVERSAL FIX: Use direct Motor collection to avoid Beanie version conflicts
        coll = get_leads_collection()
        raw_data = await coll.aggregate(pipeline).to_list(length=None)
        return {"data": raw_data}
    except Exception as e:
        logger.error(f"Error in get_activity_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

@router.get("/sources")
async def get_unique_sources():
    try:
        coll = get_leads_collection()
        sources = await coll.distinct("source_domain")
        return [s for s in sources if s] # Filter out None/Empty
    except Exception as e:
        logger.error(f"Error in get_unique_sources: {str(e)}")
        return []

@router.get("/recent")
async def get_recent_leads(
    page: int = 1, 
    limit: int = 50, 
    source_domain: Optional[str] = None, 
    status: Optional[str] = None,
    search: Optional[str] = None
):
    skip = (page - 1) * limit
    
    query = {}
    if source_domain and source_domain != "all":
        query["source_domain"] = source_domain
    
    if status and status != "all":
        if status == "unsold":
            query["status"] = {"$in": ["unsold", "rejected", "error"]}
        else:
            query["status"] = status
    
    if search:
        # Build a flexible search query across multiple fields
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"readable_id": search_regex},
            {"_id": search_regex},
            {"lead_data.email": search_regex},
            {"lead_data.phone": search_regex},
            {"lead_data.first_name": search_regex},
            {"lead_data.last_name": search_regex},
            {"lead_data.FirstName": search_regex},
            {"lead_data.LastName": search_regex}
        ]
        
    total = await Lead.find(query).count()
    items = await Lead.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

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
        # UNIVERSAL FIX: Use direct Motor collection to avoid Beanie version conflicts
        coll = get_leads_collection()
        data = await coll.aggregate(pipeline).to_list(length=None)
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
        # UNIVERSAL FIX: Use direct Motor collection to avoid Beanie version conflicts
        coll = get_leads_collection()
        data = await coll.aggregate(pipeline).to_list(length=None)
        return {"data": data}
    except Exception as e:
        logger.error(f"Error in get_buyer_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

@router.get("/outcomes")
async def get_outcome_stats(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    try:
        date_match = get_date_match(start_date, end_date)
        match_stage = date_match if date_match else {}
            
        pipeline = [
            {"$match": match_stage},
            {
                "$project": {
                    "outcome": {
                        "$cond": [
                            {"$eq": ["$status", "sold"]},
                            "Sold",
                            {"$cond": [
                                {"$eq": ["$status", "Invalid Lead"]},
                                "Invalid Lead",
                                "Unsold"
                            ]}
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": "$outcome",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        coll = get_leads_collection()
        data = await coll.aggregate(pipeline).to_list(length=None)
        return {"data": data}
    except Exception as e:
        logger.error(f"Error in get_outcome_stats: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

@router.get("/buyer-detailed")
async def get_buyer_detailed(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
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
                        "buyer_id": "$buyer_id",
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"},
                        "day": {"$dayOfMonth": "$created_at"}
                    },
                    "buyer_name": {"$first": "$buyer_name"},
                    "revenue": {"$sum": "$sold_price"},
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.buyer_id",
                    "buyer_name": {"$first": "$buyer_name"},
                    "total_revenue": {"$sum": "$revenue"},
                    "total_count": {"$sum": "$count"},
                    "daily_stats": {
                        "$push": {
                            "date": {
                                "$dateFromParts": {
                                    "year": "$_id.year",
                                    "month": "$_id.month",
                                    "day": "$_id.day"
                                }
                            },
                            "revenue": "$revenue",
                            "count": "$count"
                        }
                    }
                }
            },
            {"$sort": {"total_revenue": -1}}
        ]
        coll = get_leads_collection()
        data = await coll.aggregate(pipeline).to_list(length=None)
        return {"data": data}
    except Exception as e:
        logger.error(f"Error in get_buyer_detailed: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

@router.get("/top-insights")
async def get_top_insights(start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
    try:
        match_stage = {"status": LeadStatus.SOLD}
        date_match = get_date_match(start_date, end_date)
        if date_match:
            match_stage.update(date_match)

        coll = get_leads_collection()

        # Top Buyer - Group by ID and lookup official name
        top_buyer_pipeline = [
            {"$match": {"status": "sold", **date_match}},
            {"$group": {
                "_id": "$buyer_id", 
                "snapshot_name": {"$first": "$buyer_name"}, 
                "revenue": {"$sum": "$sold_price"}
            }},
            {"$sort": {"revenue": -1}},
            {"$limit": 1},
            {
                "$addFields": {
                    "buyer_oid": {
                        "$cond": [
                            {"$and": [{"$ne": ["$_id", None]}, {"$ne": ["$_id", ""]}]},
                            {"$toObjectId": "$_id"},
                            None
                        ]
                    }
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
                    "name": {
                        "$ifNull": [
                            "$buyer_info.name",
                            {"$ifNull": ["$snapshot_name", "Unknown Buyer"]}
                        ]
                    }
                }
            }
        ]
        top_buyer_res = await coll.aggregate(top_buyer_pipeline).to_list(length=1)
        top_buyer = top_buyer_res[0] if top_buyer_res else None

        # Top Source
        top_source_pipeline = [
            {"$match": {"status": "sold", **date_match}},
            {"$group": {"_id": "$source_domain", "revenue": {"$sum": "$sold_price"}}},
            {"$sort": {"revenue": -1}},
            {"$limit": 1}
        ]
        top_source_res = await coll.aggregate(top_source_pipeline).to_list(length=1)
        top_source = top_source_res[0] if top_source_res else None

        # Best Day
        best_day_pipeline = [
            {"$match": match_stage},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"},
                        "day": {"$dayOfMonth": "$created_at"}
                    },
                    "revenue": {"$sum": "$sold_price"}
                }
            },
            {"$sort": {"revenue": -1}},
            {"$limit": 1}
        ]
        best_day_res = await coll.aggregate(best_day_pipeline).to_list(length=1)
        best_day = best_day_res[0] if best_day_res else None

        return {
            "top_buyer": top_buyer["name"] if top_buyer and top_buyer.get("name") else (top_buyer["_id"] if top_buyer else "N/A"),
            "top_buyer_revenue": top_buyer["revenue"] if top_buyer else 0,
            "top_source": top_source["_id"] if top_source else "N/A",
            "top_source_revenue": top_source["revenue"] if top_source else 0,
            "best_day": f"{best_day['_id']['year']}-{best_day['_id']['month']}-{best_day['_id']['day']}" if best_day else "N/A",
            "best_day_revenue": best_day["revenue"] if best_day else 0
        }
    except Exception as e:
        logger.error(f"Error in get_top_insights: {str(e)}", exc_info=True)
        return {}
