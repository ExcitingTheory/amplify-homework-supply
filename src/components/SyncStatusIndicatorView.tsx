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

  if (pendingCount === 0) {
    if (!isOnline) {
      return (
        <Tooltip title={t("syncStatusIndicatorView.offlineNoPending")}>
          <Chip
            icon={<CloudOff />}
            label={t("syncStatusIndicatorView.offline")}
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
        title={t("syncStatusIndicatorView.pendingSync", {
          count: pendingCount,
        })}
      >
        <Badge badgeContent={pendingCount} color="warning">
          <Chip
            icon={isOnline ? <CloudSync /> : <CloudOff />}
            label={t("syncStatusIndicatorView.pendingLabel", {
              count: pendingCount,
            })}
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
          {t("syncStatusIndicatorView.pendingOperations")}
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
              ? t("syncStatusIndicatorView.lastSynced", {
                  time: new Date(lastSyncedAt).toLocaleString(),
                })
              : t("syncStatusIndicatorView.notSynced")}
          </Typography>
          {pendingOps.length === 0 ? (
            <Typography color="text.secondary">
              {t("syncStatusIndicatorView.noPendingOperations")}
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
                        {t("syncStatusIndicatorView.resolve")}
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
                        {op.retryCount > 0 &&
                          t("syncStatusIndicatorView.retryCount", {
                            count: op.retryCount,
                          })}
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
          <Button onClick={onCloseDialog}>{t("common.close")}</Button>
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
            {t("syncStatusIndicatorView.syncNow")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SyncStatusIndicatorView;
