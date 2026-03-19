import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

/**
 * PermissionErrorOverlay - A modal overlay displayed when a user tries to access
 * content they don't have permission to view.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the overlay is visible
 * @param {string} props.resourceType - Type of resource (e.g., 'unit', 'section')
 * @param {string} props.message - Custom error message (optional)
 * @param {Function} props.onClose - Callback when overlay is closed (optional)
 */
export default function PermissionErrorOverlay({ 
  open = false, 
  resourceType = 'unit',
  message,
  onClose 
}) {
  const { t } = useTranslation('components');
  const router = useRouter();

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    }
    // Navigate back or to home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleGoHome = () => {
    if (onClose) {
      onClose();
    }
    router.push('/');
  };

  const defaultMessage = t('permissionError.defaultMessage', {
    resourceType: t(`permissionError.resourceTypes.${resourceType}`, resourceType),
    defaultValue: `You don't have permission to access this ${resourceType}.`
  });

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
      // Prevent closing by clicking outside or pressing ESC
      disableEscapeKeyDown
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        handleGoBack();
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <LockIcon
            sx={{
              fontSize: 40,
              color: 'error.main',
            }}
          />
          <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
            {t('permissionError.title', 'Access Denied')}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          {message || defaultMessage}
        </Alert>
        
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {t('permissionError.explanation', 
            'This content is restricted. You need to be the owner or have instructor permissions to access it.'
          )}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('permissionError.contactInfo',
            'If you believe this is an error, please contact your instructor or administrator.'
          )}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleGoBack}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          {t('permissionError.goBack', 'Go Back')}
        </Button>
        <Button
          onClick={handleGoHome}
          variant="contained"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          {t('permissionError.goHome', 'Go to Home')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
