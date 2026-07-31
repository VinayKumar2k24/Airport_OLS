# scripts/phase3_change_detection.py
import json
import sys
from pathlib import Path

# Resolve project root
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

import numpy as np
import rasterio
from scipy.ndimage import binary_closing, binary_opening
import torch

from models.siamese_unet import SiameseUNet

CONFIG_PATH = ROOT_DIR / "config" / "spatial_anchor.json"
MODEL_WEIGHTS_PATH = ROOT_DIR / "data" / "models" / "siamese_unet_change.pth"


def run_siamese_change_detection(
    threshold: float = 0.75,
    patch_size: int = 256
):
    print("\n==========================================")
    print("    PHASE 3: SIAMESE U-NET CHANGE INFERENCE ")
    print("==========================================\n")

    if not CONFIG_PATH.exists():
        raise FileNotFoundError(
            "Missing config/spatial_anchor.json. Run phase1 setup scripts first."
        )

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        anchor = json.load(f)

    ws = anchor["workspace"]
    info = anchor.get("airport_info", {})
    icao = info.get("icao", "UNKNOWN")

    processed_dir = ROOT_DIR / ws.get("processed_dir", f"data/processed_{icao}")

    t1_path = ROOT_DIR / ws["t1_raster"]
    t2_path = ROOT_DIR / ws["t2_raster"]
    
    # Use processed_dir directly to create output paths
    prob_path = processed_dir / f"change_prob_{icao.lower()}.tif"
    mask_path = processed_dir / "final_change_mask.tif"

    print(f"  Airport Workspace : {icao}")
    print(f"  Reading T1        : {t1_path}")
    print(f"  Reading T2        : {t2_path}\n")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"⚡ Device initialized: {device}")

    # Initialize Siamese U-Net Model
    model = SiameseUNet(in_channels=4, out_channels=1).to(device)
    
    if MODEL_WEIGHTS_PATH.exists():
        print(f"📦 Loading pretrained weights from {MODEL_WEIGHTS_PATH}")
        model.load_state_dict(
            torch.load(MODEL_WEIGHTS_PATH, map_location=device, weights_only=True)
        )
    else:
        print("⚠️ Pretrained weights file not found. Running inference with randomly initialized weights for structural validation.")

    model.eval()

    # Read Raster Metadata and Predict in Sliding Window Patches
    with rasterio.open(t1_path) as src1, rasterio.open(t2_path) as src2:
        profile = src1.profile.copy()
        height, width = src1.height, src1.width
        
        prob_map = np.zeros((height, width), dtype=np.float32)

        print(f"🔄 Executing sliding-window inference across {width}x{height} grid...")

        with torch.no_grad():
            for y in range(0, height, patch_size):
                for x in range(0, width, patch_size):
                    window = rasterio.windows.Window(x, y, patch_size, patch_size)
                    
                    # Read multi-band patches
                    p1 = src1.read(window=window)
                    p2 = src2.read(window=window)

                    ph, pw = p1.shape[1], p1.shape[2]
                    
                    # Skip empty/zero patches to speed up processing
                    if not p1.any() and not p2.any():
                        continue

                    # Pad window edge boundaries if smaller than patch_size
                    if ph < patch_size or pw < patch_size:
                        p1 = np.pad(p1, ((0, 0), (0, patch_size - ph), (0, patch_size - pw)), mode='edge')
                        p2 = np.pad(p2, ((0, 0), (0, patch_size - ph), (0, patch_size - pw)), mode='edge')

                    # Normalize 8-bit / scaled image patches to [0.0, 1.0]
                    t1_tensor = torch.from_numpy(p1.astype(np.float32) / 255.0).unsqueeze(0).to(device)
                    t2_tensor = torch.from_numpy(p2.astype(np.float32) / 255.0).unsqueeze(0).to(device)

                    # Forward pass
                    out_logits = model(t1_tensor, t2_tensor)
                    
                    # Apply sigmoid if model outputs raw logits
                    prob_patch = torch.sigmoid(out_logits) if out_logits.min() < 0 or out_logits.max() > 1 else out_logits
                    prob_patch = prob_patch.squeeze().cpu().numpy()

                    # Crop padding and insert into global output raster
                    prob_map[y:y+ph, x:x+pw] = prob_patch[:ph, :pw]

    # Save Continuous Change Probability Raster
    profile.update(
        count=1,
        dtype=rasterio.float32,
        nodata=None,
        compress="lzw"
    )
    prob_path.parent.mkdir(parents=True, exist_ok=True)
    
    with rasterio.open(prob_path, "w", **profile) as dst:
        dst.write(prob_map, 1)

    print(f"✅ Change probability raster saved: {prob_path}")

    # Thresholding and Morphological Noise Cleaning
    print(f"🧹 Applying thresholding (> {threshold}) and morphological cleaning...")
    raw_mask = prob_map > threshold
    
    # Clean noise (small false positives and small holes)
    cleaned_mask = binary_opening(raw_mask, structure=np.ones((3, 3)))
    cleaned_mask = binary_closing(cleaned_mask, structure=np.ones((3, 3)))

    # Save Final Binary Mask Raster
    profile.update(
        count=1,
        dtype=rasterio.uint8,
        nodata=0,
        compress="lzw"
    )
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    
    with rasterio.open(mask_path, "w", **profile) as dst:
        dst.write(cleaned_mask.astype(np.uint8), 1)

    print(f"✅ Final change mask raster saved: {mask_path}")
    print("\n✅ Phase 3 Deep Learning Inference Complete!")


if __name__ == "__main__":
    run_siamese_change_detection()