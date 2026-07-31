import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import { FaPlane, FaSatellite, FaRedo, FaMoon, FaSun } from 'react-icons/fa';
import AirportSelector from '../Selectors/AirportSelector';
import RunwaySelector from '../Selectors/RunwaySelector';

interface NavbarProps {
  airports: string[];
  selectedIcao: string;
  onSelectAirport: (icao: string) => void;
  runways: string[];
  selectedRunway: string;
  onSelectRunway: (runway: string) => void;
  onAnalyze: () => void;
  onReset: () => void;
  isAnalyzing: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  airports,
  selectedIcao,
  onSelectAirport,
  runways,
  selectedRunway,
  onSelectRunway,
  onAnalyze,
  onReset,
  isAnalyzing,
  darkMode,
  onToggleDarkMode,
}) => {
  const theme = useTheme();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        backgroundColor: 'rgba(10, 22, 40, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
        
        {/* Title / Logo Area */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box 
            className="pulse-critical" 
            sx={{ 
              backgroundColor: '#1E90FF', 
              borderRadius: '50%', 
              p: 1.2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(30,144,255,0.4)'
            }}
          >
            <FaPlane style={{ color: '#ffffff', fontSize: '1.2rem' }} />
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                letterSpacing: '0.5px', 
                background: 'linear-gradient(90deg, #ffffff 0%, #B0C4DE 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Airport OLS Monitoring System
            </Typography>
            <Typography variant="caption" sx={{ color: '#1E90FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FaSatellite size={10} /> LIVE GIS SAFETY CONTROLLER
            </Typography>
          </Box>
        </Box>

        {/* Dropdowns & Trigger Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          
          <AirportSelector 
            airports={airports}
            selectedIcao={selectedIcao}
            onSelect={onSelectAirport}
            disabled={isAnalyzing}
          />

          <RunwaySelector 
            runways={runways}
            selectedRunway={selectedRunway}
            onSelect={onSelectRunway}
            disabled={isAnalyzing}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={onAnalyze}
            disabled={isAnalyzing || !selectedIcao || !selectedRunway}
            startIcon={isAnalyzing ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              px: 3,
              py: 0.9,
              fontWeight: 700,
              boxShadow: '0 4px 14px 0 rgba(30, 144, 255, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(30, 144, 255, 0.5)',
              }
            }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>

          <Tooltip title="Reset Dashboard">
            <IconButton 
              onClick={onReset} 
              disabled={isAnalyzing}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  color: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              <FaRedo size={14} />
            </IconButton>
          </Tooltip>

          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton 
              onClick={onToggleDarkMode} 
              sx={{ 
                color: '#FFD700',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }
              }}
            >
              {darkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
            </IconButton>
          </Tooltip>

        </Box>
      </Toolbar>
    </AppBar>
  );
};
export default Navbar;
