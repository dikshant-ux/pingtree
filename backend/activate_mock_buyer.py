import asyncio
from app.db.mongodb import init_db
from app.models.buyer import Buyer, BuyerStatus

async def activate_buyer():
    await init_db()
    
    # Find active or inactive
    buyers = await Buyer.find_all().to_list()
    print(f"Found {len(buyers)} buyers total.")
    
    mock_buyer = None
    for b in buyers:
        if "Mock Buyer" in b.name:
            mock_buyer = b
            break
            
    if not mock_buyer:
        print("Mock Buyer not found. Creating one...")
        mock_buyer = Buyer(
            name="Mock Buyer 1",
            status=BuyerStatus.ACTIVE,
            ping_url="http://127.0.0.1:8001/ping/default",
            payout=10.0
        )
    else:
        print(f"Found {mock_buyer.name}. Activating...")
        mock_buyer.status = BuyerStatus.ACTIVE
        mock_buyer.filters.states = [] # Clear filters
        mock_buyer.filters.zip_codes = []
        mock_buyer.filters.min_age = None
        mock_buyer.filters.max_age = None
    
    await mock_buyer.save()
    print("✅ Mock Buyer 1 is now ACTIVE and Open.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(activate_buyer())
