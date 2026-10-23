/**
 * DebugPanel - Main debug panel component
 * 
 * A drawer-based UI for debugging application state, components, and logs.
 * Uses Material-UI for styling and layout.
 */

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Drawer,
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Toolbar,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListAltIcon from '@mui/icons-material/ListAlt';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';

import { DebugPanelProps, DebugPanelTab } from './types';
import { ComponentMetadata } from '../../utils/debug/ComponentTreeStore';
import { LogEntry } from '../../utils/debug/DebugLogger';
import { StateSnapshot } from '../../utils/debug/StateSnapshot';
import { StateInspector } from './StateInspector';
import { ComponentTreeView } from './ComponentTreeView';
import { LogViewer } from './LogViewer';
import { sendToDiscord, getDiscordWebhookUrl } from '../../utils/debug/discordWebhook';
import { uploadDebugArtifact } from '../../utils/debug/uploadDebugArtifact';

/**
 * Tab panel wrapper component
 */
interface TabPanelProps {
  children?: React.ReactNode;
  value: DebugPanelTab;
  currentValue: DebugPanelTab;
}

function TabPanel({ children, value, currentValue }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== currentValue}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === currentValue && <Box sx={{ p: 2, height: '100%' }}>{children}</Box>}
    </div>
  );
}

/**
 * Main DebugPanel component
 */
