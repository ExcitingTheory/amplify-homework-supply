# Debug Panel & State Inspector

**Last Updated**: January 9, 2026  
**Status**: Planning Phase  
**Purpose**: Production debugging and support diagnostics

## Table of Contents

1. [Overview](#overview)
2. [Component Tree Inspector](#component-tree-inspector)
3. [Debug Logger](#debug-logger)
4. [State Snapshot System](#state-snapshot-system)
5. [S3 Upload & Support Integration](#s3-upload--support-integration)
6. [UI Components](#ui-components)
7. [Implementation](#implementation)
8. [Security & Privacy](#security--privacy)

---

## Overview

### Problem Statement

**Current Issues**:
- ❌ Hard to debug production issues without dev tools
- ❌ Students can't explain what went wrong
- ❌ Instructors need visibility into student app state
- ❌ No way to capture full context when bugs occur
- ❌ DataStore sync issues invisible to users

### Proposed Solution

**Debug Panel Features**:
- 🔍 **Component Tree View** - Visual hierarchy of React components with props/state
- 📝 **Debug Logger** - Captured console logs, errors, warnings
- 📊 **State Inspector** - DataStore models, context values, Redux state
- 📤 **S3 Upload** - One-click diagnostic export with shareable link
- 🎯 **Session Recording** - User actions timeline
- 🔔 **Error Boundary** - Automatic error capture and reporting

**Use Cases**:
1. Student encounters bug → Clicks "Report Issue" → Screenshot is Taken, The user can draw and comment on it → State uploaded to S3 → Support team investigates
2. Instructor debugging student's work → Views component tree to see why quiz isn't loading
3. Developer troubleshooting DataStore sync → Exports full state for analysis
4. Automated error reporting → Error boundary captures crash → Auto-uploads diagnostic

---

## Component Tree Inspector

### React Component Hierarchy

**Visualize component tree** with:
- Component name and type
- Props (with values)
- State/hooks
- Context consumers
- Child components
- Render count
- Mount/unmount times

### Implementation

#### Tree Data Collection

```javascript
// src/utils/componentTreeInspector.js
import { useEffect, useRef } from 'react';

/**
 * Hook to register component in debug tree
 * Wraps component with metadata collection
 */
export function useComponentInspector(componentName, props, state = {}) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (window.__COMPONENT_TREE__) {
      window.__COMPONENT_TREE__.register({
        name: componentName,
        props: sanitizeProps(props),
        state: sanitizeState(state),
        renderCount: renderCount.current,
        mountTime: mountTime.current,
        lastRenderTime: Date.now(),
      });
    }
    
    return () => {
      if (window.__COMPONENT_TREE__) {
        window.__COMPONENT_TREE__.unregister(componentName);
      }
    };
  }, [componentName, props, state]);
}

// Sanitize props to avoid circular references and large objects
function sanitizeProps(props) {
  const sanitized = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      sanitized[key] = '[Function]';
    } else if (React.isValidElement(value)) {
      sanitized[key] = '[ReactElement]';
    } else if (value instanceof HTMLElement) {
      sanitized[key] = '[HTMLElement]';
    } else if (Array.isArray(value)) {
      sanitized[key] = `[Array(${value.length})]`;
    } else if (value && typeof value === 'object') {
      sanitized[key] = `[Object: ${Object.keys(value).length} keys]`;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function sanitizeState(state) {
  // Similar to sanitizeProps
  return sanitizeProps(state);
}
```

#### Component Tree Store

```javascript
// src/utils/ComponentTreeStore.js
class ComponentTreeStore {
  constructor() {
    this.tree = new Map();
    this.listeners = new Set();
  }
  
  register(componentData) {
    const id = `${componentData.name}-${componentData.mountTime}`;
    this.tree.set(id, {
      ...componentData,
      id,
      children: [],
    });
    this.notifyListeners();
  }
  
  unregister(componentName) {
    // Find and remove component
    for (const [id, component] of this.tree.entries()) {
      if (component.name === componentName) {
        this.tree.delete(id);
        break;
      }
    }
    this.notifyListeners();
  }
  
  getTree() {
    // Build hierarchical tree from flat map
    return this.buildHierarchy([...this.tree.values()]);
  }
  
  buildHierarchy(components) {
    // Use React Fiber tree or component nesting to build hierarchy
    // For now, simple alphabetical grouping
    return components.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getTree()));
  }
  
  exportJSON() {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      tree: this.getTree(),
      metadata: {
        totalComponents: this.tree.size,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }
    }, null, 2);
  }
}

// Global singleton
if (typeof window !== 'undefined') {
  window.__COMPONENT_TREE__ = new ComponentTreeStore();
}

export default ComponentTreeStore;
```

#### Tree View Component

```jsx
// src/components/Debug/ComponentTreeView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ComponentIcon from '@mui/icons-material/Category';

export function ComponentTreeView() {
  const [tree, setTree] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  
  useEffect(() => {
    if (!window.__COMPONENT_TREE__) return;
    
    // Subscribe to tree updates
    const unsubscribe = window.__COMPONENT_TREE__.subscribe(setTree);
    
    // Initial load
    setTree(window.__COMPONENT_TREE__.getTree());
    
    return unsubscribe;
  }, []);
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        Component Tree ({tree.length} components)
      </Typography>
      
      <Box sx={{ p: 1 }}>
        {tree.map(component => (
          <ComponentNode
            key={component.id}
            component={component}
            onSelect={setSelectedComponent}
            selected={selectedComponent?.id === component.id}
          />
        ))}
      </Box>
      
      {selectedComponent && (
        <ComponentDetails component={selectedComponent} />
      )}
    </Box>
  );
}

function ComponentNode({ component, onSelect, selected, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{ ml: depth * 2 }}
    >
      <AccordionSummary
        expandIcon={component.children?.length > 0 ? <ExpandMoreIcon /> : null}
        onClick={() => onSelect(component)}
        sx={{
          bgcolor: selected ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <ComponentIcon fontSize="small" />
          <Typography variant="body2" fontWeight="bold">
            {component.name}
          </Typography>
          <Chip
            label={`${component.renderCount} renders`}
            size="small"
            color={component.renderCount > 10 ? 'warning' : 'default'}
          />
        </Box>
      </AccordionSummary>
      
      {component.children?.length > 0 && (
        <AccordionDetails>
          {component.children.map(child => (
            <ComponentNode
              key={child.id}
              component={child}
              onSelect={onSelect}
              selected={selected}
              depth={depth + 1}
            />
          ))}
        </AccordionDetails>
      )}
    </Accordion>
  );
}

function ComponentDetails({ component }) {
  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="h6">{component.name}</Typography>
      
      <Typography variant="subtitle2" sx={{ mt: 2 }}>Props</Typography>
      <Table size="small">
        <TableBody>
          {Object.entries(component.props || {}).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>
                <code>{JSON.stringify(value)}</code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Typography variant="subtitle2" sx={{ mt: 2 }}>State</Typography>
      <Table size="small">
        <TableBody>
          {Object.entries(component.state || {}).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>
                <code>{JSON.stringify(value)}</code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Typography variant="subtitle2" sx={{ mt: 2 }}>Metadata</Typography>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>Render Count</TableCell>
            <TableCell>{component.renderCount}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Mounted At</TableCell>
            <TableCell>{new Date(component.mountTime).toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Last Render</TableCell>
            <TableCell>{new Date(component.lastRenderTime).toLocaleString()}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
}
```

---

## Debug Logger

### Console Log Capture

**Capture all console output** for export:
- `console.log()`
- `console.warn()`
- `console.error()`
- `console.info()`
- `console.debug()`

### Implementation

```javascript
// src/utils/DebugLogger.js
class DebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Prevent memory overflow
    this.listeners = new Set();
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };
    
    this.intercept();
  }
  
  intercept() {
    const self = this;
    
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      console[method] = (...args) => {
        // Call original console method
        self.originalConsole[method].apply(console, args);
        
        // Capture log
        self.capture(method, args);
      };
    });
  }
  
  capture(level, args) {
    const logEntry = {
      timestamp: Date.now(),
      level,
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return '[Circular Object]';
          }
        }
        return String(arg);
      }).join(' '),
      stack: level === 'error' ? new Error().stack : null,
    };
    
    this.logs.push(logEntry);
    
    // Trim if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    this.notifyListeners(logEntry);
  }
  
  getLogs(filter = {}) {
    let filtered = [...this.logs];
    
    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }
    
    if (filter.search) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(filter.search.toLowerCase())
      );
    }
    
    if (filter.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since);
    }
    
    return filtered;
  }
  
  clear() {
    this.logs = [];
    this.notifyListeners(null);
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  notifyListeners(newLog) {
    this.listeners.forEach(listener => listener(newLog));
  }
  
  exportJSON() {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      logs: this.logs,
      metadata: {
        totalLogs: this.logs.length,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }
    }, null, 2);
  }
}

// Global singleton
if (typeof window !== 'undefined') {
  window.__DEBUG_LOGGER__ = new DebugLogger();
}

export default DebugLogger;
```

### Logger UI Component

```jsx
// src/components/Debug/DebugLogViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import BugReportIcon from '@mui/icons-material/BugReport';

const LEVEL_COLORS = {
  log: 'default',
  info: 'info',
  warn: 'warning',
  error: 'error',
  debug: 'secondary',
};

const LEVEL_ICONS = {
  log: <BugReportIcon fontSize="small" />,
  info: <InfoIcon fontSize="small" />,
  warn: <WarningIcon fontSize="small" />,
  error: <ErrorIcon fontSize="small" />,
  debug: <BugReportIcon fontSize="small" />,
};

export function DebugLogViewer() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ level: null, search: '' });
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef(null);
  
  useEffect(() => {
    if (!window.__DEBUG_LOGGER__) return;
    
    // Initial load
    setLogs(window.__DEBUG_LOGGER__.getLogs());
    
    // Subscribe to new logs
    const unsubscribe = window.__DEBUG_LOGGER__.subscribe((newLog) => {
      if (newLog) {
        setLogs(prev => [...prev, newLog]);
      } else {
        setLogs([]); // Clear
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);
  
  const handleClear = () => {
    if (window.__DEBUG_LOGGER__) {
      window.__DEBUG_LOGGER__.clear();
    }
  };
  
  const filteredLogs = logs.filter(log => {
    if (filter.level && log.level !== filter.level) return false;
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">
            Debug Logs ({filteredLogs.length}/{logs.length})
          </Typography>
          <IconButton onClick={handleClear} size="small">
            <ClearIcon />
          </IconButton>
        </Box>
        
        {/* Filters */}
        <Box display="flex" gap={1} mt={1}>
          <ToggleButtonGroup
            value={filter.level}
            exclusive
            onChange={(e, value) => setFilter({ ...filter, level: value })}
            size="small"
          >
            <ToggleButton value="log">Log</ToggleButton>
            <ToggleButton value="info">Info</ToggleButton>
            <ToggleButton value="warn">Warn</ToggleButton>
            <ToggleButton value="error">Error</ToggleButton>
            <ToggleButton value="debug">Debug</ToggleButton>
          </ToggleButtonGroup>
          
          <TextField
            placeholder="Search logs..."
            size="small"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            sx={{ flexGrow: 1 }}
          />
        </Box>
      </Box>
      
      {/* Log List */}
      <List
        ref={listRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'grey.900',
          color: 'grey.100',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        }}
      >
        {filteredLogs.map((log, index) => (
          <ListItem
            key={index}
            sx={{
              borderBottom: 1,
              borderColor: 'grey.800',
              alignItems: 'flex-start',
            }}
          >
            <Box display="flex" gap={1} width="100%">
              <Chip
                icon={LEVEL_ICONS[log.level]}
                label={log.level.toUpperCase()}
                color={LEVEL_COLORS[log.level]}
                size="small"
                sx={{ minWidth: 80 }}
              />
              
              <Box flexGrow={1}>
                <Typography variant="caption" color="grey.500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0,
                  }}
                >
                  {log.message}
                </Typography>
                
                {log.stack && (
                  <Typography
                    component="pre"
                    variant="caption"
                    color="error"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      mt: 1,
                      opacity: 0.7,
                    }}
                  >
                    {log.stack}
                  </Typography>
                )}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
```

---

## State Snapshot System

### Capture Full App State

**Snapshot includes**:
1. **React Component Tree** (from ComponentTreeStore)
2. **Console Logs** (from DebugLogger)
3. **DataStore Models** (all cached items)
4. **React Context** (UnitContext, FilesContext, etc.)
5. **Browser Info** (userAgent, screen size, localStorage)
6. **Network Requests** (recent API calls)
7. **Error Boundary Catches** (recent errors)
8. **User Actions Timeline** (last 50 interactions)

### Implementation

```javascript
// src/utils/StateSnapshot.js
import { DataStore } from 'aws-amplify/datastore';
import { Unit, Word, File, Question, Grade, Section } from '../models';

export async function captureStateSnapshot() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    
    // Browser environment
    environment: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
    },
    
    // Local Storage
    localStorage: captureLocalStorage(),
    
    // Session Storage
    sessionStorage: captureSessionStorage(),
    
    // Component Tree
    componentTree: window.__COMPONENT_TREE__?.exportJSON() || null,
    
    // Debug Logs
    logs: window.__DEBUG_LOGGER__?.exportJSON() || null,
    
    // DataStore State
    dataStore: await captureDataStoreState(),
    
    // React Context (if available)
    contexts: captureContexts(),
    
    // Performance Metrics
    performance: capturePerformanceMetrics(),
    
    // Recent Errors
    errors: window.__ERROR_BOUNDARY__?.getRecentErrors() || [],
  };
  
  return snapshot;
}

function captureLocalStorage() {
  const items = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    items[key] = localStorage.getItem(key);
  }
  return items;
}

function captureSessionStorage() {
  const items = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    items[key] = sessionStorage.getItem(key);
  }
  return items;
}

async function captureDataStoreState() {
  try {
    const [units, words, files, questions, grades, sections] = await Promise.all([
      DataStore.query(Unit),
      DataStore.query(Word),
      DataStore.query(File),
      DataStore.query(Question),
      DataStore.query(Grade),
      DataStore.query(Section),
    ]);
    
    return {
      units: units.map(sanitizeModel),
      words: words.map(sanitizeModel),
      files: files.map(sanitizeModel),
      questions: questions.map(sanitizeModel),
      grades: grades.map(sanitizeModel),
      sections: sections.map(sanitizeModel),
      metadata: {
        syncStatus: await DataStore.query('SyncStatus'), // If available
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

function sanitizeModel(model) {
  // Remove sensitive data, keep structure
  const sanitized = { ...model };
  
  // Remove large binary data
  delete sanitized.data; // Large JSON fields
  delete sanitized.audio; // Audio blobs
  
  // Keep IDs, names, basic metadata
  return {
    id: sanitized.id,
    _version: sanitized._version,
    _lastChangedAt: sanitized._lastChangedAt,
    _deleted: sanitized._deleted,
    // Include other non-sensitive fields
    ...Object.keys(sanitized).reduce((acc, key) => {
      if (key.startsWith('_') || ['id', 'name', 'title', 'type'].includes(key)) {
        acc[key] = sanitized[key];
      }
      return acc;
    }, {})
  };
}

function captureContexts() {
  // Manually collect context values if exposed on window
  return {
    unit: window.__UNIT_CONTEXT__ || null,
    files: window.__FILES_CONTEXT__ || null,
    session: window.__SESSION_CONTEXT__ || null,
  };
}

function capturePerformanceMetrics() {
  if (!window.performance) return null;
  
  return {
    navigation: window.performance.getEntriesByType('navigation')[0],
    memory: window.performance.memory ? {
      usedJSHeapSize: window.performance.memory.usedJSHeapSize,
      totalJSHeapSize: window.performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
    } : null,
    timing: {
      domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
      loadComplete: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
    }
  };
}
```

---

## S3 Upload & Support Integration

### Upload Diagnostic to S3

```javascript
// src/utils/uploadDiagnostic.js
import { uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { captureStateSnapshot } from './StateSnapshot';

export async function uploadDiagnosticToS3(description = '') {
  try {
    // Get current user
    const session = await fetchAuthSession();
    const userId = session.identityId || 'anonymous';
    
    // Capture state snapshot
    const snapshot = await captureStateSnapshot();
    
    // Add user description
    snapshot.userDescription = description;
    snapshot.userId = userId;
    
    // Generate filename
    const timestamp = Date.now();
    const filename = `diagnostics/${userId}/${timestamp}-diagnostic.json`;
    
    // Convert to blob
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json'
    });
    
    // Upload to S3
    const result = await uploadData({
      key: filename,
      data: blob,
      options: {
        contentType: 'application/json',
        metadata: {
          userId,
          timestamp: timestamp.toString(),
          url: window.location.href,
        }
      }
    }).result;
    
    console.log('Diagnostic uploaded:', result.key);
    
    // Return shareable info
    return {
      success: true,
      key: result.key,
      timestamp,
      userId,
      shareableId: btoa(result.key), // Base64 encode for URL
    };
  } catch (error) {
    console.error('Failed to upload diagnostic:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Download diagnostic from S3 (support team)
export async function downloadDiagnostic(shareableId) {
  try {
    const key = atob(shareableId); // Decode base64
    
    const { body } = await getUrl({
      key,
      options: {
        download: true,
      }
    });
    
    const text = await body.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to download diagnostic:', error);
    throw error;
  }
}
```

### Report Issue UI

```jsx
// src/components/Debug/ReportIssueDialog.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadDiagnosticToS3 } from '../../utils/uploadDiagnostic';

export function ReportIssueDialog({ open, onClose }) {
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleSubmit = async () => {
    setUploading(true);
    setResult(null);
    
    try {
      const uploadResult = await uploadDiagnosticToS3(description);
      setResult(uploadResult);
      
      if (uploadResult.success) {
        // Optionally send notification to support team
        await notifySupportTeam(uploadResult);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report an Issue</DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" paragraph>
          This will capture your current app state (component tree, logs, DataStore data)
          and upload it to our support team for investigation.
        </Typography>
        
        <TextField
          label="What happened? (optional)"
          placeholder="Describe the issue you encountered..."
          multiline
          rows={4}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={uploading || result?.success}
          sx={{ mt: 2 }}
        />
        
        {result && (
          <Alert
            severity={result.success ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            {result.success ? (
              <Box>
                <Typography variant="body2">
                  Diagnostic uploaded successfully!
                </Typography>
                <Typography variant="caption" component="div">
                  Reference ID: {result.shareableId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Share this ID with support for faster assistance.
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2">
                Upload failed: {result.error}
              </Typography>
            )}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          {result?.success ? 'Close' : 'Cancel'}
        </Button>
        
        {!result?.success && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Submit Report'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

async function notifySupportTeam(uploadResult) {
  // Send email or create support ticket
  // Could use AWS SES, SendGrid, or create a DynamoDB record
  
  try {
    await fetch('/api/support/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosticId: uploadResult.shareableId,
        userId: uploadResult.userId,
        timestamp: uploadResult.timestamp,
      })
    });
  } catch (error) {
    console.error('Failed to notify support:', error);
  }
}
```

---

## UI Components

### Floating Debug Panel

```jsx
// src/components/Debug/DebugPanel.jsx
import React, { useState } from 'react';
import {
  Fab,
  Drawer,
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Tooltip,
  Button,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ComponentTreeView } from './ComponentTreeView';
import { DebugLogViewer } from './DebugLogViewer';
import { StateInspector } from './StateInspector';
import { ReportIssueDialog } from './ReportIssueDialog';

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  // Only show in development or for admins
  const shouldShow = process.env.NODE_ENV === 'development' || 
                     window.location.search.includes('debug=true');
  
  if (!shouldShow) return null;
  
  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="secondary"
        aria-label="debug"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
        }}
      >
        <BugReportIcon />
      </Fab>
      
      {/* Debug Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 600, md: 800 },
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}>
            <Typography variant="h6">🐛 Debug Panel</Typography>
            
            <Box>
              <Tooltip title="Report Issue">
                <IconButton onClick={() => setReportDialogOpen(true)}>
                  <CloudUploadIcon />
                </IconButton>
              </Tooltip>
              
              <IconButton onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(e, newValue) => setTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Component Tree" />
            <Tab label="Console Logs" />
            <Tab label="State Inspector" />
          </Tabs>
          
          {/* Tab Content */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            {tab === 0 && <ComponentTreeView />}
            {tab === 1 && <DebugLogViewer />}
            {tab === 2 && <StateInspector />}
          </Box>
        </Box>
      </Drawer>
      
      {/* Report Issue Dialog */}
      <ReportIssueDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </>
  );
}
```

### State Inspector Component

```jsx
// src/components/Debug/StateInspector.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import { captureStateSnapshot } from '../../utils/StateSnapshot';

export function StateInspector() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleCapture = async () => {
    setLoading(true);
    try {
      const data = await captureStateSnapshot();
      setSnapshot(data);
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!snapshot) return;
    
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  useEffect(() => {
    handleCapture();
  }, []);
  
  if (!snapshot) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          onClick={handleCapture}
          disabled={loading}
        >
          {loading ? 'Capturing...' : 'Capture State'}
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">State Snapshot</Typography>
          
          <Box>
            <Button
              size="small"
              onClick={handleCapture}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download JSON
            </Button>
          </Box>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Captured at: {new Date(snapshot.timestamp).toLocaleString()}
        </Typography>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <StateSection title="Environment" data={snapshot.environment} />
        <StateSection title="DataStore" data={snapshot.dataStore} />
        <StateSection title="Local Storage" data={snapshot.localStorage} />
        <StateSection title="Performance" data={snapshot.performance} />
        <StateSection title="Errors" data={snapshot.errors} />
      </Box>
    </Box>
  );
}

function StateSection({ title, data }) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.900',
            color: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
```

---

## Implementation

### Phase 1: Core Infrastructure (Week 1, 20 hours)

**Tasks**:
1. Create ComponentTreeStore
2. Create DebugLogger with console interception
3. Create StateSnapshot utility
4. Test data capture

**Deliverables**:
- ✅ Component tree tracking working
- ✅ Console logs captured
- ✅ State snapshot generates valid JSON

### Phase 2: UI Components (Week 2, 24 hours)

**Tasks**:
1. Build DebugPanel floating button
2. Build ComponentTreeView
3. Build DebugLogViewer
4. Build StateInspector
5. Add tabs and navigation

**Deliverables**:
- ✅ Debug panel accessible via FAB
- ✅ All three views functional
- ✅ UI polished and responsive

### Phase 3: S3 Integration (Week 3, 16 hours)

**Tasks**:
1. Implement uploadDiagnosticToS3
2. Build ReportIssueDialog
3. Add support team notification (email/ticket)
4. Test upload/download flow

**Deliverables**:
- ✅ One-click diagnostic upload
- ✅ Shareable diagnostic IDs
- ✅ Support team notified

### Phase 4: Advanced Features (Week 4, 20 hours)

**Tasks**:
1. Add Error Boundary integration
2. Add network request logging
3. Add user action timeline
4. Performance optimizations

**Deliverables**:
- ✅ Comprehensive error capture
- ✅ Network tab in debug panel
- ✅ Action replay timeline

### Phase 5: Testing & Documentation (Week 5, 10 hours)

**Tasks**:
1. Write tests for snapshot capture
2. Document debug panel usage
3. Train support team on diagnostic review
4. Create admin diagnostic viewer

**Deliverables**:
- ✅ Tested and documented
- ✅ Support team trained
- ✅ Admin tools deployed

**Total**: 5 weeks, ~90 hours

---

## Security & Privacy

### Data Sanitization

**Remove sensitive information**:
- ❌ Passwords, tokens, API keys
- ❌ Personal student data (names, emails)
- ❌ Payment information
- ❌ Large binary data (audio files, images)
- ✅ Keep: IDs, timestamps, metadata, error messages

### Access Control

**Who can access diagnostics**:
- ✅ **Admins** - Full access to all diagnostics
- ✅ **Instructors** - Access to their students' diagnostics (with permission)
- ✅ **Support Team** - Read-only access via shareable links
- ❌ **Students** - Can only upload their own diagnostics

### S3 Bucket Configuration

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DiagnosticUpload",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/authenticated-role"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::bucket/diagnostics/${cognito-identity.amazonaws.com:sub}/*"
    },
    {
      "Sid": "AdminAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/admin-role"
      },
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::bucket/diagnostics",
        "arn:aws:s3:::bucket/diagnostics/*"
      ]
    }
  ]
}
```

### GDPR Compliance

**Data retention policy**:
- Diagnostics auto-delete after 30 days
- Users can request diagnostic deletion
- Lambda function for cleanup:

```javascript
// amplify/backend/function/cleanupDiagnostics/src/index.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const bucket = process.env.BUCKET_NAME;
  const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
  
  // List old diagnostics
  const objects = await s3.listObjectsV2({
    Bucket: bucket,
    Prefix: 'diagnostics/'
  }).promise();
  
  const toDelete = objects.Contents.filter(obj => {
    return new Date(obj.LastModified).getTime() < cutoffDate;
  });
  
  // Delete in batches
  if (toDelete.length > 0) {
    await s3.deleteObjects({
      Bucket: bucket,
      Delete: {
        Objects: toDelete.map(obj => ({ Key: obj.Key }))
      }
    }).promise();
  }
  
  return { deleted: toDelete.length };
};
```

---

## Usage Examples

### Enable Debug Panel in Production

Add `?debug=true` to URL or enable for specific users:

```javascript
// pages/_app.js
import { DebugPanel } from '../src/components/Debug/DebugPanel';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <DebugPanel /> {/* Automatically hides in production unless ?debug=true */}
    </>
  );
}
```

### Programmatic Error Reporting

```javascript
// Automatically upload diagnostic on critical error
try {
  await criticalOperation();
} catch (error) {
  console.error('Critical error:', error);
  
  // Auto-report
  await uploadDiagnosticToS3(`Critical error: ${error.message}`);
  
  // Show user-friendly message
  alert('An error occurred. Our team has been notified.');
}
```

### Support Team Diagnostic Review

```javascript
// Admin page to view diagnostics
const DiagnosticViewer = ({ shareableId }) => {
  const [diagnostic, setDiagnostic] = useState(null);
  
  useEffect(() => {
    downloadDiagnostic(shareableId).then(setDiagnostic);
  }, [shareableId]);
  
  return (
    <Box>
      <Typography variant="h4">Diagnostic Report</Typography>
      <StateInspector snapshot={diagnostic} />
    </Box>
  );
};
```

---

**Last Updated**: January 9, 2026  
**Status**: Ready for Implementation  
**Estimated Effort**: 90 hours over 5 weeks
