import { Skeleton, Box } from '@mui/material';

/**
 * Skills page loading skeleton.
 * Matches: Full-height container with skill tree visualization (graph/node layout).
 */
export default function Loading() {
  return (
    <Box sx={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Full-height tree area with scattered node placeholders */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          p: 3,
        }}
      >
        {/* Simulated skill tree nodes at various positions */}
        {[
          { top: '10%', left: '45%', size: 64 },
          { top: '30%', left: '25%', size: 56 },
          { top: '30%', left: '65%', size: 56 },
          { top: '50%', left: '15%', size: 48 },
          { top: '50%', left: '45%', size: 48 },
          { top: '50%', left: '75%', size: 48 },
          { top: '70%', left: '30%', size: 44 },
          { top: '70%', left: '60%', size: 44 },
        ].map((node, i) => (
          <Skeleton
            key={i}
            variant="circular"
            width={node.size}
            height={node.size}
            sx={{
              position: 'absolute',
              top: node.top,
              left: node.left,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
