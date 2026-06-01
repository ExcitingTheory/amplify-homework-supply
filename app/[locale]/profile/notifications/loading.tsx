import { Skeleton, Box, Paper, Container } from '@mui/material';

/**
 * Notifications page loading skeleton.
 * Matches: Container maxWidth="md" + Paper with notification list items.
 */
export default function Loading() {
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Skeleton variant="text" width={160} height={36} sx={{ mb: 2 }} />
      <Paper sx={{ overflow: 'hidden' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Skeleton variant="circular" width={36} height={36} sx={{ flexShrink: 0 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={`${50 + (i % 3) * 15}%`} height={20} />
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width={80} height={14} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton variant="circular" width={8} height={8} sx={{ mt: 1 }} />
          </Box>
        ))}
      </Paper>
    </Container>
  );
}
