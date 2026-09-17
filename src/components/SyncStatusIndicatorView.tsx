"use client";

/**
 * SyncStatusIndicatorView — Presentational sync-status chip + pending-ops dialog.
 *
 * Renders from plain props so it can be shown without the offline sync queue /
 * network hooks the SyncStatusIndicator container owns. The container keeps all
 * state + the ConflictResolutionDialog and passes values/handlers down.
 *
 * @module SyncStatusIndicatorView
 */

import React from "react";
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
} from "@mui/material";
import {
  CloudSync,
  CloudOff,
  ErrorOutline,
  Refresh,
  CompareArrows,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";

export interface SyncPendingOp {
  id?: number;
  model: string;
  operation: string;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  payload?: string;
}

export interface SyncStatusIndicatorViewProps {
  isOnline: boolean;
  pendingCount: number;
  pendingOps: SyncPendingOp[];
  syncing: boolean;
  lastSyncedAt: number | null;
  dialogOpen: boolean;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
  onSync: () => void;
  onResolveOp: (op: SyncPendingOp) => void;
}

export function SyncStatusIndicatorView({
  isOnline,
  pendingCount,
  pendingOps,
  syncing,
  lastSyncedAt,
  dialogOpen,
  onOpenDialog,
  onCloseDialog,
  onSync,
  onResolveOp,
}: SyncStatusIndicatorViewProps) {
  const t = useTranslations("components");
  const td = (key: string, fallback: string) =>
    t.has(key) ? t(key) : fallback;

  if (pendingCount === 0) {
    if (!isOnline) {
      return (
        <Tooltip
          title={td("offline.offlineNoPending", "Offline — no pending changes")}
        >
          <Chip
            icon={<CloudOff />}
            label={td("offline.offline", "Offline")}
            size="small"
            variant="outlined"
          />
        </Tooltip>
      );
    }
    return null;
  }

  return (
    <>
      <Tooltip
        title={td(
          "offline.pendingSync",
          `${pendingCount} changes pending sync`,
        )}
      >
        <Badge badgeContent={pendingCount} color="warning">
          <Chip
            icon={isOnline ? <CloudSync /> : <CloudOff />}
            label={td("offline.pendingLabel", `${pendingCount} pending`)}
            size="small"
            variant="outlined"
            color={isOnline ? "primary" : "default"}
            onClick={onOpenDialog}
            sx={{ cursor: "pointer" }}
          />
        </Badge>
      </Tooltip>

      <Dialog open={dialogOpen} onClose={onCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {td("offline.pendingOperations", "Pending sync operations")}
          <IconButton
            onClick={onSync}
            disabled={!isOnline || syncing}
            sx={{ float: "right" }}
          >
            {syncing ? (
              <Skeleton variant="circular" width={20} height={20} />
            ) : (
              <Refresh />
            )}
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 1 }}
          >
            {lastSyncedAt
              ? td(
                  "offline.lastSynced",
                  `Last synced ${new Date(lastSyncedAt).toLocaleString()}`,
                )
              : td("offline.notSynced", "Not synced in this session")}
          </Typography>
          {pendingOps.length === 0 ? (
            <Typography color="text.secondary">
              {td("offline.noPendingOperations", "No pending operations")}
            </Typography>
          ) : (
            <List dense>
              {pendingOps.map((op) => (
                <ListItem
                  key={op.id ?? op.createdAt}
                  secondaryAction={
                    (op.lastError?.toLowerCase().includes("version") ||
                      op.lastError?.toLowerCase().includes("conflict") ||
                      op.model === "Grade") && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<CompareArrows />}
                        onClick={() => onResolveOp(op)}
                      >
                        {td("offline.resolve", "Resolve")}
                      </Button>
                    )
                  }
                >
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
          <Button onClick={onCloseDialog}>{td("common.close", "Close")}</Button>
          <Button
            onClick={onSync}
            disabled={!isOnline || syncing}
            variant="contained"
            startIcon={
              syncing ? (
                <Skeleton variant="circular" width={16} height={16} />
              ) : (
                <CloudSync />
              )
            }
          >
            {td("offline.syncNow", "Sync now")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SyncStatusIndicatorView;
