
import httpx
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1/buyers"

def test_persistence():
    # 1. Create Buyer with Ping Mapping
    payload = {
        "name": "Persistence Test Buyer",
        "type": "ping_post",
        "ping_url": "http://example.com/ping",
        "field_mapping": [],
        "ping_mapping": [
            {"internal_field": "test_ping", "buyer_field": "b_ping"}
        ],
        "post_mapping": [
            {"internal_field": "test_post", "buyer_field": "b_post"}
        ]
    }
    
    print("Creating Buyer...")
    try:
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/", json=payload)
            if res.status_code != 200:
                print(f"Failed to create: {res.text}")
                return
            
            data = res.json()
            buyer_id = data["_id"]
            print(f"Created Buyer ID: {buyer_id}")
            
            # Check immediate response
            if not data.get("ping_mapping"):
                print("ERROR: Response from Create missing ping_mapping")
            else:
                print(f"Response has ping_mapping: {len(data['ping_mapping'])}")
                
            # 2. Fetch Buyer
            print("Fetching Buyer...")
            res = client.get(f"{BASE_URL}/{buyer_id}")
            data = res.json()
            
            if not data.get("ping_mapping"):
                print("ERROR: Fetched Buyer missing ping_mapping")
                print(json.dumps(data, indent=2))
            else:
                print(f"SUCCESS: Fetched Buyer has ping_mapping: {len(data['ping_mapping'])}")
                
            # 3. Update Buyer
            print("Updating Buyer...")
            payload["ping_mapping"].append({"internal_field": "test_ping_2", "buyer_field": "b_ping_2"})
            payload["context_extraction"] = [
                {"response_field": "response.id", "context_key": "lead_id"}
            ]
            res = client.put(f"{BASE_URL}/{buyer_id}", json=payload)
            data = res.json()
            
            if len(data.get("ping_mapping", [])) != 2:
                print(f"ERROR: Update failed to save new mapping. Count: {len(data.get('ping_mapping', []))}")
            else:
                print("SUCCESS: Update saved new mapping.")

            if len(data.get("context_extraction", [])) != 1:
                print(f"ERROR: Update failed to save context_extraction. Count: {len(data.get('context_extraction', []))}")
            else:
                print("SUCCESS: Update saved context_extraction.")
                
            # Cleanup
            client.delete(f"{BASE_URL}/{buyer_id}")
            print("Cleanup done.")
        
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_persistence()
