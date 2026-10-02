import React, { useState, useEffect, useCallback } from "react";
import { Chip, IconButton, Skeleton, Tooltip } from "@mui/material";
import {
  CloudDone,
  CloudDownload,
  CloudOff,
  ErrorOutline,
} from "@mui/icons-material";

export interface PrefetchBadgeProps {
  unitId: string;
  /** Show status as an icon with a tooltip instead of a labeled chip. */
  iconOnly?: boolean;
  /** Amplify data client — needed for prefetch */
  client?: any;
  /** Current username — needed for student memory prefetch */
  username?: string;
  /** Optional section context to cache for offline navigation */
  section?: {
    id: string;
    name: string;
    description?: string;
    code?: string;
    owner?: string;
    instructor?: string;
    featuredImage?: string;
    identityId?: string;
    status?: string;
  };
  /** Optional assignment context to cache for offline navigation */
  assignment?: {
    id: string;
    unitID: string;
    sectionID: string;
    unitName?: string;
    dueDate?: string;
    status?: string;
    featuredImage?: string;
    identityId?: string;
  };
}

/**
 * Per-assignment badge: "Available offline ✓" / "Download for offline" / "Downloading…"
 */
export default function PrefetchBadge({
  unitId,
  client,
  username,
  section,
  assignment,
  iconOnly = false,
}: PrefetchBadgeProps) {
  const [status, setStatus] = useState<
    "unknown" | "none" | "downloading" | "complete" | "error"
  >("unknown");
  const [progress, setProgress] = useState(0);

  // Check current prefetch status
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { getPrefetchStatus } =
          await import("../offline/OfflineDataStore");
        const ps = await getPrefetchStatus(unitId);
        if (!mounted) return;
        if (ps?.status === "complete") {
          setStatus("complete");
        } else if (ps?.status === "downloading") {
          setStatus("downloading");
          setProgress(ps.progress);
        } else if (ps?.status === "error") {
          setStatus("error");
        } else {
          setStatus("none");
        }
      } catch {
        if (mounted) setStatus("none");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [unitId]);

  const handlePrefetch = useCallback(async () => {
    if (!client || !username) return;
    setStatus("downloading");
    setProgress(0);
    try {
      const { prefetchAssignment } =
        await import("../offline/prefetchAssignment");
      await prefetchAssignment(
        client,
        unitId,
        username,
        {
          onProgress: (s) => setProgress(s.progress),
          onComplete: () => setStatus("complete"),
          onError: () => setStatus("error"),
        },
        { section, assignment },
      );
    } catch {
      setStatus("error");
    }
  }, [client, unitId, username, section, assignment]);

  if (status === "unknown") return null;

  if (iconOnly) {
    if (status === "complete") {
      return (
        <Tooltip title="Available offline" arrow>
          <span aria-label="Available offline" role="img">
            <CloudDone color="success" fontSize="small" />
          </span>
        </Tooltip>
      );
    }

    if (status === "downloading") {
      return (
        <Tooltip title={`Downloading for offline use... ${progress}%`} arrow>
          <span
            aria-label={`Downloading for offline use: ${progress}%`}
            role="status"
          >
            <Skeleton variant="circular" width={18} height={18} />
          </span>
        </Tooltip>
      );
    }

    if (status === "error") {
      return (
        <Tooltip title="Offline download failed — tap to retry" arrow>
          <IconButton
            size="small"
            aria-label="Retry offline download"
            onClick={handlePrefetch}
            sx={{ color: "error.main" }}
          >
            <ErrorOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return (
      <Tooltip title="Download for offline use" arrow>
        <IconButton
          size="small"
          aria-label="Download for offline use"
          onClick={handlePrefetch}
        >
          <CloudDownload fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  if (status === "complete") {
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

  if (status === "downloading") {
    return (
      <Tooltip title={`Downloading for offline use... ${progress}%`}>
        <Chip
          icon={<Skeleton variant="circular" width={14} height={14} />}
          label={`${progress}%`}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (status === "error") {
    return (
      <Tooltip title="Offline download failed — tap to retry">
        <Chip
          icon={<ErrorOutline />}
          label="Retry"
          size="small"
          color="error"
          variant="outlined"
          onClick={handlePrefetch}
          sx={{ cursor: "pointer" }}
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
        sx={{ cursor: "pointer" }}
      />
    </Tooltip>
  );
}
