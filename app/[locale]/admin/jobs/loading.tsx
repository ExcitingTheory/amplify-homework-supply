import { Skeleton, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

/**
 * Admin Jobs loading skeleton.
 * Matches: Title + filter row (type + status selects + refresh button) + jobs table.
 */
export default function Loading() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Title */}
      <Skeleton variant="text" width={180} height={36} sx={{ mb: 2 }} />

      {/* Filter row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <Skeleton variant="rounded" width={160} height={40} />
        <Skeleton variant="rounded" width={160} height={40} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="circular" width={40} height={40} />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              {['Type', 'Status', 'Created', 'Duration', 'Details', 'Actions'].map((col) => (
                <TableCell key={col}>
                  <Skeleton variant="text" width={60} height={20} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton variant="rounded" width={100} height={24} /></TableCell>
                <TableCell><Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 8 }} /></TableCell>
                <TableCell><Skeleton variant="text" width={70} /></TableCell>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                <TableCell><Skeleton variant="text" width={140} /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
