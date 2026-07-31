import React, { useState } from 'react';
import { Paper, Tabs, Tab, Box, Typography } from '@mui/material';
import { FaFileAlt, FaFileCsv, FaTerminal, FaDownload } from 'react-icons/fa';
import ReportViewer from './ReportViewer';
import CSVViewer from './CSVViewer';
import DownloadPanel from './DownloadPanel';
import { EncroachmentSummaryRow, SystemLog } from '../../types/analysis';
import { OLSFeatureCollection, EncroachmentFeatureCollection } from '../../types/geojson';

interface BottomPanelProps {
  airportIcao: string;
  olsGeoJson: OLSFeatureCollection | null;
  encroachmentsGeoJson: EncroachmentFeatureCollection | null;
  csvData: EncroachmentSummaryRow[];
  complianceReport: string;
  logs: SystemLog[];
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  airportIcao,
  olsGeoJson,
  encroachmentsGeoJson,
  csvData,
  complianceReport,
  logs,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Paper
      elevation={4}
      className="glass-panel"
      sx={{
        width: '100%',
        height: 280,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Tabs list */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.08)', px: 1, backgroundColor: 'rgba(3, 9, 20, 0.4)' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          aria-label="ols monitoring dashboard tabs"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              py: 1,
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.6)',
              '&.Mui-selected': {
                color: '#1E90FF',
              },
            },
          }}
        >
          <Tab icon={<FaFileAlt style={{ marginRight: 6 }} />} iconPosition="start" label="Compliance Report" />
          <Tab icon={<FaFileCsv style={{ marginRight: 6 }} />} iconPosition="start" label="CSV Summary" />
          <Tab 
            icon={<FaTerminal style={{ marginRight: 6 }} />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                System Logs
                {logs.length > 0 && (
                  <Box 
                    sx={{ 
                      ml: 1, 
                      px: 0.8, 
                      py: 0.2, 
                      borderRadius: '10px', 
                      fontSize: '0.65rem', 
                      backgroundColor: 'rgba(30, 144, 255, 0.2)',
                      color: '#1E90FF',
                      fontWeight: 700
                    }}
                  >
                    {logs.length}
                  </Box>
                )}
              </Box>
            } 
          />
          <Tab icon={<FaDownload style={{ marginRight: 6 }} />} iconPosition="start" label="Downloads" />
        </Tabs>
      </Box>

      {/* Tab panel container */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 1.5 }}>
        
        {/* Compliance Report */}
        {activeTab === 0 && (
          <ReportViewer reportContent={complianceReport} />
        )}

        {/* CSV Summary */}
        {activeTab === 1 && (
          <CSVViewer csvData={csvData} />
        )}

        {/* System Logs */}
        {activeTab === 2 && (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: '#02060e', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 1,
              p: 2, 
              overflow: 'auto' 
            }}
          >
            {logs.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', my: 2 }}>
                No active processes. Click "Analyze" to inspect logs.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {logs.map((log, index) => {
                  let color = '#B0C4DE';
                  if (log.level === 'success') color = '#00E676';
                  if (log.level === 'warning') color = '#FF9900';
                  if (log.level === 'error') color = '#FF4D4D';

                  return (
                    <Typography 
                      key={index} 
                      className="mono-text" 
                      sx={{ 
                        fontSize: '0.8rem', 
                        lineHeight: 1.4,
                        color,
                      }}
                    >
                      [{log.timestamp}] {log.message}
                    </Typography>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* Downloads */}
        {activeTab === 3 && (
          <DownloadPanel 
            airportIcao={airportIcao}
            olsGeoJson={olsGeoJson}
            encroachmentsGeoJson={encroachmentsGeoJson}
            csvData={csvData}
            complianceReport={complianceReport}
          />
        )}

      </Box>
    </Paper>
  );
};
export default BottomPanel;
