import { Skeleton, Box } from '@mui/material';

/**
 * Sections page loading skeleton.
 * Matches: header row (title + switch + button) + vertical card list with left border accent.
 */
export default function Loading() {
  return (
    <Box sx={{ padding: '2rem 1rem' }}>
      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: '2rem',
        }}
      >
        <Skeleton variant="text" width={180} height={40} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rectangular" width={50} height={28} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Section cards */}
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            maxWidth: '80rem',
            margin: '1rem auto',
            borderRadius: 2,
            borderLeft: '4px solid',
            borderLeftColor: 'divider',
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            p: 2,
            gap: 2,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="50%" height={28} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 0.5 }} />
          </Box>
          <Skeleton variant="rectangular" width={120} height={80} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  );
}
