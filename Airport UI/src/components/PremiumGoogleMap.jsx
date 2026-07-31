import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import {
  FaSatellite, FaSearchPlus, FaSearchMinus,
  FaCrosshairs, FaLayerGroup, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Airport coordinates fallback map
const AIRPORT_COORDS = {
  VABB: { lat: 19.0896, lng: 72.8656, zoom: 14 },
  VIDP: { lat: 28.5665, lng: 77.1031, zoom: 13 },
  VOHS: { lat: 17.2403, lng: 78.4294, zoom: 13 },
  VOBL: { lat: 13.1986, lng: 77.7066, zoom: 14 },
  VECC: { lat: 22.6547, lng: 88.4467, zoom: 14 },
  KJFK: { lat: 40.6413, lng: -73.7781, zoom: 13 },
  KORD: { lat: 41.9742, lng: -87.9073, zoom: 13 },
  KSEA: { lat: 47.4502, lng: -122.3088, zoom: 13 },
  DEFAULT: { lat: 17.2403, lng: 78.4294, zoom: 13 },
};

// OLS Surface Colors matching exact specification (Sky Blue tones, zero green)
export const getOlsSurfaceColor = (surfaceName) => {
  if (!surfaceName) return '#6EC6FF';
  const s = String(surfaceName).toLowerCase();
  if (s.includes('primary') || s.includes('strip') || s.includes('runway')) return '#0080FF';
  if (s.includes('approach')) return '#66B3FF';
  if (s.includes('takeoff') || s.includes('take-off') || s.includes('take_off')) return '#4499FF';
  if (s.includes('transitional')) return '#88CCFF';
  if (s.includes('inner') || s.includes('inner_horizontal') || s.includes('inner horizontal')) return '#6EC6FF';
  if (s.includes('conical')) return '#55AAFF';
  return '#6EC6FF';
};

// Encroachment Risk Level Colors
export const getRiskColor = (risk) => {
  if (!risk) return '#64748b';
  const r = String(risk).toLowerCase();
  if (r.includes('critical')) return '#ef4444'; // Red
  if (r.includes('high')) return '#f97316';     // Orange
  if (r.includes('medium')) return '#eab308';   // Yellow
  if (r.includes('low')) return '#22c55e';      // Green
  return '#64748b';
};

const MapOverlayLayers = ({
  olsGeoJson, encroachmentsGeoJson, layers, selectedIcao, selectedRunway,
  olsOpacity = 0.08, onSelectFeature, onBoundsCalculated
}) => {
  const map = useMap();
  const olsLayerRef = useRef(null);
  const encroachLayerRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Re-center map when airport changes
  useEffect(() => {
    if (!map) return;
    const coords = AIRPORT_COORDS[selectedIcao] || AIRPORT_COORDS.DEFAULT;
    map.panTo({ lat: coords.lat, lng: coords.lng });
    map.setZoom(coords.zoom);
  }, [map, selectedIcao]);

  // Load and style OLS Surfaces Layer
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (olsLayerRef.current) {
      olsLayerRef.current.setMap(null);
      olsLayerRef.current = null;
    }

    if (layers.olsSurfaces && olsGeoJson?.features?.length) {
      const olsLayer = new window.google.maps.Data({ map });
      olsLayer.addGeoJson(olsGeoJson);

      olsLayer.setStyle((feature) => {
        const name = feature.getProperty('zone_name') || feature.getProperty('surface_name') || feature.getProperty('surface') || '';
        const color = getOlsSurfaceColor(name);

        return {
          fillColor: color,
          fillOpacity: Math.min(olsOpacity, 0.15),
          strokeColor: '#0066FF',
          strokeWeight: 2,
          strokeOpacity: 1,
        };
      });

      // Hover / Click listener
      const handleFeatureEvent = (e) => {
        const props = {};
        e.feature.forEachProperty((val, key) => { props[key] = val; });
        props._layerType = 'OLS Surface';
        props.selectedIcao = selectedIcao;
        props.selectedRunway = selectedRunway;

        if (onSelectFeature) onSelectFeature(props, e.latLng);

        if (infoWindowRef.current) infoWindowRef.current.close();
        const contentStr = `
          <div style="background:#0a1929;padding:12px;border-radius:10px;min-width:210px;font-family:Inter,sans-serif;color:#e2e8f0;border:1px solid rgba(0,245,255,0.25);box-shadow:0 10px 25px rgba(0,0,0,0.5)">
            <div style="color:#00f5ff;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">
              ${props.zone_name || props.surface_name || 'OLS Surface'}
            </div>
            <div style="display:grid;grid-template-columns:auto auto;gap:4px 12px;font-size:10px;font-family:monospace">
              <span style="color:#64748b">Airport ICAO:</span><span style="color:#e2e8f0;font-weight:600">${selectedIcao}</span>
              <span style="color:#64748b">Runway:</span><span style="color:#e2e8f0;font-weight:600">${selectedRunway}</span>
              ${props.z_limit_m !== undefined ? `<span style="color:#64748b">Height Limit:</span><span style="color:#00f5ff;font-weight:700">${props.z_limit_m}m</span>` : ''}
              ${props.description ? `<span style="color:#64748b;grid-column:span 2;margin-top:4px">${props.description}</span>` : ''}
            </div>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: contentStr,
          position: e.latLng,
        });
        infoWindow.open(map);
        infoWindowRef.current = infoWindow;
      };

      olsLayer.addListener('click', handleFeatureEvent);
      olsLayer.addListener('mouseover', handleFeatureEvent);

      olsLayerRef.current = olsLayer;
    }

    return () => {
      if (olsLayerRef.current) {
        olsLayerRef.current.setMap(null);
        olsLayerRef.current = null;
      }
    };
  }, [map, olsGeoJson, layers.olsSurfaces, olsOpacity, selectedIcao, selectedRunway]);

  // Load and style Encroachments Layer
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (encroachLayerRef.current) {
      encroachLayerRef.current.setMap(null);
      encroachLayerRef.current = null;
    }

    if (layers.encroachments && encroachmentsGeoJson?.features?.length) {
      const encLayer = new window.google.maps.Data({ map });
      encLayer.addGeoJson(encroachmentsGeoJson);

      encLayer.setStyle((feature) => {
        const rawRisk = feature.getProperty('risk_level') || feature.getProperty('risk') || feature.getProperty('severity') || feature.getProperty('classification') || 'Low';
        const color = getRiskColor(rawRisk);

        return {
          fillColor: color,
          fillOpacity: 0.35,
          strokeColor: color,
          strokeWeight: 2,
          strokeOpacity: 0.95,
          icon: {
            path: window.google.maps?.SymbolPath?.CIRCLE || 0,
            scale: 6,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
          },
        };
      });

      const handleEncroachmentEvent = (e) => {
        const props = {};
        e.feature.forEachProperty((val, key) => { props[key] = val; });
        props._layerType = 'Encroachment';
        props.selectedIcao = selectedIcao;
        props.selectedRunway = selectedRunway;

        if (onSelectFeature) onSelectFeature(props, e.latLng);

        if (infoWindowRef.current) infoWindowRef.current.close();
        const rawRisk = props.risk_level || props.risk || props.severity || props.classification || 'Low';
        const color = getRiskColor(rawRisk);

        const structId = props.polygon_id || props.id || props.structure_id || props.name || 'N/A';
        const surfaceName = props.zone_name || props.surface_name || props.surface || 'N/A';
        const currHeight = props.estimated_height_m ?? props.observed_height ?? props.height ?? '0';
        const allowedHeight = props.z_limit_m ?? props.allowed_height ?? '0';
        const violationHeight = props.height_violation_m ?? props.height_violation ?? '0';
        const violationNum = parseFloat(violationHeight) || 0;
        const complianceStatus = violationNum > 0 ? 'NON-COMPLIANT' : 'COMPLIANT';
        const complianceColor = violationNum > 0 ? '#ef4444' : '#22c55e';

        const contentStr = `
          <div style="background:#0a1929;padding:12px;border-radius:10px;min-width:230px;font-family:Inter,sans-serif;color:#e2e8f0;border:1px solid ${color};box-shadow:0 10px 25px rgba(0,0,0,0.5)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <span style="color:#00f5ff;font-size:11px;font-weight:700;text-transform:uppercase">Structure: ${structId}</span>
              <span style="background:${color}22;color:${color};border:1px solid ${color};font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;text-transform:uppercase">${rawRisk} Risk</span>
            </div>
            <div style="display:grid;grid-template-columns:auto auto;gap:4px 12px;font-size:10px;font-family:monospace">
              <span style="color:#64748b">Surface Zone:</span><span style="color:#e2e8f0;font-weight:600">${surfaceName}</span>
              <span style="color:#64748b">Current Height:</span><span style="color:#e2e8f0;font-weight:600">${currHeight}m</span>
              <span style="color:#64748b">Allowed Height:</span><span style="color:#00f5ff;font-weight:600">${allowedHeight}m</span>
              <span style="color:#64748b">Height Violation:</span><span style="color:${color};font-weight:700">${violationHeight}m</span>
              <span style="color:#64748b">Compliance:</span><span style="color:${complianceColor};font-weight:800">${complianceStatus}</span>
              ${props.area_m2 || props.footprint_area ? `<span style="color:#64748b">Footprint Area:</span><span style="color:#e2e8f0">${props.area_m2 || props.footprint_area} m²</span>` : ''}
            </div>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: contentStr,
          position: e.latLng,
        });
        infoWindow.open(map);
        infoWindowRef.current = infoWindow;
      };

      encLayer.addListener('click', handleEncroachmentEvent);
      encLayer.addListener('mouseover', handleEncroachmentEvent);

      encroachLayerRef.current = encLayer;
    }

    return () => {
      if (encroachLayerRef.current) {
        encroachLayerRef.current.setMap(null);
        encroachLayerRef.current = null;
      }
    };
  }, [map, encroachmentsGeoJson, layers.encroachments, selectedIcao, selectedRunway]);

  // Calculate & Auto-Fit Map Bounds
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const bounds = new window.google.maps.LatLngBounds();
    let pointCount = 0;

    const walkCoords = (coords) => {
      if (!Array.isArray(coords)) return;
      if (typeof coords[0] === 'number') {
        const [lng, lat] = coords;
        if (isFinite(lat) && isFinite(lng)) {
          bounds.extend({ lat, lng });
          pointCount++;
        }
      } else {
        coords.forEach(walkCoords);
      }
    };

    [olsGeoJson, encroachmentsGeoJson].forEach(gj => {
      if (gj?.features) {
        gj.features.forEach(f => {
          if (f?.geometry?.coordinates) walkCoords(f.geometry.coordinates);
        });
      }
    });

    if (pointCount > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      if (onBoundsCalculated) onBoundsCalculated(bounds);
    }
  }, [map, olsGeoJson, encroachmentsGeoJson]);

  // Sync Map Type (Satellite / Hybrid / Terrain / Roadmap)
  useEffect(() => {
    if (!map || !window.google?.maps) return;
    const isSat = layers?.satelliteView ?? true;
    const typeId = isSat
      ? window.google.maps.MapTypeId.HYBRID
      : (layers?.terrainView ? window.google.maps.MapTypeId.TERRAIN : window.google.maps.MapTypeId.ROADMAP);

    map.setMapTypeId(typeId);
  }, [map, layers?.satelliteView, layers?.terrainView]);

  return null;
};