export function DebugPanel({
  open,
  onClose,
  defaultTab = 'components',
  position = 'right',
  width = 600,
  height = '100%',
}: DebugPanelProps) {
  const t = useTranslations('common');
  const [currentTab, setCurrentTab] = useState<DebugPanelTab>(defaultTab);
  const [componentTree, setComponentTree] = useState<ComponentMetadata[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stateSnapshot, setStateSnapshot] = useState<StateSnapshot | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [discordDialog, setDiscordDialog] = useState(false);
  const [userDescription, setUserDescription] = useState('');
  const [userContact, setUserContact] = useState('');

  // Subscribe to component tree updates
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const store = window.__COMPONENT_TREE__;
    if (!store) return;

    const unsubscribe = store.subscribe((tree) => {
      setComponentTree(tree);
    });

    // Initial load
    setComponentTree(store.getTree());

    return unsubscribe;
  }, [open]);

  // Subscribe to log updates
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const logger = window.__DEBUG_LOGGER__;
    if (!logger) return;

    const unsubscribe = logger.subscribe((newLog) => {
      if (newLog) {
        setLogs((prev) => [...prev, newLog]);
      } else {
        // Clear event
        setLogs([]);
      }
    });

    // Initial load
    setLogs(logger.getLogs());

    return unsubscribe;
  }, [open]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: DebugPanelTab) => {
    setCurrentTab(newValue);
  };

  const handleClearLogs = () => {
    if (typeof window !== 'undefined' && window.__DEBUG_LOGGER__) {
      window.__DEBUG_LOGGER__.clear();
    }
  };

  const handleRefreshState = async () => {
    const { captureStateSnapshot } = await import('../../utils/debug/StateSnapshot');
    const snapshot = await captureStateSnapshot();
    setStateSnapshot(snapshot);
  };

  const handleExportState = async (snapshot: StateSnapshot) => {
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state-snapshot-${snapshot.timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: t('debugPanel.snapshotDownloaded'), severity: 'success' });
  };

  const handleSendToDiscord = async (snapshot: StateSnapshot) => {
    setDiscordDialog(true);
  };

  const handleConfirmSendToDiscord = async () => {
    if (!stateSnapshot) return;

    setDiscordDialog(false);
    setSnackbar({ open: true, message: t('debugPanel.uploadingArtifact'), severity: 'info' });

    const webhookUrl = getDiscordWebhookUrl();
    if (!webhookUrl) {
      setSnackbar({ open: true, message: t('debugPanel.webhookNotConfigured'), severity: 'error' });
      return;
    }

    try {
      // Upload artifact to S3 and get signed URL
      const { url: artifactUrl, key } = await uploadDebugArtifact(stateSnapshot);
      console.log('[DebugPanel] Artifact uploaded to S3:', key);
      
      setSnackbar({ open: true, message: t('debugPanel.sendingToDiscord'), severity: 'info' });

      // Send to Discord with S3 URL
      const result = await sendToDiscord(
        {
          snapshot: stateSnapshot,
          description: userDescription || undefined,
          userContact: userContact || undefined,
          artifactUrl, // Include 30-day signed URL
        },
        { webhookUrl }
      );

      if (result.success) {
        setSnackbar({ 
          open: true, 
          message: t('debugPanel.diagnosticSent'),
          severity: 'success' 
        });
        setUserDescription('');
        setUserContact('');
      } else {
        setSnackbar({
          open: true,
          message: t('debugPanel.sendFailed', { error: String(result.error) }),
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('[DebugPanel] Error uploading/sending diagnostic:', error);
      setSnackbar({ 
        open: true, 
        message: t('debugPanel.uploadFailed', {
          error: error instanceof Error ? error.message : t('debugPanel.unknownError'),
        }),
        severity: 'error' 
      });
    }
  };

  return (
    <>
    <Drawer
      anchor={position === 'bottom' ? 'bottom' : position}
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          width: position !== 'bottom' ? width : '100%',
          height: position === 'bottom' ? height : '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Toolbar sx={{ minHeight: 48 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {t('debugPanel.title')}
        </Typography>
        <IconButton edge="end" onClick={onClose} aria-label={t('actions.close')}>
          <CloseIcon />
        </IconButton>
      </Toolbar>

      <Divider />

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab
          value="components"
          icon={<AccountTreeIcon />}
          label={t('debugPanel.tabs.components')}
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
        <Tab
          value="logs"
          icon={<ListAltIcon />}
          label={t('debugPanel.tabs.logs', { count: logs.length })}
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
        <Tab
          value="state"
          icon={<StorageIcon />}
          label={t('debugPanel.tabs.state')}
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
        <Tab
          value="performance"
          icon={<SpeedIcon />}
          label={t('debugPanel.tabs.performance')}
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
      </Tabs>

      {/* Tab Panels */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TabPanel value="components" currentValue={currentTab}>
          <ComponentTreeView tree={componentTree} />
        </TabPanel>

        <TabPanel value="logs" currentValue={currentTab}>
          <LogViewer logs={logs} onClear={handleClearLogs} />
        </TabPanel>

        <TabPanel value="state" currentValue={currentTab}>
          <StateInspector
            snapshot={stateSnapshot}
            onRefresh={handleRefreshState}
            onExport={handleExportState}
            onSendToDiscord={handleSendToDiscord}
          />
        </TabPanel>

        <TabPanel value="performance" currentValue={currentTab}>
          <Typography variant="body2" color="text.secondary">
            {t('debugPanel.performanceComingSoon')}
          </Typography>
        </TabPanel>
      </Box>
    </Drawer>

    {/* Discord send dialog */}
    <Dialog open={discordDialog} onClose={() => setDiscordDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t('debugPanel.sendDialogTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('debugPanel.sendDialogDescription')}
        </Typography>
        <TextField
          fullWidth
          label={t('debugPanel.describeIssueLabel')}
          multiline
          rows={3}
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          placeholder={t('debugPanel.describeIssuePlaceholder')}
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          fullWidth
          label={t('debugPanel.contactLabel')}
          value={userContact}
          onChange={(e) => setUserContact(e.target.value)}
          placeholder={t('debugPanel.contactPlaceholder')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDiscordDialog(false)}>{t('actions.cancel')}</Button>
        <Button onClick={handleConfirmSendToDiscord} variant="contained" color="primary">
          {t('debugPanel.sendToSupport')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Snackbar for notifications */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>
  );
}

export default DebugPanel;
