/**
 * Mock yjs/hooks for Storybook
 * Prevents loading real YJS dependencies
 */

export function useYjsProvider(config) {
  return {
    provider: null,
    isSynced: false,
    isConnected: false,
  };
}

export function useYMap(provider, mapName) {
  return {
    map: null,
    get: () => null,
    set: () => {},
    delete: () => {},
    toJSON: () => ({}),
  };
}

export function useYArray(provider, arrayName) {
  return {
    array: null,
    toArray: () => [],
    push: () => {},
    insert: () => {},
    delete: () => {},
  };
}

export function useYText(provider, textName) {
  return {
    text: null,
    toString: () => '',
    insert: () => {},
    delete: () => {},
  };
}

export function useAwareness(provider) {
  return {
    awareness: null,
    users: [],
    localUser: null,
    setLocalState: () => {},
    getLocalState: () => null,
    getStates: () => new Map(),
  };
}
