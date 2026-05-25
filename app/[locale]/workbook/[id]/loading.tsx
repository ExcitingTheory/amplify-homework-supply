import { Skeleton, Box } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', mt: '5rem', p: 2 }}>
      {/* Toolbar area */}
      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />

      {/* Content blocks */}
      <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="90%" height={20} />
      <Skeleton variant="text" width="85%" height={20} />
      <Skeleton variant="text" width="75%" height={20} sx={{ mb: 3 }} />

      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1, mb: 3 }} />

      <Skeleton variant="text" width="50%" height={28} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="95%" height={20} />
      <Skeleton variant="text" width="80%" height={20} />
      <Skeleton variant="text" width="70%" height={20} />
    </Box>
  );
}
