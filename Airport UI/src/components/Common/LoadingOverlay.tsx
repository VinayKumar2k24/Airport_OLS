import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';
import { FaPlane } from 'react-icons/fa';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  open, 
  message = 'Processing Obstacle Limitation Surface analysis...' 
}) => {
  return (
    <Backdrop
      sx={{ 
        color: '#ffffff', 
        zIndex: (theme) => theme.zIndex.drawer + 999,
        backgroundColor: 'rgba(3, 9, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
      open={open}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress 
          size={80} 
          thickness={3} 
          sx={{ 
            color: '#1E90FF',
            '& .MuiCircularProgress-svg': {
              filter: 'drop-shadow(0px 0px 8px rgba(30,144,255,0.5))'
            }
          }} 
        />
        
        {/* Animated plane inside spinner */}
        <Box 
          sx={{ 
            position: 'absolute', 
            animation: 'float 2s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FaPlane style={{ color: '#ffffff', fontSize: '1.5rem', transform: 'rotate(-45deg)' }} />
        </Box>
      </Box>

      <Box sx={{ textAlign: 'center', px: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '0.5px', color: '#ffffff' }}>
          {message}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1, fontStyle: 'italic' }}>
          Running GIS intersections, height calculations, and compiling charts...
        </Typography>
      </Box>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(-45deg); }
          50% { transform: translateY(-6px) rotate(-45deg); }
          100% { transform: translateY(0px) rotate(-45deg); }
        }
      `}</style>
    </Backdrop>
  );
};
export default LoadingOverlay;
