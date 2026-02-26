
import asyncio
from app.db.mongodb import init_db
from app.models.buyer import Buyer, BuyerType, BuyerStatus, FieldMapping, ContextExtractionRule, ResponseParsingRule

async def setup_mock_sbb():
    await init_db()
    print("Connected to MongoDB")
    
    # 1. Define the Mock Buyer
    buyer_data = {
        "name": "Mock SBB Buyer",
        "type": BuyerType.PING_POST,
        "status": BuyerStatus.ACTIVE,
        "tier": 1,
        "payout": 25.0,
        "priority": 10,
        "timeout_ms": 2000,
        
        # Point to Simulator (Port 8002)
        "ping_url": "http://localhost:8002/api/buyers/mock_sbb/ping",
        "post_url": "http://localhost:8002/api/buyers/mock_sbb/post",
        
        # 1. Custom Headers (Enterprise Feature)
        "headers": {
            "Authorization": "Basic cmVzdC11c2VyOjVTOGNCRHEmRWYha3BMKk5XNXVM", # Example from docs
            "X-Custom-Source": "PingTree-Enterprise"
        },
        
        # 2. Field Mapping (Enterprise Feature)
        # PING: Partial Data (Anonymized)
        "ping_mapping": [
             FieldMapping(internal_field="state", buyer_field="Property_State"),
             FieldMapping(internal_field="zip_code", buyer_field="Property_Zip"),
             # Static Values for Ping
             FieldMapping(internal_field="MODE_PLACEHOLDER", buyer_field="SRC", static_value="APPHS"),
             FieldMapping(internal_field="MODE_PLACEHOLDER", buyer_field="Allowed_Times_Sold", static_value=2),
             FieldMapping(internal_field="MODE_PLACEHOLDER", buyer_field="Mode", static_value="ping"),
        ],
        
        # POST: Full Data (PII)
        "post_mapping": [
            # Standard Fields
            FieldMapping(internal_field="first_name", buyer_field="First_Name"),
            FieldMapping(internal_field="last_name", buyer_field="Last_Name"),
            FieldMapping(internal_field="phone", buyer_field="Primary_Phone"),
            FieldMapping(internal_field="email", buyer_field="Email"),
            FieldMapping(internal_field="state", buyer_field="Property_State"),
            FieldMapping(internal_field="zip_code", buyer_field="Property_Zip"),
            
            # Static Values for Post
            FieldMapping(internal_field="MODE_PLACEHOLDER", buyer_field="SRC", static_value="APPHS"),
            FieldMapping(internal_field="MODE_PLACEHOLDER", buyer_field="Allowed_Times_Sold", static_value=2),
            FieldMapping(internal_field="MODE_PLACEHOLDER", buyer_field="Mode", static_value="post"),
            
            # The Magic: Mapping the Extracted Context
            FieldMapping(internal_field="sbb_lead_id", buyer_field="Lead_ID")
        ],
        
        "field_mapping": [], # Clear Legacy mapping
        
        # 3. Context Extraction (Ping -> Post Carryover)
        "context_extraction": [
            # Extract 'lead_id' from the Ping response JSON, and save it as 'sbb_lead_id' in the context
            ContextExtractionRule(response_field="lead_id", context_key="sbb_lead_id")
        ],
        
        # Response Parsing (Standard)
        "response_parsing": ResponseParsingRule(
            success_field="status",
            success_value="accepted",
            price_field="price",
            redirect_url_field="redirect_url"
        )
    }
    
    # Check if exists
    existing = await Buyer.find_one(Buyer.name == buyer_data["name"])
    if existing:
        print("Updating existing Mock SBB Buyer...")
        await existing.update({"$set": buyer_data})
    else:
        print("Creating new Mock SBB Buyer...")
        buyer = Buyer(**buyer_data)
        await buyer.insert()
        
    print("✅ Mock SBB Buyer configured successfully!")
    # await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(setup_mock_sbb())
