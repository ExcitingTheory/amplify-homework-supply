import { Skeleton, Box } from '@mui/material';

/**
 * Squad detail loading skeleton.
 * Matches: maxWidth 48rem centered, members list + challenges + posts feed.
 */
export default function Loading() {
  return (
    <Box sx={{ padding: '1.5rem', maxWidth: '48rem', margin: '0 auto' }}>
      {/* Squad name + description */}
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={100} height={20} sx={{ mb: 3 }} />

      {/* Members section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={100} height={24} />
        <Skeleton variant="rectangular" width={28} height={20} sx={{ borderRadius: 0.5 }} />
      </Box>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="text" width={`${30 + i * 8}%`} height={20} />
        </Box>
      ))}

      <Skeleton variant="rectangular" height={1} sx={{ my: 3, opacity: 0.3 }} />

      {/* Challenges section */}
      <Skeleton variant="text" width={140} height={24} sx={{ mb: 1.5 }} />
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 3 }}>
        <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
      </Box>

      <Skeleton variant="rectangular" height={1} sx={{ my: 3, opacity: 0.3 }} />

      {/* Posts feed */}
      <Skeleton variant="text" width={100} height={24} sx={{ mb: 1.5 }} />
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="text" width={100} height={18} />
            <Box sx={{ flexGrow: 1 }} />
            <Skeleton variant="text" width={60} height={16} />
          </Box>
          <Skeleton variant="text" width="90%" height={18} />
          <Skeleton variant="text" width="70%" height={18} />
        </Box>
      ))}
    </Box>
  );
}
