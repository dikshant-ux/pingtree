from fastapi import APIRouter, Query
from typing import Optional, Dict

router = APIRouter()

# NOTE:
# Routing numbers can vary by account location/type. These are best-effort
# default values used to prefill the public form based on selected bank.
BANK_LOOKUP: Dict[str, Dict[str, Optional[str]]] = {
    "other": {"state": None, "routing_number": None},
    "bancorp": {"state": "Delaware", "routing_number": "031101114"},
    "bank of america": {"state": "North Carolina", "routing_number": "053900272"},
    "branch bank": {"state": "North Carolina", "routing_number": "053101121"},
    "bonneville bank": {"state": "Utah", "routing_number": "124303120"},
    "chase bank": {"state": "Ohio", "routing_number": "021000021"},
    "fifth third bank": {"state": "Ohio", "routing_number": "042000314"},
    "first california bank": {"state": "California", "routing_number": "122243130"},
    "first national bank texas": {"state": "Texas", "routing_number": "111906271"},
    "m&t bank": {"state": "New York", "routing_number": "022000046"},
    "metabank": {"state": "South Dakota", "routing_number": "273970116"},
    "navy federal credit union": {"state": "Virginia", "routing_number": "256074974"},
    "pnc bank": {"state": "Pennsylvania", "routing_number": "043000096"},
    "regions bank": {"state": "Alabama", "routing_number": "062000019"},
    "suntrust bank": {"state": "North Carolina", "routing_number": "061000104"},
    "td bank": {"state": "New Jersey", "routing_number": "031201360"},
    "usaa federal savings bank": {"state": "Texas", "routing_number": "314074269"},
    "us bank": {"state": "Minnesota", "routing_number": "091000022"},
    "wells fargo": {"state": "Minnesota", "routing_number": "121000248"},
}


@router.get("/lookup")
async def lookup_bank(bank_name: str = Query(..., description="Bank key from form")):
    key = (bank_name or "").strip().lower()
    details = BANK_LOOKUP.get(key, {"state": None, "routing_number": None})
    return {
        "bank_name": bank_name,
        "state": details.get("state"),
        "routing_number": details.get("routing_number"),
    }
