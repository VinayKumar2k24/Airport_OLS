import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1E90FF', // Sky Blue
      light: '#63B8FF',
      dark: '#00688B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0A1628', // Navy Blue
      contrastText: '#ffffff',
    },
    background: {
      default: '#030914', // Deep Midnight/Navy Blue
      paper: '#0A1628',   // Navy Blue Panel
    },
    text: {
      primary: '#ffffff',
      secondary: '#B0C4DE', // Light Slate/Gray
    },
    error: {
      main: '#FF4D4D', // Red for violations/critical
    },
    warning: {
      main: '#FF9900', // Orange for warnings/high risk
    },
    info: {
      main: '#FFD700', // Yellow for medium risk
    },
    success: {
      main: '#00E676', // Green for safe/low risk
    },
  },
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 22, 40, 0.7)', // Glassmorphism dark navy
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(10, 22, 40, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
        },
      },
    },
  },
});
