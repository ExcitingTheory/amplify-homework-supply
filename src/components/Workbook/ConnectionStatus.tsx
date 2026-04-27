/**
 * Connection Status Indicator
 * 
 * Shows the real-time collaboration connection status.
 * Clicking copies a join code that tutors can use to connect.
 */

import React from 'react';
import { Chip, Snackbar, Tooltip } from '@mui/material';
import { Wifi, WifiOff, Sync } from '@mui/icons-material';
import UnitContext from '../../context/unitContext';

/**
 * Derive a short 6-char uppercase join code from a grade ID.
 * Deterministic: same gradeId always produces the same code.
 */
function deriveJoinCode(gradeId: string): string {
  if (!gradeId) return '';
  // Use last 6 alphanumeric chars of the ID, uppercased
  const alphanumeric = gradeId.replace(/[^a-zA-Z0-9]/g, '');
  return alphanumeric.slice(-6).toUpperCase();
}

export interface ConnectionStatusProps {
  /**
   * Size of the status chip
   * @default 'small'
   */
  size?: 'small' | 'medium';
  
  /**
   * Show label text or just icon
   * @default true
   */
  showLabel?: boolean;
}

export function ConnectionStatus({ 
  size = 'small', 
  showLabel = true 
}: ConnectionStatusProps) {
  const { workbook, workbookEnabled, grade } = React.useContext(UnitContext);
  const [snackOpen, setSnackOpen] = React.useState(false);

  const joinCode = React.useMemo(() => deriveJoinCode(grade?.id), [grade?.id]);

  const handleClick = React.useCallback(async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setSnackOpen(true);
    } catch {
      // Fallback for older browsers
      setSnackOpen(true);
    }
  }, [joinCode]);

  // Don't show if feature disabled or no workbook provider
  if (!workbookEnabled || !workbook?.provider) {
    return null;
  }

  const chipSx = {
    '& .MuiChip-icon': { fontSize: size === 'small' ? 16 : 20 },
    minWidth: showLabel ? 'auto' : '32px',
    cursor: 'pointer',
  };

  const tooltipTitle = joinCode 
    ? `Join code: ${joinCode} — click to copy` 
    : '';

  // Offline state
  if (!workbook.isConnected) {
    return (
      <>
        <Tooltip title={tooltipTitle} arrow>
          <Chip
            icon={<WifiOff />}
            label={showLabel ? 'Offline' : undefined}
            variant="outlined"
            size={size}
            onClick={handleClick}
            sx={chipSx}
          />
        </Tooltip>
        <Snackbar
          open={snackOpen}
          autoHideDuration={2000}
          onClose={() => setSnackOpen(false)}
          message={`Join code copied: ${joinCode}`}
        />
      </>
    );
  }

  // Syncing state
  if (!workbook.isSynced) {
    return (
      <>
        <Tooltip title={tooltipTitle} arrow>
          <Chip
            icon={
              <Sync
                sx={{
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            }
            label={showLabel ? 'Syncing...' : undefined}
            variant="outlined"
            size={size}
            onClick={handleClick}
            sx={chipSx}
          />
        </Tooltip>
        <Snackbar
          open={snackOpen}
          autoHideDuration={2000}
          onClose={() => setSnackOpen(false)}
          message={`Join code copied: ${joinCode}`}
        />
      </>
    );
  }

  // Connected and synced
  return (
    <>
      <Tooltip title={tooltipTitle} arrow>
        <Chip
          icon={<Wifi />}
          label={showLabel ? 'Connected' : undefined}
          variant="outlined"
          size={size}
          onClick={handleClick}
          sx={chipSx}
        />
      </Tooltip>
      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message={`Join code copied: ${joinCode}`}
      />
    </>
  );
}

export default ConnectionStatus;
