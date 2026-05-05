import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { WifiOff, Refresh } from '@mui/icons-material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config.js';

/**
 * Offline fallback page shown by the service worker when a navigation
 * request fails and no cached page is available.
 */
export default function OfflinePage() {
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
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </Box>
    </Container>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
    },
  };
}
