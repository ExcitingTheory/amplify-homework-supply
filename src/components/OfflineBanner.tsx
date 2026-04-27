import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Snackbar, Alert, Button, Slide } from '@mui/material';
import { WifiOff, CloudSync } from '@mui/icons-material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Persistent offline banner displayed at the top of the app when the user
 * loses network connectivity.  Shows pending sync count when available.
 *
 * Also listens for PROCESS_SYNC_QUEUE messages from the service worker
 * (Background Sync) and triggers queue processing on the main thread.
 */
export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  // Listen for SW messages: sync queue count updates AND Background Sync triggers
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_QUEUE_COUNT') {
        setPendingCount(event.data.count ?? 0);
      }
      if (event.data?.type === 'PROCESS_SYNC_QUEUE') {
        try {
          const { processQueue } = await import('../offline/SyncQueue');
          const result = await processQueue(async (model, operation, payload) => {
            const { generateClient } = await import('aws-amplify/data');
            const client = generateClient() as any;
            if (operation === 'update') {
              await client.models[model].update(payload);
            } else if (operation === 'create') {
              await client.models[model].create(payload);
            } else if (operation === 'delete') {
              await client.models[model].delete(payload);
            }
          });
          setPendingCount(result.remaining);
          // Notify SW that sync is complete
          navigator.serviceWorker?.controller?.postMessage({
            type: 'SYNC_COMPLETE',
            result,
          });
        } catch {
          // Queue processing failed — will retry on next trigger
        }
      }
    };
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  // Track offline → online transitions (skip initial mount)
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Genuinely transitioned from offline → online
      setJustReconnected(true);
      wasOfflineRef.current = false;
      const timer = setTimeout(() => setJustReconnected(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleManualSync = useCallback(async () => {
    try {
      const { processQueue } = await import('../offline/SyncQueue');
      const result = await processQueue(async (model, operation, payload) => {
        const { generateClient } = await import('aws-amplify/data');
        const client = generateClient() as any;
        if (operation === 'update') {
          await client.models[model].update(payload);
        } else if (operation === 'create') {
          await client.models[model].create(payload);
        } else if (operation === 'delete') {
          await client.models[model].delete(payload);
        }
      });
      setPendingCount(result.remaining);
    } catch {
      // Sync failed — will retry
    }
  }, []);

  // Offline banner
  if (!isOnline) {
    return (
      <Snackbar
        open
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert
          severity="warning"
          icon={<WifiOff />}
          action={
            pendingCount > 0 ? (
              <Button color="inherit" size="small" startIcon={<CloudSync />}>
                {pendingCount} pending
              </Button>
            ) : undefined
          }
          sx={{ width: '100%' }}
        >
          You&apos;re offline — your work is saved locally
        </Alert>
      </Snackbar>
    );
  }

  // Brief reconnection banner
  if (justReconnected && pendingCount > 0) {
    return (
      <Snackbar
        open
        autoHideDuration={4000}
        onClose={() => setJustReconnected(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert
          severity="success"
          icon={<CloudSync />}
          action={
            <Button color="inherit" size="small" onClick={handleManualSync}>
              Sync now
            </Button>
          }
          sx={{ width: '100%' }}
        >
          Back online — syncing {pendingCount} pending changes
        </Alert>
      </Snackbar>
    );
  }

  return null;
}
