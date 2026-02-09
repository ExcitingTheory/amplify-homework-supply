/**
 * LogViewer - Console log viewer component with filtering
 * 
 * Displays captured console logs with color-coding and search
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

import { LogViewerProps } from './types';
import { LogEntry, LogLevel } from '../../utils/debug/DebugLogger';

/**
 * Get icon for log level
 */
function LogLevelIcon({ level }: { level: LogLevel }) {
  switch (level) {
    case 'error':
      return <ErrorIcon fontSize="small" color="error" />;
    case 'warn':
      return <WarningIcon fontSize="small" color="warning" />;
    case 'info':
      return <InfoIcon fontSize="small" color="info" />;
    default:
      return null;
  }
}

/**
 * Get background color for log level
 */
function getLogColor(level: LogLevel): string {
  switch (level) {
    case 'error':
      return 'rgba(211, 47, 47, 0.1)';
    case 'warn':
      return 'rgba(237, 108, 2, 0.1)';
    case 'info':
      return 'rgba(2, 136, 209, 0.1)';
    default:
      return 'transparent';
  }
}

/**
 * LogViewer component
 */
export function LogViewer({ logs, onClear, autoScroll = true }: LogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesSearch =
        searchTerm === '' || log.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [logs, levelFilter, searchTerm]);

  // Count by level
  const counts = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<LogLevel, number>
    );
  }, [logs]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filters */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="log-level-filter-label">Level</InputLabel>
          <Select
            labelId="log-level-filter-label"
            id="log-level-filter"
            value={levelFilter}
            label="Level"
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
          >
            <MenuItem value="all">All ({logs.length})</MenuItem>
            <MenuItem value="log">Log ({counts.log || 0})</MenuItem>
            <MenuItem value="info">Info ({counts.info || 0})</MenuItem>
            <MenuItem value="warn">Warn ({counts.warn || 0})</MenuItem>
            <MenuItem value="error">Error ({counts.error || 0})</MenuItem>
            <MenuItem value="debug">Debug ({counts.debug || 0})</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />

        <Tooltip title="Clear all logs">
          <IconButton size="small" onClick={onClear} color="error">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Stats */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        {counts.error > 0 && (
          <Chip
            icon={<ErrorIcon />}
            label={counts.error}
            size="small"
            color="error"
            variant="outlined"
          />
        )}
        {counts.warn > 0 && (
          <Chip
            icon={<WarningIcon />}
            label={counts.warn}
            size="small"
            color="warning"
            variant="outlined"
          />
        )}
        <Chip
          label={`${filteredLogs.length} / ${logs.length} shown`}
          size="small"
          variant="outlined"
        />
      </Stack>

      {/* Log entries */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
        }}
      >
        {filteredLogs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {logs.length === 0 ? 'No logs captured yet' : 'No logs match filters'}
          </Typography>
        ) : (
          filteredLogs.map((log, index) => (
            <Box
              key={`${log.timestamp}-${index}`}
              sx={{
                p: 1,
                mb: 0.5,
                borderLeft: 3,
                borderColor:
                  log.level === 'error'
                    ? 'error.main'
                    : log.level === 'warn'
                    ? 'warning.main'
                    : log.level === 'info'
                    ? 'info.main'
                    : 'divider',
                bgcolor: getLogColor(log.level),
                borderRadius: 0.5,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <LogLevelIcon level={log.level} />
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>
                <Chip label={log.level.toUpperCase()} size="small" sx={{ fontSize: 9, height: 18 }} />
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {log.message}
              </Typography>
              {log.stack && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    fontFamily: 'monospace',
                    fontSize: 9,
                    color: 'text.secondary',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {log.stack}
                </Typography>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export default LogViewer;
