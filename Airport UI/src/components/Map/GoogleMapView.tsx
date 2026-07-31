import React, { useEffect, useMemo, useState, useRef } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Box, Paper, InputBase, IconButton, Tooltip, Typography } from '@mui/material';
import { FaSearch, FaCompressArrowsAlt, FaExpand, FaCompass, FaSpinner } from 'react-icons/fa';
import { AirportMetadata } from '../../types/airport';
import { OLSFeatureCollection, EncroachmentFeatureCollection, EncroachmentProperties } from '../../types/geojson';
import { MapLayerState } from '../../hooks/useMapLayers';
import { 
  getOLSSurfaceColor, 
  RISK_COLORS_RGBA, 
  BUILDING_COLOR_RGBA, 
  RUNWAY_COLOR_RGBA, 
  SELECTED_OUTLINE_RGBA,
  RISK_COLORS_HEX
} from '../../utils/colorUtils';
import MapLayers from './MapLayers';
import BuildingPopup from '../Popup/BuildingPopup';

interface GoogleMapViewProps {
  apiKey: string;
  airportInfo: AirportMetadata | null;
  olsGeoJson: OLSFeatureCollection | null;
  encroachmentsGeoJson: EncroachmentFeatureCollection | null;
  layers: MapLayerState;
  onToggleLayer: (layerKey: keyof MapLayerState) => void;
  isAnalyzing: boolean;
}

// Inner component that can access useMap hook
const MapController: React.FC<{ airportInfo: AirportMetadata | null }> = ({ airportInfo }) => {
  const map = useMap();

  useEffect(() => {
    if (map && airportInfo) {
      map.setCenter({ lat: airportInfo.latitude, lng: airportInfo.longitude });
      map.setZoom(airportInfo.zoom);
    }
  }, [map, airportInfo]);

  return null;
};

