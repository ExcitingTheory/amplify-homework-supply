/**
 * DebugLogger - Intercepts and captures console output for debugging
 * 
 * Captures all console.log, warn, error, info, and debug calls
 * Stores them with timestamps and provides filtering capabilities
 * 
 * @example
 * ```typescript
 * // Logger automatically intercepts console
 * console.log('Hello', { data: 123 });
 * 
 * // Get all logs
 * window.__DEBUG_LOGGER__.getLogs();
 * 
 * // Subscribe to new logs
 * window.__DEBUG_LOGGER__.subscribe(newLog => {
 *   console.log('New log:', newLog);
 * });
 * ```
 */

/**
 * Log severity levels
 */
export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

/**
 * A single log entry
 */
export interface LogEntry {
  /** Timestamp when log was captured */
  timestamp: number;
  /** Log severity level */
  level: LogLevel;
  /** Serialized message string */
  message: string;
  /** Stack trace (only for errors) */
  stack: string | null;
}

/**
 * Filter options for querying logs
 */
export interface LogFilter {
  /** Filter by specific log level */
  level?: LogLevel;
  /** Search term to match in message */
  search?: string;
  /** Only return logs after this timestamp */
  since?: number;
}

/**
 * Listener function that receives new log entries
 */
export type LogListener = (log: LogEntry | null) => void;

/**
 * Original console methods before interception
 */
interface OriginalConsoleMethods {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
  info: typeof console.info;
  debug: typeof console.debug;
}

/**
 * DebugLogger class - Intercepts and stores console output
 */
class DebugLogger {
  private logs: LogEntry[];
  private maxLogs: number;
  private listeners: Set<LogListener>;
  private originalConsole: OriginalConsoleMethods;

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

  /**
   * Intercept console methods
   * @private
   */
  private intercept(): void {
    const methods: LogLevel[] = ['log', 'warn', 'error', 'info', 'debug'];
    
    methods.forEach(method => {
      console[method] = (...args: unknown[]) => {
        // Call original console method first to maintain normal console behavior
        try {
          this.originalConsole[method].apply(console, args);
        } catch (err) {
          // Silently fail if original console fails
        }
        
        // Capture the log
        this.capture(method, args);
      };
    });
  }

  /**
   * Capture a log entry
   * @private
   * @param level - Log level
   * @param args - Arguments passed to console method
   */
  private capture(level: LogLevel, args: unknown[]): void {
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message: args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return '[Circular or non-serializable object]';
          }
        }
        return String(arg);
      }).join(' '),
      stack: level === 'error' ? new Error().stack || null : null,
    };
    
    this.logs.push(logEntry);
    
    // Trim if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    this.notifyListeners(logEntry);
  }

  /**
   * Get filtered logs
   * @param filter - Filter options
   * @returns Filtered log entries
   */
  getLogs(filter: LogFilter = {}): LogEntry[] {
    let filtered = [...this.logs];
    
    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }
    
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower)
      );
    }
    
    if (filter.since) {
      const since = filter.since;
      filtered = filtered.filter(log => log.timestamp >= since);
    }
    
    return filtered;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    this.notifyListeners(null);
  }

  /**
   * Subscribe to new log events
   * @param listener - Callback receiving new log entries
   * @returns Unsubscribe function
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of new log
   * @private
   * @param newLog - New log entry or null for clear event
   */
  private notifyListeners(newLog: LogEntry | null): void {
    this.listeners.forEach(listener => listener(newLog));
  }

  /**
   * Export logs as JSON
   * @returns JSON representation of all logs
   */
  exportJSON(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      logs: this.logs,
      metadata: {
        totalLogs: this.logs.length,
        version: '1.0.0',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      }
    }, null, 2);
  }

  /**
   * Restore original console methods
   * Useful for testing or disabling debug logging
   */
  restore(): void {
    const methods: LogLevel[] = ['log', 'warn', 'error', 'info', 'debug'];
    methods.forEach(method => {
      console[method] = this.originalConsole[method];
    });
  }
}

// Initialize global singleton
if (typeof window !== 'undefined') {
  window.__DEBUG_LOGGER__ = new DebugLogger();
}

export default DebugLogger;
