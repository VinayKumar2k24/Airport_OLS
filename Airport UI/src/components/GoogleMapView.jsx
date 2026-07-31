import React, { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

// Helper airport coordinates lookup
const AIRPORT_COORDINATES = {
  VABB: { lat: 19.0896, lng: 72.8656, zoom: 14 },
  VIDP: { lat: 28.5562, lng: 77.1000, zoom: 13 },
  VOBL: { lat: 13.1986, lng: 77.7066, zoom: 13 },
  VECC: { lat: 22.6547, lng: 88.4467, zoom: 13 },
  VOHS: { lat: 17.2405, lng: 78.4294, zoom: 13 },
  KJFK: { lat: 40.6398, lng: -73.7789, zoom: 12 },
  KORD: { lat: 41.9742, lng: -87.9073, zoom: 12 },
};

// Colors for OLS Zones
const OLS_ZONE_COLORS = {
  'Inner Horizontal Surface': '#38bdf8',
  'Conical Surface': '#818cf8',
  'Approach Surface': '#00f5d4',
  'Take-off Climb Surface': '#0284c7',
  'Transitional Surface': '#3b82f6',
  default: '#38bdf8',
};

// Risk colors for encroachments
const RISK_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
  default: '#38bdf8',
};

// Map Recenter Controller
const MapRecenter = ({ selectedIcao }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedIcao) return;
    const config = AIRPORT_COORDINATES[selectedIcao] || AIRPORT_COORDINATES.VABB;
    map.setCenter({ lat: config.lat, lng: config.lng });
    map.setZoom(config.zoom);
  }, [map, selectedIcao]);

  return null;
};

// GeoJSON Renderer overlay inside Google Maps
const GeoJSONRenderer = ({ olsGeoJson, encroachmentsGeoJson, layers }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google || !window.google.maps) return;

    const dataFeatures = [];

    // 1. Load OLS Surfaces
    if (layers.olsSurfaces && olsGeoJson) {
      const olsLayer = new window.google.maps.Data();
      olsLayer.addGeoJson(olsGeoJson);
      olsLayer.setStyle((feature) => {
        const zoneName = feature.getProperty('surface_name') || feature.getProperty('zone_name') || '';
        const color = OLS_ZONE_COLORS[zoneName] || OLS_ZONE_COLORS.default;
        return {
          fillColor: color,
          fillOpacity: 0.25,
          strokeColor: color,
          strokeWeight: 1.5,
        };
      });
      olsLayer.setMap(map);
      dataFeatures.push(olsLayer);
    }

    // 2. Load Encroachments
    if (layers.encroachments && encroachmentsGeoJson) {
      const encroachLayer = new window.google.maps.Data();
      encroachLayer.addGeoJson(encroachmentsGeoJson);
      encroachLayer.setStyle((feature) => {
        const risk = feature.getProperty('risk_level') || 'Low';
        const color = RISK_COLORS[risk] || RISK_COLORS.default;
        return {
          fillColor: color,
          fillOpacity: 0.65,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        };
      });
      encroachLayer.setMap(map);
      dataFeatures.push(encroachLayer);
    }

    return () => {
      dataFeatures.forEach((layer) => layer.setMap(null));
    };
  }, [map, olsGeoJson, encroachmentsGeoJson, layers]);

  return null;
};

export const GoogleMapView = ({ 
  apiKey, 
  selectedIcao, 
  olsGeoJson, 
  encroachmentsGeoJson, 
  layers 
}) => {
  const airportConfig = AIRPORT_COORDINATES[selectedIcao] || AIRPORT_COORDINATES.VABB;

  // Determine Google Maps MapTypeId based on layer control switches
  const mapTypeId = useMemo(() => {
    if (layers.terrainView) return 'terrain';
    if (layers.satelliteView) return 'hybrid';
    return 'satellite';
  }, [layers.satelliteView, layers.terrainView]);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-navy-950 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
      <APIProvider apiKey={apiKey}>
        <Map
          id="ols-google-map"
          defaultCenter={{ lat: airportConfig.lat, lng: airportConfig.lng }}
          defaultZoom={airportConfig.zoom}
          mapTypeId={mapTypeId}
          gestureHandling="greedy"
          disableDefaultUI={!layers.labels}
          style={{ width: '100%', height: '100%' }}
        >
          <MapRecenter selectedIcao={selectedIcao} />
          <GeoJSONRenderer 
            olsGeoJson={olsGeoJson} 
            encroachmentsGeoJson={encroachmentsGeoJson} 
            layers={layers} 
          />
        </Map>
      </APIProvider>

      {/* Legend Badge Overlay */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 rounded-xl border border-slate-700/60 shadow-xl z-10 hidden sm:block">
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Severity Color Legend
        </h5>
        <div className="flex items-center space-x-3 text-xs font-semibold">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            <span className="text-slate-200">Critical</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-200">High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-slate-200">Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-200">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapView;
