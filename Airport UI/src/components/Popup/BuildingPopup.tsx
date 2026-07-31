import React from 'react';
import { Paper, Box, Typography, IconButton, Grid, Divider } from '@mui/material';
import { IoClose } from 'react-icons/io5';
import { FaBuilding, FaMapMarkerAlt, FaRulerCombined, FaExclamationTriangle } from 'react-icons/fa';
import { EncroachmentProperties } from '../../types/geojson';
import { formatMeter, formatLatLng } from '../../utils/formatUtils';
import { RISK_COLORS_HEX } from '../../utils/colorUtils';

interface BuildingPopupProps {
  building: EncroachmentProperties;
  onClose: () => void;
}

export const BuildingPopup: React.FC<BuildingPopupProps> = ({ building, onClose }) => {
  const riskColor = RISK_COLORS_HEX[building.risk_level] || '#ffffff';

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 320,
        zIndex: 11,
        backgroundColor: 'rgba(10, 22, 40, 0.9)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${riskColor}`,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 15px ${riskColor}30`,
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          px: 2, 
          py: 1.5, 
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaBuilding style={{ color: riskColor }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff' }}>
            Building ID: {building.building_id}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#ffffff' } }}>
          <IoClose size={16} />
        </IconButton>
      </Box>

      {/* Body details */}
      <Box sx={{ p: 2 }}>
        <Box 
          sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 0.8, 
            px: 1.2, 
            py: 0.5, 
            borderRadius: 1, 
            backgroundColor: `${riskColor}15`, 
            border: `1px solid ${riskColor}30`,
            mb: 2 
          }}
        >
          <FaExclamationTriangle style={{ color: riskColor, fontSize: '0.75rem' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: riskColor, letterSpacing: '0.5px' }}>
            {building.risk_level.toUpperCase()} RISK LEVEL
          </Typography>
        </Box>

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {/* Zone Name */}
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              OLS ZONE INTERSECTION
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {building.zone_name}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          </Grid>

          {/* Allowed Height */}
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaRulerCombined size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  ALLOWED
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatMeter(building.allowed_height)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Detected Height */}
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaRulerCombined size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  DETECTED
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatMeter(building.detected_height)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Height Difference */}
          <Grid item xs={12}>
            <Box sx={{ p: 1, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                HEIGHT DIFFERENCE
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 700, 
                  color: building.height_difference > 0 ? riskColor : '#00E676' 
                }}
              >
                {building.height_difference > 0 
                  ? `+${formatMeter(building.height_difference)} (Violation)` 
                  : `${formatMeter(building.height_difference)} (Clear)`
                }
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          </Grid>

          {/* Lat, Lng */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaMapMarkerAlt size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  COORDINATES
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatLatLng(building.latitude, building.longitude)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Embedded slideUp CSS animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </Paper>
  );
};
export default BuildingPopup;
