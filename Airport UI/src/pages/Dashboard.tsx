import React, { useState } from 'react';
import { Box, Paper, Typography, Link, useTheme } from '@mui/material';
import { FaExclamationTriangle } from 'react-icons/fa';
import Navbar from '../components/Navbar/Navbar';
import LeftSidebar from '../components/Sidebar/LeftSidebar';
import RightSidebar from '../components/Sidebar/RightSidebar';
import GoogleMapView from '../components/Map/GoogleMapView';
import BottomPanel from '../components/Panels/BottomPanel';
import LoadingOverlay from '../components/Common/LoadingOverlay';
import NotificationSnackbar from '../components/Common/NotificationSnackbar';

// Hooks
import { useAirports } from '../hooks/useAirports';
import { useRunways } from '../hooks/useRunways';
import { useAnalysis } from '../hooks/useAnalysis';
import { useMapLayers } from '../hooks/useMapLayers';

export const Dashboard: React.FC = () => {
  const theme = useTheme();

  // Dark mode trigger state (defaults to true)
  const [darkMode, setDarkMode] = useState<boolean>(true);
  
  // Notification snackbar triggers
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 1. Airports List & Selected airport hook
  const {
    airports,
    selectedIcao,
    selectedAirportInfo,
    loading: loadingAirports,
    selectAirport,
  } = useAirports((err) => showNotification(err, 'error'));

  // 2. Runways List hook
  const {
    runways,
    selectedRunway,
    setSelectedRunway,
    loading: loadingRunways,
  } = useRunways(selectedIcao, (err) => showNotification(err, 'error'));

  // 3. Analysis logic orchestrator hook
  const {
    isAnalyzing,
    logs,
    olsGeoJson,
    encroachmentsGeoJson,
    csvData,
    complianceReport,
    summary,
    runOlsAnalysis,
    resetAnalysis,
  } = useAnalysis(
    (successMsg) => showNotification(successMsg, 'success'),
    (errorMsg) => showNotification(errorMsg, 'error')
  );

  // 4. Map layer toggles hook
  const { layers, toggleLayer, resetLayers } = useMapLayers();

  const handleAnalyzeClick = () => {
    runOlsAnalysis(selectedIcao, selectedRunway, selectedAirportInfo);
  };

  const handleResetClick = () => {
    resetAnalysis();
    resetLayers();
  };

  // Google Maps key configuration
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const isKeyPlaceholder = 
    !googleMapsKey || 
    googleMapsKey === 'YOUR_GOOGLE_MAPS_API_KEY' || 
    googleMapsKey.trim() === '';

  return (
    <Box 
      sx={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: darkMode ? '#030914' : '#f5f7fa',
        color: darkMode ? '#ffffff' : '#1a1a1a',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Loading spinners */}
      <LoadingOverlay open={isAnalyzing} message="Orchestrating OLS analysis on backend..." />

      {/* Popups */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleCloseSnackbar}
        onRetry={snackbar.severity === 'error' ? handleAnalyzeClick : undefined}
      />

      {/* Top Navbar */}
      <Navbar
        airports={airports}
        selectedIcao={selectedIcao}
        onSelectAirport={selectAirport}
        runways={runways}
        selectedRunway={selectedRunway}
        onSelectRunway={setSelectedRunway}
        onAnalyze={handleAnalyzeClick}
        onReset={handleResetClick}
        isAnalyzing={isAnalyzing || loadingAirports || loadingRunways}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Panel grid layout */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', width: '100%' }}>
        
        {/* Left Airport Metadata panel */}
        <LeftSidebar 
          airportInfo={selectedAirportInfo} 
          selectedRunway={selectedRunway} 
        />

        {/* Center Panel (Map + Bottom Panel) */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden', 
            height: '100%',
            p: 1.5,
            gap: 1.5,
          }}
        >
          {/* Map Area */}
          <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
            {isKeyPlaceholder ? (
              <Paper 
                sx={{ 
                  position: 'absolute', 
                  top: 20, 
                  left: 20, 
                  right: 20, 
                  p: 3, 
                  backgroundColor: 'rgba(10, 22, 40, 0.9)', 
                  border: `1px solid ${theme.palette.warning.main}`,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <FaExclamationTriangle style={{ color: theme.palette.warning.main, fontSize: '2rem' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    Google Maps API Key Missing
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    Please add your Google Maps API key to the <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>.env</code> file in the root folder as: <br />
                    <code>VITE_GOOGLE_MAPS_API_KEY=your_actual_key</code>
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Need a key? Visit the <Link href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noopener" sx={{ color: '#1E90FF', fontWeight: 600 }}>Google Maps Platform Console</Link>.
                  </Typography>
                </Box>
              </Paper>
            ) : null}

            <GoogleMapView
              apiKey={googleMapsKey}
              airportInfo={selectedAirportInfo}
              olsGeoJson={olsGeoJson}
              encroachmentsGeoJson={encroachmentsGeoJson}
              layers={layers}
              onToggleLayer={toggleLayer}
              isAnalyzing={isAnalyzing}
            />
          </Box>

          {/* Bottom Tabs Panel */}
          <BottomPanel
            airportIcao={selectedIcao}
            olsGeoJson={olsGeoJson}
            encroachmentsGeoJson={encroachmentsGeoJson}
            csvData={csvData}
            complianceReport={complianceReport}
            logs={logs}
          />
        </Box>

        {/* Right Analytics and summary stats panel */}
        <RightSidebar summary={summary} />

      </Box>
    </Box>
  );
};
export default Dashboard;
