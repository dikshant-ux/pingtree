import asyncio
from app.db.mongodb import init_db
from app.models.buyer import Buyer, ResponseParsingRule

async def fix_buyers():
    await init_db()
    
    buyers = await Buyer.find_all().to_list()
    print(f"Found {len(buyers)} buyers.")
    
    for buyer in buyers:
        # Check if this buyer points to our simulator
        if "localhost:8001" in buyer.ping_url or "127.0.0.1:8001" in buyer.ping_url:
            print(f"Updating configuration for simulator buyer: {buyer.name}")
            
            # Normalize to 127.0.0.1 to avoid windows ipv6 issues
            if "localhost" in buyer.ping_url:
                buyer.ping_url = buyer.ping_url.replace("localhost", "127.0.0.1")
            if buyer.post_url and "localhost" in buyer.post_url:
                buyer.post_url = buyer.post_url.replace("localhost", "127.0.0.1")
            
            # Update Response Parsing to match Simulator Defaults
            buyer.response_parsing = ResponseParsingRule(
                success_field="status",
                success_value="accepted",
                price_field="price",
                redirect_url_field="redirect_url",
                reason_field="reason"
            )
            
            await buyer.save()
            print("Updated!")
            
    print("Done.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(fix_buyers())
