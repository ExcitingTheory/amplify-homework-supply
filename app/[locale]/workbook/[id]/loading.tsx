import { Skeleton, Box } from '@mui/material';

/**
 * Workbook loading skeleton.
 * Matches: Fixed toolbar at top (back button + title + progress) + scrollable content below.
 * The workbook page renders full-viewport with its own fixed AppBar.
 */
export default function Loading() {
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* Fixed toolbar skeleton */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 1,
        }}
      >
        {/* Back button */}
        <Skeleton variant="circular" width={40} height={40} />
        {/* Unit title */}
        <Skeleton variant="text" width={200} height={28} />
        <Box sx={{ flexGrow: 1 }} />
        {/* Progress indicator */}
        <Skeleton variant="rectangular" width={100} height={8} sx={{ borderRadius: 1 }} />
        {/* Action button */}
        <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Content area */}
      <Box sx={{ pt: '80px', px: 3, maxWidth: '900px', mx: 'auto' }}>
        {/* Heading */}
        <Skeleton variant="text" width="55%" height={36} sx={{ mb: 2 }} />

        {/* Paragraph block */}
        <Skeleton variant="text" width="95%" height={20} />
        <Skeleton variant="text" width="88%" height={20} />
        <Skeleton variant="text" width="76%" height={20} sx={{ mb: 3 }} />

        {/* Interactive block placeholder (quiz/answer) */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            mb: 3,
            backgroundColor: 'action.hover',
          }}
        >
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1, mb: 1 }} />
          <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1, mb: 1 }} />
          <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
        </Box>

        {/* More text */}
        <Skeleton variant="text" width="50%" height={28} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="92%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="70%" height={20} />
      </Box>
    </Box>
  );
}
