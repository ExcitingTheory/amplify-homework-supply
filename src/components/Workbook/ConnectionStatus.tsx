/**
 * Connection Status Indicator
 * 
 * Shows the real-time collaboration connection status
 */

import React from 'react';
import { Chip } from '@mui/material';
import { Wifi, WifiOff, Sync } from '@mui/icons-material';
import UnitContext from '../../context/unitContext';

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
  const { workbook, workbookEnabled } = React.useContext(UnitContext);

  // Don't show if feature disabled or no workbook provider
  if (!workbookEnabled || !workbook?.provider) {
    return null;
  }

  // Offline state
  if (!workbook.isConnected) {
    return (
      <Chip
        icon={<WifiOff />}
        label={showLabel ? 'Offline - Changes saved locally' : undefined}
        color="warning"
        size={size}
        sx={{ 
          '& .MuiChip-icon': { fontSize: size === 'small' ? 16 : 20 },
          minWidth: showLabel ? 'auto' : '32px',
        }}
      />
    );
  }

  // Syncing state
  if (!workbook.isSynced) {
    return (
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
        color="info"
        size={size}
        sx={{ 
          '& .MuiChip-icon': { fontSize: size === 'small' ? 16 : 20 },
          minWidth: showLabel ? 'auto' : '32px',
        }}
      />
    );
  }

  // Connected and synced
  return (
    <Chip
      icon={<Wifi />}
      label={showLabel ? 'Connected' : undefined}
      color="success"
      size={size}
      sx={{ 
        '& .MuiChip-icon': { fontSize: size === 'small' ? 16 : 20 },
        minWidth: showLabel ? 'auto' : '32px',
      }}
    />
  );
}

export default ConnectionStatus;
