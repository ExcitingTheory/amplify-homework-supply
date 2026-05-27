import { Skeleton, Box } from '@mui/material';

/**
 * Peer Review loading skeleton.
 * Matches: Top bar + split pane (60% workbook left, 40% chat right).
 */
export default function Loading() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Skeleton variant="text" width={160} height={28} />
        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 0.5 }} />
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 0.5 }} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rectangular" width={100} height={34} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Split pane */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Workbook content */}
        <Box sx={{ flex: '1 1 60%', borderRight: '1px solid', borderColor: 'divider', p: 2, overflow: 'auto' }}>
          <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="90%" height={20} />
          <Skeleton variant="text" width="85%" height={20} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 3 }} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="65%" height={20} />
        </Box>

        {/* Right: Chat panel */}
        <Box sx={{ flex: '0 0 40%', maxWidth: 480, minWidth: 320, display: 'flex', flexDirection: 'column', p: 2 }}>
          <Skeleton variant="text" width={80} height={24} sx={{ mb: 2 }} />
          {/* Chat messages */}
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}>
              {i % 2 === 0 && <Skeleton variant="circular" width={28} height={28} />}
              <Skeleton
                variant="rectangular"
                width={`${50 + (i % 2) * 20}%`}
                height={40 + (i % 3) * 12}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          ))}
          <Box sx={{ flexGrow: 1 }} />
          {/* Input area */}
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Box>
  );
}
