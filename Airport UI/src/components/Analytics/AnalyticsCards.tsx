import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { 
  FaExclamationTriangle, 
  FaBuilding, 
  FaRulerVertical, 
  FaVectorSquare, 
  FaMountain, 
  FaLocationArrow 
} from 'react-icons/fa';
import { AnalyticsSummary } from '../../types/analysis';
import { formatMeter, formatArea } from '../../utils/formatUtils';
import { RISK_COLORS_HEX } from '../../utils/colorUtils';

interface AnalyticsCardsProps {
  summary: AnalyticsSummary | null;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ summary }) => {

  if (!summary) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ fontStyle: 'italic', px: 2 }}>
          Perform OLS analysis to load violation logs and calculate risks.
        </Typography>
      </Box>
    );
  }

  const riskCards = [
    { title: 'Critical Risks', count: summary.criticalCount, color: RISK_COLORS_HEX.Critical, level: 'Critical' },
    { title: 'High Risks', count: summary.highCount, color: RISK_COLORS_HEX.High, level: 'High' },
    { title: 'Medium Risks', count: summary.mediumCount, color: RISK_COLORS_HEX.Medium, level: 'Medium' },
    { title: 'Low Risks', count: summary.lowCount, color: RISK_COLORS_HEX.Low, level: 'Low' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* 4 Risk Categories */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {riskCards.map((card) => (
          <Grid item xs={6} key={card.title}>
            <Card 
              className="glass-card-hover" 
              sx={{ 
                borderLeft: `4px solid ${card.color}`,
                backgroundColor: 'rgba(10, 22, 40, 0.55)',
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ p: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
                    {card.title.toUpperCase()}
                  </Typography>
                  <FaExclamationTriangle style={{ color: card.color, fontSize: '0.85rem' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#ffffff' }}>
                  {card.count}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 2.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Main Structural Metrics */}
      <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, mb: 1, display: 'block', letterSpacing: '0.5px' }}>
        MONITORED STATISTICS
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Detected Structures */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FaBuilding style={{ color: '#1E90FF' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              Detected Structures
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff' }}>
            {summary.detectedStructuresCount}
          </Typography>
        </Box>

        {/* Max Height */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FaRulerVertical style={{ color: '#FF9900' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              Maximum Height
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff' }}>
            {formatMeter(summary.maxHeight)}
          </Typography>
        </Box>

        {/* Average Structure Area */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FaVectorSquare style={{ color: '#00E676' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              Average Area
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff' }}>
            {formatArea(summary.avgArea)}
          </Typography>
        </Box>

        {/* Airport Elevation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FaMountain style={{ color: '#B0C4DE' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              Airport Elevation
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff' }}>
            {formatMeter(summary.airportElevation)}
          </Typography>
        </Box>

        {/* Runway Length */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FaLocationArrow style={{ color: '#1E90FF', transform: 'rotate(45deg)' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              Runway Length
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#ffffff' }}>
            {formatMeter(summary.runwayLength)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
export default AnalyticsCards;
