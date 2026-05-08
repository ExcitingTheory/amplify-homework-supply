import { Skeleton, Box } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ mt: '5rem', p: 2, maxWidth: '1400px', mx: 'auto' }}>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1, mb: 2 }} />
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="30%" height={24} sx={{ mt: 1 }} />
    </Box>
  );
}
