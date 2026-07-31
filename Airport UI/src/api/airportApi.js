import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export const getAirports = async () => {
  const response = await api.get('/airports');
  return response.data;
};

export const getRunways = async (icao) => {
  try {
    const response = await api.get(`/airports/${icao}/runways`);
    return response.data;
  } catch (e) {
    const response = await api.get(`/runways/${icao}`);
    return response.data;
  }
};

export const runAnalysis = async ({ airport_icao, runway_name, baseline, monitoring }) => {
  const payload = {
    airport_icao,
    runway_name,
    baseline: {
      from_date: baseline.from_date,
      to_date: baseline.to_date,
    },
    monitoring: {
      from_date: monitoring.from_date,
      to_date: monitoring.to_date,
    },
  };

  const response = await api.post('/analyze', payload);
  return response.data;
};

const tryFetch = async (paths) => {
  for (const path of paths) {
    try {
      const res = await api.get(path);
      return res.data;
    } catch (e) {
      if (e.response?.status !== 404) throw e;
    }
  }
  throw new Error('File not found in any expected location');
};

export const getOLSSurfaces = (icao) =>
  tryFetch([
    `/data/processed_${icao}/${icao}_OLS_surfaces.geojson`,
    `/processed_${icao}/${icao}_OLS_surfaces.geojson`,
  ]);

export const getEncroachments = (icao) =>
  tryFetch([
    `/data/processed_${icao}/${icao}_encroachment_analytics.geojson`,
    `/processed_${icao}/${icao}_encroachment_analytics.geojson`,
  ]);

// ─── Export helpers ───────────────────────────────────────────────────────────

/**
 * Build the canonical export file paths for a given ICAO.
 */
const getExportPaths = (icao) => ({
  csv:     `/data/processed_${icao}/${icao}_encroachment_summary.csv`,
  // Primary: new PDF report; fallback handled in resolveExportUrl
  report:  `/data/processed_${icao}/${icao}_OLS_Compliance_Report.pdf`,
  geojson: `/data/processed_${icao}/${icao}_encroachment_analytics.geojson`,
});

/**
 * Resolve the first reachable path for a given artifact type.
 * Falls back to alternate path when the primary returns 404.
 * Throws a user-readable error for 404 and other HTTP errors.
 */
const resolveExportUrl = async (icao, type) => {
  const primary = getExportPaths(icao)[type];
  const alt = primary.replace('/data/', '/');

  for (const path of [primary, alt]) {
    try {
      // HEAD request — lightweight existence check
      await api.head(path);
      return `${API_BASE}${path}`;
    } catch (e) {
      if (e.response?.status === 404) {
        // For the report, also try the old .txt fallback path
        if (type === 'report' && path === primary) {
          const txtFallback = `/data/processed_${icao}/${icao}_compliance_report.txt`;
          try {
            await api.head(txtFallback);
            return `${API_BASE}${txtFallback}`;
          } catch (_) { /* not found either, continue */ }
        }
        continue;
      }
      // Any non-404 HTTP error is a real problem
      const detail = e.response?.data?.detail || e.response?.statusText || e.message;
      throw new Error(`Server error (${e.response?.status ?? 'network'}): ${detail}`);
    }
  }

  throw new Error(
    `Export file not found for ${icao} (${type}).\nPlease run an analysis first.`
  );
};

/**
 * Programmatically trigger a browser file download from a URL.
 * Converts to a local Blob URL so the browser forces a download
 * even for cross-origin URLs or plain text files.
 */
const triggerDownload = async (url, filename) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download file (${res.status} ${res.statusText})`);
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
};

/** Download the encroachment summary CSV for the given ICAO. */
export const downloadCSV = async (icao) => {
  const url = await resolveExportUrl(icao, 'csv');
  await triggerDownload(url, `${icao}_encroachment_summary.csv`);
};

/** Download the OLS Compliance Report PDF (or .txt fallback) for the given ICAO. */
export const downloadTXT = async (icao) => {
  const url = await resolveExportUrl(icao, 'report');
  // Use the resolved filename from the URL for the download attribute
  const filename = url.split('/').pop();
  await triggerDownload(url, filename);
};

/** Open the encroachment analytics GeoJSON in a new browser tab. */
export const openGeoJSON = async (icao) => {
  const url = await resolveExportUrl(icao, 'geojson');
  window.open(url, '_blank', 'noopener,noreferrer');
};

/** Download the encroachment analytics GeoJSON file. */
export const downloadGeoJSON = async (icao) => {
  const url = await resolveExportUrl(icao, 'geojson');
  await triggerDownload(url, `${icao}_encroachment_analytics.geojson`);
};


export const computeStats = (encroachmentsGeoJson) => {
  if (!encroachmentsGeoJson?.features?.length) return null;

  const features = encroachmentsGeoJson.features;
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  let maxHeight = 0;
  let totalArea = 0;
  let areaCount = 0;
  let totalStructures = 0;

  features.forEach(f => {
    const props = f.properties || {};

    // Ignore OLS background surfaces if present in encroachment file
    if (props.layer_type === 'ols_surface' && !props.risk_level && !props.risk && !props.severity) {
      return;
    }

    // Read Risk Level supporting all property name variations:
    // risk, risk_level, severity, classification, status, Risk Level, RiskLevel, etc.
    const rawRisk = props.risk_level ?? props.risk ?? props.severity ?? props.classification ?? props.status ?? props['Risk Level'] ?? props['RiskLevel'] ?? props['Risk'] ?? '';
    const sRisk = String(rawRisk).trim().toLowerCase();

    let category = null;
    if (sRisk.includes('critical')) {
      category = 'Critical';
    } else if (sRisk.includes('high')) {
      category = 'High';
    } else if (sRisk.includes('medium') || sRisk.includes('mod')) {
      category = 'Medium';
    } else if (sRisk.includes('low')) {
      category = 'Low';
    } else if (props.polygon_id || props.layer_type === 'encroachment_polygon') {
      // Default to Low for structure features if risk level string is absent
      category = 'Low';
    }

    if (category) {
      counts[category]++;
      totalStructures++;
    }

    // Height violation metrics
    const height = parseFloat(props.height_violation_m ?? props.height_violation ?? props.estimated_height_m ?? props.observed_height ?? props.height ?? 0);
    if (height > maxHeight) maxHeight = height;

    // Footprint area metrics
    const area = parseFloat(props.area_m2 ?? props.footprint_area ?? props.area ?? 0);
    if (area > 0) {
      totalArea += area;
      areaCount++;
    }
  });

  return {
    total: totalStructures || features.length,
    critical: counts.Critical,
    high: counts.High,
    medium: counts.Medium,
    low: counts.Low,
    maxHeight: maxHeight.toFixed(1),
    avgArea: areaCount > 0 ? (totalArea / areaCount).toFixed(0) : '0',
  };
};
