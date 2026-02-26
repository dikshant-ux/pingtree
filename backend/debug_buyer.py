
import httpx
import json

def debug_buyer():
    r = httpx.get('http://localhost:8000/api/v1/buyers/')
    buyers = r.json()
    b1 = [b for b in buyers if b['name'] == 'Buyer1']
    if b1:
        b = b1[0]
        print(json.dumps({
            "name": b.get("name"),
            "type": b.get("type"),
            "ping_url": b.get("ping_url"),
            "post_url": b.get("post_url")
        }, indent=2))
    else:
        print("Buyer1 not found")

if __name__ == "__main__":
    debug_buyer()
