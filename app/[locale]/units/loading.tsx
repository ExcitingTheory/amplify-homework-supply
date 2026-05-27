import { Skeleton, Box } from '@mui/material';

/**
 * Units page loading skeleton.
 * Matches: header row (title + create button) + grouped vertical card list.
 */
export default function Loading() {
  return (
    <Box sx={{ py: 2 }}>
      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: '2rem',
        }}
      >
        <Skeleton variant="text" width={140} height={40} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Section label */}
      <Box sx={{ width: '80vw', maxWidth: '80rem', margin: '1rem auto' }}>
        <Skeleton variant="text" width={120} height={28} sx={{ mb: 1 }} />
      </Box>

      {/* Unit cards */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            width: '90vw',
            maxWidth: '80rem',
            margin: '1rem auto',
            borderRadius: 2,
            borderLeft: '4px solid',
            borderLeftColor: 'divider',
            border: 1,
            borderColor: 'divider',
            p: 2,
          }}
        >
          <Skeleton variant="text" width="45%" height={28} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="65%" height={20} sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