// Deck.gl Overlay component
const DeckGLOverlay: React.FC<{
  olsGeoJson: OLSFeatureCollection | null;
  encroachmentsGeoJson: EncroachmentFeatureCollection | null;
  layers: MapLayerState;
  selectedBuildingId: string | null;
  onSelectBuilding: (building: EncroachmentProperties | null) => void;
  hoveredObject: any;
  setHoveredObject: (obj: any) => void;
}> = ({
  olsGeoJson,
  encroachmentsGeoJson,
  layers,
  selectedBuildingId,
  onSelectBuilding,
  setHoveredObject,
}) => {
  const map = useMap();
  const [overlay, setOverlay] = useState<GoogleMapsOverlay | null>(null);

  useEffect(() => {
    if (!map || !(window as any).google || !(window as any).google.maps) return;
    const newOverlay = new GoogleMapsOverlay({});
    newOverlay.setMap(map);
    setOverlay(newOverlay);
    return () => {
      newOverlay.setMap(null);
    };
  }, [map]);

  // Compile deck.gl layers dynamically based on visibility hooks
  const deckLayers = useMemo(() => {
    const list: any[] = [];

    // 1. OLS Surfaces Layer
    if (layers.olsSurface && olsGeoJson) {
      list.push(
        new GeoJsonLayer({
          id: 'ols-surfaces-layer',
          data: olsGeoJson as any,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: false,
          getLineColor: [255, 255, 255, 40],
          getLineWidth: 1,
          lineWidthMinPixels: 1,
          getFillColor: (f: any) => {
            const name = f.properties?.surface_name || '';
            
            // Check individual surface toggle filter
            if (!layers.innerHorizontal && name.toLowerCase().includes('inner horizontal')) return [0, 0, 0, 0];
            if (!layers.conical && name.toLowerCase().includes('conical')) return [0, 0, 0, 0];
            if (!layers.approach && name.toLowerCase().includes('approach')) return [0, 0, 0, 0];
            if (!layers.takeoff && (name.toLowerCase().includes('takeoff') || name.toLowerCase().includes('take-off'))) return [0, 0, 0, 0];
            if (!layers.transitional && name.toLowerCase().includes('transitional')) return [0, 0, 0, 0];

            return getOLSSurfaceColor(name);
          },
          updateTriggers: {
            getFillColor: [
              layers.innerHorizontal,
              layers.conical,
              layers.approach,
              layers.takeoff,
              layers.transitional,
            ],
          },
        })
      );
    }

    // 2. Runway Layer (if represented in GeoJSON as a surface)
    if (layers.runway && olsGeoJson) {
      list.push(
        new GeoJsonLayer({
          id: 'runway-strips-layer',
          data: olsGeoJson as any,
          pickable: false,
          stroked: true,
          filled: true,
          getLineColor: [255, 255, 255, 200],
          getLineWidth: 2,
          lineWidthMinPixels: 1,
          getFillColor: (f: any) => {
            const name = f.properties?.surface_name || '';
            if (name.toLowerCase().includes('runway') || name.toLowerCase().includes('strip')) {
              return RUNWAY_COLOR_RGBA;
            }
            return [0, 0, 0, 0]; // Invisible if not runway
          },
        })
      );
    }

    // 3. Buildings / Encroachments Layer
    if (encroachmentsGeoJson && (layers.buildings || layers.encroachments)) {
      list.push(
        new GeoJsonLayer({
          id: 'encroachments-layer',
          data: encroachmentsGeoJson as any,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: true,
          getElevation: (f: any) => f.properties?.detected_height || 10,
          getLineColor: (f: any) => {
            const id = f.properties?.building_id || '';
            if (id === selectedBuildingId) {
              return SELECTED_OUTLINE_RGBA;
            }
            return [0, 0, 0, 40];
          },
          getLineWidth: (f: any) => {
            const id = f.properties?.building_id || '';
            return id === selectedBuildingId ? 3 : 1;
          },
          lineWidthMinPixels: 1,
          getFillColor: (f: any) => {
            const risk = f.properties?.risk_level || 'Low';
            const isEncroachment = f.properties?.height_difference > 0;

            if (isEncroachment && layers.encroachments) {
              return RISK_COLORS_RGBA(risk, 200);
            }
            if (layers.buildings) {
              return BUILDING_COLOR_RGBA;
            }
            return [0, 0, 0, 0]; // Hidden if neither toggle matches
          },
          onHover: (info: any) => {
            if (info.object) {
              setHoveredObject({
                x: info.x,
                y: info.y,
                properties: info.object.properties,
              });
            } else {
              setHoveredObject(null);
            }
          },
          onClick: (info: any) => {
            if (info.object) {
              onSelectBuilding(info.object.properties);
            } else {
              onSelectBuilding(null);
            }
          },
          updateTriggers: {
            getFillColor: [layers.buildings, layers.encroachments],
            getLineColor: [selectedBuildingId],
            getLineWidth: [selectedBuildingId],
          },
        })
      );
    }

    return list;
  }, [olsGeoJson, encroachmentsGeoJson, layers, selectedBuildingId]);

  useEffect(() => {
    if (!overlay) return;
    overlay.setProps({ layers: deckLayers });
  }, [deckLayers, overlay]);

  return null;
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  apiKey,
  airportInfo,
  olsGeoJson,
  encroachmentsGeoJson,
  layers,
  onToggleLayer,
  isAnalyzing,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<EncroachmentProperties | null>(null);
  const [hoveredObject, setHoveredObject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Center on coordinates or perform quick zoom lookup
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Simple coordinate search: e.g. "19.0896, 72.8656"
    const coords = searchQuery.split(',').map(Number);
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      // Coordinate navigation will be driven if map object can be accessed.
      // But we also support general searching: e.g., checking standard ICAOs
      const icaoMatch = searchQuery.toUpperCase().trim();
      if (airportInfo && icaoMatch === airportInfo.icao) {
        // Just recenter on active airport
        setSearchQuery('');
      }
    }
  };

  const defaultCenter = airportInfo 
    ? { lat: airportInfo.latitude, lng: airportInfo.longitude } 
    : { lat: 20.5937, lng: 78.9629 }; // India default center

  const defaultZoom = airportInfo ? airportInfo.zoom : 5;

  return (
    <Box 
      ref={mapContainerRef}
      sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        backgroundColor: '#030914',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <APIProvider apiKey={apiKey}>
        <Map
          id="ols-map"
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          mapTypeId={layers.satellite ? 'satellite' : 'roadmap'}
          gestureHandling="greedy"
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}
        >
          <MapController airportInfo={airportInfo} />
          
          <DeckGLOverlay 
            olsGeoJson={olsGeoJson}
            encroachmentsGeoJson={encroachmentsGeoJson}
            layers={layers}
            selectedBuildingId={selectedBuilding?.building_id || null}
            onSelectBuilding={setSelectedBuilding}
            hoveredObject={hoveredObject}
            setHoveredObject={setHoveredObject}
          />
        </Map>
      </APIProvider>

      {/* Floating Map Controls */}

      {/* 1. Search Bar */}
      <Paper
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: 280,
          backgroundColor: 'rgba(10, 22, 40, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          zIndex: 10,
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1, color: '#ffffff', fontSize: '0.875rem' }}
          placeholder="Search Airport ICAO or Coords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <IconButton type="submit" sx={{ p: '8px', color: '#1E90FF' }}>
          <FaSearch size={14} />
        </IconButton>
      </Paper>

      {/* 2. Custom Compass and Scale Overlay tools */}
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 20, 
          zIndex: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1 
        }}
      >
        {/* Fullscreen control */}
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <IconButton 
            onClick={handleToggleFullscreen}
            sx={{ 
              backgroundColor: 'rgba(10, 22, 40, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            {isFullscreen ? <FaCompressArrowsAlt size={16} /> : <FaExpand size={16} />}
          </IconButton>
        </Tooltip>

        {/* Compass indicator */}
        <IconButton 
          sx={{ 
            backgroundColor: 'rgba(10, 22, 40, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            borderRadius: 2,
            cursor: 'default'
          }}
        >
          <FaCompass size={16} style={{ color: '#00E676' }} />
        </IconButton>
      </Box>

      {/* 3. Layer toggles */}
      <MapLayers layers={layers} onToggle={onToggleLayer} />

      {/* 4. Building Hover Tooltip */}
      {hoveredObject && (
        <Paper
          sx={{
            position: 'absolute',
            left: hoveredObject.x + 15,
            top: hoveredObject.y + 15,
            p: 1.5,
            pointerEvents: 'none',
            backgroundColor: 'rgba(10, 22, 40, 0.9)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${RISK_COLORS_HEX[hoveredObject.properties.risk_level as keyof typeof RISK_COLORS_HEX] || 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 1.5,
            zIndex: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff' }}>
            Building ID: {hoveredObject.properties.building_id}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
            Zone: {hoveredObject.properties.zone_name}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 700, 
              color: RISK_COLORS_HEX[hoveredObject.properties.risk_level as keyof typeof RISK_COLORS_HEX] 
            }}
          >
            Risk: {hoveredObject.properties.risk_level} ({hoveredObject.properties.height_difference > 0 ? `+${hoveredObject.properties.height_difference.toFixed(1)}m Overlimit` : 'Safe'})
          </Typography>
        </Paper>
      )}

      {/* 5. Building Detail Popup (Clicked details card) */}
      {selectedBuilding && (
        <BuildingPopup 
          building={selectedBuilding} 
          onClose={() => setSelectedBuilding(null)} 
        />
      )}

      {/* 6. Map Loading Spinner */}
      {isAnalyzing && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(3, 9, 20, 0.65)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 15 
          }}
        >
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              backgroundColor: '#0A1628', 
              border: '1px solid rgba(255, 255, 255, 0.1)' 
            }}
          >
            <FaSpinner className="spin" style={{ color: '#1E90FF', fontSize: '1.5rem', animation: 'spin 1.5s linear infinite' }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Rendering OLS surfaces and structural layers...
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Embedded Spin CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};
export default GoogleMapView;
