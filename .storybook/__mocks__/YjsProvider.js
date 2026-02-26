/**
 * Mock YjsProvider for Storybook
 * Prevents loading real YJS dependencies that may cause circular dependency issues
 */

export class YjsDocProvider {
  constructor(config) {
    this.docName = config.docName;
    this.config = config;
    console.log('[Mock YjsDocProvider] Created:', config.docName);
  }

  getDoc() {
    return {
      getMap: () => ({
        get: () => null,
        set: () => {},
        toJSON: () => ({}),
      }),
    };
  }

  getMap(name) {
    return {
      get: () => null,
      set: () => {},
      toJSON: () => ({}),
      observe: () => {},
      unobserve: () => {},
    };
  }

  getArray(name) {
    return {
      toArray: () => [],
      push: () => {},
      insert: () => {},
      delete: () => {},
      observe: () => {},
      unobserve: () => {},
    };
  }

  getAwareness() {
    return {
      on: () => {},
      off: () => {},
      getStates: () => new Map(),
      setLocalState: () => {},
      getLocalState: () => null,
    };
  }

  connect() {
    console.log('[Mock YjsDocProvider] Connect called');
  }

  disconnect() {
    console.log('[Mock YjsDocProvider] Disconnect called');
  }

  destroy() {
    console.log('[Mock YjsDocProvider] Destroy called');
  }

  isSynced() {
    return false;
  }

  isConnected() {
    return false;
  }
}
