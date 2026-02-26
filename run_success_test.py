import urllib.request
import urllib.error
import json
import time
import random
import string

# Configuration
API_URL = "http://127.0.0.1:8000/api/v1"
SIMULATOR_URL = "http://127.0.0.1:8002"

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
    print(f"📝 Found {mock_buyer['name']} (ID: {buyer_id})")
    
    # Update to Active + Point to Simulator
    mock_buyer["status"] = "active"
    mock_buyer["tier"] = 1
    mock_buyer["ping_url"] = f"{SIMULATOR_URL}/api/buyers/{buyer_id}/ping"
    mock_buyer["post_url"] = f"{SIMULATOR_URL}/api/buyers/{buyer_id}/post"
    mock_buyer["filters"] = {
        "states": [],
        "zip_codes": [],
        "min_age": None,
        "max_age": None,
        "custom_conditions": {}
    }
    mock_buyer["response_parsing"] = None
    mock_buyer["capabilities"] = {
        "supports_fallback": True,
        "supports_reping": True,
        "max_ping_age_seconds": 60,
        "requires_exclusive": False
    }
    
    # Configure Simulator for this Buyer ID
    print(f"🔧 Configuring Simulator for {buyer_id}...")
    sim_config = {
        "accept_rate": 100,
        "latency_ms": 100,
        "min_price": 50.0,
        "max_price": 99.0
    }
    s_sim, _ = make_request(f"{SIMULATOR_URL}/api/internal/config/{buyer_id}", "PUT", sim_config)
    if s_sim != 200:
        print("⚠️ Failed to configure simulator (Is it running on 8002?)")
        return False
          
    print("🔄 Updating Receiver Buyer...")
    s, resp = make_request(f"{API_URL}/buyers/{buyer_id}", "PUT", mock_buyer)
    
    if s == 200:
        print("✅ Buyer Activated and Simulator Configured")
        return True
    else:
        print("❌ Failed to update buyer")
        return False

def generate_random_phone():
    return str(random.randint(1000000000, 9999999999))

def generate_random_email():
    chars = string.ascii_lowercase + string.digits
    username = ''.join(random.choice(chars) for _ in range(10))
    return f"{username}@gmail.com"

def send_lead():
    print("🚀 Sending Lead...")
    lead = {
        "first_name": "Final",
        "last_name": "Test",
        "email": generate_random_email(),
        "phone": generate_random_phone(),
        "state": "XY",
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
        time.sleep(1)
        send_lead()
