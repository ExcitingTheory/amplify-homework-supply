# Feature: Debug Panel & State Inspector

**Last Updated**: February 6, 2026  
**Status**: 🟡 In Progress - Phase 1  
**Component Version**: New TypeScript implementation  
**Type Safety**: Strict mode enabled

## Overview

Production debugging and support diagnostics system that provides visibility into React component state, console logs, DataStore sync, and application state. Enables one-click diagnostic uploads to S3 for support team investigation.

## Goals

### Primary Objectives
- Enable production debugging without developer tools access
- Capture full application state for support diagnostics
- Provide component tree visualization for debugging
- Track console output and errors in real-time
- Export diagnostic data to S3 with shareable links
- Support student bug reporting workflow

### Success Criteria
- [ ] Debug panel accessible via FAB or `?debug=true` URL parameter
- [ ] Component tree tracks all registered components
- [ ] Console logs captured with filtering and search
- [ ] State snapshot includes DataStore, contexts, localStorage
- [ ] One-click upload to S3 generates shareable diagnostic ID
- [ ] Zero performance impact when panel is closed
- [ ] All code passes `tsc --noEmit` with strict mode
- [ ] >80% test coverage

## Technical Requirements

### TypeScript Version
- TypeScript 5.x
- Strict mode enabled
- No `any` types allowed (except for external library compatibility)
- ESLint TypeScript rules enforced

### Required Dependencies
- React 18+
- Material-UI (@mui/material)
- AWS Amplify Gen 2 (for S3 uploads)
- next-i18next (for translations)

### Type Safety Requirements
- All component props must have interfaces
- All utility functions must have typed parameters and return types
- DataStore models must use generated types
- Context providers must have typed values
- Event handlers must have proper React event types

## API Design

### Core Utilities

#### ComponentTreeStore
```typescript
interface ComponentMetadata {
  id: string;
  name: string;
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  mountTime: number;
  renderCount: number;
  lastRenderTime: number;
  children: ComponentMetadata[];
}

class ComponentTreeStore {
  register(data: Omit<ComponentMetadata, 'id' | 'children'>): void;
  unregister(componentName: string): void;
  getTree(): ComponentMetadata[];
  subscribe(listener: (tree: ComponentMetadata[]) => void): () => void;
  exportJSON(): string;
  clear(): void;
}
```

#### DebugLogger
```typescript
type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  stack: string | null;
}

interface LogFilter {
  level?: LogLevel;
  search?: string;
  since?: number;
}

class DebugLogger {
  getLogs(filter?: LogFilter): LogEntry[];
  clear(): void;
  subscribe(listener: (log: LogEntry | null) => void): () => void;
  exportJSON(): string;
  restore(): void;
}
```

#### StateSnapshot
```typescript
interface StateSnapshot {
  timestamp: string;
  version: string;
  environment: EnvironmentInfo;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  componentTree: string | null;
  logs: string | null;
  dataStore: DataStoreState;
  contexts: Record<string, unknown>;
  performance: PerformanceMetrics | null;
  errors: ErrorInfo[];
}

async function captureStateSnapshot(): Promise<StateSnapshot>;
```

#### Diagnostic Upload
```typescript
interface DiagnosticUploadResult {
  success: boolean;
  key?: string;
  timestamp?: number;
  userId?: string;
  shareableId?: string;
  error?: string;
}

async function uploadDiagnosticToS3(description?: string): Promise<DiagnosticUploadResult>;
async function downloadDiagnostic(shareableId: string): Promise<StateSnapshot>;
```

### React Components

#### DebugPanel
```typescript
interface DebugPanelProps {
  defaultOpen?: boolean;
  showInProduction?: boolean;
}

export function DebugPanel(props: DebugPanelProps): JSX.Element | null;
```

#### ComponentTreeView
```typescript
interface ComponentTreeViewProps {
  onComponentSelect?: (component: ComponentMetadata) => void;
}

export function ComponentTreeView(props: ComponentTreeViewProps): JSX.Element;
```

#### DebugLogViewer
```typescript
interface DebugLogViewerProps {
  autoScroll?: boolean;
  maxHeight?: number;
}

export function DebugLogViewer(props: DebugLogViewerProps): JSX.Element;
```

