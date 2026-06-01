"use cache";

import { cacheLife } from "next/cache";
import { Box, Typography, Container } from '@mui/material';
import { WifiOff } from '@mui/icons-material';
import { RefreshButton } from './RefreshButton';

/**
 * Offline fallback page shown by the service worker when a navigation
 * request fails and no cached page is available.
 * Fully cached — static content that never changes between deployments.
 */
export default async function OfflinePage() {
  cacheLife("max");
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <WifiOff sx={{ fontSize: 64, color: 'text.secondary' }} />
        <Typography variant="h4" component="h1">
          You&apos;re offline
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page isn&apos;t available offline. Your saved work is safe and
          will sync when you reconnect.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try navigating to an assignment you&apos;ve previously opened — those
          are cached for offline use.
        </Typography>
        <RefreshButton />
      </Box>
    </Container>
  );
}
