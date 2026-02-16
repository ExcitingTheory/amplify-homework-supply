/**
 * DebugPanel - Main debug panel component
 * 
 * A drawer-based UI for debugging application state, components, and logs.
 * Uses Material-UI for styling and layout.
 */

import React, { useState, useEffect } from 'react';
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
    setSnackbar({ open: true, message: 'Diagnostic snapshot downloaded', severity: 'success' });
  };

  const handleSendToDiscord = async (snapshot: StateSnapshot) => {
    setDiscordDialog(true);
  };

  const handleConfirmSendToDiscord = async () => {
    if (!stateSnapshot) return;

    setDiscordDialog(false);
    setSnackbar({ open: true, message: 'Sending to Discord...', severity: 'info' });

    const webhookUrl = getDiscordWebhookUrl();
    if (!webhookUrl) {
      setSnackbar({ open: true, message: 'Discord webhook not configured', severity: 'error' });
      return;
    }

    const result = await sendToDiscord(
      {
        snapshot: stateSnapshot,
        description: userDescription || undefined,
        userContact: userContact || undefined,
      },
      { webhookUrl }
    );

    if (result.success) {
      setSnackbar({ open: true, message: '✅ Diagnostic sent to support team!', severity: 'success' });
      setUserDescription('');
      setUserContact('');
    } else {
      setSnackbar({ open: true, message: `Failed to send: ${result.error}`, severity: 'error' });
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
          Debug Panel
        </Typography>
        <IconButton edge="end" onClick={onClose} aria-label="Close debug panel">
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
          label="Components"
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
        <Tab
          value="logs"
          icon={<ListAltIcon />}
          label={`Logs (${logs.length})`}
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
        <Tab
          value="state"
          icon={<StorageIcon />}
          label="State"
          iconPosition="start"
          sx={{ minHeight: 40 }}
        />
        <Tab
          value="performance"
          icon={<SpeedIcon />}
          label="Performance"
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
            Performance metrics coming soon...
          </Typography>
        </TabPanel>
      </Box>
    </Drawer>

    {/* Discord send dialog */}
    <Dialog open={discordDialog} onClose={() => setDiscordDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Send Diagnostic to Support</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This will send your diagnostic snapshot to our support team via Discord.
          Your data will be sanitized to remove sensitive information.
        </Typography>
        <TextField
          fullWidth
          label="Describe the issue (optional)"
          multiline
          rows={3}
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          placeholder="What were you doing when the problem occurred?"
          sx={{ mb: 2, mt: 1 }}
        />
        <TextField
          fullWidth
          label="Your email or contact (optional)"
          value={userContact}
          onChange={(e) => setUserContact(e.target.value)}
          placeholder="So we can follow up with you"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDiscordDialog(false)}>Cancel</Button>
        <Button onClick={handleConfirmSendToDiscord} variant="contained" color="primary">
          Send to Support
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
