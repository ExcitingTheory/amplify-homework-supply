import { Skeleton, Box } from '@mui/material';

/**
 * Squads page loading skeleton.
 * Matches: maxWidth 48rem centered, title + description + create row + leaderboard.
 */
export default function Loading() {
  return (
    <Box sx={{ padding: '1rem', maxWidth: '48rem', margin: '0 auto 3rem' }}>
      {/* Title + description */}
      <Skeleton variant="text" width={120} height={36} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 3 }} />

      {/* Create row: section selector + button */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 3 }}>
        <Skeleton variant="rectangular" width={280} height={48} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={160} height={40} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Squad leaderboard rows */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 1.5,
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Skeleton variant="text" width={24} height={24} />
          <Skeleton variant="text" width={`${35 + (i % 3) * 8}%`} height={24} sx={{ flexGrow: 1 }} />
          <Skeleton variant="text" width={50} height={20} />
          <Skeleton variant="text" width={40} height={20} />
        </Box>
      ))}
    </Box>
  );
}
