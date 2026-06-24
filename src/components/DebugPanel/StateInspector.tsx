/**
 * StateInspector - Detailed state visualization component
 * 
 * Displays application state snapshot with expandable sections
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { StateInspectorProps } from './types';
import { isDiscordWebhookConfigured } from '../../utils/debug/discordWebhook';

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * StateInspector component
 */
export function StateInspector({ snapshot, onRefresh, onExport, onSendToDiscord }: StateInspectorProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const discordEnabled = isDiscordWebhookConfigured();

  const handleCopySection = (sectionName: string, data: unknown) => {
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (!snapshot) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          No state snapshot available
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          sx={{ mt: 2 }}
        >
          Capture State
        </Button>
      </Box>
    );
  }

  const snapshotSize = new Blob([JSON.stringify(snapshot)]).size;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
        <Chip
          label={`Captured: ${new Date(snapshot.timestamp).toLocaleString()}`}
          size="small"
          variant="outlined"
        />
        <Chip label={formatBytes(snapshotSize)} size="small" color="primary" />
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh snapshot">
          <IconButton size="small" onClick={onRefresh}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {discordEnabled && (
          <Tooltip title="Send to Discord support channel">
            <IconButton
              size="small"
              onClick={() => onSendToDiscord?.(snapshot)}
              color="primary"
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Export snapshot">
          <IconButton size="small" onClick={() => onExport?.(snapshot)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Environment Info */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Environment</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Version:</strong> {snapshot.version}
            </Typography>
            <Typography variant="body2">
              <strong>User Agent:</strong> {snapshot.environment.userAgent}
            </Typography>
            <Typography variant="body2">
              <strong>URL:</strong> {snapshot.environment.url}
            </Typography>
            <Typography variant="body2">
              <strong>Viewport:</strong> {snapshot.environment.viewport.width} × {snapshot.environment.viewport.height}
            </Typography>
            <Typography variant="body2">
              <strong>Platform:</strong> {snapshot.environment.platform}
            </Typography>
            <Typography variant="body2">
              <strong>Language:</strong> {snapshot.environment.language}
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Local Storage */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
            <Typography variant="subtitle2">
              Local Storage ({Object.keys(snapshot.localStorage).length})
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              component="span"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCopySection('localStorage', snapshot.localStorage);
              }}
              sx={{ mr: -1 }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: 11, margin: 0, overflow: 'auto', maxHeight: 300 }}>
            {JSON.stringify(snapshot.localStorage, null, 2)}
          </pre>
          {copiedSection === 'localStorage' && (
            <Typography variant="caption" color="success.main">
              Copied!
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Session Storage */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">
            Session Storage ({Object.keys(snapshot.sessionStorage).length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: 11, margin: 0, overflow: 'auto', maxHeight: 300 }}>
            {JSON.stringify(snapshot.sessionStorage, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>

      {/* Component Tree */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">
            Component Tree ({snapshot.componentTree ? JSON.parse(snapshot.componentTree).length : 0})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: 11, margin: 0, overflow: 'auto', maxHeight: 300 }}>
            {snapshot.componentTree || 'No component tree data'}
          </pre>
        </AccordionDetails>
      </Accordion>

      {/* Logs */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Logs ({snapshot.logs ? JSON.parse(snapshot.logs).length : 0})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: 11, margin: 0, overflow: 'auto', maxHeight: 300 }}>
            {snapshot.logs || 'No log data'}
          </pre>
        </AccordionDetails>
      </Accordion>

      {/* DataStore */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">DataStore Models</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            {Object.entries(snapshot.dataStore).map(([modelName, models]) => (
              <Box key={modelName}>
                <Typography variant="caption" fontWeight="bold">
                  {modelName} ({(models as unknown[]).length})
                </Typography>
                <pre style={{ fontSize: 10, margin: 0, overflow: 'auto', maxHeight: 200 }}>
                  {JSON.stringify(models, null, 2)}
                </pre>
              </Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Performance */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Performance Metrics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <pre style={{ fontSize: 11, margin: 0, overflow: 'auto', maxHeight: 300 }}>
            {JSON.stringify(snapshot.performance, null, 2)}
          </pre>
        </AccordionDetails>
      </Accordion>

      {/* Errors */}
      {snapshot.errors.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" color="error">
              Errors ({snapshot.errors.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ fontSize: 11, margin: 0, overflow: 'auto', maxHeight: 300 }}>
              {JSON.stringify(snapshot.errors, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

export default StateInspector;
