# scripts/phase1_generate_ols.py
import json
import math
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

import geopandas as gpd
import numpy as np
from shapely.geometry import Polygon

CONFIG_PATH = ROOT_DIR / "config" / "spatial_anchor.json"


def generate_ols_surfaces():
    print("\n==========================================")
    print("   PHASE 1 (PART 2): ICAO OLS GENERATOR   ")
    print("==========================================\n")

    if not CONFIG_PATH.exists():
        raise FileNotFoundError("Missing config/spatial_anchor.json. Run phase1_setup_anchor.py first.")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        anchor = json.load(f)

    info = anchor["airport_info"]
    icao = info.get("icao", "UNKNOWN")
    utm_epsg = info["utm_epsg"]
    elevation_msl = float(info.get("elevation_msl_m", 0.0))

    ws = anchor["workspace"]
    processed_dir = ROOT_DIR / ws["processed_dir"]
    processed_dir.mkdir(parents=True, exist_ok=True)

    output_ols_path = processed_dir / f"{icao}_OLS_surfaces.geojson"

    p1 = anchor["thresholds_utm"]["threshold_primary"]
    p2 = anchor["thresholds_utm"]["threshold_secondary"]
    
    azimuth_rad = info["azimuth_rad"]
   # runway_length = info["runway_length_m"]
    #runway_width = info["runway_width_m"]

    print(f"  Airport : {info['airport_name']} [{icao}]")
    print(f"  UTM CRS : {utm_epsg}")
    print(f"  Base MSL: {elevation_msl} m\n")

    # Direction vectors along and perpendicular to runway
    sin_a, cos_a = math.sin(azimuth_rad), math.cos(azimuth_rad)
    perp_sin, perp_cos = math.sin(azimuth_rad + math.pi / 2), math.cos(azimuth_rad + math.pi / 2)

    mid_x = (p1[0] + p2[0]) / 2.0
    mid_y = (p1[1] + p2[1]) / 2.0

    features = []

    # 1. Inner Horizontal Surface (45m elevation limit above aerodrome)
    ihs_radius = 4000.0  # 4.0 km radius
    angles = np.linspace(0, 2 * math.pi, 72)
    ihs_poly = Polygon([(mid_x + ihs_radius * math.cos(a), mid_y + ihs_radius * math.sin(a)) for a in angles])
    features.append({
        "geometry": ihs_poly,
        "zone_name": "Inner_Horizontal_Surface",
        "z_limit_m": round(elevation_msl + 45.0, 2),
        "description": "Inner Horizontal Surface (45m above aerodrome elevation)"
    })

    # 2. Conical Surface (45m to 100m elevation limit above aerodrome)
    conical_radius = 6000.0  # 6.0 km outer radius
    conical_poly = Polygon(
        shell=[(mid_x + conical_radius * math.cos(a), mid_y + conical_radius * math.sin(a)) for a in angles],
        holes=[list(ihs_poly.exterior.coords)]
    )
    features.append({
        "geometry": conical_poly,
        "zone_name": "Conical_Surface",
        "z_limit_m": round(elevation_msl + 100.0, 2),
        "description": "Conical Surface (Sloping from 45m to 100m above aerodrome)"
    })

    # Helper to construct approach trapezoids at runway ends
    def build_approach_surface(start_pt, direction_sign):
        length = 3000.0  # 3km approach length
        inner_width = 150.0  # 150m strip width
        outer_width = 150.0 + (length * 0.15)  # 15% divergence

        # Base threshold points
        b1_x = start_pt[0] - (inner_width / 2.0) * perp_sin
        b1_y = start_pt[1] - (inner_width / 2.0) * perp_cos
        b2_x = start_pt[0] + (inner_width / 2.0) * perp_sin
        b2_y = start_pt[1] + (inner_width / 2.0) * perp_cos

        # Far points
        far_center_x = start_pt[0] + direction_sign * length * sin_a
        far_center_y = start_pt[1] + direction_sign * length * cos_a

        f1_x = far_center_x - (outer_width / 2.0) * perp_sin
        f1_y = far_center_y - (outer_width / 2.0) * perp_cos
        f2_x = far_center_x + (outer_width / 2.0) * perp_sin
        f2_y = far_center_y + (outer_width / 2.0) * perp_cos

        return Polygon([(b1_x, b1_y), (b2_x, b2_y), (f2_x, f2_y), (f1_x, f1_y)])

    # 3. Primary & Secondary Approach Surfaces
    app_p1 = build_approach_surface(p1, direction_sign=-1)
    app_p2 = build_approach_surface(p2, direction_sign=1)

    features.append({
        "geometry": app_p1,
        "zone_name": "Approach_Surface",
        "z_limit_m": round(elevation_msl + 30.0, 2),
        "description": "Primary Threshold Approach Surface (Inclined 2.5% slope)"
    })
    features.append({
        "geometry": app_p2,
        "zone_name": "Approach_Surface",
        "z_limit_m": round(elevation_msl + 30.0, 2),
        "description": "Secondary Threshold Approach Surface (Inclined 2.5% slope)"
    })
    # ------------------------------------------------------------
    # 4. Transitional Surface (Both sides of runway)
    # ------------------------------------------------------------
    transition_width = 300.0

    # Left Transitional Surface
    left_poly = Polygon([
        (p1[0] - 75 * perp_sin, p1[1] - 75 * perp_cos),
        (p2[0] - 75 * perp_sin, p2[1] - 75 * perp_cos),
        (p2[0] - (75 + transition_width) * perp_sin,
         p2[1] - (75 + transition_width) * perp_cos),
        (p1[0] - (75 + transition_width) * perp_sin,
         p1[1] - (75 + transition_width) * perp_cos)
    ])

    # Right Transitional Surface
    right_poly = Polygon([
        (p1[0] + 75 * perp_sin, p1[1] + 75 * perp_cos),
        (p2[0] + 75 * perp_sin, p2[1] + 75 * perp_cos),
        (p2[0] + (75 + transition_width) * perp_sin,
         p2[1] + (75 + transition_width) * perp_cos),
        (p1[0] + (75 + transition_width) * perp_sin,
         p1[1] + (75 + transition_width) * perp_cos)
    ])

    features.append({
        "geometry": left_poly,
        "zone_name": "Transitional_Surface",
        "z_limit_m": round(elevation_msl + 35.0, 2),
        "description": "Left Transitional Surface"
    })

    features.append({
        "geometry": right_poly,
        "zone_name": "Transitional_Surface",
        "z_limit_m": round(elevation_msl + 35.0, 2),
        "description": "Right Transitional Surface"
    })
    
    # Create GeoDataFrame in UTM CRS
    ols_gdf = gpd.GeoDataFrame(features, crs=utm_epsg)

    # Convert to WGS84 before saving to GeoJSON
    ols_gdf_wgs84 = ols_gdf.to_crs("EPSG:4326")
    ols_gdf_wgs84.to_file(output_ols_path, driver="GeoJSON")

    print(f"✅ Generated {len(ols_gdf)} OLS Surface zones successfully!")
    print(f"💾 File Saved: {output_ols_path}\n")


if __name__ == "__main__":
    generate_ols_surfaces()