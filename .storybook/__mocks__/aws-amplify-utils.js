/**
 * Mock aws-amplify/utils for Storybook
 */

export const sharedInMemoryStorage = {
  getItem: (key) => null,
  setItem: (key, value) => {},
  removeItem: (key) => {},
  clear: () => {},
};

export const parseAmplifyConfig = (config) => config || {};

export const Cache = {
  getItem: async (key) => {
    console.log('Mock Cache.getItem called with:', key);
    return null; // Always return null to force "fetch"
  },
  setItem: async (key, value, options) => {
    console.log('Mock Cache.setItem called with:', key, value);
  },
  clear: () => {
    console.log('Mock Cache.clear called');
  },
};

export const Hub = {
  listen: (channel, callback) => {
    console.log('Mock Hub.listen called for channel:', channel);
    return () => {
      console.log('Mock Hub.listen cleanup for channel:', channel);
    };
  },
  dispatch: (channel, payload) => {
    console.log('Mock Hub.dispatch called for channel:', channel, payload);
  },
};

export class ConsoleLogger {
  constructor(name) {
    this.name = name;
  }
  debug(...args) { console.log(`[Mock Logger ${this.name}] DEBUG:`, ...args); }
  info(...args) { console.log(`[Mock Logger ${this.name}] INFO:`, ...args); }
  warn(...args) { console.warn(`[Mock Logger ${this.name}] WARN:`, ...args); }
  error(...args) { console.error(`[Mock Logger ${this.name}] ERROR:`, ...args); }
}

export const I18n = {
  get: (key, options) => {
    console.log(`[Mock I18n] Getting translation for: ${key}`);
    return key;
  },
  put: (key, value) => {
    console.log(`[Mock I18n] Setting translation ${key}: ${value}`);
  },
  setLanguage: (lang) => {
    console.log(`[Mock I18n] Setting language: ${lang}`);
  },
};
