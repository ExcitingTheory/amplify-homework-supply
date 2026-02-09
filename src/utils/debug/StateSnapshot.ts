/**
 * StateSnapshot - Captures full application state for diagnostics
 * 
 * Includes component tree, logs, DataStore,contexts, localStorage, and performance metrics
 * Used for creating comprehensive diagnostic exports
 */

import { DataStore } from 'aws-amplify/datastore';
import { Unit, Word, File, Question, Grade, Section } from '../../models';
import { sanitizeModel } from './sanitizeComponentData';

/**
 * Browser environment information
 */
export interface EnvironmentInfo {
  url: string;
  userAgent: string;
  screenSize: {
    width: number;
    height: number;
  };
  viewport: {
    width: number;
    height: number;
  };
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  online: boolean;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  navigation: PerformanceEntry | null;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  timing: {
    domContentLoaded: number;
    loadComplete: number;
  };
}

/**
 * DataStore sync state
 */
export interface DataStoreState {
  units?: unknown[];
  words?: unknown[];
  files?: unknown[];
  questions?: unknown[];
  grades?: unknown[];
  sections?: unknown[];
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Error information
 */
export interface ErrorInfo {
  timestamp: number;
  message: string;
  stack?: string;
  componentStack?: string;
}

/**
 * Complete state snapshot
 */
export interface StateSnapshot {
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

/**
 * Capture localStorage contents
 */
function captureLocalStorage(): Record<string, string> {
  const items: Record<string, string> = {};
  if (typeof window === 'undefined') return items;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items[key] = localStorage.getItem(key) || '';
      }
    }
  } catch (error) {
    console.warn('Failed to capture localStorage:', error);
  }
  
  return items;
}

/**
 * Capture sessionStorage contents
 */
function captureSessionStorage(): Record<string, string> {
  const items: Record<string, string> = {};
  if (typeof window === 'undefined') return items;
  
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        items[key] = sessionStorage.getItem(key) || '';
      }
    }
  } catch (error) {
    console.warn('Failed to capture sessionStorage:', error);
  }
  
  return items;
}

/**
 * Capture DataStore state (Gen 1 DataStore)
 */
async function captureDataStoreState(): Promise<DataStoreState> {
  try {
    // Query all major models
    const [units, words, files, questions, grades, sections] = await Promise.all([
      DataStore.query(Unit).catch(() => []),
      DataStore.query(Word).catch(() => []),
      DataStore.query(File).catch(() => []),
      DataStore.query(Question).catch(() => []),
      DataStore.query(Grade).catch(() => []),
      DataStore.query(Section).catch(() => []),
    ]);
    
    return {
      units: units.map(sanitizeModel),
      words: words.map(sanitizeModel),
      files: files.map(sanitizeModel),
      questions: questions.map(sanitizeModel),
      grades: grades.map(sanitizeModel),
      sections: sections.map(sanitizeModel),
      metadata: {
        unitCount: units.length,
        wordCount: words.length,
        fileCount: files.length,
        questionCount: questions.length,
        gradeCount: grades.length,
        sectionCount: sections.length,
      }
    };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Unknown error capturing DataStore state' 
    };
  }
}

/**
 * Capture context values (if exposed on window)
 */
function captureContexts(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  
  return {
    unit: (window as { __UNIT_CONTEXT__?: unknown }).__UNIT_CONTEXT__ || null,
    files: (window as { __FILES_CONTEXT__?: unknown }).__FILES_CONTEXT__ || null,
    session: (window as { __SESSION_CONTEXT__?: unknown }).__SESSION_CONTEXT__ || null,
  };
}

/**
 * Capture performance metrics
 */
function capturePerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  const navigationEntries = window.performance.getEntriesByType('navigation');
  const memoryInfo = (window.performance as { memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } }).memory;
  
  return {
    navigation: navigationEntries[0] || null,
    memory: memoryInfo ? {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
    } : null,
    timing: {
      domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
      loadComplete: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
    }
  };
}

/**
 * Capture complete application state snapshot
 * @returns Complete state snapshot for diagnostic export
 */
export async function captureStateSnapshot(): Promise<StateSnapshot> {
  const snapshot: StateSnapshot = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    
    // Browser environment
    environment: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenSize: {
        width: typeof window !== 'undefined' ? window.screen.width : 0,
        height: typeof window !== 'undefined' ? window.screen.height : 0,
      },
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      },
      platform: typeof navigator !== 'undefined' ? navigator.platform : '',
      language: typeof navigator !== 'undefined' ? navigator.language : '',
      cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
      online: typeof navigator !== 'undefined' ? navigator.onLine : false,
    },
    
    // Local Storage
    localStorage: captureLocalStorage(),
    
    // Session Storage
    sessionStorage: captureSessionStorage(),
    
    // Component Tree
    componentTree: typeof window !== 'undefined' && window.__COMPONENT_TREE__ 
      ? window.__COMPONENT_TREE__.exportJSON() 
      : null,
    
    // Debug Logs
    logs: typeof window !== 'undefined' && window.__DEBUG_LOGGER__ 
      ? window.__DEBUG_LOGGER__.exportJSON() 
      : null,
    
    // DataStore State
    dataStore: await captureDataStoreState(),
    
    // React Context (if available)
    contexts: captureContexts(),
    
    // Performance Metrics
    performance: capturePerformanceMetrics(),
    
    // Recent Errors
    errors: typeof window !== 'undefined' && window.__ERROR_BOUNDARY__
      ? window.__ERROR_BOUNDARY__.getRecentErrors()
      : [],
  };
  
  return snapshot;
}

export default captureStateSnapshot;
