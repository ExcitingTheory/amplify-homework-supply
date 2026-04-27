import React, { useState, useEffect, useCallback } from 'react';
import { Chip, CircularProgress, Tooltip } from '@mui/material';
import {
  CloudDone,
  CloudDownload,
  CloudOff,
  ErrorOutline,
} from '@mui/icons-material';

export interface PrefetchBadgeProps {
  unitId: string;
  /** Amplify data client — needed for prefetch */
  client?: any;
  /** Current username — needed for student memory prefetch */
  username?: string;
}

/**
 * Per-assignment badge: "Available offline ✓" / "Download for offline" / "Downloading…"
 */
export default function PrefetchBadge({ unitId, client, username }: PrefetchBadgeProps) {
  const [status, setStatus] = useState<'unknown' | 'none' | 'downloading' | 'complete' | 'error'>('unknown');
  const [progress, setProgress] = useState(0);

  // Check current prefetch status
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { getPrefetchStatus } = await import('../offline/OfflineDataStore');
        const ps = await getPrefetchStatus(unitId);
        if (!mounted) return;
        if (ps?.status === 'complete') {
          setStatus('complete');
        } else if (ps?.status === 'downloading') {
          setStatus('downloading');
          setProgress(ps.progress);
        } else if (ps?.status === 'error') {
          setStatus('error');
        } else {
          setStatus('none');
        }
      } catch {
        if (mounted) setStatus('none');
      }
    })();
    return () => { mounted = false; };
  }, [unitId]);

  const handlePrefetch = useCallback(async () => {
    if (!client || !username) return;
    setStatus('downloading');
    setProgress(0);
    try {
      const { prefetchAssignment } = await import('../offline/prefetchAssignment');
      await prefetchAssignment(client, unitId, username, {
        onProgress: (s) => setProgress(s.progress),
        onComplete: () => setStatus('complete'),
        onError: () => setStatus('error'),
      });
    } catch {
      setStatus('error');
    }
  }, [client, unitId, username]);

  if (status === 'unknown') return null;

  if (status === 'complete') {
    return (
      <Tooltip title="Available offline">
        <Chip
          icon={<CloudDone />}
          label="Offline ready"
          size="small"
          color="success"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (status === 'downloading') {
    return (
      <Tooltip title={`Downloading for offline use... ${progress}%`}>
        <Chip
          icon={<CircularProgress size={14} />}
          label={`${progress}%`}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (status === 'error') {
    return (
      <Tooltip title="Offline download failed — tap to retry">
        <Chip
          icon={<ErrorOutline />}
          label="Retry"
          size="small"
          color="error"
          variant="outlined"
          onClick={handlePrefetch}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
    );
  }

  // status === 'none'
  return (
    <Tooltip title="Download for offline use">
      <Chip
        icon={<CloudDownload />}
        label="Save offline"
        size="small"
        variant="outlined"
        onClick={handlePrefetch}
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  );
}
