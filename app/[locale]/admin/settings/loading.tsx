import { Skeleton, Box, Card, CardContent, Tabs, Tab } from '@mui/material';

/**
 * Admin Settings (Gamification) loading skeleton.
 * Matches: Title + section selector + tab bar + panel content.
 */
export default function Loading() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Title */}
      <Skeleton variant="text" width={240} height={36} sx={{ mb: 2 }} />

      {/* Section selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Skeleton variant="rounded" width={240} height={40} />
        <Skeleton variant="rounded" width={140} height={36} />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['Skill Tree', 'Campaigns', 'Challenges', 'Squads', 'Events'].map((tab) => (
            <Skeleton key={tab} variant="rounded" width={90} height={36} />
          ))}
        </Box>
      </Box>

      {/* Panel content — grid of cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} variant="outlined">
            <CardContent>
              <Skeleton variant="text" width="70%" height={24} />
              <Skeleton variant="text" width="90%" height={16} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="50%" height={16} />
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 8 }} />
                <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 8 }} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
