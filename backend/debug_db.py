
import asyncio
from app.db.mongodb import init_db
from app.models.buyer import Buyer

async def check_buyers():
    await init_db()
    buyers = await Buyer.find_all().to_list()
    print(f"Found {len(buyers)} buyers.")
    for b in buyers:
        print(f"Buyer: {b.name} (ID: {b.id})")
        print(f"   Context Extraction: {b.context_extraction}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_buyers())
