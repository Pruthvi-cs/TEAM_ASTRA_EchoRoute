from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import math

app = FastAPI(title="EchoRoute API")

# Load your enriched JSON data
DATA_FILE = "enriched_data.json" # Change this to your output filename
NOISE_THRESHOLD = 70.0  # dB

def load_road_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

# Haversine Formula to calculate 1km distance
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@app.get("/admin/thermal-data")
async def get_thermal_data():
    """Returns the noise levels for the Admin Thermal Heatmap."""
    data = load_road_data()
    # If GeoJSON, extract features; otherwise return list
    return data.get("features", data) if isinstance(data, dict) else data

@app.get("/user/check-reroute")
async def check_reroute(user_lat: float, user_lon: float):
    """
    Checks if a user is within 1km of a noise breach (>70dB).
    If yes, triggers the reroute logic.
    """
    data = load_road_data()
    segments = data.get("features", data) if isinstance(data, dict) else data
    
    breaches = []
    for seg in segments:
        # Extracting lat/lon depends on your JSON structure
        # Assuming properties contains noise_level and center coordinates
        props = seg.get("properties", seg)
        noise = props.get("noise_level", 0)
        
        if noise > NOISE_THRESHOLD:
            # Note: You'll need lat/lon for the noisy segment in your JSON
            seg_lat = props.get("latitude") 
            seg_lon = props.get("longitude")
            
            if seg_lat and seg_lon:
                dist = calculate_distance(user_lat, user_lon, seg_lat, seg_lon)
                if dist <= 1.0: # 1km radius
                    breaches.append({"location": props.get("name", "Unknown"), "db": noise})

    if breaches:
        return {"reroute_required": True, "reason": "High Noise Detected nearby", "breaches": breaches}
    return {"reroute_required": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)