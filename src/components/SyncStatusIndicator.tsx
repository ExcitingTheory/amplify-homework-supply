"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Chip,
  Badge,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  CloudSync,
  CloudDone,
  CloudOff,
  ErrorOutline,
  Refresh,
} from '@mui/icons-material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Shows "X changes pending sync" chip and a dialog to inspect/retry the queue.
 */
export default function SyncStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingOps, setPendingOps] = useState<Array<{
    id?: number;
    model: string;
    operation: string;
    createdAt: number;
    retryCount: number;
    lastError?: string;
  }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load pending count
  const refreshCount = useCallback(async () => {
    try {
      const { getPendingCount, getAllPending } = await import('../offline/SyncQueue');
      const count = await getPendingCount();
      setPendingCount(count);
      if (dialogOpen) {
        const ops = await getAllPending();
        setPendingOps(ops);
      }
    } catch {
      // Module not loaded yet
    }
  }, [dialogOpen]);

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Listen for service worker sync messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        refreshCount();
      }
    };
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, [refreshCount]);

  const handleManualSync = useCallback(async () => {
    setSyncing(true);
    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
      }
      // Wait a moment then refresh
      await new Promise((r) => setTimeout(r, 2000));
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  }, [refreshCount]);

  if (pendingCount === 0) {
    if (!isOnline) {
      return (
        <Tooltip title="Offline — no pending changes">
          <Chip
            icon={<CloudOff />}
            label="Offline"
            size="small"
            variant="outlined"
          />
        </Tooltip>
      );
    }
    return null; // All synced, nothing to show
  }

  return (
    <>
      <Tooltip title={`${pendingCount} changes pending sync`}>
        <Badge badgeContent={pendingCount} color="warning">
          <Chip
            icon={isOnline ? <CloudSync /> : <CloudOff />}
            label={`${pendingCount} pending`}
            size="small"
            variant="outlined"
            color={isOnline ? 'primary' : 'default'}
            onClick={() => setDialogOpen(true)}
            sx={{ cursor: 'pointer' }}
          />
        </Badge>
      </Tooltip>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pending Sync Operations
          <IconButton
            onClick={handleManualSync}
            disabled={!isOnline || syncing}
            sx={{ float: 'right' }}
          >
            {syncing ? <Skeleton variant="circular" width={20} height={20} /> : <Refresh />}
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {pendingOps.length === 0 ? (
            <Typography color="text.secondary">No pending operations</Typography>
          ) : (
            <List dense>
              {pendingOps.map((op) => (
                <ListItem key={op.id ?? op.createdAt}>
                  <ListItemIcon>
                    {op.lastError ? (
                      <ErrorOutline color="error" />
                    ) : (
                      <CloudSync color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${op.operation} ${op.model}`}
                    secondary={
                      <>
                        {new Date(op.createdAt).toLocaleString()}
                        {op.retryCount > 0 && ` · ${op.retryCount} retries`}
                        {op.lastError && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="error"
                            display="block"
                          >
                            {op.lastError}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleManualSync}
            disabled={!isOnline || syncing}
            variant="contained"
            startIcon={syncing ? <Skeleton variant="circular" width={16} height={16} /> : <CloudSync />}
          >
            Sync now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
