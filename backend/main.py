from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import math

app = FastAPI(title="EchoRoute API")

# --- FIX: Enable CORS so App.js can talk to this API ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "enriched_data.json"
NOISE_THRESHOLD = 70.0

def load_road_data():
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"features": []}

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371 
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@app.get("/admin/thermal-data")
async def get_thermal_data():
    data = load_road_data()
    features = data.get("features", [])
    
    results = []
    for f in features:
        props = f["properties"]
        noise = props["noise_level"]
        
        # --- DECISION INTELLIGENCE ATTACHED HERE ---
        suggestion = "Maintain Flow"
        status = "Safe"
        if noise > 80:
            suggestion = "Immediate Diversion: Heavy Vehicles Only"
            status = "Critical"
        elif noise > 70:
            suggestion = "Optimize Traffic Lights: Reduce Idling"
            status = "Warning"
            
        results.append({
            **props, 
            "coordinates": f["geometry"]["coordinates"],
            "control_suggestion": suggestion,
            "status": status
        })
    return results

@app.get("/admin/simulate-reduction")
async def simulate_reduction(segment_name: str, reduction_percent: float = 20.0):
    """
    Simulates the impact of rerouting heavy vehicles.
    In reality, a 20% traffic reduction roughly lowers noise by ~2-4 dB.
    """
    data = load_road_data()
    features = data.get("features", [])
    
    target = next((f for f in features if f["properties"]["name"] == segment_name), None)
    
    if not target:
        return {"error": "Road not found"}
        
    original_db = target["properties"]["noise_level"]
    # LOGIC: Every 10% reduction in traffic volume results in approx 1dB drop
    reduction_db = (reduction_percent / 10) 
    new_db = max(40, original_db - reduction_db)

    return {
        "road": segment_name,
        "before_db": original_db,
        "after_db": round(new_db, 1),
        "impact": "Significant Improvement" if original_db > 70 and new_db <= 70 else "Minor Change"
    }

@app.get("/admin/analytics")
async def get_analytics():
    data = load_road_data()
    features = data.get("features", [])
    
    # Flatten data for analysis
    all_segments = [{**f["properties"], "coords": f["geometry"]["coordinates"]} for f in features]
    
    # Sort for Top 5 Noisy Roads
    top_noisy = sorted(all_segments, key=lambda x: x['noise_level'], reverse=True)[:5]
    
    # Calculate Stats
    total = len(all_segments)
    high_risk = len([s for s in all_segments if s['noise_level'] > 70])
    avg_noise = sum(s['noise_level'] for s in all_segments) / total if total > 0 else 0

    return {
        "stats": {
            "total_monitored_roads": total,
            "high_risk_zones": high_risk,
            "avg_city_noise": round(avg_noise, 1)
        },
        "top_5_noisy_roads": top_noisy
    }

@app.get("/user/check-reroute")
async def check_reroute(user_lat: float, user_lon: float):
    data = load_road_data()
    segments = data.get("features", [])
    
    breaches = []
    for seg in segments:
        props = seg.get("properties", {})
        geom = seg.get("geometry", {})
        coords = geom.get("coordinates", [])

        noise = props.get("noise_level", 0)
        
        if noise > NOISE_THRESHOLD and len(coords) >= 2:
            seg_lon, seg_lat = coords[0], coords[1]
            dist = calculate_distance(user_lat, user_lon, seg_lat, seg_lon)
            if dist <= 1.0: 
                breaches.append({
                    "location": props.get("name", "Unknown"), 
                    "db": noise,
                    "distance_km": round(dist, 2)
                })

    return {"reroute_required": len(breaches) > 0, "breaches": breaches}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)