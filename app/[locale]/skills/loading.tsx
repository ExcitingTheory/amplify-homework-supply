import { Skeleton, Box, Card, CardContent, Grid as Grid } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ mt: '5rem', p: 2, maxWidth: '1200px', mx: 'auto' }}>
      <Skeleton variant="text" width="25%" height={40} sx={{ mb: 3 }} />
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="90%" height={18} />
                <Skeleton variant="text" width="50%" height={18} sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" height={8} sx={{ mt: 2, borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
