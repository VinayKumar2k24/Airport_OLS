# scripts/train_siamese_unet.py
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

import numpy as np
import rasterio
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from models.siamese_unet import SiameseUNet

TRAIN_DIR = ROOT_DIR / "data" / "train"
VAL_DIR = ROOT_DIR / "data" / "val"
MODEL_SAVE_PATH = ROOT_DIR / "data" / "models" / "siamese_unet_change.pth"


class ChangeDetectionDataset(Dataset):
    """
    Dataset loader that computes a synthetic Pseudo-NIR channel 
    (Luminance Proxy: 0.299R + 0.587G + 0.114B) for 3-channel RGB images.
    """
    def __init__(self, data_dir):
        self.t1_dir = data_dir / "t1"
        self.t2_dir = data_dir / "t2"
        self.mask_dir = data_dir / "masks"

        self.filenames = [f.name for f in self.t1_dir.glob("*.tif")]
        if not self.filenames:
            self.filenames = [f.name for f in self.t1_dir.glob("*.png")]

        if not self.filenames:
            raise FileNotFoundError(f"No training patches found in {self.t1_dir}.")

    def __len__(self):
        return len(self.filenames)

    def _synthesize_nir(self, rgb_array):
        """Synthesizes pseudo-NIR using ITU-R BT.601 luminance weights."""
        r, g, b = rgb_array[0], rgb_array[1], rgb_array[2]
        nir = 0.299 * r + 0.587 * g + 0.114 * b
        return np.expand_dims(nir, axis=0)

    def __getitem__(self, idx):
        filename = self.filenames[idx]

        with rasterio.open(self.t1_dir / filename) as src:
            t1_img = src.read().astype(np.float32) / 255.0

        with rasterio.open(self.t2_dir / filename) as src:
            t2_img = src.read().astype(np.float32) / 255.0

        with rasterio.open(self.mask_dir / filename) as src:
            mask_img = src.read(1).astype(np.float32)
            if mask_img.max() > 1.0:
                mask_img = mask_img / 255.0
            mask_img = (mask_img > 0.5).astype(np.float32)
            mask_img = np.expand_dims(mask_img, axis=0)

        # Handle 3-channel RGB to 4-channel RGB-NIR synthesis
        if t1_img.shape[0] == 3:
            t1_nir = self._synthesize_nir(t1_img)
            t2_nir = self._synthesize_nir(t2_img)
            t1_img = np.concatenate([t1_img, t1_nir], axis=0)
            t2_img = np.concatenate([t2_img, t2_nir], axis=0)

        return torch.from_numpy(t1_img), torch.from_numpy(t2_img), torch.from_numpy(mask_img)


class HybridLoss(nn.Module):
    def __init__(self, bce_weight=0.5, dice_weight=0.5):
        super(HybridLoss, self).__init__()
        self.bce = nn.BCELoss()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight

    def forward(self, preds, targets):
        bce_loss = self.bce(preds, targets)
        smooth = 1e-6
        intersection = (preds * targets).sum(dim=(2, 3))
        union = preds.sum(dim=(2, 3)) + targets.sum(dim=(2, 3))
        dice_loss = 1.0 - ((2.0 * intersection + smooth) / (union + smooth)).mean()
        return (self.bce_weight * bce_loss) + (self.dice_weight * dice_loss)


def calculate_iou(preds, targets, threshold=0.5):
    """Computes Intersection over Union (IoU) for binary change evaluation."""
    preds_bin = (preds > threshold).float()
    intersection = (preds_bin * targets).sum(dim=(2, 3))
    union = preds_bin.sum(dim=(2, 3)) + targets.sum(dim=(2, 3)) - intersection
    iou = (intersection + 1e-6) / (union + 1e-6)
    return iou.mean().item()


def train_model(epochs=100, batch_size=8, lr=0.0005, patience=10):
    print("\n==========================================")
    print("   TRAINING SIAMESE U-NET WITH VALIDATION ")
    print("==========================================\n")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"⚡ Device initialized: {device}")

    train_dataset = ChangeDetectionDataset(TRAIN_DIR)
    val_dataset = ChangeDetectionDataset(VAL_DIR)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    model = SiameseUNet(in_channels=4, out_channels=1).to(device)
    criterion = HybridLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    best_val_iou = 0.0
    patience_counter = 0

    print(f"🏋️ Train samples: {len(train_dataset)} | Val samples: {len(val_dataset)}")

    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        train_loss = 0.0
        for t1, t2, masks in train_loader:
            t1, t2, masks = t1.to(device), t2.to(device), masks.to(device)
            optimizer.zero_grad()
            preds = model(t1, t2)
            loss = criterion(preds, masks)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * t1.size(0)

        epoch_train_loss = train_loss / len(train_dataset)

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_iou = 0.0
        with torch.no_grad():
            for t1, t2, masks in val_loader:
                t1, t2, masks = t1.to(device), t2.to(device), masks.to(device)
                preds = model(t1, t2)
                loss = criterion(preds, masks)
                val_loss += loss.item() * t1.size(0)
                val_iou += calculate_iou(preds, masks) * t1.size(0)

        epoch_val_loss = val_loss / len(val_dataset)
        epoch_val_iou = val_iou / len(val_dataset)

        print(f"Epoch [{epoch:03d}/{epochs:03d}] - "
              f"Train Loss: {epoch_train_loss:.4f} | "
              f"Val Loss: {epoch_val_loss:.4f} | "
              f"Val IoU: {epoch_val_iou:.4f}")

        # Best Model Checkpointing & Early Stopping
        if epoch_val_iou > best_val_iou:
            best_val_iou = epoch_val_iou
            patience_counter = 0
            MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
            # FIX: Correct torch.save call
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"  ⭐ Best Model Saved! New Peak Val IoU: {best_val_iou:.4f}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\n✋ Early stopping triggered after {epoch} epochs (No Val IoU improvement for {patience} consecutive epochs).")
                break

    print("\n------------------------------------------")
    print(f"✅ Training Complete. Best Val IoU: {best_val_iou:.4f}")
    print(f"📦 Model Checkpoint: {MODEL_SAVE_PATH}")
    print("------------------------------------------\n")


if __name__ == "__main__":
    train_model(epochs=20, batch_size=8, lr=0.0005, patience=5)