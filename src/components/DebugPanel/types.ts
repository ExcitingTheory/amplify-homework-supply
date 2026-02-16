/**
 * TypeScript interfaces for DebugPanel components
 */

import { ComponentMetadata } from '../../utils/debug/ComponentTreeStore';
import { LogEntry } from '../../utils/debug/DebugLogger';
import { StateSnapshot } from '../../utils/debug/StateSnapshot';

/**
 * Tab IDs for the debug panel
 */
export type DebugPanelTab = 'components' | 'logs' | 'state' | 'performance';

/**
 * Props for the main DebugPanel component
 */
export interface DebugPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Initial tab to display */
  defaultTab?: DebugPanelTab;
  /** Position of the panel */
  position?: 'left' | 'right' | 'bottom';
  /** Width of the panel (for left/right positions) */
  width?: number | string;
  /** Height of the panel (for bottom position) */
  height?: number | string;
}

/**
 * Props for ComponentTreeView
 */
export interface ComponentTreeViewProps {
  /** Component tree data */
  tree: ComponentMetadata[];
  /** Callback when component is selected */
  onSelectComponent?: (component: ComponentMetadata) => void;
  /** Currently selected component ID */
  selectedId?: string;
}

/**
 * Props for LogViewer
 */
export interface LogViewerProps {
  /** Log entries to display */
  logs: LogEntry[];
  /** Callback when logs are cleared */
  onClear?: () => void;
  /** Whether to auto-scroll to newest logs */
  autoScroll?: boolean;
}

/**
 * Props for StateInspector
 */
export interface StateInspectorProps {
  /** Current state snapshot */
  snapshot: StateSnapshot | null;
  /** Callback to refresh snapshot */
  onRefresh?: () => void;
  /** Callback to export snapshot */
  onExport?: (snapshot: StateSnapshot) => void;  /** Callback to send snapshot to Discord */
  onSendToDiscord?: (snapshot: StateSnapshot) => void;}

/**
 * Filter options for logs
 */
export interface LogFilterOptions {
  level?: 'log' | 'warn' | 'error' | 'info' | 'debug';
  search?: string;
  since?: number;
}
