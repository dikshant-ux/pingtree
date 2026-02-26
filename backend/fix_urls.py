
import asyncio
from app.db.mongodb import db, connect_to_mongo, close_mongo_connection
from app.models.buyer import Buyer
from app.core.config import settings

async def fix_buyer_urls():
    await connect_to_mongo()
    print("Connected to MongoDB")
    
    # 1. Update Mock Buyer 1
    # Find by name or just update all that look like mock buyers
    buyers = await Buyer.find_all().to_list()
    
    for b in buyers:
        changed = False
        if "8001" in b.ping_url:
            print(f"Fixing Ping URL for {b.name}: {b.ping_url} -> 8002")
            b.ping_url = b.ping_url.replace("8001", "8002")
            changed = True
            
        if b.post_url and "8001" in b.post_url:
            print(f"Fixing Post URL for {b.name}: {b.post_url} -> 8002")
            b.post_url = b.post_url.replace("8001", "8002")
            changed = True
            
        if changed:
            await b.save()
            print(f"✅ Saved {b.name}")
            
    print("Done")
    await close_mongo_connection()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(fix_buyer_urls())
