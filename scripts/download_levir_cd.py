# scripts/download_levir_cd.py
import sys
import random
import shutil
from pathlib import Path

# Resolve project root
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from tqdm import tqdm

DATA_DIR = ROOT_DIR / "data"
TRAIN_DIR = DATA_DIR / "train"
VAL_DIR = DATA_DIR / "val"


def setup_val_directories():
    """Creates subdirectories for validation set."""
    (VAL_DIR / "t1").mkdir(parents=True, exist_ok=True)
    (VAL_DIR / "t2").mkdir(parents=True, exist_ok=True)
    (VAL_DIR / "masks").mkdir(parents=True, exist_ok=True)


def create_val_split_from_train(val_ratio=0.15):
    """
    Splits a portion of local training patches into the validation set.
    """
    setup_val_directories()

    t1_train = TRAIN_DIR / "t1"
    t2_train = TRAIN_DIR / "t2"
    masks_train = TRAIN_DIR / "masks"

    t1_val = VAL_DIR / "t1"
    t2_val = VAL_DIR / "t2"
    masks_val = VAL_DIR / "masks"

    # Check existing val patches
    existing_val = list(t1_val.glob("*.tif"))
    if len(existing_val) > 0:
        print(f"✅ Validation split already exists! Found {len(existing_val)} val patches.")
        return

    train_patches = list(t1_train.glob("*.tif"))
    if not train_patches:
        raise FileNotFoundError(f"No training patches found in {t1_train}.")

    # Group patches by base image ID so entire 1024x1024 scenes stay together
    # Filename format: train_0001_p00.tif -> base_id = train_0001
    scene_groups = {}
    for p in train_patches:
        base_id = p.stem.rsplit("_p", 1)[0]
        if base_id not in scene_groups:
            scene_groups[base_id] = []
        scene_groups[base_id].append(p.name)

    scene_ids = sorted(list(scene_groups.keys()))
    random.seed(42)  # Fixed seed for reproducible split
    random.shuffle(scene_ids)

    num_val_scenes = int(len(scene_ids) * val_ratio)
    val_scene_ids = set(scene_ids[:num_val_scenes])

    print(f"\n📦 Splitting {num_val_scenes} base scenes (~{val_ratio*100:.0f}%) into 'data/val/'...")

    moved_count = 0
    for scene_id in tqdm(val_scene_ids, desc="Moving Validation Patches"):
        patch_names = scene_groups[scene_id]
        for p_name in patch_names:
            # Move t1, t2, mask from train to val
            if (t1_train / p_name).exists():
                shutil.move(str(t1_train / p_name), str(t1_val / p_name))
            if (t2_train / p_name).exists():
                shutil.move(str(t2_train / p_name), str(t2_val / p_name))
            if (masks_train / p_name).exists():
                shutil.move(str(masks_train / p_name), str(masks_val / p_name))
            moved_count += 1

    print("\n------------------------------------------")
    print("✅ LEVIR-CD Training & Validation Sets Finalized!")
    print(f"  • Train Patches (T1/T2/Masks) : {len(list(t1_train.glob('*.tif')))}")
    print(f"  • Val Patches   (T1/T2/Masks) : {len(list(t1_val.glob('*.tif')))}")
    print("------------------------------------------\n")


if __name__ == "__main__":
    print("\n==========================================")
    print("   LEVIR-CD VALIDATION SPLIT CREATOR      ")
    print("==========================================\n")

    create_val_split_from_train(val_ratio=0.15)