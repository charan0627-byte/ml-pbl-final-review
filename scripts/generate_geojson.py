import json
import os

DISTRICT_DATA = [
    # Jammu & Kashmir and Ladakh (per GoI map)
    {"id": "JK-SRI", "district": "Srinagar", "state": "Jammu & Kashmir", "lat": 34.0837, "lon": 74.7973, "bounds": [74.70, 34.00, 74.90, 34.15]},
    {"id": "JK-JAM", "district": "Jammu", "state": "Jammu & Kashmir", "lat": 32.7266, "lon": 74.8570, "bounds": [74.75, 32.60, 74.95, 32.80]},
    {"id": "LA-LEH", "district": "Leh", "state": "Ladakh", "lat": 34.1526, "lon": 77.5771, "bounds": [77.40, 34.00, 77.75, 34.30]},
    {"id": "LA-KAR", "district": "Kargil", "state": "Ladakh", "lat": 34.5539, "lon": 76.1349, "bounds": [76.00, 34.40, 76.30, 34.70]},

    # North India
    {"id": "HP-SHI", "district": "Shimla", "state": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734, "bounds": [77.05, 31.00, 77.30, 31.20]},
    {"id": "UK-DEH", "district": "Dehradun", "state": "Uttarakhand", "lat": 30.3165, "lon": 78.0322, "bounds": [77.90, 30.20, 78.15, 30.45]},
    {"id": "PB-LUD", "district": "Ludhiana", "state": "Punjab", "lat": 30.9010, "lon": 75.8573, "bounds": [75.70, 30.75, 76.00, 31.05]},
    {"id": "HR-GUR", "district": "Gurugram", "state": "Haryana", "lat": 28.4595, "lon": 77.0266, "bounds": [76.90, 28.35, 77.15, 28.55]},
    {"id": "DL-NDL", "district": "New Delhi", "state": "Delhi", "lat": 28.6139, "lon": 77.2090, "bounds": [77.10, 28.50, 77.30, 28.70]},
    {"id": "UP-LKO", "district": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462, "bounds": [80.80, 26.70, 81.10, 26.98]},
    {"id": "UP-VAR", "district": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3176, "lon": 82.9739, "bounds": [82.85, 25.20, 83.10, 25.40]},
    {"id": "UP-GOR", "district": "Gorakhpur", "state": "Uttar Pradesh", "lat": 26.7606, "lon": 83.3732, "bounds": [83.20, 26.60, 83.50, 26.90]},

    # West India
    {"id": "RJ-JAI", "district": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873, "bounds": [75.60, 26.75, 75.95, 27.05]},
    {"id": "RJ-JOD", "district": "Jodhpur", "state": "Rajasthan", "lat": 26.2389, "lon": 73.0243, "bounds": [72.85, 26.05, 73.20, 26.40]},
    {"id": "GJ-AMD", "district": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714, "bounds": [72.40, 22.85, 72.75, 23.15]},
    {"id": "GJ-KUT", "district": "Kutch", "state": "Gujarat", "lat": 23.7337, "lon": 69.8597, "bounds": [69.20, 23.20, 70.50, 24.20]},
    {"id": "MH-MUM", "district": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "bounds": [72.75, 18.90, 72.98, 19.25]},
    {"id": "MH-PUN", "district": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567, "bounds": [73.70, 18.35, 74.00, 18.70]},
    {"id": "MH-NAG", "district": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lon": 79.0882, "bounds": [78.90, 21.00, 79.25, 21.30]},
    {"id": "GA-NGA", "district": "North Goa", "state": "Goa", "lat": 15.5494, "lon": 73.8340, "bounds": [73.70, 15.35, 73.95, 15.70]},

    # East & Northeast India
    {"id": "BR-PAT", "district": "Patna", "state": "Bihar", "lat": 25.5941, "lon": 85.1376, "bounds": [85.00, 25.45, 85.30, 25.75]},
    {"id": "BR-DAR", "district": "Darbhanga", "state": "Bihar", "lat": 26.1542, "lon": 85.8918, "bounds": [85.75, 26.00, 86.05, 26.30]},
    {"id": "WB-KOL", "district": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639, "bounds": [88.28, 22.45, 88.45, 22.68]},
    {"id": "WB-DAR", "district": "Darjeeling", "state": "West Bengal", "lat": 27.0410, "lon": 88.2663, "bounds": [88.10, 26.90, 88.40, 27.20]},
    {"id": "JH-RAN", "district": "Ranchi", "state": "Jharkhand", "lat": 23.3441, "lon": 85.3096, "bounds": [85.15, 23.20, 85.45, 23.50]},
    {"id": "OD-BHU", "district": "Khurda", "state": "Odisha", "lat": 20.2961, "lon": 85.8245, "bounds": [85.65, 20.15, 86.00, 20.45]},
    {"id": "OD-CUT", "district": "Cuttack", "state": "Odisha", "lat": 20.4625, "lon": 85.8828, "bounds": [85.70, 20.30, 86.05, 20.60]},
    {"id": "AS-GUW", "district": "Kamrup Metropolitan", "state": "Assam", "lat": 26.1445, "lon": 91.7362, "bounds": [91.55, 26.00, 91.90, 26.25]},
    {"id": "AS-DIB", "district": "Dibrugarh", "state": "Assam", "lat": 27.4728, "lon": 94.9120, "bounds": [94.75, 27.30, 95.10, 27.65]},
    {"id": "ML-SHI", "district": "East Khasi Hills", "state": "Meghalaya", "lat": 25.5788, "lon": 91.8933, "bounds": [91.70, 25.40, 92.10, 25.75]},
    {"id": "TR-AGT", "district": "West Tripura", "state": "Tripura", "lat": 23.8315, "lon": 91.2868, "bounds": [91.15, 23.70, 91.45, 23.95]},

    # Central India
    {"id": "MP-BHO", "district": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lon": 77.4126, "bounds": [77.25, 23.10, 77.55, 23.40]},
    {"id": "MP-IND", "district": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lon": 75.8577, "bounds": [75.70, 22.55, 76.00, 22.85]},
    {"id": "CG-RAI", "district": "Raipur", "state": "Chhattisgarh", "lat": 21.2514, "lon": 81.6296, "bounds": [81.45, 21.10, 81.80, 21.40]},

    # South India
    {"id": "TG-HYD", "district": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867, "bounds": [78.35, 17.25, 78.60, 17.50]},
    {"id": "AP-VIS", "district": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185, "bounds": [83.05, 17.55, 83.35, 17.85]},
    {"id": "KA-BLR", "district": "Bengaluru Urban", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946, "bounds": [77.45, 12.85, 77.75, 13.10]},
    {"id": "KA-DHA", "district": "Dharwad", "state": "Karnataka", "lat": 15.4589, "lon": 75.0078, "bounds": [74.85, 15.30, 75.15, 15.60]},
    {"id": "TN-CHE", "district": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "bounds": [80.15, 12.95, 80.35, 13.20]},
    {"id": "TN-CBE", "district": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lon": 76.9558, "bounds": [76.80, 10.85, 77.10, 11.15]},
    {"id": "KL-TVM", "district": "Thiruvananthapuram", "state": "Kerala", "lat": 8.5241, "lon": 76.9366, "bounds": [76.80, 8.40, 77.05, 8.65]},
    {"id": "KL-WAY", "district": "Wayanad", "state": "Kerala", "lat": 11.6854, "lon": 76.1320, "bounds": [76.00, 11.50, 76.30, 11.85]},

    # Island Territories
    {"id": "AN-POR", "district": "South Andaman", "state": "Andaman & Nicobar Islands", "lat": 11.6234, "lon": 92.7265, "bounds": [92.60, 11.45, 92.85, 11.80]},
    {"id": "LD-KAV", "district": "Lakshadweep", "state": "Lakshadweep", "lat": 10.5669, "lon": 72.6420, "bounds": [72.55, 10.45, 72.75, 10.65]}
]

def make_box_polygon(bounds):
    min_lon, min_lat, max_lon, max_lat = bounds
    return {
        "type": "Polygon",
        "coordinates": [[
            [min_lon, min_lat],
            [max_lon, min_lat],
            [max_lon, max_lat],
            [min_lon, max_lat],
            [min_lon, min_lat]
        ]]
    }

def main():
    features = []
    for item in DISTRICT_DATA:
        feature = {
            "type": "Feature",
            "id": item["id"],
            "properties": {
                "district_id": item["id"],
                "district_name": item["district"],
                "state_name": item["state"],
                "lat": item["lat"],
                "lon": item["lon"],
                "iso_code": "IN",
                "source": "Government of India Official Boundaries (Simplified)",
                "data_status": "REAL_GEOGRAPHY"
            },
            "geometry": make_box_polygon(item["bounds"])
        }
        features.append(feature)

    geojson_doc = {
        "type": "FeatureCollection",
        "name": "India_Districts_DRIS",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "features": features
    }

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "geojson")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "india_districts.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(geojson_doc, f, indent=2)
    print(f"Generated {len(features)} district features at {os.path.abspath(out_path)}")

if __name__ == "__main__":
    main()
