import { Skeleton, Box, Card, Stack } from '@mui/material';

/**
 * Profile page loading skeleton.
 * Matches: 2-column grid (avatar card + activity card), progress card, badges card.
 */
export default function Loading() {
  return (
    <Box sx={{ mt: '1rem', px: 2, pb: 3, maxWidth: '60rem', mx: 'auto' }}>
      {/* Top row: Avatar + Activity side by side */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          mb: 2,
        }}
      >
        {/* Avatar Card (square) */}
        <Card
          sx={{
            padding: '2rem 1rem',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Skeleton variant="circular" width={96} height={96} />
          <Skeleton variant="text" width={180} height={32} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={80} height={20} />
          </Box>
        </Card>

        {/* Activity Calendar Card (square) */}
        <Card
          sx={{
            padding: '2rem 1rem',
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton variant="rectangular" width="90%" height="70%" sx={{ borderRadius: 1 }} />
          </Box>
        </Card>
      </Box>

      {/* Progress Rings Card */}
      <Card sx={{ padding: '2rem 1rem', mb: 2 }}>
        <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="circular" width={64} height={64} />
              <Skeleton variant="text" width={60} height={16} />
            </Box>
          ))}
        </Stack>
      </Card>

      {/* Badges Card */}
      <Card sx={{ padding: '2rem 1rem', mb: 2 }}>
        <Skeleton variant="text" width={80} height={28} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="circular" width={48} height={48} />
          ))}
        </Stack>
      </Card>
    </Box>
  );
}
