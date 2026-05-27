import { Skeleton, Box, Card } from '@mui/material';

/**
 * XP History page loading skeleton.
 * Matches: maxWidth 60rem centered, summary card + log list card.
 */
export default function Loading() {
  return (
    <Box sx={{ maxWidth: '60rem', margin: '5rem auto 3rem', padding: '1rem' }}>
      {/* Summary card */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Skeleton variant="text" width={140} height={36} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={200} height={20} />
      </Card>

      {/* XP Log card */}
      <Card sx={{ p: 0 }}>
        {Array.from({ length: 8 }).map((_, i) => (
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
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={`${40 + (i % 3) * 10}%`} height={20} />
              <Skeleton variant="text" width={100} height={16} />
            </Box>
            <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 0.5 }} />
          </Box>
        ))}
      </Card>
    </Box>
  );
}
