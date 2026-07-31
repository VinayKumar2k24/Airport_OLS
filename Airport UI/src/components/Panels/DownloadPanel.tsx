import React from 'react';
import { Box, Button, Grid, Typography, Card, CardContent } from '@mui/material';
import { FaFileCode, FaFileCsv, FaFileAlt } from 'react-icons/fa';
import { OLSFeatureCollection, EncroachmentFeatureCollection } from '../../types/geojson';
import { EncroachmentSummaryRow } from '../../types/analysis';

interface DownloadPanelProps {
  airportIcao: string;
  olsGeoJson: OLSFeatureCollection | null;
  encroachmentsGeoJson: EncroachmentFeatureCollection | null;
  csvData: EncroachmentSummaryRow[];
  complianceReport: string;
}

export const DownloadPanel: React.FC<DownloadPanelProps> = ({
  airportIcao,
  olsGeoJson,
  encroachmentsGeoJson,
  csvData,
  complianceReport,
}) => {
  const triggerDownload = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadOLSSurfaces = () => {
    if (!olsGeoJson) return;
    triggerDownload(
      JSON.stringify(olsGeoJson, null, 2),
      `${airportIcao}_OLS_surfaces.geojson`,
      'application/geo+json'
    );
  };

  const downloadEncroachments = () => {
    if (!encroachmentsGeoJson) return;
    triggerDownload(
      JSON.stringify(encroachmentsGeoJson, null, 2),
      `${airportIcao}_encroachment_analytics.geojson`,
      'application/geo+json'
    );
  };

  const downloadCSV = () => {
    if (csvData.length === 0) return;
    // Map objects back to a CSV string
    const headers = 'building_id,zone_name,allowed_height,detected_height,height_difference,risk_level,latitude,longitude,area_sqm\n';
    const rows = csvData
      .map(
        (r) =>
          `"${r.building_id}","${r.zone_name}",${r.allowed_height},${r.detected_height},${r.height_difference},"${r.risk_level}",${r.latitude},${r.longitude},${r.area_sqm || 0}`
      )
      .join('\n');
    
    triggerDownload(headers + rows, `${airportIcao}_encroachment_summary.csv`, 'text/csv');
  };

  const downloadReport = () => {
    if (!complianceReport) return;
    triggerDownload(complianceReport, `${airportIcao}_compliance_report.txt`, 'text/plain');
  };

  const isDataAvailable = !!airportIcao && (!!olsGeoJson || csvData.length > 0 || !!complianceReport);

  if (!isDataAvailable) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
          No static files compiled. Perform OLS analysis to prepare downloads.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#ffffff', letterSpacing: '0.5px' }}>
        EXPORT ANALYSIS ARTIFACTS ({airportIcao})
      </Typography>

      <Grid container spacing={3}>
        {/* GeoJSON Datasets */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaFileCode size={20} style={{ color: '#1E90FF' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Vector GeoJSON Layers
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Includes OLS Surfaces, Runway coordinates, and building obstacle geometry.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={downloadOLSSurfaces}
                  disabled={!olsGeoJson}
                  fullWidth
                >
                  Download OLS GeoJSON
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={downloadEncroachments}
                  disabled={!encroachmentsGeoJson}
                  fullWidth
                >
                  Download Encroachments GeoJSON
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* CSV Summary */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaFileCsv size={20} style={{ color: '#00E676' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Encroachment Summary
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Clean tabular data containing building ids, intersected zones, heights, and risk calculations.
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={downloadCSV}
                disabled={csvData.length === 0}
                sx={{ mt: 'auto', pt: 1 }}
                fullWidth
              >
                Download CSV Dataset
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Text Compliance Report */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaFileAlt size={20} style={{ color: '#FF9900' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Safety Compliance Report
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Professional ASCII-formatted summary report describing runways, OLS parameters, and violations.
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={downloadReport}
                disabled={!complianceReport}
                sx={{ mt: 'auto', pt: 1 }}
                fullWidth
              >
                Download TXT Report
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default DownloadPanel;
