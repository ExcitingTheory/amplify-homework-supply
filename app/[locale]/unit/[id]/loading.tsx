import { Skeleton, Box } from '@mui/material';

/**
 * Unit editor loading skeleton.
 * Matches: Full viewport flex column — toolbar (48px) + left tab strip + content + right tab strip.
 */
export default function Loading() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Toolbar placeholder */}
      <Box
        sx={{
          height: 48,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Skeleton variant="text" width={200} height={24} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rectangular" width={80} height={28} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Content area: left tabs + main + right tabs */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left tab strip */}
        <Box
          sx={{
            width: 40,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            pt: 2,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={24} height={24} sx={{ borderRadius: 0.5 }} />
          ))}
        </Box>

        {/* Main editor area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: '1rem 2rem' }}>
          <Skeleton variant="text" width="55%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="90%" height={20} />
          <Skeleton variant="text" width="85%" height={20} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 3 }} />
          <Skeleton variant="text" width="50%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="75%" height={20} />
        </Box>

        {/* Right tab strip */}
        <Box
          sx={{
            width: 40,
            borderLeft: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            pt: 2,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" width={24} height={24} sx={{ borderRadius: 0.5 }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
