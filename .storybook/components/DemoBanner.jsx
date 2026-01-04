import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

/**
 * DemoBanner Component
 * 
 * Displays a consistent banner at the top of stories to indicate
 * that AWS services and APIs are mocked.
 * 
 * @param {Object} props
 * @param {'info'|'warning'|'success'} props.severity - Alert severity level
 * @param {string} props.title - Banner title
 * @param {React.ReactNode} props.children - Banner message content
 */
export function DemoBanner({ 
  severity = 'info', 
  title = '📘 Demo Mode',
  children 
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity={severity} variant="filled">
        <AlertTitle>{title}</AlertTitle>
        {children || 'AWS services (DataStore, Auth, Storage) and API endpoints are mocked for demonstration purposes.'}
      </Alert>
    </Box>
  );
}

export default DemoBanner;
