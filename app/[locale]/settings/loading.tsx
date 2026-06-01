import { Skeleton, Box, Card } from '@mui/material';

/**
 * Settings page loading skeleton.
 * Matches: maxWidth 60rem centered, vertical stack of Card sections.
 */
export default function Loading() {
  return (
    <Box sx={{ maxWidth: '60rem', margin: '1rem auto 3rem', padding: '1rem', overflow: 'auto' }}>
      {/* Profile Info card */}
      <Card sx={{ padding: '2rem 1rem', margin: '1rem auto', maxWidth: '60rem' }}>
        <Skeleton variant="text" width={160} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
        </Box>
      </Card>

      {/* Change Password card */}
      <Card sx={{ padding: '2rem 1rem', margin: '1rem auto', maxWidth: '60rem' }}>
        <Skeleton variant="text" width={180} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
      </Card>

      {/* Language card */}
      <Card sx={{ padding: '2rem 1rem', margin: '1rem auto', maxWidth: '60rem' }}>
        <Skeleton variant="text" width={200} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
      </Card>

      {/* Advanced card */}
      <Card sx={{ padding: '2rem 1rem', margin: '1rem auto', maxWidth: '60rem' }}>
        <Skeleton variant="text" width={100} height={36} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
      </Card>
    </Box>
  );
}
