import { Skeleton, Box, Paper } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ mt: '5rem', p: 2, maxWidth: '900px', mx: 'auto' }}>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
      <Paper sx={{ overflow: 'hidden' }}>
        {Array.from({ length: 10 }).map((_, i) => (
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
            <Skeleton variant="text" width={24} height={24} />
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width="40%" height={24} sx={{ flexGrow: 1 }} />
            <Skeleton variant="text" width={60} height={24} />
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
