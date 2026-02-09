# Debug Panel System - Usage Guide

## Overview

The Debug Panel is a development-only tool for inspecting application state, component tree, console logs, and performance metrics. It's automatically enabled in development and disabled in production.

## Quick Start

### Opening the Debug Panel

**Keyboard Shortcut:** `Cmd+Shift+D` (Mac) / `Ctrl+Shift+D` (Windows/Linux)

The panel opens as a drawer on the right side of the screen with four tabs:
- **Components** - Component tree viewer
- **Logs** - Console log viewer with filtering
- **State** - Application state inspector
- **Performance** - Performance metrics (coming soon)

## Features

### 1. Component Tree Viewer

Displays all registered React components with:
- Component name and instance ID
- Props and state values (JSON formatted)
- Render count tracking
- Grouping by component name
- Expandable detail views

**Usage:**
```tsx
import { useComponentInspector } from '@/utils/debug/useComponentInspector';

function MyComponent(props) {
  useComponentInspector('MyComponent', { props, state: someState });
  
  return <div>...</div>;
}
```

### 2. Log Viewer

Captures all console logs with:
- Level filtering (log, info, warn, error, debug)
- Text search
- Color-coded log levels
- Stack traces for errors
- Auto-scroll option
- Clear all logs button

**Features:**
- Automatically intercepts `console.log/info/warn/error/debug`
- Max 1000 logs (oldest removed first)
- Displays timestamps in readable format
- Shows error and warning count badges

### 3. State Inspector

Provides snapshot view of:
- **Environment** - Browser info, viewport, URL
- **LocalStorage** - All localStorage keys/values
- **SessionStorage** - All sessionStorage keys/values
- **Component Tree** - All registered components
- **Console Logs** - Recent log entries
- **DataStore** - Amplify DataStore models (with sync status)
- **Performance** - Memory usage, navigation timing
- **Errors** - Captured errors with stack traces

**Actions:**
- **Refresh** - Capture new snapshot
- **Export** - Download snapshot as JSON
- **Copy** - Copy individual sections to clipboard

### 4. Performance Tab (Coming Soon)

Will display:
- Memory usage graphs
- Render performance metrics
- Network request tracking
- DataStore query performance

## Architecture

### Core Utilities

**ComponentTreeStore** ([src/utils/debug/ComponentTreeStore.ts](src/utils/debug/ComponentTreeStore.ts))
- Singleton pattern for component registration
- Real-time component tree updates
- Export to JSON
- Subscription support

**DebugLogger** ([src/utils/debug/DebugLogger.ts](src/utils/debug/DebugLogger.ts))
- Console interception
- Log filtering by level/search/timestamp
- Max 1000 log limit
- Subscription support

**StateSnapshot** ([src/utils/debug/StateSnapshot.ts](src/utils/debug/StateSnapshot.ts))
- Captures full application state
- Includes localStorage, sessionStorage, DataStore
- Performance metrics from `performance` API
- Error tracking

**sanitizeComponentData** ([src/utils/debug/sanitizeComponentData.ts](src/utils/debug/sanitizeComponentData.ts))
- Removes circular references
- Converts functions to `[Function]` strings
- Handles React elements safely
- Nested object support

### React Components

**DebugPanel** ([src/components/DebugPanel/DebugPanel.tsx](src/components/DebugPanel/DebugPanel.tsx))
- Main Material-UI Drawer component
- Tab navigation
- Real-time data subscriptions
- Keyboard shortcut handling

**StateInspector** ([src/components/DebugPanel/StateInspector.tsx](src/components/DebugPanel/StateInspector.tsx))
- Accordion-based state display
- Export and copy functionality
- File size display

**ComponentTreeView** ([src/components/DebugPanel/ComponentTreeView.tsx](src/components/DebugPanel/ComponentTreeView.tsx))
- Hierarchical component display
- Expandable instances
- Props/state JSON formatting

**LogViewer** ([src/components/DebugPanel/LogViewer.tsx](src/components/DebugPanel/LogViewer.tsx))
- Filterable log display
- Search functionality
- Auto-scroll support

### Integration

**Global Provider** ([pages/_app.js](pages/_app.js))
```jsx
import { DebugPanelProvider } from '../src/components/DebugPanel';

function MyApp({ Component, pageProps }) {
  return (
    <DebugPanelProvider>
      <Component {...pageProps} />
    </DebugPanelProvider>
  );
}
```

