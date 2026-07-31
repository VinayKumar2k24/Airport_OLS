# ✈️ Airport OLS Monitoring System

> **An AI-Powered Geospatial Airport Obstacle Limitation Surface (OLS) Monitoring and Compliance System based on ICAO Annex 14 standards.**

![Python](https://img.shields.io/badge/Python-3.10-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Google Maps](https://img.shields.io/badge/Google%20Maps-Satellite-orange)
![Machine Learning](https://img.shields.io/badge/Machine%20Learning-Siamese%20UNet-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

# 📖 Overview

The **Airport OLS Monitoring System** is an intelligent geospatial application designed to automate the monitoring of airport Obstacle Limitation Surfaces (OLS) in accordance with **ICAO Annex 14**.

The system integrates satellite imagery, machine learning, GIS analysis, Google Maps visualization, and automated compliance reporting to identify obstacles that may violate airport safety regulations.

---

# ✨ Key Features

- ICAO Annex 14 OLS Compliance Monitoring
- Multi-Airport Support
- Google Satellite Map Visualization
- Automatic OLS Surface Generation
- Machine Learning Based Change Detection
- GeoJSON Export
- CSV Export
- Automated ICAO Compliance PDF Reports
- Interactive Dashboard
- Encroachment Detection
- Risk Classification
- Spatial Analytics
- Automatic Map Snapshot Integration
- Professional Reporting

---

# 🏗 System Architecture

```
Satellite Imagery
        │
        ▼
Phase 1
Spatial Anchor Generation
        │
        ▼
Phase 2
Satellite Image Acquisition
        │
        ▼
Phase 3
Machine Learning Change Detection
(Siamese U-Net)
        │
        ▼
Phase 4
Spatial Analysis
OLS Compliance Check
        │
        ▼
Phase 5
Professional PDF Report
GeoJSON
CSV Export
Dashboard Visualization
```

---

# ⚙️ Technologies Used

## Backend

- Python
- FastAPI
- Rasterio
- GeoPandas
- Shapely
- NumPy
- Pandas
- OpenCV
- ReportLab
- Uvicorn

---

## Frontend

- React
- Vite
- Google Maps JavaScript API
- Leaflet
- HTML5
- CSS3
- JavaScript

---

## Machine Learning

- PyTorch
- Siamese U-Net
- Remote Sensing Image Processing

---

## GIS & Mapping

- Google Maps
- GeoJSON
- Raster Processing
- Coordinate Transformations
- Spatial Analysis

---

# 📂 Project Structure

```
Airport_OLS/
│
├── Airport UI/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── config/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── models/
│
├── models/
│
├── scripts/
│   ├── Phase 1
│   ├── Phase 2
│   ├── Phase 3
│   ├── Phase 4
│   └── Phase 5
│
├── app.py
├── requirements.txt
├── README.md
└── LICENSE
```

---

# 🚀 Workflow

```
Airport Selection
        │
        ▼
Runway Selection
        │
        ▼
Date Selection
        │
        ▼
Run OLS Analysis
        │
        ▼
Satellite Image Processing
        │
        ▼
Machine Learning Detection
        │
        ▼
OLS Compliance Analysis
        │
        ▼
Interactive Dashboard
        │
        ▼
GeoJSON Export
CSV Export
Professional PDF Report
```

---

# 🌍 Supported Airports

The system supports dynamic airport processing using ICAO codes.

Examples include:

- VOHS
- VOBL
- VABB
- VIDP
- VECC
- KJFK
- KSFO
- KSEA
- KORD

Additional airports can be configured through the airport configuration files.

---

# 📊 Outputs

The system automatically generates:

- GeoJSON Files
- CSV Reports
- ICAO Compliance Reports
- Encroachment Summary
- Dashboard Analytics
- OLS Visualization
- Risk Statistics
- Map Snapshot
- Professional PDF Report

---

# 🧠 Machine Learning Pipeline

The system uses a **Siamese U-Net** model for satellite image change detection.

Pipeline:

1. Image Acquisition
2. Image Registration
3. Feature Extraction
4. Change Detection
5. Segmentation
6. Spatial Validation
7. OLS Compliance Analysis

---

# 📄 ICAO Compliance

The project follows:

- ICAO Annex 14
- OLS Surface Standards
- Obstacle Limitation Surface Guidelines
- Airport Safety Monitoring Practices

---

# 📦 Installation

## Clone Repository

```bash
git clone https://github.com/VinayKumar2k24/Airport_OLS.git

cd Airport_OLS
```

---

## Backend

```bash
python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Run backend

```bash
python app.py
```

---

## Frontend

```bash
cd "Airport UI"

npm install

npm run dev
```

---

# 📈 Future Enhancements

- Real-Time Satellite Monitoring
- Drone-Based Obstacle Detection
- AI Predictive Risk Analysis
- Multi-User Authentication
- Cloud Deployment
- Mobile Application
- Live NOTAM Integration
- Airport Authority Dashboard
- Historical Trend Analysis

---

# 🔒 Security

Sensitive information such as:

- API Keys
- Environment Variables
- Generated Reports
- Virtual Environments

are excluded using `.gitignore`.

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Vinay Kumar**

Bachelor of Engineering (Artificial Intelligence & Machine Learning)

Ballari Institute of Technology and Management

GitHub:
https://github.com/VinayKumar2k24

---

# ⭐ Support

If you found this project useful:

⭐ Star this
