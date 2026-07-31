import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  IconButton, 
  Collapse, 
  Box,
  Divider,
  Tooltip
} from '@mui/material';
import { FaLayerGroup, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import { MapLayerState } from '../../hooks/useMapLayers';

interface MapLayersProps {
  layers: MapLayerState;
  onToggle: (layerKey: keyof MapLayerState) => void;
}

export const MapLayers: React.FC<MapLayersProps> = ({ layers, onToggle }) => {
  const [expanded, setExpanded] = useState<boolean>(true);

  const layerItems: { key: keyof MapLayerState; label: string; color: string }[] = [
    { key: 'satellite', label: 'Satellite Base Map', color: '#1E90FF' },
    { key: 'runway', label: 'Runway Strip', color: '#ffffff' },
    { key: 'olsSurface', label: 'OLS Surfaces (All)', color: 'rgba(30, 144, 255, 0.6)' },
    { key: 'innerHorizontal', label: 'Inner Horizontal Surface', color: 'rgba(30, 144, 255, 0.4)' },
    { key: 'conical', label: 'Conical Surface', color: 'rgba(30, 144, 255, 0.5)' },
    { key: 'approach', label: 'Approach Surface', color: 'rgba(30, 144, 255, 0.7)' },
    { key: 'takeoff', label: 'Takeoff Surface', color: 'rgba(30, 144, 255, 0.7)' },
    { key: 'transitional', label: 'Transitional Surface', color: 'rgba(30, 144, 255, 0.8)' },
    { key: 'buildings', label: 'Detected Buildings', color: '#969696' },
    { key: 'encroachments', label: 'Encroachment Violations', color: '#FF4D4D' },
    { key: 'labels', label: 'Map Labels', color: '#B0C4DE' },
  ];

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 250,
        zIndex: 10,
        backgroundColor: 'rgba(10, 22, 40, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header bar */}
      <Box 
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          p: 1.5, 
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaLayerGroup style={{ color: '#1E90FF' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
            Map Layers
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: '#ffffff' }}>
          {expanded ? <FaAngleUp size={14} /> : <FaAngleDown size={14} />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
        <Box sx={{ p: 1.5, maxHeight: 350, overflowY: 'auto' }}>
          <FormGroup>
            {layerItems.map((item) => (
              <Box 
                key={item.key} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  py: 0.25 
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={layers[item.key]}
                      onChange={() => onToggle(item.key)}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        '&.Mui-checked': {
                          color: '#1E90FF',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                      {item.label}
                    </Typography>
                  }
                  sx={{ mr: 0, flexGrow: 1 }}
                />
                
                {/* Visual Legend Indicator */}
                <Tooltip title={item.label}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: item.color,
                      border: item.color.includes('rgba') ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                      flexShrink: 0,
                      ml: 1,
                    }}
                  />
                </Tooltip>
              </Box>
            ))}
          </FormGroup>
        </Box>
      </Collapse>
    </Paper>
  );
};
export default MapLayers;
