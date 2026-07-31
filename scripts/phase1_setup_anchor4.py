# scripts/phase1_setup_anchor.py
import json
import math
from pathlib import Path

import pandas as pd
from pyproj import Transformer

ROOT_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT_DIR / "data" / "airport_runway_data.csv"
CONFIG_PATH = ROOT_DIR / "config" / "spatial_anchor.json"

# 8.0 km buffer around runway midpoint (Creates a 16km x 16km AOI bounding box)
AOI_BUFFER_KM = 8.0


def utm_epsg_from_lon_lat(lon, lat):
    zone = int((lon + 180) / 6) + 1
    return f"EPSG:{32600 + zone}" if lat >= 0 else f"EPSG:{32700 + zone}"


def choose_runway(airport_icao, runway_name):
    df = pd.read_csv(CSV_PATH)

    print("Airport ICAO:", airport_icao)
    print("Requested Runway:", runway_name)
    print(df[df["ICAO"] == airport_icao][["ICAO","Runway"]])

    rows = df[
        (df["ICAO"] == airport_icao) &
        (df["Runway"] == runway_name)
    ].reset_index(drop=True)

    if rows.empty:
        raise ValueError(
            f"Runway '{runway_name}' not found for airport '{airport_icao}'."
        )

    return rows.iloc[0]


def calculate_spatial_anchor(airport_icao, runway_name):
    print("NEW VERSION LOADED")
    row = choose_runway(airport_icao, runway_name)

    airport_name = str(row["Airport_Name"])
    icao = str(row["ICAO"]).upper().strip()

    # Determine Region dynamically (US for K-prefix ICAOs like KJFK, KORD, etc.)
    region = "US" if icao.startswith("K") or "US" in str(row.get("Country", "")).upper() else "INDIA"

    threshold_primary = [float(row["Threshold1_Lon"]), float(row["Threshold1_Lat"])]
    threshold_secondary = [float(row["Threshold2_Lon"]), float(row["Threshold2_Lat"])]

    runway_width = float(row["Runway_Width_m"])
    elevation = float(row["Elevation_MSL_m"])

    mid_lon = (threshold_primary[0] + threshold_secondary[0]) / 2.0
    mid_lat = (threshold_primary[1] + threshold_secondary[1]) / 2.0

    utm_epsg = utm_epsg_from_lon_lat(mid_lon, mid_lat)

    transformer = Transformer.from_crs("EPSG:4326", utm_epsg, always_xy=True)
    reverse = Transformer.from_crs(utm_epsg, "EPSG:4326", always_xy=True)

    x1, y1 = transformer.transform(*threshold_primary)
    x2, y2 = transformer.transform(*threshold_secondary)

    dx = x2 - x1
    dy = y2 - y1

    runway_length = math.hypot(dx, dy)

    azimuth_rad = math.atan2(dx, dy)
    azimuth_deg = (math.degrees(azimuth_rad) + 360.0) % 360.0

    mid_x = (x1 + x2) / 2.0
    mid_y = (y1 + y2) / 2.0

    buffer = AOI_BUFFER_KM * 1000.0

    min_x = mid_x - buffer
    max_x = mid_x + buffer
    min_y = mid_y - buffer
    max_y = mid_y + buffer

    # Transform metric UTM bounding box back to WGS84 coordinates for STAC queries
    min_lon, min_lat = reverse.transform(min_x, min_y)
    max_lon, max_lat = reverse.transform(max_x, max_y)

    # Relative paths for Phase 2, 3, and 4
    processed_rel_dir = f"data/processed_{icao}"
    t1_raster_rel = f"{processed_rel_dir}/t1_{icao.lower()}.tif"
    t2_raster_rel = f"{processed_rel_dir}/t2_{icao.lower()}.tif"

    anchor = {
        "airport_info": {
            "airport_name": airport_name,
            "icao": icao,
            "region": region,
            "utm_epsg": utm_epsg,
            "elevation_msl_m": elevation,
            "runway_width_m": runway_width,
            "runway_length_m": round(runway_length, 2),
            "azimuth_deg": round(azimuth_deg, 2),
            "azimuth_rad": round(azimuth_rad, 4)
        },
        "workspace": {
            "processed_dir": processed_rel_dir,
            "t1_raster": t1_raster_rel,
            "t2_raster": t2_raster_rel,
            "change_prob_raster": f"{processed_rel_dir}/change_prob_{icao.lower()}.tif",
            "final_mask_raster": f"{processed_rel_dir}/final_change_mask.tif"
        },
        "thresholds_wgs84": {
            "threshold_primary": threshold_primary,
            "threshold_secondary": threshold_secondary
        },
        "thresholds_utm": {
            "threshold_primary": [round(x1, 2), round(y1, 2)],
            "threshold_secondary": [round(x2, 2), round(y2, 2)]
        },
        "bounding_box_utm": {
            "min_x": round(min_x, 2),
            "max_x": round(max_x, 2),
            "min_y": round(min_y, 2),
            "max_y": round(max_y, 2)
        },
        "bounding_box_wgs84": {
            "min_lon": round(min_lon, 6),
            "max_lon": round(max_lon, 6),
            "min_lat": round(min_lat, 6),
            "max_lat": round(max_lat, 6)
        }
    }

    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(anchor, f, indent=4)

    print("\n==========================================")
    print("✅ spatial_anchor.json generated successfully!")
    print("==========================================")
    print(f"  Airport : {airport_name} [{icao}]")
    print(f"  Region  : {region}")
    print(f"  UTM CRS : {utm_epsg}")
    print(f"  Runway  : {row['Runway']}")
    print(f"  Length  : {round(runway_length, 2)} m")
    print(f"  Azimuth : {round(azimuth_deg, 2)} deg")
    print(f"  BBox WGS84: Lon[{round(min_lon,4)} to {round(max_lon,4)}], Lat[{round(min_lat,4)} to {round(max_lat,4)}]")
    print("==========================================\n")


if __name__ == "__main__":
    calculate_spatial_anchor(airport_icao="VABB", runway_name="09/27")