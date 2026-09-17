import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Alert,
  Chip,
  Stack,
} from "@mui/material";
import {
  Delete,
  CloudDownload,
  Storage,
  SmartToy,
  CheckCircle,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";
import type {
  StorageBudget,
  AIModel,
  PrefetchStatus,
} from "./storageManagementReducer";

export interface StorageManagementViewProps {
  storageBudget: StorageBudget;
  models: AIModel[];
  prefetchStatuses: PrefetchStatus[];
  downloading: boolean;
  downloadProgress: number;
  onDownloadModel: () => void;
  onDeleteModel: () => void;
  onClearUnitCache: (unitId: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * StorageManagementView — presentational storage/model/cache panel. Renders
 * from plain props so it can be shown without the offline modules the
 * StorageManagement container loads.
 */
export function StorageManagementView({
  storageBudget,
  models,
  prefetchStatuses,
  downloading,
  downloadProgress,
  onDownloadModel,
  onDeleteModel,
  onClearUnitCache,
}: StorageManagementViewProps) {
  const t = useTranslations("components");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Storage overview */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Storage color="primary" />
            <Typography variant="h6">
              {t("storageManagement.offlineStorage")}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={storageBudget.percentUsed}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {t("storageManagement.usedOfQuota", {
              used: formatBytes(storageBudget.used),
              quota: formatBytes(storageBudget.quota),
              percent: storageBudget.percentUsed,
            })}
          </Typography>
          {storageBudget.percentUsed > 80 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {t("storageManagement.storageFullWarning")}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* AI Model management */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <SmartToy color="primary" />
            <Typography variant="h6">
              {t("storageManagement.aiModelForOffline")}
            </Typography>
          </Stack>
          <List dense>
            {models.map((model) => (
              <ListItem key={model.id} sx={{ gap: 1 }}>
                <ListItemText
                  primary={model.name}
                  secondary={
                    model.sizeBytes > 0
                      ? t("storageManagement.modelSizeStatus", {
                          size: formatBytes(model.sizeBytes),
                          status: model.ready
                            ? t("storageManagement.downloaded")
                            : t("storageManagement.notDownloaded"),
                        })
                      : t("storageManagement.preInstalled")
                  }
                  sx={{ flex: 1, minWidth: 0 }}
                  primaryTypographyProps={{ noWrap: true }}
                />
                <Box sx={{ flexShrink: 0 }}>
                  {model.backend === "chrome-ai" ? (
                    <Chip
                      icon={<CheckCircle />}
                      label={t("storageManagement.builtIn")}
                      color="success"
                      size="small"
                    />
                  ) : model.ready ? (
                    <IconButton
                      edge="end"
                      onClick={onDeleteModel}
                      title={t("storageManagement.removeModel")}
                    >
                      <Delete />
                    </IconButton>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudDownload />}
                      onClick={onDownloadModel}
                      disabled={downloading}
                    >
                      {t("storageManagement.download")}
                    </Button>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
          {downloading && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress variant="determinate" value={downloadProgress} />
              <Typography variant="caption" color="text.secondary">
                {t("storageManagement.downloadingModel", {
                  percent: downloadProgress,
                })}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Cached assignments */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t("storageManagement.cachedAssignments")}
          </Typography>
          {prefetchStatuses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("storageManagement.noCachedAssignments")}
            </Typography>
          ) : (
            <List dense>
              {prefetchStatuses.map((status) => (
                <ListItem key={status.unitId} sx={{ gap: 1 }}>
                  <ListItemText
                    primary={t("storageManagement.unitLabel", {
                      id: status.unitId.slice(0, 8),
                    })}
                    secondary={t("storageManagement.cacheStatusUpdated", {
                      status: status.status,
                      date: new Date(status.lastUpdated).toLocaleDateString(),
                    })}
                    sx={{ flex: 1, minWidth: 0 }}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                  <IconButton
                    edge="end"
                    onClick={() => onClearUnitCache(status.unitId)}
                    title={t("storageManagement.removeOfflineData")}
                  >
                    <Delete />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default StorageManagementView;
