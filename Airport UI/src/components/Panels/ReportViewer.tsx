import React from 'react';
import { Box, Typography } from '@mui/material';

interface ReportViewerProps {
  reportContent: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ reportContent }) => {
  if (!reportContent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No compliance report loaded. Run OLS analysis to compile report.
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#02060e',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 1,
        p: 2.5,
        overflow: 'auto',
      }}
    >
      <pre 
        className="mono-text"
        style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-all', 
          margin: 0, 
          color: '#B0C4DE', 
          lineHeight: 1.6,
          fontSize: '0.85rem'
        }}
      >
        {reportContent}
      </pre>
    </Box>
  );
};
export default ReportViewer;
