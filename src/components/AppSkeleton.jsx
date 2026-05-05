import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

/**
 * Full-page skeleton used while the app is loading (auth resolving, data fetching, etc.)
 * Mimics the typical page layout: AppBar with nav items + content cards.
 *
 * @param {object} props
 * @param {'page'|'cards'|'detail'|'redirect'} [props.variant='page'] - Layout variant
 */
export default function AppSkeleton({ variant = 'page' }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Skeleton AppBar */}
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          {/* Menu icon */}
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          {/* Title */}
          <Skeleton variant="text" width={160} height={32} sx={{ flexGrow: 1 }} />
          {/* Nav items */}
          <Skeleton variant="circular" width={36} height={36} sx={{ ml: 1 }} />
          <Skeleton variant="circular" width={36} height={36} sx={{ ml: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Content area */}
      <Box sx={{ mt: '80px', p: { xs: 2, sm: 3 }, maxWidth: '80rem', mx: 'auto' }}>
        {variant === 'redirect' && <RedirectSkeleton />}
        {variant === 'cards' && <CardsSkeleton />}
        {variant === 'detail' && <DetailSkeleton />}
        {variant === 'page' && <PageSkeleton />}
      </Box>
    </Box>
  );
}

/** Default page skeleton: title + a few content blocks */
function PageSkeleton() {
  return (
    <>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="70%" height={24} sx={{ mb: 3 }} />
      {[0, 1, 2].map((i) => (
        <Box key={i} sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 1 }} />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      ))}
    </>
  );
}

/** Card list skeleton: grid of card placeholders */
function CardsSkeleton() {
  return (
    <>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <Skeleton variant="rectangular" height={140} />
            <Box sx={{ p: 2 }}>
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}

/** Detail page skeleton: header + rich content blocks */
function DetailSkeleton() {
  return (
    <>
      <Skeleton variant="text" width="50%" height={44} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 3 }} />
      <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1, mb: 3 }} />
      {[0, 1].map((i) => (
        <Box key={i} sx={{ mb: 2 }}>
          <Skeleton variant="text" width="90%" height={20} />
          <Skeleton variant="text" width="75%" height={20} />
          <Skeleton variant="text" width="80%" height={20} />
        </Box>
      ))}
    </>
  );
}

/** Redirect skeleton: centered loading indicator */
function RedirectSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Skeleton variant="circular" width={64} height={64} sx={{ mb: 2 }} />
      <Skeleton variant="text" width={200} height={24} />
    </Box>
  );
}
