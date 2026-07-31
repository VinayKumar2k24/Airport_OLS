from datetime import datetime
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# -------------------------------
# Import Project Phases
# -------------------------------
from scripts.phase1_setup_anchor4 import calculate_spatial_anchor
from scripts.phase1_generate_ols2 import generate_ols_surfaces
from scripts.phase2_dual_fetchf import fetch_and_preprocess
from scripts.phase3_unet_change2 import run_siamese_change_detection
from scripts.phase4_spatial_analytics3 import run_spatial_analytics
from scripts.phase5_export_report import generate_encroachment_report

# -------------------------------
# Base Directory
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent

print("BASE_DIR =", BASE_DIR)
print("DATA EXISTS =", (BASE_DIR / "data").exists())
print("PROCESSED EXISTS =", (BASE_DIR / "data" / "processed_VABB").exists())
print("OLS EXISTS =", (BASE_DIR / "data" / "processed_VABB" / "VABB_OLS_surfaces.geojson").exists())
print("Static Folder:", BASE_DIR / "data")

# -------------------------------
# FastAPI App
# -------------------------------
app = FastAPI(title="Airport OLS Monitoring System")

app.mount(
    "/data",
    StaticFiles(directory=str(BASE_DIR / "data")),
    name="data"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Imported function:", calculate_spatial_anchor)
print("Module:", calculate_spatial_anchor.__module__)
print("Arguments:", calculate_spatial_anchor.__code__.co_varnames)

# -------------------------------
# CSV Path
# -------------------------------
ROOT_DIR = Path(__file__).resolve().parent
CSV_PATH = ROOT_DIR / "data" / "airport_runway_data.csv"

# -------------------------------
# Request Models
# -------------------------------
class DateRange(BaseModel):
    from_date: str
    to_date: str


class AnalyzeRequest(BaseModel):
    airport_icao: str
    runway_name: str
    baseline: DateRange
    monitoring: DateRange


# -------------------------------
# Airports API
# -------------------------------
@app.get("/airports")
def get_airports():
    df = pd.read_csv(CSV_PATH)

    airports = (
        df[["ICAO", "Airport_Name"]]
        .drop_duplicates()
        .to_dict(orient="records")
    )

    result = []

    for item in airports:
        icao_val = item.get("ICAO") or item.get("icao")
        name_val = item.get("Airport_Name") or item.get("airport_name")

        result.append(
            {
                "icao": icao_val,
                "airport_name": name_val,
                "ICAO": icao_val,
                "Airport_Name": name_val,
            }
        )

    return result


# -------------------------------
# Runways API
# -------------------------------
@app.get("/airports/{icao}/runways")
@app.get("/runways/{icao}")
def get_runways(icao: str):
    df = pd.read_csv(CSV_PATH)

    runways = (
        df[df["ICAO"].str.upper() == icao.upper()]["Runway"]
        .drop_duplicates()
        .tolist()
    )

    return runways


# -------------------------------
# Analyze API
# -------------------------------
@app.post("/analyze")
def analyze(request: AnalyzeRequest):

    airport_icao = request.airport_icao
    runway_name = request.runway_name

    baseline_from = request.baseline.from_date
    baseline_to = request.baseline.to_date

    monitoring_from = request.monitoring.from_date
    monitoring_to = request.monitoring.to_date

    # -----------------------------
    # Validate Dates
    # -----------------------------
    datetime.fromisoformat(baseline_from)
    datetime.fromisoformat(baseline_to)
    datetime.fromisoformat(monitoring_from)
    datetime.fromisoformat(monitoring_to)

    print("\n==========================================")
    print("Airport      :", airport_icao)
    print("Runway       :", runway_name)
    print("Baseline     :", baseline_from, "->", baseline_to)
    print("Monitoring   :", monitoring_from, "->", monitoring_to)
    print("==========================================\n")

    # ---------------- Phase 1 ----------------
    calculate_spatial_anchor(airport_icao, runway_name)

    # ---------------- Phase 1.5 ----------------
    generate_ols_surfaces()

    # ---------------- Phase 2 ----------------
    fetch_and_preprocess(
        baseline_from,
        baseline_to,
        monitoring_from,
        monitoring_to,
    )

    # ---------------- Phase 3 ----------------
    run_siamese_change_detection()

    # ---------------- Phase 4 ----------------
    run_spatial_analytics()

    # ---------------- Phase 5 ----------------
    generate_encroachment_report()

    print("Analysis Completed Successfully")

    return {
        "status": "success",
        "message": "Airport OLS Analysis Completed Successfully",
        "airport": airport_icao,
        "runway": runway_name,
        "baseline": {
            "from": baseline_from,
            "to": baseline_to,
        },
        "monitoring": {
            "from": monitoring_from,
            "to": monitoring_to,
        },
    }


# -------------------------------
# Map Snapshot Upload API
# -------------------------------
@app.post("/upload-map-snapshot")
async def upload_map_snapshot(
    icao: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Accepts a PNG snapshot of the dashboard map and saves it as
    data/processed_<ICAO>/map_snapshot.png for embedding in the PDF report.
    """
    # Sanitise ICAO — only allow alphanumeric characters
    safe_icao = "".join(c for c in icao.upper() if c.isalnum())
    if not safe_icao:
        return {"success": False, "message": "Invalid ICAO code."}

    processed_dir = BASE_DIR / "data" / f"processed_{safe_icao}"

    if not processed_dir.exists():
        processed_dir.mkdir(parents=True, exist_ok=True)

    snapshot_path = processed_dir / "map_snapshot.png"

    contents = await file.read()
    with open(snapshot_path, "wb") as f:
        f.write(contents)

    print(f"[OK] Map snapshot saved: {snapshot_path} ({len(contents):,} bytes)")

    return {
        "success": True,
        "message": "Map snapshot uploaded successfully.",
        "path": str(snapshot_path),
        "size_bytes": len(contents),
    }