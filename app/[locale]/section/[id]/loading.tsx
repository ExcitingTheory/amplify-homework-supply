import { Skeleton, Box } from '@mui/material';

/**
 * Section detail loading skeleton.
 * Matches: Hero card (90vw, maxWidth 80rem) + students table + gradebook.
 */
export default function Loading() {
  return (
    <Box>
      {/* Section hero card */}
      <Box
        sx={{
          width: '90vw',
          maxWidth: '80rem',
          margin: '5rem auto 2rem',
          borderRadius: 2,
          borderLeft: '4px solid',
          borderLeftColor: 'primary.main',
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Featured image area */}
        <Skeleton variant="rectangular" height={200} />
        {/* Card content */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Skeleton variant="text" width="35%" height={32} />
            <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 0.5 }} />
          </Box>
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      </Box>

      {/* Students table */}
      <Box sx={{ width: '90vw', maxWidth: '90vw', margin: '2rem auto' }}>
        <Skeleton variant="text" width={120} height={28} sx={{ mb: 1 }} />
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {/* Table header */}
          <Box sx={{ display: 'flex', gap: 2, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', backgroundColor: 'action.hover' }}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="text" width="20%" height={20} />
          </Box>
          {/* Table rows */}
          {[0, 1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="20%" height={20} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Gradebook area */}
      <Box sx={{ width: '90vw', maxWidth: '90vw', margin: '2rem auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Skeleton variant="text" width={120} height={28} />
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={60} height={28} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );
}
