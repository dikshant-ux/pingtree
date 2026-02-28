from fastapi import APIRouter, Query
from typing import Optional, Dict

router = APIRouter()

# NOTE:
# Routing numbers can vary by account location/type. These are best-effort
# default values used to prefill the public form based on selected bank.
BANK_LOOKUP: Dict[str, Dict[str, Optional[str]]] = {
    "other": {"state": None, "routing_number": None},
    "bancorp": {"state": "DE", "routing_number": "031101114"},
    "bankofamerica": {"state": "NC", "routing_number": "053900272"},
    "bbt": {"state": "NC", "routing_number": "053101121"},
    "bonneville": {"state": "UT", "routing_number": "124303120"},
    "chase": {"state": "OH", "routing_number": "021000021"},
    "fifththird": {"state": "OH", "routing_number": "042000314"},
    "firstcalifornia": {"state": "CA", "routing_number": "122243130"},
    "fnbtexas": {"state": "TX", "routing_number": "111906271"},
    "mt": {"state": "NY", "routing_number": "022000046"},
    "meta": {"state": "SD", "routing_number": "273970116"},
    "navyfederal": {"state": "VA", "routing_number": "256074974"},
    "pnc": {"state": "PA", "routing_number": "043000096"},
    "regions": {"state": "AL", "routing_number": "062000019"},
    "suntrust": {"state": "NC", "routing_number": "061000104"},
    "td": {"state": "NJ", "routing_number": "031201360"},
    "usaa": {"state": "TX", "routing_number": "314074269"},
    "usbank": {"state": "MN", "routing_number": "091000022"},
    "wellsfargo": {"state": "MN", "routing_number": "121000248"},
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
