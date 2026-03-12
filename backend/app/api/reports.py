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
        sources = await coll.distinct("lead_data.source")
        domains = await coll.distinct("source_domain")
        return {
            "sources": [s for s in sources if s],
            "domains": [d for d in domains if d]
        }
    except Exception as e:
        logger.error(f"Error in get_unique_sources: {str(e)}")
        return {"sources": [], "domains": []}

@router.get("/recent")
async def get_recent_leads(
    page: int = 1, 
    limit: int = 50, 
    source: Optional[str] = None,
    source_domain: Optional[str] = None, 
    status: Optional[str] = None,
    search: Optional[str] = None
):
    skip = (page - 1) * limit
    
    query = {}
    if source and source != "all":
        query["lead_data.source"] = source
        
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


from pydantic import BaseModel
from typing import List, Any

class FilterEntry(BaseModel):
    field: str
    operator: str  # e.g., 'equals', 'contains', 'greater_than', 'less_than', 'not_equals'
    value: Any

class DynamicReportRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    dimensions: List[str] = []
    filters: Optional[List[FilterEntry]] = []

@router.post("/dynamic")
async def get_dynamic_report(request: DynamicReportRequest) -> Dict[str, Any]:
    try:
        pipeline = []
        
        # 1. Initial date match
        date_match = get_date_match(request.start_date, request.end_date)
        if date_match:
            pipeline.append({"$match": date_match})
            
        # Post-resolution match array for fields like Buyer Name
        post_match_stages = []

        # 2. Map and Apply Filters
        if request.filters:
            for f in request.filters:
                target_field = f.field
                is_dimension_resolved = False

                if target_field == "source":
                    target_field = "source_domain"
                elif target_field == "buyer":
                    target_field = "buyer_name" # Post-resolution
                    is_dimension_resolved = True
                elif target_field == "sub_source":
                    # Use a post-resolution field to handle $ifNull logic consistently
                    is_dimension_resolved = True
                elif target_field == "lead_source":
                    target_field = "lead_data.source"
                elif target_field == "date":
                    target_field = "created_at"
                
                # Build MongoDB query for this specific filter
                # For string 'equals', use case-insensitive regex for better UX
                query_val = f.value
                if f.operator == 'equals' and isinstance(f.value, str):
                    query_val = {"$regex": f"^{str(f.value)}$", "$options": "i"}
                elif f.operator == 'not_equals':
                    query_val = {"$ne": f.value}
                elif f.operator == 'contains':
                    query_val = {"$regex": str(f.value), "$options": "i"}
                elif f.operator == 'greater_than':
                    query_val = {"$gt": f.value}
                elif f.operator == 'less_than':
                    query_val = {"$lt": f.value}

                match_stage = {"$match": {target_field: query_val}}
                
                if is_dimension_resolved:
                    post_match_stages.append(match_stage)
                else:
                    pipeline.append(match_stage)

        # Build dynamic _id for $group
        group_id = {}
        is_buyer_dim = "buyer" in request.dimensions
        # Post-match stages can also check if a buyer filter is applied
        has_buyer_filter = any('buyer_name' in stage['$match'] for stage in post_match_stages)
        
        for dim in request.dimensions:
            if dim == "date":
                group_id["year"] = {"$year": "$created_at"}
                group_id["month"] = {"$month": "$created_at"}
                group_id["day"] = {"$dayOfMonth": "$created_at"}
            elif dim == "source":
                group_id["source"] = "$source_domain"
            elif dim == "sub_source":
                group_id["sub_source"] = {
                    "$ifNull": ["$lead_data.sub_source", "$lead_data.sub_id"]
                }
            elif dim == "lead_source":
                group_id["lead_source"] = "$lead_data.source"
            elif dim == "buyer":
                group_id["buyer"] = "$buyer_id"
                group_id["buyer_name"] = "$buyer_name" 
            elif dim == "status":
                group_id["status"] = "$status"
            else:
                group_id[dim] = f"${dim}"


        # Pre-aggregation fields to evaluate validation results and redirection
        pipeline.append({
            "$addFields": {
                "has_good_email": {
                    "$eq": [
                        {
                            "$size": {
                                "$filter": {
                                    "input": {"$ifNull": ["$validation_results", []]},
                                    "as": "v",
                                    "cond": {
                                        "$or": [
                                            {
                                                "$and": [
                                                    {"$eq": ["$$v.success", False]},
                                                    {"$gte": [{"$indexOfCP": [{"$toLower": "$$v.validator_name"}, "email"]}, 0]}
                                                ]
                                            },
                                            {"$eq": ["$$v.response_body.data.email.status", "invalid"]}
                                        ]
                                    }
                                }
                            }
                        },
                        0
                    ]
                },
                "has_good_ip": {
                    "$eq": [
                        {
                            "$size": {
                                "$filter": {
                                    "input": {"$ifNull": ["$validation_results", []]},
                                    "as": "v",
                                    "cond": {
                                        "$or": [
                                            {
                                                "$and": [
                                                    {"$eq": ["$$v.success", False]},
                                                    {"$gte": [{"$indexOfCP": [{"$toLower": "$$v.validator_name"}, "ip"]}, 0]}
                                                ]
                                            },
                                            {"$eq": ["$$v.response_body.data.ip.status", "invalid"]}
                                        ]
                                    }
                                }
                            }
                        },
                        0
                    ]
                },
                "has_good_phone": {
                    "$eq": [
                        {
                            "$size": {
                                "$filter": {
                                    "input": {"$ifNull": ["$validation_results", []]},
                                    "as": "v",
                                    "cond": {
                                        "$or": [
                                            {
                                                "$and": [
                                                    {"$eq": ["$$v.success", False]},
                                                    {"$gte": [{"$indexOfCP": [{"$toLower": "$$v.validator_name"}, "phone"]}, 0]}
                                                ]
                                            },
                                            {"$eq": ["$$v.response_body.data.phone.status", "invalid"]}
                                        ]
                                    }
                                }
                            }
                        },
                        0
                    ]
                },
                "is_redirected": {"$ifNull": ["$is_redirected", False]}
            }
        })

        is_buyer_dim = "buyer" in request.dimensions
        has_buyer_filter = any('buyer_name' in stage['$match'] for stage in post_match_stages)
        has_sub_source_filter = any('sub_source' in stage['$match'] for stage in post_match_stages)

        if is_buyer_dim or has_buyer_filter:
            # When grouping by or filtering by buyer, we unwind the trace
            pipeline.append({
                "$addFields": {
                    "buyer_attempts": {
                        "$setUnion": {
                            "$filter": {
                                "input": {
                                    "$map": {
                                        "input": {"$ifNull": ["$trace", []]},
                                        "as": "t",
                                        "in": {
                                            "$cond": [
                                                {
                                                    "$and": [
                                                        {"$in": ["$$t.stage", ["Ping", "Post"]]},
                                                        {"$ne": ["$$t.buyer_id", None]}
                                                    ]
                                                },
                                                {
                                                    "buyer_id": "$$t.buyer_id",
                                                    "buyer_name": "$$t.buyer_name"
                                                },
                                                "REMOVE"
                                            ]
                                        }
                                    }
                                },
                                "as": "res",
                                "cond": {"$ne": ["$$res", "REMOVE"]}
                            }
                        }
                    }
                }
            })
            
            pipeline.append({"$unwind": "$buyer_attempts"})
            
            # Buyer Name Resolution: Lookup master name from buyers collection
            pipeline.append({
                "$lookup": {
                    "from": "buyers",
                    "let": {"search_id": "$buyer_attempts.buyer_id"},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": [
                                        "$_id", 
                                        {
                                            "$cond": [
                                                {"$and": [
                                                    {"$ne": ["$$search_id", None]},
                                                    {"$eq": [{"$type": "$$search_id"}, "string"]},
                                                    {"$eq": [{"$strLenCP": "$$search_id"}, 24]}
                                                ]},
                                                {"$toObjectId": "$$search_id"},
                                                "$$search_id"
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    "as": "buyer_master"
                }
            })

            # Repopulate top-level fields for buyer group mapping
            pipeline.append({
                "$addFields": {
                    "buyer_id": "$buyer_attempts.buyer_id",
                    "buyer_name": {
                        "$ifNull": [
                            {"$arrayElemAt": ["$buyer_master.name", 0]},
                            "$buyer_attempts.buyer_name", # Fallback to name in trace
                            "$buyer_attempts.buyer_id"     # Final fallback to ID
                        ]
                    },
                    "was_sold_to_this_buyer": {
                        "$and": [
                            {"$eq": ["$status", "sold"]},
                            {"$eq": ["$buyer_id", "$buyer_attempts.buyer_id"]}
                        ]
                    }
                }
            })

        # Resolve other complex dimensions for post-matching
        pipeline.append({
            "$addFields": {
                "sub_source": {"$ifNull": ["$lead_data.sub_source", "$lead_data.sub_id"]}
            }
        })

        # 3. Apply post-resolution filters
        if post_match_stages:
            pipeline.extend(post_match_stages)

        pipeline.append({
            "$group": {
                "_id": group_id if group_id else None,
                "total_leads": {"$sum": 1},
                "sold_leads": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$was_sold_to_this_buyer", True]} if (is_buyer_dim or has_buyer_filter) else {"$eq": ["$status", "sold"]}, 
                            1, 0
                        ]
                    }
                },
                "revenue": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$was_sold_to_this_buyer", True]} if (is_buyer_dim or has_buyer_filter) else {"$eq": ["$status", "sold"]}, 
                            "$sold_price", 0
                        ]
                    }
                },
                "emails_good": {
                    "$sum": {"$cond": ["$has_good_email", 1, 0]}
                },
                "ips_good": {
                    "$sum": {"$cond": ["$has_good_ip", 1, 0]}
                },
                "phones_good": {
                    "$sum": {"$cond": ["$has_good_phone", 1, 0]}
                },
                "redirected": {
                    "$sum": {"$cond": ["$is_redirected", 1, 0]}
                }
            }
        })

        pipeline.append({
            "$project": {
                "total_leads": 1,
                "sold_leads": 1,
                "revenue": 1,
                "conversion_rate": {
                    "$cond": [
                        {"$gt": ["$total_leads", 0]},
                        {"$multiply": [{"$divide": ["$sold_leads", "$total_leads"]}, 100]},
                        0
                    ]
                },
                "avg_price": {
                    "$cond": [
                        {"$gt": ["$sold_leads", 0]},
                        {"$divide": ["$revenue", "$sold_leads"]},
                        0
                    ]
                },
                "email_good_rate": {
                    "$cond": [
                        {"$gt": ["$total_leads", 0]},
                        {"$multiply": [{"$divide": ["$emails_good", "$total_leads"]}, 100]},
                        0
                    ]
                },
                "ip_good_rate": {
                    "$cond": [
                        {"$gt": ["$total_leads", 0]},
                        {"$multiply": [{"$divide": ["$ips_good", "$total_leads"]}, 100]},
                        0
                    ]
                },
                "phone_good_rate": {
                    "$cond": [
                        {"$gt": ["$total_leads", 0]},
                        {"$multiply": [{"$divide": ["$phones_good", "$total_leads"]}, 100]},
                        0
                    ]
                },
                "redirection_rate": {
                    "$cond": [
                        {"$gt": ["$total_leads", 0]},
                        {"$multiply": [{"$divide": ["$redirected", "$total_leads"]}, 100]},
                        0
                    ]
                }
            }
        })
        
        # Sort by revenue descending by default
        pipeline.append({"$sort": {"revenue": -1}})

        coll = get_leads_collection()
        data = await coll.aggregate(pipeline).to_list(length=None)

        # Flatten the _id object into the main dict
        flattened_data = []
        for item in data:
            flat_item = {
                "total_leads": item.get("total_leads", 0),
                "sold_leads": item.get("sold_leads", 0),
                "revenue": item.get("revenue", 0),
                "conversion_rate": item.get("conversion_rate", 0),
                "avg_price": item.get("avg_price", 0),
                "email_good_rate": item.get("email_good_rate", 0),
                "ip_good_rate": item.get("ip_good_rate", 0),
                "phone_good_rate": item.get("phone_good_rate", 0),
                "redirection_rate": item.get("redirection_rate", 0),
            }
            if item.get("_id"):
                flat_item.update(item["_id"])
            
            # Format date if present
            if "year" in flat_item and "month" in flat_item and "day" in flat_item:
                flat_item["date"] = f"{flat_item['year']}-{flat_item['month']:02d}-{flat_item['day']:02d}"
                del flat_item["year"]
                del flat_item["month"]
                del flat_item["day"]

            flattened_data.append(flat_item)

        return {"data": flattened_data}
    except Exception as e:
        logger.error(f"Error in get_dynamic_report: {str(e)}", exc_info=True)
        return {"data": [], "error": str(e)}

