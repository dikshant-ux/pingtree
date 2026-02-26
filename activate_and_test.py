import urllib.request
import urllib.error
import json
import time

API_URL = "http://127.0.0.1:8000/api/v1"
SIMULATOR_URL = "http://127.0.0.1:8001"

def make_request(url, method="GET", data=None):
    headers = {"Content-Type": "application/json"}
    data_bytes = json.dumps(data).encode('utf-8') if data else None
    
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.read().decode()}")
        return e.code, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return 0, None

def activate_mock_buyer():
    print("🔎 Finding Mock Buyer 1...")
    status, buyers = make_request(f"{API_URL}/buyers/")
    
    if status != 200:
        print("❌ Failed to list buyers")
        return False
        
    mock_buyer = None
    for b in buyers:
        if "Mock Buyer 1" in b.get("name", "") or "Mock Buyer" in b.get("name", ""):
            mock_buyer = b
            break
            
    if not mock_buyer:
        print("❌ Mock Buyer 1 not found in DB!")
        return False
        
    buyer_id = mock_buyer.get("_id") or mock_buyer.get("id")
    print(f"📝 Found {mock_buyer['name']} (ID: {buyer_id}). Status: {mock_buyer.get('status')}")
    
    # Update to Active + Clear Filters
    mock_buyer["status"] = "active"
    mock_buyer["filters"] = {
        "states": [],
        "zip_codes": [],
        "min_age": None,
        "max_age": None,
        "custom_conditions": {}
    }
    # Ensure URL is correct
    if "localhost" in mock_buyer.get("ping_url", ""):
         mock_buyer["ping_url"] = mock_buyer["ping_url"].replace("localhost", "127.0.0.1")
         
    print("🔄 Updating Buyer...")
    s, resp = make_request(f"{API_URL}/buyers/{buyer_id}", "PUT", mock_buyer)
    
    if s == 200:
        print("✅ Buyer Activated and Filters Cleared")
        return True
    else:
        print("❌ Failed to update buyer")
        return False

def configure_simulator():
    print("🔧 Configuring Simulator...")
    status, config = make_request(f"{SIMULATOR_URL}/api/config/default", "GET")
    if status == 200 and config:
        config["accept_rate"] = 100
        config["min_price"] = 15.0
        config["max_price"] = 100.0
        s, _ = make_request(f"{SIMULATOR_URL}/api/config/default", "POST", config)
        if s == 200:
            print("✅ Simulator: 100% Accept")
            return True
            
    print("⚠️ Simulator Config Failed")
    return False

def send_lead():
    print("🚀 Sending Lead...")
    lead = {
        "first_name": "Final",
        "last_name": "Test",
        "email": "final@test.com",
        "phone": "555-9999",
        "state": "XY", # No filter should stop this now
        "zip_code": "00000",
        "age": 25,
        "source_id": "script"
    }
    s, data = make_request(f"{API_URL}/leads/", "POST", lead)
    if s == 200:
        print(f"📋 Status: {data.get('status')}")
        if data.get("status") == "SOLD":
            print(f"💰 SOLD! Price: ${data.get('sold_price')}")
            return True
        else:
            print("⚠️ REJECTED. Trace:")
            print(json.dumps(data.get("trace", []), indent=2))
            return False
            
    return False

if __name__ == "__main__":
    if activate_mock_buyer():
        configure_simulator()
        time.sleep(1)
        send_lead()