#### StateInspector
```typescript
interface StateInspectorProps {
  onDownload?: (snapshot: StateSnapshot) => void;
}

export function StateInspector(props: StateInspectorProps): JSX.Element;
```

#### ReportIssueDialog
```typescript
interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (result: DiagnosticUploadResult) => void;
}

export function ReportIssueDialog(props: ReportIssueDialogProps): JSX.Element;
```

### React Hooks

#### useComponentInspector
```typescript
function useComponentInspector(
  componentName: string,
  props: Record<string, unknown>,
  state?: Record<string, unknown>
): number; // Returns render count
```

## Implementation Notes

### Performance Considerations
- Component tree registration should use `useEffect` with minimal dependencies
- Console interception should have negligible overhead
- State snapshots should be lazy - only capture on demand
- Sanitization functions must handle circular references
- Max log storage limit (1000 entries) to prevent memory leaks

### Security Considerations
- Sanitize all captured data to remove sensitive information
- Filter out passwords, tokens, API keys from logs
- Redact PII from DataStore models
- S3 bucket must have proper IAM policies
- Diagnostic files should have cognito-based access control
- Auto-delete diagnostics after 30 days (GDPR compliance)

### Global State Management
```typescript
// Window interface extensions
declare global {
  interface Window {
    __COMPONENT_TREE__?: ComponentTreeStore;
    __DEBUG_LOGGER__?: DebugLogger;
    __ERROR_BOUNDARY__?: {
      getRecentErrors(): ErrorInfo[];
    };
  }
}
```

## Edge Cases

### Boundary Conditions
- Empty component tree (no components registered)
- Zero logs captured
- DataStore not initialized
- Auth not available (anonymous users)
- S3 upload failures (network issues)
- Circular references in captured objects
- Very large state objects (>1MB)

### Error Scenarios
- TypeScript compilation errors must block progression
- Component registration during unmount
- Console.log called with non-serializable objects
- State snapshot capture throws exception
- S3 permissions denied
- Invalid shareable ID format

### Invalid Input Handling
- Null/undefined component props
- Non-string component names
- Invalid log filter parameters
- Malformed snapshot data
- Missing required auth credentials

## Development Phases

### Phase 1: Core Infrastructure (TypeScript Utilities)
**Estimated Effort**: 12 hours

**Deliverables**:
- ComponentTreeStore class with full typing
- DebugLogger class with console interception
- Sanitization utilities (props, state, models, errors)
- useComponentInspector hook
- StateSnapshot utility with DataStore capture
- All utilities pass TypeScript strict mode
- Unit tests for all utilities (>80% coverage)

### Phase 2: UI Components (React + MUI)
**Estimated Effort**: 16 hours

**Deliverables**:
- DebugPanel floating FAB with drawer
- ComponentTreeView with accordion tree
- ComponentDetails display table
- DebugLogViewer with filtering
- StateInspector with download
- Tab navigation between views
- All components fully typed
- Storybook stories for all components

### Phase 3: S3 Integration & Diagnostics
**Estimated Effort**: 10 hours

**Deliverables**:
- uploadDiagnosticToS3 typed function
- downloadDiagnostic typed function  
- ReportIssueDialog component
- Shareable ID generation
- S3 bucket configuration
- Support notification system
- Error handling and retries

### Phase 4: Advanced Features
**Estimated Effort**: 12 hours

**Deliverables**:
- Error Boundary integration
- Network request logging
- User action timeline
- Performance monitoring
- Optimizations and caching
- Data sanitization for GDPR

### Phase 5: Integration & Testing
**Estimated Effort**: 8 hours

**Deliverables**:
- Integrate DebugPanel in pages/_app.tsx
- `?debug=true` URL parameter handling
- Full E2E testing
- Storybook validation
- Documentation
- Admin diagnostic viewer

**Total Estimated Effort**: 58 hours across 5 phases

## Migration Strategy

N/A - This is a new feature, not a rewrite.

## Related Documentation

- [Debug Panel System Design](DEBUG_PANEL_SYSTEM.md) - Original design document
- [TypeScript Migration Guide](TYPESCRIPT_MIGRATION.md) - Project TS practices
- [Testing Guide](DEBUG_PANEL_TESTING_GUIDE.md) - Test strategy for this feature
- [API Documentation](API.md) - DataStore models reference
