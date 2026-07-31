import React from 'react';
import { Snackbar, Alert, Button } from '@mui/material';

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
  onRetry?: () => void; // Optional retry handler for errors
}

export const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  onRetry,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={severity === 'error' ? 8000 : 5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          fontWeight: 600,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          '& .MuiAlert-message': {
            flexGrow: 1,
          },
        }}
        action={
          onRetry && severity === 'error' ? (
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                onRetry();
                onClose();
              }}
              sx={{ fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)', ml: 1 }}
            >
              Retry
            </Button>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
export default NotificationSnackbar;
