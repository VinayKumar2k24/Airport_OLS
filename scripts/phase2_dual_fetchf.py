# scripts/phase2_dual_fetchf.py
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import time

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import calculate_default_transform, reproject, transform_bounds
from rasterio.windows import from_bounds
from pystac_client import Client

CONFIG_PATH = ROOT_DIR / "config" / "spatial_anchor.json"
EARTH_SEARCH_URL = "https://earth-search.aws.element84.com/v1"
PLANETARY_COMPUTER_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"

# Fast GDAL environment configuration for HTTP cloud streaming
GDAL_FAST_ENV = {
    "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
    "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif",
    "VSI_CACHE": True,
    "VSI_CACHE_SIZE": 50000000,  # 50MB RAM cache
    "GDAL_HTTP_MAX_RETRY": "3",
    "GDAL_HTTP_RETRY_DELAY": "1"
}


def save_multiband_geotiff(data_stack, transform, crs_str, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count, height, width = data_stack.shape

    profile = {
        "driver": "GTiff",
        "height": height,
        "width": width,
        "count": count,
        "dtype": data_stack.dtype,
        "crs": crs_str,
        "transform": transform,
        "compress": "lzw"
    }

    with rasterio.open(output_path, "w", **profile) as dst:
        dst.write(data_stack)


def read_cropped_cog_band(asset_url, bbox_wgs84, target_epsg, target_grid=None, resolution_m=1.0, is_sentinel2=False):
    with rasterio.Env(**GDAL_FAST_ENV):
        with rasterio.open(asset_url) as src:
            src_crs = src.crs

            if target_grid is None:
                minx_src, miny_src, maxx_src, maxy_src = transform_bounds(
                    "EPSG:4326", src_crs,
                    bbox_wgs84["min_lon"], bbox_wgs84["min_lat"],
                    bbox_wgs84["max_lon"], bbox_wgs84["max_lat"]
                )

                src_win = from_bounds(minx_src, miny_src, maxx_src, maxy_src, transform=src.transform)

                dst_transform, dst_width, dst_height = calculate_default_transform(
                    src_crs, target_epsg,
                    src_win.width, src_win.height,
                    left=minx_src, bottom=miny_src, right=maxx_src, top=maxy_src,
                    resolution=resolution_m
                )

                target_grid = {
                    "transform": dst_transform,
                    "width": int(dst_width),
                    "height": int(dst_height)
                }

            src_minx, src_miny, src_maxx, src_maxy = transform_bounds(
                target_epsg, src_crs,
                target_grid["transform"][2],
                target_grid["transform"][5] + target_grid["transform"][4] * target_grid["height"],
                target_grid["transform"][2] + target_grid["transform"][0] * target_grid["width"],
                target_grid["transform"][5]
            )

            src_window = from_bounds(src_minx, src_miny, src_maxx, src_maxy, transform=src.transform)

            src_data = src.read(1, window=src_window, boundless=True, fill_value=0)
            win_transform = src.window_transform(src_window)

            dst_array = np.zeros((target_grid["height"], target_grid["width"]), dtype=np.float32 if is_sentinel2 else np.uint8)

            reproject(
                source=src_data,
                destination=dst_array,
                src_transform=win_transform,
                src_crs=src_crs,
                dst_transform=target_grid["transform"],
                dst_crs=target_epsg,
                resampling=Resampling.bilinear
            )

            if is_sentinel2:
                dst_array = np.clip((dst_array / 10000.0) * 255.0, 0, 255).astype(np.uint8)

            return dst_array, target_grid


def fetch_band_worker(args):
    key, href, bbox_wgs84, target_epsg, active_grid, is_sentinel2 = args
    res_m = 10.0 if is_sentinel2 else 1.0
    band_array, grid_meta = read_cropped_cog_band(
        href, bbox_wgs84, target_epsg, target_grid=active_grid, resolution_m=res_m, is_sentinel2=is_sentinel2
    )
    return key, band_array, grid_meta


def fetch_naip_us(bbox_wgs84, t_start, t_end, output_path, target_epsg, target_grid=None):
    import os

    if output_path.exists():
        print(f"🗑 Removing old cached raster: {output_path.name}")
        os.remove(output_path)

    print(f"📡 Querying NAIP STAC via Planetary Computer [{t_start} to {t_end}]...")
    client = Client.open(
    PLANETARY_COMPUTER_URL,
    ignore_conformance=True
)
    search = client.search(
        collections=["naip"],
        bbox=[bbox_wgs84["min_lon"], bbox_wgs84["min_lat"], bbox_wgs84["max_lon"], bbox_wgs84["max_lat"]],
        datetime=f"{t_start}/{t_end}",
        max_items=5
    )

    items = list(search.items())
    print(f"Found {len(items)} NAIP scenes.")
    if not items:
        raise ValueError(f"No NAIP aerial imagery found for time window {t_start} to {t_end}.")

    selected_item = items[0]
    print(f"  • Selected NAIP Scene: {selected_item.id}")

    band_keys = ["red", "green", "blue", "nir"]
    tasks = []

    # Prepare parallel threads for all 4 bands
    for key in band_keys:
        href = selected_item.assets[key].href
        tasks.append((key, href, bbox_wgs84, target_epsg, target_grid, False))

    print("  🚀 Parallel streaming 4 NAIP bands over HTTP range requests...")
    results = {}
    active_grid = target_grid

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(fetch_band_worker, task) for task in tasks]
        for future in futures:
            key, band_array, grid_meta = future.result()
            results[key] = band_array
            if active_grid is None:
                active_grid = grid_meta

    stacked = np.stack([results[k] for k in band_keys], axis=0)

    print(f"\n💾 Writing raster to: {output_path}")

    save_multiband_geotiff(
        stacked,
        active_grid["transform"],
        target_epsg,
        output_path
    )

    print("✅ Raster successfully written.")
    print("📁 File exists:", output_path.exists())

    return active_grid


