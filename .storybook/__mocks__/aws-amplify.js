/**
 * Mock for aws-amplify main package
 * Used in Storybook to prevent Amplify configuration errors
 */

export const Amplify = {
  configure: (config) => {
    console.log('[Mock Amplify] configure() called');
    console.log('[Mock Amplify] Config:', config ? 'provided' : 'none');
    return config;
  },
  getConfig: () => {
    console.log('[Mock Amplify] getConfig() called');
    return {};
  },
};

// Mock AuthModeStrategyType enum
export const AuthModeStrategyType = {
  DEFAULT: 'DEFAULT',
  MULTI_AUTH: 'MULTI_AUTH',
};

// Mock Logger
export class Logger {
  constructor(name, level = 'INFO') {
    this.name = name;
    this.level = level;
  }

  debug(...args) {
    console.log(`[Mock Logger:${this.name}] DEBUG:`, ...args);
  }

  info(...args) {
    console.log(`[Mock Logger:${this.name}] INFO:`, ...args);
  }

  warn(...args) {
    console.warn(`[Mock Logger:${this.name}] WARN:`, ...args);
  }

  error(...args) {
    console.error(`[Mock Logger:${this.name}] ERROR:`, ...args);
  }

  setLogLevel(level) {
    this.level = level;
  }
}

// Mock AWSCloudWatchProvider
export class AWSCloudWatchProvider {
  constructor(config) {
    console.log('[Mock AWSCloudWatchProvider] Created with config:', config);
  }

  pushLogs() {
    console.log('[Mock AWSCloudWatchProvider] pushLogs() called');
  }
}

export default Amplify;