// Floating Legend Component
const MapLegend = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-8 left-3 z-20 glass-card rounded-xl p-3 shadow-glass border border-cyan-500/20 max-w-[210px] text-xs">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1"
      >
        <span className="flex items-center gap-1.5"><FaLayerGroup /> Map Legend</span>
        {collapsed ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {!collapsed && (
        <div className="space-y-2.5 mt-2 pt-2 border-t border-slate-800">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">OLS Surfaces</span>
            <div className="grid grid-cols-1 gap-1 text-[10px]">
              {[
                { name: 'Primary Surface', color: '#0080ff' },
                { name: 'Approach Surface', color: '#66b3ff' },
                { name: 'Take-off Surface', color: '#4499ff' },
                { name: 'Transitional Surface', color: '#88ccff' },
                { name: 'Inner Horizontal', color: '#6ec6ff' },
                { name: 'Conical Surface', color: '#55aaff' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-2 rounded-xs opacity-80 shrink-0" style={{ background: item.color }} />
                  <span className="text-slate-300 text-[10px] truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 block mb-1">Risk Severity</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {[
                { name: 'Critical', color: '#ef4444' },
                { name: 'High', color: '#f97316' },
                { name: 'Medium', color: '#eab308' },
                { name: 'Low', color: '#22c55e' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-slate-300 text-[9px]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Map Floating Controls Overlay
const MapControlsOverlay = ({ onZoomIn, onZoomOut, onRecenter, isSatellite, onToggleSatellite }) => (
  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
    <div className="glass-card rounded-lg p-1 flex flex-col gap-1 border border-cyan-500/20 shadow-glass">
      <button onClick={onZoomIn} title="Zoom In" className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors">
        <FaSearchPlus />
      </button>
      <div className="h-px bg-slate-800" />
      <button onClick={onZoomOut} title="Zoom Out" className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors">
        <FaSearchMinus />
      </button>
      <div className="h-px bg-slate-800" />
      <button onClick={onRecenter} title="Recenter Airport" className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-cyan-400 hover:bg-white/5 transition-colors">
        <FaCrosshairs />
      </button>
    </div>

    <div className="glass-card rounded-lg p-1 border border-cyan-500/20 shadow-glass">
      <button
        onClick={onToggleSatellite}
        title={isSatellite ? "Switch to Map View" : "Switch to Satellite View"}
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
          isSatellite ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:text-cyan-400 hover:bg-white/5'
        }`}
      >
        <FaSatellite />
      </button>
    </div>
  </div>
);

export const PremiumGoogleMap = ({
  selectedIcao, selectedRunway, olsGeoJson, encroachmentsGeoJson, layers,
  olsOpacity = 0.15, onToggleSatellite
}) => {
  const coords = AIRPORT_COORDS[selectedIcao] || AIRPORT_COORDS.DEFAULT;
  const [mapInstance, setMapInstance] = useState(null);

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.setZoom(mapInstance.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.setZoom(mapInstance.getZoom() - 1);
  };

  const handleRecenter = () => {
    if (mapInstance) {
      const c = AIRPORT_COORDS[selectedIcao] || AIRPORT_COORDS.DEFAULT;
      mapInstance.panTo({ lat: c.lat, lng: c.lng });
      mapInstance.setZoom(c.zoom);
    }
  };

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={{ lat: coords.lat, lng: coords.lng }}
          defaultZoom={coords.zoom}
          defaultMapTypeId="hybrid"
          mapTypeId="hybrid"
          gestureHandling="greedy"
          disableDefaultUI={true}
          className="w-full h-full"
        >
          <MapInnerSetter setMapInstance={setMapInstance} />
          <MapOverlayLayers
            olsGeoJson={olsGeoJson}
            encroachmentsGeoJson={encroachmentsGeoJson}
            layers={layers}
            selectedIcao={selectedIcao}
            selectedRunway={selectedRunway}
            olsOpacity={olsOpacity}
          />
        </Map>
      </APIProvider>

      {/* Floating Controls */}
      <MapControlsOverlay
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={handleRecenter}
        isSatellite={layers?.satelliteView}
        onToggleSatellite={onToggleSatellite}
      />

      {/* Floating Legend */}
      <MapLegend />
    </div>
  );
};

const MapInnerSetter = ({ setMapInstance }) => {
  const map = useMap();
  useEffect(() => {
    if (map) setMapInstance(map);
  }, [map, setMapInstance]);
  return null;
};

export default PremiumGoogleMap;