**Environment Control**
- Automatically disabled when `NODE_ENV === 'production'`
- Can be manually disabled: `<DebugPanelProvider enabled={false}>`
- Uses `process.env.NODE_ENV` check at build time

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+D` (Mac) | Toggle Debug Panel |
| `Ctrl+Shift+D` (Windows/Linux) | Toggle Debug Panel |

## Advanced Usage

### Manual Component Registration

```tsx
import { ComponentTreeStore } from '@/utils/debug/ComponentTreeStore';

const store = ComponentTreeStore.getInstance();

// Register a component
store.register({
  id: 'my-component-1',
  name: 'MyComponent',
  props: { foo: 'bar' },
  state: { count: 0 },
  renderCount: 1,
});

// Subscribe to updates
const unsubscribe = store.subscribe((tree) => {
  console.log('Component tree updated:', tree);
});

// Clean up
unsubscribe();
```

### Access Debug Logger Programmatically

```tsx
if (typeof window !== 'undefined' && window.__DEBUG_LOGGER__) {
  const logger = window.__DEBUG_LOGGER__;
  
  // Get all logs
  const allLogs = logger.getLogs();
  
  // Get filtered logs
  const errors = logger.getLogs({ level: 'error' });
  const recent = logger.getLogs({ since: Date.now() - 60000 }); // Last minute
  const searched = logger.getLogs({ search: 'network' });
  
  // Subscribe to new logs
  const unsubscribe = logger.subscribe((log) => {
    console.log('New log:', log);
  });
  
  // Clear all logs
  logger.clear();
}
```

### Capture State Snapshot

```tsx
import { captureStateSnapshot } from '@/utils/debug/StateSnapshot';

async function debugCurrentState() {
  const snapshot = await captureStateSnapshot();
  
  console.log('Environment:', snapshot.environment);
  console.log('Components:', snapshot.componentTree);
  console.log('Memory:', snapshot.performance.memory);
  
  // Export to file
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `state-${Date.now()}.json`;
  a.click();
}
```

## Testing

### Unit Tests

Located in:
- `src/utils/debug/__tests__/` - Utility tests (72 tests, 95.83% coverage)
- `src/components/DebugPanel/__tests__/` - Component tests (43 tests)

Run tests:
```bash
npm test -- src/utils/debug/__tests__
npm test -- src/components/DebugPanel/__tests__
```

### Storybook

View components in isolation:
```bash
npm run storybook
```

Stories available:
- `Components/DebugPanel/DebugPanel` - Main panel with all tabs
- `Components/DebugPanel/StateInspector` - State viewer
- `Components/DebugPanel/ComponentTreeView` - Component tree
- `Components/DebugPanel/LogViewer` - Log viewer

## Performance Considerations

### Component Tree

- Uses `Map` for O(1) component lookup
- Sanitizes data before storing (removes circular refs)
- Subscribe to updates rather than polling

### Debug Logger

- Max 1000 logs (configurable)
- Oldest logs removed first (FIFO)
- Efficient filtering with native array methods
- Subscribers notified only on new logs

### State Snapshot

- Captured on-demand (not continuous)
- DataStore queries use `observeQuery` for efficiency
- Performance metrics from native `performance` API

## Troubleshooting

**Panel won't open:**
- Check keyboard shortcut fired: Look for "Debug panel toggled" in console
- Verify `NODE_ENV=development`
- Check browser console for errors

**Components not showing:**
- Components must use `useComponentInspector` hook
- Verify window.__COMPONENT_TREE__ exists in console
- Check component is actually mounted

**Logs not capturing:**
- Logger auto-initializes on first render
- Check window.__DEBUG_LOGGER__ exists
- Verify console methods not overridden elsewhere

**State snapshot empty:**
- Click "Refresh" button to capture new snapshot
- Check DataStore is initialized (Amplify configured)
- Performance API may not be available in some browsers

## Future Enhancements

### Phase 3 - Advanced Features
- [ ] Performance monitoring with graphs
- [ ] Network request tracker
- [ ] DataStore query viewer with execution times
- [ ] Event log export in multiple formats (CSV, JSON, XML)

### Phase 5 - Testing & Documentation
- [ ] E2E tests with Cypress
- [ ] Comprehensive usage examples
- [ ] Video walkthrough
- [ ] Integration guides for custom components

## API Reference

See TypeScript definitions in:
- [src/components/DebugPanel/types.ts](src/components/DebugPanel/types.ts)
- [src/utils/debug/ComponentTreeStore.ts](src/utils/debug/ComponentTreeStore.ts)
- [src/utils/debug/DebugLogger.ts](src/utils/debug/DebugLogger.ts)
- [src/utils/debug/StateSnapshot.ts](src/utils/debug/StateSnapshot.ts)

## License

Internal development tool - not for production use.
