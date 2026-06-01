import { Skeleton, Box } from '@mui/material';

/**
 * Instructor grade review loading skeleton.
 * Matches: Fixed AppBar (back + student name + prev/next + override button) + content below.
 */
export default function Loading() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
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
          height: 48,
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 1,
        }}
      >
        {/* Back button */}
        <Skeleton variant="circular" width={36} height={36} />
        {/* Prev button */}
        <Skeleton variant="circular" width={28} height={28} />
        {/* Title: "Grade Review — Student" */}
        <Skeleton variant="text" width={240} height={28} />
        <Box sx={{ flexGrow: 1 }} />
        {/* Next button */}
        <Skeleton variant="circular" width={28} height={28} />
        {/* Override button */}
        <Skeleton variant="rectangular" width={120} height={34} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Content area */}
      <Box sx={{ mt: '5rem', p: 2, maxWidth: '1400px', mx: 'auto' }}>
        {/* Attempt tabs / grade info */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Workbook content with graded blocks */}
        <Skeleton variant="text" width="55%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 3 }} />

        {/* Graded block */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            mb: 3,
          }}
        >
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 0.5 }} />
            <Skeleton variant="text" width={60} height={24} />
          </Box>
        </Box>

        <Skeleton variant="text" width="70%" height={20} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
    </Box>
  );
}
