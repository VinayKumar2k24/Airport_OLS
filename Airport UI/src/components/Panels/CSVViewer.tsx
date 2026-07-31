import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Box, 
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import { EncroachmentSummaryRow } from '../../types/analysis';
import { formatMeter, formatLatLng } from '../../utils/formatUtils';
import { RISK_COLORS_HEX } from '../../utils/colorUtils';

interface CSVViewerProps {
  csvData: EncroachmentSummaryRow[];
}

export const CSVViewer: React.FC<CSVViewerProps> = ({ csvData }) => {
  const theme = useTheme();

  if (csvData.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No CSV data loaded. Run OLS analysis to load encroachment lists.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        height: '100%', 
        backgroundColor: '#02060e', 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: 'none',
        borderRadius: 1,
        overflow: 'auto',
      }}
    >
      <Table stickyHeader size="small" aria-label="encroachments table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: '#02060e', color: '#ffffff', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' }}>Building ID</TableCell>
            <TableCell sx={{ backgroundColor: '#02060e', color: '#ffffff', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' }}>OLS Zone Name</TableCell>
            <TableCell sx={{ backgroundColor: '#02060e', color: '#ffffff', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' }} align="right">Allowed Ht.</TableCell>
            <TableCell sx={{ backgroundColor: '#02060e', color: '#ffffff', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' }} align="right">Detected Ht.</TableCell>
            <TableCell sx={{ backgroundColor: '#02060e', color: '#ffffff', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' }} align="right">Diff.</TableCell>
            <TableCell sx={{ backgroundColor: '#02060e', color: '#ffffff', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' }} align="center">Risk Level</TableCell>
            <TableCell sx={{ backgroundColor: '#02060e', color: '#ffffff', fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' }}>Coordinates</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {csvData.map((row, index) => {
            const isViolation = row.height_difference > 0;
            const riskColor = RISK_COLORS_HEX[row.risk_level] || '#ffffff';
            
            return (
              <TableRow 
                key={`${row.building_id}-${index}`}
                sx={{ 
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
                  '& td': { borderColor: 'rgba(255, 255, 255, 0.05)' }
                }}
              >
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{row.building_id}</TableCell>
                <TableCell sx={{ color: '#B0C4DE' }}>{row.zone_name}</TableCell>
                <TableCell sx={{ color: '#B0C4DE' }} align="right">{formatMeter(row.allowed_height)}</TableCell>
                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }} align="right">{formatMeter(row.detected_height)}</TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 700, 
                    color: isViolation ? riskColor : theme.palette.success.main 
                  }} 
                  align="right"
                >
                  {isViolation ? `+${formatMeter(row.height_difference)}` : formatMeter(row.height_difference)}
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={row.risk_level} 
                    size="small"
                    sx={{ 
                      backgroundColor: `${riskColor}15`, 
                      color: riskColor, 
                      borderColor: `${riskColor}30`, 
                      borderWidth: 1, 
                      borderStyle: 'solid',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 20
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ color: '#B0C4DE', fontSize: '0.8rem' }}>
                  {formatLatLng(row.latitude, row.longitude)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
export default CSVViewer;
