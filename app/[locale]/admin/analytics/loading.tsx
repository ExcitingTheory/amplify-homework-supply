import { Skeleton, Box, Card, CardContent, Grid, FormControl } from '@mui/material';

/**
 * Admin Analytics loading skeleton.
 * Matches: Filter row (date range + section select) + grid of stat cards + chart area.
 */
export default function Loading() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Title */}
      <Skeleton variant="text" width={200} height={36} sx={{ mb: 2 }} />

      {/* Filter row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Skeleton variant="rounded" width={140} height={40} />
        <Skeleton variant="rounded" width={200} height={40} />
      </Box>

      {/* Stat cards grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="40%" height={40} />
                <Skeleton variant="text" width="80%" height={14} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart area placeholder */}
      <Card variant="outlined">
        <CardContent>
          <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="100%" height={240} />
        </CardContent>
      </Card>
    </Box>
  );
}
