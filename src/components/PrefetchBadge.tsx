import React, { useState, useEffect, useCallback } from "react";
import { Chip, IconButton, Skeleton, Tooltip } from "@mui/material";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("components");
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
        <Tooltip title={t("prefetchBadge.availableOffline")} arrow>
          <span aria-label={t("prefetchBadge.availableOffline")} role="img">
            <CloudDone color="success" fontSize="small" />
          </span>
        </Tooltip>
      );
    }

    if (status === "downloading") {
      return (
        <Tooltip
          title={t("prefetchBadge.downloadingTooltip", { progress })}
          arrow
        >
          <span
            aria-label={t("prefetchBadge.downloadingAriaLabel", { progress })}
            role="status"
          >
            <Skeleton variant="circular" width={18} height={18} />
          </span>
        </Tooltip>
      );
    }

    if (status === "error") {
      return (
        <Tooltip title={t("prefetchBadge.downloadFailedRetry")} arrow>
          <IconButton
            size="small"
            aria-label={t("prefetchBadge.retryDownload")}
            onClick={handlePrefetch}
            sx={{ color: "error.main" }}
          >
            <ErrorOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={t("prefetchBadge.downloadForOffline")} arrow>
        <IconButton
          size="small"
          aria-label={t("prefetchBadge.downloadForOffline")}
          onClick={handlePrefetch}
        >
          <CloudDownload fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  if (status === "complete") {
    return (
      <Tooltip title={t("prefetchBadge.availableOffline")}>
        <Chip
          icon={<CloudDone />}
          label={t("prefetchBadge.offlineReady")}
          size="small"
          color="success"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (status === "downloading") {
    return (
      <Tooltip title={t("prefetchBadge.downloadingTooltip", { progress })}>
        <Chip
          icon={<Skeleton variant="circular" width={14} height={14} />}
          label={t("prefetchBadge.progressPercent", { progress })}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (status === "error") {
    return (
      <Tooltip title={t("prefetchBadge.downloadFailedRetry")}>
        <Chip
          icon={<ErrorOutline />}
          label={t("prefetchBadge.retry")}
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
    <Tooltip title={t("prefetchBadge.downloadForOffline")}>
      <Chip
        icon={<CloudDownload />}
        label={t("prefetchBadge.saveOffline")}
        size="small"
        variant="outlined"
        onClick={handlePrefetch}
        sx={{ cursor: "pointer" }}
      />
    </Tooltip>
  );
}
