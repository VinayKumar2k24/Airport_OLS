# scripts/phase4_spatial_analytics3.py
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio
from rasterio.features import shapes
from scipy.ndimage import binary_closing, binary_opening
from shapely.geometry import shape

CONFIG_PATH = ROOT_DIR / "config" / "spatial_anchor.json"


def run_spatial_analytics():
    print("\n==========================================")
    print("   PHASE 4: SPATIAL ANALYTICS & OLS MERGE  ")
    print("==========================================\n")

    if not CONFIG_PATH.exists():
        raise FileNotFoundError("Missing config/spatial_anchor.json. Run phase1_setup_anchor.py first.")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        anchor = json.load(f)

    info = anchor["airport_info"]
    ws = anchor["workspace"]
    icao = info.get("icao", "UNKNOWN")
    utm_epsg = info.get("utm_epsg", "EPSG:32618")
    elevation_msl = float(info.get("elevation_msl_m", 0.0))

    processed_dir = ROOT_DIR / ws["processed_dir"]
    mask_path = processed_dir / "final_change_mask.tif"
    ols_surfaces_path = processed_dir / f"{icao}_OLS_surfaces.geojson"
    output_combined_path = processed_dir / f"{icao}_encroachment_analytics.geojson"
    global_vector_path = ROOT_DIR / "data" / "vector" / "global_encroachments.geojson"

    print(f"  Airport Workspace : {info.get('airport_name', 'Airport')} [{icao}]")
    print(f"  Target UTM CRS    : {utm_epsg}")
    print(f"  Input Mask        : {mask_path}\n")

    if not mask_path.exists():
        raise FileNotFoundError(f"Change mask raster not found at {mask_path}")

    # 1. Polygonize change mask raster with morphological smoothing
    print("🔄 Polygonizing and smoothing change mask raster...")
    with rasterio.open(mask_path) as src:
        image = src.read(1)
        transform = src.transform
        raster_crs = src.crs

    # Apply morphological opening & closing to eliminate 1-pixel tile boundary artifacts
    cleaned_mask = binary_opening(image, structure=np.ones((3, 3)))
    cleaned_mask = binary_closing(cleaned_mask, structure=np.ones((3, 3)))

    mask_shapes = shapes(cleaned_mask.astype(np.uint8), mask=(cleaned_mask == 1), transform=transform)
    polygons = []

    for geom, _ in mask_shapes:
        poly = shape(geom)
        if poly.area >= 50.0:  # Filter out noise candidate footprints smaller than 50m²
            # Smooth polygon staircase edges (0.5m tolerance)
            simplified_poly = poly.simplify(tolerance=0.5, preserve_topology=True)
            if not simplified_poly.is_empty:
                polygons.append(simplified_poly)

    if not polygons:
        print("⚠️ No change footprints (≥ 50m²) detected.")
        gdf = gpd.GeoDataFrame(columns=["polygon_id", "geometry"], crs=utm_epsg)
    else:
        gdf = gpd.GeoDataFrame({"geometry": polygons}, crs=raster_crs)
        if gdf.crs != utm_epsg:
            gdf = gdf.to_crs(utm_epsg)

        print(f"  • Processed & Smoothed Footprints: {len(gdf)}")

        # Assign unique IDs and calculate metric attributes
        gdf["polygon_id"] = [f"ENC_{i+1:04d}" for i in range(len(gdf))]
        gdf["area_m2"] = gdf.geometry.area.round(2)

        # Reproject centroids accurately from UTM to WGS84
        wgs84_centroids = gdf.geometry.centroid.to_crs("EPSG:4326")
        gdf["centroid_lon"] = wgs84_centroids.x.round(6)
        gdf["centroid_lat"] = wgs84_centroids.y.round(6)

        # 2. Spatial Intersection with ICAO Annex 14 OLS surfaces
        print("🔄 Intersecting footprints with ICAO Annex 14 OLS surfaces...")
        
        # Pre-initialize target columns safely on gdf
        gdf["zone_name"] = None
        gdf["z_limit_m"] = np.nan

        if ols_surfaces_path.exists():
            ols_gdf = gpd.read_file(ols_surfaces_path).to_crs(utm_epsg)

            # Dynamically identify zone name column
            possible_zone_cols = ["zone_name", "zone", "surface", "Name", "ols_type", "description", "layer"]
            zone_col = next((col for col in possible_zone_cols if col in ols_gdf.columns), None)

            # Dynamically identify elevation limit column
            possible_z_cols = ["z_limit_m", "z_limit", "max_elevation_m", "max_alt_m", "elevation_m", "height_m"]
            z_col = next((col for col in possible_z_cols if col in ols_gdf.columns), None)

            ols_cols = ["geometry"]
            if zone_col:
                ols_cols.append(zone_col)
            if z_col:
                ols_cols.append(z_col)

            # Spatial join
            joined_gdf = gpd.sjoin(gdf.drop(columns=["zone_name", "z_limit_m"]), ols_gdf[ols_cols], how="inner", predicate="intersects")

            # Standardize column names safely
            if zone_col and zone_col in joined_gdf.columns and zone_col != "zone_name":
                joined_gdf.rename(columns={zone_col: "zone_name"}, inplace=True)
            
            if z_col and z_col in joined_gdf.columns and z_col != "z_limit_m":
                joined_gdf.rename(columns={z_col: "z_limit_m"}, inplace=True)

            # Remove duplicate matches keeping unique polygon IDs
            joined_gdf = joined_gdf.drop_duplicates(subset=["polygon_id"]).reset_index(drop=True)
            gdf = joined_gdf
        else:
            print("⚠️ OLS surfaces vector missing. Defaulting zone assignment.")
            gdf["zone_name"] = "Inner_Horizontal_Surface"
            gdf["z_limit_m"] = elevation_msl + 45.0

        # Guarantee required columns exist before calling fillna
        if "zone_name" not in gdf.columns:
            gdf["zone_name"] = None
        if "z_limit_m" not in gdf.columns:
            gdf["z_limit_m"] = np.nan

        # Fill default values for unmatched regions
        gdf["zone_name"] = gdf["zone_name"].fillna("Conical_Surface")
        gdf["z_limit_m"] = gdf["z_limit_m"].fillna(elevation_msl + 100.0)

        # Structural risk evaluation
        gdf["airport_icao"] = icao
        gdf["estimated_height_m"] = (10.0 + (gdf["area_m2"] / 100.0)).clip(upper=45.0).round(2)
        gdf["absolute_alt_m"] = (elevation_msl + gdf["estimated_height_m"]).round(2)
        gdf["height_violation_m"] = (gdf["absolute_alt_m"] - gdf["z_limit_m"]).clip(lower=0.0).round(2)

        def evaluate_risk(row):
            if row["height_violation_m"] > 0:
                return "CRITICAL"
            elif row["zone_name"] in ["Approach_Surface", "Transitional_Surface"]:
                return "HIGH"
            elif row["zone_name"] == "Inner_Horizontal_Surface":
                return "MEDIUM"
            return "LOW"

        gdf["risk_level"] = gdf.apply(evaluate_risk, axis=1)
        gdf["layer_type"] = "encroachment_polygon"

        # Apply geojson.io Mapbox styling properties to Encroachments
        def style_encroachment(risk):
            if risk == "CRITICAL":
                return "#ff0000", 0.7, "#ff0000"  # Red
            elif risk == "HIGH":
                return "#ff8800", 0.6, "#ff8800"  # Orange
            elif risk == "MEDIUM":
                return "#ffff00", 0.5, "#ffff00"  # Yellow
            return "#00ff00", 0.4, "#00ff00"       # Green

        styles = [style_encroachment(r) for r in gdf["risk_level"]]
        gdf["fill"] = [s[0] for s in styles]
        gdf["fill-opacity"] = [s[1] for s in styles]
        gdf["stroke"] = [s[2] for s in styles]
        gdf["stroke-width"] = 2

    # 3. Load & Style OLS Surfaces for Combined GeoJSON Export
    combined_gdfs = []

    if ols_surfaces_path.exists():
        print("🔄 Merging OLS Surfaces into Master GeoJSON...")
        ols_display_gdf = gpd.read_file(ols_surfaces_path).to_crs(utm_epsg)
        ols_display_gdf["layer_type"] = "ols_surface"
        
        # Apply distinct cyan/blue styling for OLS Surface Zones in geojson.io
        ols_display_gdf["fill"] = "#00bfff"
        ols_display_gdf["fill-opacity"] = 0.15
        ols_display_gdf["stroke"] = "#0000ff"
        ols_display_gdf["stroke-width"] = 1.5

        combined_gdfs.append(ols_display_gdf)

    if not gdf.empty:
        combined_gdfs.append(gdf)

    if combined_gdfs:
        master_gdf = pd.concat(combined_gdfs, ignore_index=True)
        master_gdf = gpd.GeoDataFrame(master_gdf, crs=utm_epsg).to_crs("EPSG:4326")
    else:
        master_gdf = gpd.GeoDataFrame(columns=["geometry"], crs="EPSG:4326")

    # 4. Save Output
    output_combined_path.parent.mkdir(parents=True, exist_ok=True)
    global_vector_path.parent.mkdir(parents=True, exist_ok=True)

    master_gdf.to_file(output_combined_path, driver="GeoJSON")
    master_gdf.to_file(global_vector_path, driver="GeoJSON")

    print("\n------------------------------------------")
    print("✅ Spatial Analytics & OLS Merge Complete!")
    if not gdf.empty:
        print(f"  • Footprints Detected : {len(gdf)}")
        print(f"  • Critical Violations : {(gdf['risk_level'] == 'CRITICAL').sum()}")
        print(f"  • High Risk Count     : {(gdf['risk_level'] == 'HIGH').sum()}")
    print(f"  • Combined GeoJSON    : {output_combined_path}")
    print("------------------------------------------\n")


if __name__ == "__main__":
    run_spatial_analytics()