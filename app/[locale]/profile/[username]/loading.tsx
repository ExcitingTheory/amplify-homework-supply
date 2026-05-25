import { Skeleton, Box, Card, CardContent, Stack } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ mt: '5rem', p: 2, maxWidth: '900px', mx: 'auto' }}>
      {/* Avatar + name */}
      <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Skeleton variant="circular" width={96} height={96} />
        <Skeleton variant="text" width={180} height={32} />
        <Skeleton variant="text" width={120} height={20} />
      </Stack>

      {/* Stats row */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} sx={{ minWidth: 100 }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
              <Skeleton variant="text" width={40} height={28} sx={{ mx: 'auto' }} />
              <Skeleton variant="text" width={60} height={16} sx={{ mx: 'auto' }} />
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Badge shelf */}
      <Skeleton variant="text" width="20%" height={28} sx={{ mb: 1 }} />
      <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="circular" width={48} height={48} />
        ))}
      </Stack>

      {/* Activity calendar */}
      <Skeleton variant="text" width="25%" height={28} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
    </Box>
  );
}