def fetch_sentinel2_india(bbox_wgs84, t_start, t_end, output_path, target_epsg, target_grid=None):
    import os

    if output_path.exists():
        print(f"🗑 Removing old cached raster: {output_path.name}")
        os.remove(output_path)

    print(f"📡 Querying Sentinel-2 L2A STAC [{t_start} to {t_end}]...")
    client = Client.open(
    EARTH_SEARCH_URL,
    ignore_conformance=True
)

    search = client.search(
        collections=["sentinel-2-l2a"],
        bbox=[bbox_wgs84["min_lon"], bbox_wgs84["min_lat"], bbox_wgs84["max_lon"], bbox_wgs84["max_lat"]],
        datetime=f"{t_start}/{t_end}",
        query={"eo:cloud_cover": {"lt": 20}},
        max_items=10
    )

    items = list(search.items())
    print(f"Found {len(items)} Sentinel-2 scenes.")
    if not items:
        raise ValueError(f"No Sentinel-2 imagery found for time window {t_start} to {t_end}.")

    items.sort(key=lambda x: x.properties.get("eo:cloud_cover", 100))

    band_keys = ["red", "green", "blue", "nir"]

    for idx, selected_item in enumerate(items):
        print(f"  • Candidate [{idx+1}/{len(items)}]: {selected_item.id} (Cloud cover: {selected_item.properties.get('eo:cloud_cover', 'N/A')}%)")
        print("Scene Date :", selected_item.datetime)
        print("Cloud Cover:", selected_item.properties.get("eo:cloud_cover"))
        try:
            tasks = []
            for key in band_keys:
                href = None
                for candidate in [key, key.upper(), "nir08" if key == "nir" else None]:
                    if candidate and candidate in selected_item.assets:
                        href = selected_item.assets[candidate].href
                        break
                if not href:
                    raise KeyError(f"Band key '{key}' missing.")

                tasks.append((key, href, bbox_wgs84, target_epsg, target_grid, True))

            results = {}
            active_grid = target_grid

            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(fetch_band_worker, task) for task in tasks]
                for future in futures:
                    key, band_array, grid_meta = future.result()
                    results[key] = band_array
                    if active_grid is None:
                        active_grid = grid_meta

            stacked = np.stack([results[k] for k in band_keys], axis=0)

            print(f"\n💾 Writing raster to: {output_path}")

            save_multiband_geotiff(
                stacked,
                active_grid["transform"],
                target_epsg,
                output_path
            )

            print("✅ Raster successfully written.")
            print("📁 File exists:", output_path.exists())

            return active_grid

        except Exception as err:
            print(f"  ⚠️ Scene read failed: {err}. Trying next best scene...")
            continue

    raise RuntimeError("Failed to fetch clean Sentinel-2 imagery.")


def fetch_and_preprocess(
    baseline_from,
    baseline_to,
    monitoring_from,
    monitoring_to
):
    print("\n==========================================")
    print("   PHASE 2: REAL SATELLITE INGESTION ENGINE")
    print("==========================================\n")

    if not CONFIG_PATH.exists():
        raise FileNotFoundError("Missing config/spatial_anchor.json. Run Phase 1 first.")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        anchor = json.load(f)

    info = anchor["airport_info"]
    ws = anchor["workspace"]

    target_epsg = info["utm_epsg"]
    bbox_wgs84 = anchor["bounding_box_wgs84"]
    region = info.get("region", "US")
    icao = info.get("icao", "UNKNOWN")

    t1_out = ROOT_DIR / ws["t1_raster"]
    t2_out = ROOT_DIR / ws["t2_raster"]

    print(f" Airport : {info.get('airport_name')} [{icao}]")
    print(f" Region  : {region}")
    print(f" Target  : {t1_out.parent}/\n")

    print("==========================================")
    print("Selected Date Ranges")
    print("------------------------------------------")
    print(f"Baseline   : {baseline_from}  -->  {baseline_to}")
    print(f"Monitoring : {monitoring_from}  -->  {monitoring_to}")
    print("==========================================\n")

    t_start = time.time()

    if region == "US":
        print(f"🔄 Ingesting NAIP Baseline Stack for {icao}...")
        t1_grid = fetch_naip_us(
    bbox_wgs84,
    baseline_from,
    baseline_to,
    t1_out,
    target_epsg,
    target_grid=None
)
        print(f"\n🔄 Ingesting NAIP Monitoring Stack for {icao}...")
        _ = fetch_naip_us(
    bbox_wgs84,
    monitoring_from,
    monitoring_to,
    t2_out,
    target_epsg,
    target_grid=t1_grid
)

    else:
        print(f"🔄 Ingesting Sentinel-2 Baseline Stack for {icao}...")
        t1_grid = fetch_sentinel2_india(
    bbox_wgs84,
    baseline_from,
    baseline_to,
    t1_out,
    target_epsg,
    target_grid=None
)

        print(f"\n🔄 Ingesting Sentinel-2 Monitoring Stack for {icao}...")
        _ = fetch_sentinel2_india(
    bbox_wgs84,
    monitoring_from,
    monitoring_to,
    t2_out,
    target_epsg,
    target_grid=t1_grid
)
    elapsed = round(time.time() - t_start, 2)
    print("\n------------------------------------------")
    print(f"✅ Ingestion Complete in {elapsed} seconds!")
    print(f"  • Baseline   : {t1_out}")
    print(f"  • Monitoring : {t2_out}")
    print("------------------------------------------\n")


if __name__ == "__main__":
    print("Run this module through app.py")
    
    