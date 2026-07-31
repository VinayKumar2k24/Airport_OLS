# models/siamese_unet.py
import torch
import torch.nn as nn
import torch.nn.functional as F


class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super(DoubleConv, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.conv(x)


class SiameseUNet(nn.Module):
    """
    Siamese U-Net Architecture for Multi-Temporal Change Detection.
    Takes co-registered T1 and T2 4-band patches (RGB-NIR) and predicts
    change probability map.
    """
    def __init__(self, in_channels=4, out_channels=1):
        super(SiameseUNet, self).__init__()
        
        # Shared Encoder (Weight-Sharing)
        self.inc = DoubleConv(in_channels, 32)
        self.down1 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(32, 64))
        self.down2 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(64, 128))
        self.down3 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(128, 256))

        # Bottleneck Feature Difference Fusion
        self.bottleneck = DoubleConv(256 * 2, 256)

        # Decoder Path
        self.up1 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.conv_up1 = DoubleConv(256, 128)

        self.up2 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.conv_up2 = DoubleConv(128, 64)

        self.up3 = nn.ConvTranspose2d(64, 32, kernel_size=2, stride=2)
        self.conv_up3 = DoubleConv(64, 32)

        self.outc = nn.Conv2d(32, out_channels, kernel_size=1)

    def forward_one(self, x):
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        return x1, x2, x3, x4

    def forward(self, t1, t2):
        # Extract features through shared encoder
        t1_x1, t1_x2, t1_x3, t1_x4 = self.forward_one(t1)
        t2_x1, t2_x2, t2_x3, t2_x4 = self.forward_one(t2)

        # Feature concatenation / difference fusion at bottleneck
        diff_x4 = torch.cat([t1_x4, t2_x4], dim=1)
        b = self.bottleneck(diff_x4)

        # Decoding with skip connections
        x = self.up1(b)
        x = torch.cat([x, torch.abs(t1_x3 - t2_x3)], dim=1)
        x = self.conv_up1(x)

        x = self.up2(x)
        x = torch.cat([x, torch.abs(t1_x2 - t2_x2)], dim=1)
        x = self.conv_up2(x)

        x = self.up3(x)
        x = torch.cat([x, torch.abs(t1_x1 - t2_x1)], dim=1)
        x = self.conv_up3(x)

        logits = self.outc(x)
        return torch.sigmoid(logits)