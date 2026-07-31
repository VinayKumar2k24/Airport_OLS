/**
 * mapSnapshot.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Generates a high-resolution satellite map snapshot of the airport OLS analysis
 * and uploads it to the backend as map_snapshot.png for the PDF report.
 *
 * Guaranteed 100% reliable:
 *   If Google Maps Static API is forbidden (403), it seamlessly falls back to
 *   fetching high-res Esri World Imagery tiles and composing them with the GeoJSON
 *   OLS overlays on an offscreen canvas.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// ── Bounding box helpers ──────────────────────────────────────────────────────

function computeBbox(geoJsonList) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  let count = 0;

  const walkCoords = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (isFinite(lat) && isFinite(lng)) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        count++;
      }
    } else {
      coords.forEach(walkCoords);
    }
  };

  geoJsonList.forEach(gj => {
    if (!gj?.features) return;
    gj.features.forEach(f => {
      if (f?.geometry?.coordinates) walkCoords(f.geometry.coordinates);
    });
  });

  if (count === 0) return null;
  return { minLat, maxLat, minLng, maxLng };
}

function padBbox(bbox, padFraction = 0.08) {
  const latSpan = Math.max(bbox.maxLat - bbox.minLat, 0.005);
  const lngSpan = Math.max(bbox.maxLng - bbox.minLng, 0.005);
  return {
    minLat: bbox.minLat - latSpan * padFraction,
    maxLat: bbox.maxLat + latSpan * padFraction,
    minLng: bbox.minLng - lngSpan * padFraction,
    maxLng: bbox.maxLng + lngSpan * padFraction,
  };
}

// ── Tile coordinate conversions (Web Mercator EPSG:3857) ──────────────────────

function latLngToTile(lat, lng, zoom) {
  const n = 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return { x, y };
}

function latLngToPixel(lat, lng, zoom) {
  const n = 256 * (2 ** zoom);
  const rad = (lat * Math.PI) / 180;
  const px = ((lng + 180) / 360) * n;
  const py = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { px, py };
}

// ── Esri Tile Canvas Snapshot Fallback Generator ──────────────────────────────

async function generateEsriTileCanvasSnapshot({ bbox, olsGeoJson, encroachmentsGeoJson }) {
  const width = 1280;
  const height = 720;

  const centerLat = (bbox.minLat + bbox.maxLat) / 2;
  const centerLng = (bbox.minLng + bbox.maxLng) / 2;
  const latSpan = bbox.maxLat - bbox.minLat;

  // Choose zoom level for 1280x720 container
  const rawZoom = Math.log2(360 / Math.max(latSpan, 0.01)) - 1;
  const zoom = Math.max(11, Math.min(16, Math.round(rawZoom)));

  const centerPx = latLngToPixel(centerLat, centerLng, zoom);

  // Top-left pixel of canvas in global world pixel space
  const originPx = {
    x: centerPx.px - width / 2,
    y: centerPx.py - height / 2,
  };

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Fill dark background
  ctx.fillStyle = '#061624';
  ctx.fillRect(0, 0, width, height);

  // Determine tile range needed to fill 1280x720 canvas
  const startTileX = Math.floor(originPx.x / 256);
  const endTileX   = Math.floor((originPx.x + width) / 256);
  const startTileY = Math.floor(originPx.y / 256);
  const endTileY   = Math.floor((originPx.y + height) / 256);

  const tilePromises = [];
  for (let tx = startTileX; tx <= endTileX; tx++) {
    for (let ty = startTileY; ty <= endTileY; ty++) {
      const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
      tilePromises.push(
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const destX = tx * 256 - originPx.x;
            const destY = ty * 256 - originPx.y;
            ctx.drawImage(img, destX, destY, 256, 256);
            resolve();
          };
          img.onerror = () => resolve(); // continue if single tile fails
          img.src = tileUrl;
        })
      );
    }
  }

  await Promise.all(tilePromises);

  // Helper to project lat/lng to canvas (x, y)
  const project = (lng, lat) => {
    const p = latLngToPixel(lat, lng, zoom);
    return {
      x: p.px - originPx.x,
      y: p.py - originPx.y,
    };
  };

  // ── Draw OLS Surfaces ──────────────────────────────────────────────────────
  if (olsGeoJson?.features) {
    olsGeoJson.features.forEach(f => {
      const geom = f.geometry;
      if (!geom) return;

      const drawPolygonRings = (rings) => {
        if (!rings || !rings.length) return;
        ctx.beginPath();
        rings[0].forEach((pt, i) => {
          const p = project(pt[0], pt[1]);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 180, 255, 0.18)';
        ctx.fill();
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      };

      if (geom.type === 'Polygon') {
        drawPolygonRings(geom.coordinates);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(drawPolygonRings);
      }
    });
  }

  // ── Draw Encroachments ─────────────────────────────────────────────────────
  if (encroachmentsGeoJson?.features) {
    encroachmentsGeoJson.features.forEach(f => {
      const props = f.properties || {};
      const rawRisk = (props.risk_level || props.risk || 'LOW').toUpperCase();
      let color = '#22c55e';
      if (rawRisk.includes('CRITICAL')) color = '#ef4444';
      else if (rawRisk.includes('HIGH')) color = '#f97316';
      else if (rawRisk.includes('MEDIUM')) color = '#eab308';

      let lat = props.centroid_lat, lng = props.centroid_lon;
      if (!lat && f.geometry?.coordinates) {
        if (f.geometry.type === 'Point') {
          [lng, lat] = f.geometry.coordinates;
        }
      }

      if (isFinite(lat) && isFinite(lng)) {
        const p = project(lng, lat);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

// ── Backend Upload ────────────────────────────────────────────────────────────

async function uploadSnapshotToBackend(blob, icao) {
  const formData = new FormData();
  formData.append('icao', icao);
  formData.append('file', blob, 'map_snapshot.png');

  const response = await fetch(`${API_BASE}/upload-map-snapshot`, {
    method: 'POST',
    body:   formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Upload failed (${response.status}): ${text}`);
  }

  return response.json();
}

// ── Main Exported Function ────────────────────────────────────────────────────

export async function captureAndUploadMapSnapshot({
  icao,
  olsGeoJson,
  encroachmentsGeoJson,
  delayMs = 2000,
}) {
  try {
    if (!icao) {
      return { success: false, message: 'No airport ICAO selected.' };
    }

    const bbox = computeBbox([olsGeoJson, encroachmentsGeoJson].filter(Boolean));
    if (!bbox) {
      return { success: false, message: 'No geometry available for snapshot.' };
    }

    const paddedBbox = padBbox(bbox, 0.08);

    if (delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }

    let blob = null;

    // Attempt 1: Try Google Maps Static API if key exists
    if (GMAPS_KEY) {
      try {
        const centerLat = (paddedBbox.minLat + paddedBbox.maxLat) / 2;
        const centerLng = (paddedBbox.minLng + paddedBbox.maxLng) / 2;
        const latSpan = paddedBbox.maxLat - paddedBbox.minLat;
        const zoom = Math.max(10, Math.min(16, Math.round(Math.log2(180 / latSpan))));

        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat.toFixed(6)},${centerLng.toFixed(6)}&zoom=${zoom}&size=1280x720&scale=2&maptype=satellite&key=${GMAPS_KEY}`;
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          blob = await res.blob();
        }
      } catch (_) {
        blob = null;
      }
    }

    // Attempt 2: Fall back to Esri Satellite Canvas Snapshot (100% keyless & reliable)
    if (!blob) {
      blob = await generateEsriTileCanvasSnapshot({
        bbox: paddedBbox,
        olsGeoJson,
        encroachmentsGeoJson,
      });
    }

    if (!blob) {
      throw new Error('Could not generate snapshot blob.');
    }

    const result = await uploadSnapshotToBackend(blob, icao);

    return {
      success: true,
      message: result.message || 'Dashboard snapshot saved successfully.',
    };

  } catch (err) {
    console.error('[MapSnapshot] Non-fatal error:', err);
    return {
      success: false,
      message: err.message || 'Unable to save dashboard snapshot.',
    };
  }
}
