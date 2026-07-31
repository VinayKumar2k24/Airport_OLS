import React from 'react';
import { Box, Paper, Typography, Divider, Grid, useTheme } from '@mui/material';
import { FaInfoCircle, FaCompass, FaRuler, FaGlobe, FaMountain } from 'react-icons/fa';
import { AirportMetadata } from '../../types/airport';
import { formatMeter } from '../../utils/formatUtils';

interface LeftSidebarProps {
  airportInfo: AirportMetadata | null;
  selectedRunway: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  airportInfo,
  selectedRunway,
}) => {
  const theme = useTheme();

  // Find detailed runway properties
  const runwayMeta = airportInfo && selectedRunway 
    ? airportInfo.runways[Object.keys(airportInfo.runways).find(
        (k) => k.toLowerCase() === selectedRunway.toLowerCase() || k === selectedRunway
      ) || selectedRunway] 
    : null;

  return (
    <Paper
      elevation={4}
      className="glass-panel"
      sx={{
        width: 340,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2.5,
        overflowY: 'auto',
        flexShrink: 0,
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FaInfoCircle style={{ color: '#1E90FF', fontSize: '1.2rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
          Airport Information
        </Typography>
      </Box>
      <Divider sx={{ mb: 2.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {airportInfo ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* ICAO Code card */}
          <Box 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderLeft: `4px solid ${theme.palette.primary.main}` 
            }}
          >
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
              AIRPORT ICAO
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, letterSpacing: '1px', color: '#ffffff' }}>
              {airportInfo.icao}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, lineHeight: 1.3 }}>
              {airportInfo.name}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Elevation */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FaMountain style={{ color: '#B0C4DE' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    ELEVATION
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatMeter(airportInfo.elevation)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Coordinate System */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FaGlobe style={{ color: '#B0C4DE' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    COORDINATE SYSTEM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                    {airportInfo.crs}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* UTM Zone */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FaCompass style={{ color: '#B0C4DE' }} />
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    UTM ZONE
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {airportInfo.utmZone}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Runway metadata card */}
          {runwayMeta ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaRuler style={{ color: '#1E90FF' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E90FF' }}>
                  ACTIVE RUNWAY: {runwayMeta.name}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <Typography variant="caption" color="textSecondary">
                      WIDTH
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {formatMeter(runwayMeta.width)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <Typography variant="caption" color="textSecondary">
                      LENGTH
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {formatMeter(runwayMeta.length)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ px: 1.5, py: 1, borderRadius: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="textSecondary">
                      APPROACH HEADING
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {runwayMeta.heading}°
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary" align="center" sx={{ fontStyle: 'italic', my: 2 }}>
              No Runway Selected
            </Typography>
          )}

        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ fontStyle: 'italic', px: 2 }}>
            Select an airport from the top navigation bar to initialize OLS dimensions.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
export default LeftSidebar;
