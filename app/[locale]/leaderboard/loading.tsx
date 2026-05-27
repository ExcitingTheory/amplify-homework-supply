import { Skeleton, Box, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

/**
 * Leaderboard loading skeleton.
 * Matches: Container maxWidth="lg", mt: 3, title + toggle buttons + table rows
 */
export default function Loading() {
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 3, p: 2 }}>
      {/* Header row: title + toggle buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="text" width={260} height={40} />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Skeleton variant="rectangular" width={70} height={34} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={110} height={34} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={80} height={34} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>

      {/* Table rows */}
      <Paper sx={{ overflow: 'hidden' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Rank */}
            <Skeleton variant="text" width={24} height={24} />
            {/* Avatar */}
            <Skeleton variant="circular" width={40} height={40} />
            {/* Name */}
            <Skeleton variant="text" width={`${30 + (i % 3) * 10}%`} height={24} sx={{ flexGrow: 1 }} />
            {/* XP */}
            <Skeleton variant="text" width={60} height={24} />
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
