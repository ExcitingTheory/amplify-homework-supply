import React, { useReducer, useEffect, useCallback } from 'react';
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
  Divider,
  Switch,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  Delete,
  CloudDownload,
  Storage,
  SmartToy,
  CheckCircle,
} from '@mui/icons-material';
import {
  storageManagementReducer,
  initialStorageManagementState,
} from './storageManagementReducer';

/**
 * Storage management panel for the Settings page.
 * Shows offline storage usage, cached assignments, and AI model controls.
 */
export default function StorageManagement() {
  const [state, dispatch] = useReducer(storageManagementReducer, initialStorageManagementState);
  const { storageBudget, models, prefetchStatuses, downloadStatus, downloadProgress } = state;
  const downloading = downloadStatus === 'downloading';

  const refresh = useCallback(async () => {
    try {
      const { getStorageBudget, getAvailableModels } = await import('../offline/ModelManager');
      const { getAllPrefetchStatuses } = await import('../offline/OfflineDataStore');

      const results = await Promise.allSettled([
        getStorageBudget(),
        getAvailableModels(),
        getAllPrefetchStatuses(),
      ]);

      dispatch({
        type: 'SET_DATA',
        storageBudget: results[0].status === 'fulfilled' ? results[0].value : undefined,
        models: results[1].status === 'fulfilled' ? results[1].value : undefined,
        prefetchStatuses: results[2].status === 'fulfilled' ? results[2].value : undefined,
      });
    } catch {
      // Modules not loaded
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDownloadModel = useCallback(async () => {
    dispatch({ type: 'DOWNLOAD_START' });
    try {
      const { downloadWebLLMModel } = await import('../offline/ModelManager');
      await downloadWebLLMModel((p: number) => dispatch({ type: 'DOWNLOAD_PROGRESS', progress: p }));
      dispatch({ type: 'DOWNLOAD_COMPLETE' });
      await refresh();
    } catch (err) {
      console.error('Model download failed:', err);
      dispatch({ type: 'DOWNLOAD_ERROR' });
    }
  }, [refresh]);

  const handleDeleteModel = useCallback(async () => {
    try {
      const { deleteWebLLMModel } = await import('../offline/ModelManager');
      await deleteWebLLMModel();
      await refresh();
    } catch (err) {
      console.error('Model deletion failed:', err);
    }
  }, [refresh]);

  const handleClearUnitCache = useCallback(async (unitId: string) => {
    try {
      const { clearUnitCache } = await import('../offline/OfflineDataStore');
      await clearUnitCache(unitId);
      await refresh();
    } catch (err) {
      console.error('Cache clear failed:', err);
    }
  }, [refresh]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Storage overview */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Storage color="primary" />
            <Typography variant="h6">Offline Storage</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={storageBudget.percentUsed}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {formatBytes(storageBudget.used)} of {formatBytes(storageBudget.quota)} used
            ({storageBudget.percentUsed}%)
          </Typography>
          {storageBudget.percentUsed > 80 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Storage is getting full. Consider removing cached assignments or
              the AI model to free space.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* AI Model management */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <SmartToy color="primary" />
            <Typography variant="h6">AI Model for Offline Use</Typography>
          </Stack>
          <List dense>
            {models.map((model) => (
              <ListItem key={model.id} sx={{ gap: 1 }}>
                <ListItemText
                  primary={model.name}
                  secondary={
                    model.sizeBytes > 0
                      ? `${formatBytes(model.sizeBytes)} · ${model.ready ? 'Downloaded' : 'Not downloaded'}`
                      : 'Pre-installed — no download needed'
                  }
                  sx={{ flex: 1, minWidth: 0 }}
                  primaryTypographyProps={{ noWrap: true }}
                />
                <Box sx={{ flexShrink: 0 }}>
                  {model.backend === 'chrome-ai' ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Built-in"
                      color="success"
                      size="small"
                    />
                  ) : model.ready ? (
                    <IconButton
                      edge="end"
                      onClick={handleDeleteModel}
                      title="Remove model"
                    >
                      <Delete />
                    </IconButton>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CloudDownload />}
                      onClick={handleDownloadModel}
                      disabled={downloading}
                    >
                      Download
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
                Downloading AI model... {downloadProgress}%
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Cached assignments */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cached Assignments
          </Typography>
          {prefetchStatuses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No assignments cached for offline use yet. Open an assignment to
              cache it automatically.
            </Typography>
          ) : (
            <List dense>
              {prefetchStatuses.map((status) => (
                <ListItem key={status.unitId} sx={{ gap: 1 }}>
                  <ListItemText
                    primary={`Unit: ${status.unitId.slice(0, 8)}...`}
                    secondary={`${status.status} · Last updated ${new Date(status.lastUpdated).toLocaleDateString()}`}
                    sx={{ flex: 1, minWidth: 0 }}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                  <IconButton
                    edge="end"
                    onClick={() => handleClearUnitCache(status.unitId)}
                    title="Remove offline data"
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
