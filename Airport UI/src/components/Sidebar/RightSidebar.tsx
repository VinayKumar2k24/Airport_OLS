import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import { FaChartBar } from 'react-icons/fa';
import { AnalyticsSummary } from '../../types/analysis';
import AnalyticsCards from '../Analytics/AnalyticsCards';

interface RightSidebarProps {
  summary: AnalyticsSummary | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ summary }) => {
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
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FaChartBar style={{ color: '#1E90FF', fontSize: '1.2rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
          Analysis Summary
        </Typography>
      </Box>
      <Divider sx={{ mb: 2.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <AnalyticsCards summary={summary} />
    </Paper>
  );
};
export default RightSidebar;
