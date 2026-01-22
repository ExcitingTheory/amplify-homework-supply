/**
 * Unit tests for tabStateUtils.js
 * Tests localStorage + URL state syncing for vertical tabs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import {
  loadTabState,
  saveTabState,
  parseTabStateFromURL,
  buildTabStateQuery,
  mergeTabState,
  clearTabState,
} from '../tabStateUtils.js';

describe('tabStateUtils', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  describe('loadTabState', () => {
    it('should load tab state from localStorage', () => {
      const state = {
        leftTab: 4,
        rightTab: 5,
        leftOpen: true,
        rightOpen: false,
        leftWidth: 400,
        rightWidth: 350,
      };
      
      localStorageMock.setItem('editor-tab-state', JSON.stringify(state));
      
      const result = loadTabState();
      
      expect(result).toEqual(state);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('editor-tab-state');
    });
    
    it('should return null when no state in localStorage', () => {
      const result = loadTabState();
      
      expect(result).toBeNull();
    });
    
    it('should return null when localStorage has invalid JSON', () => {
      localStorageMock.setItem('editor-tab-state', 'invalid json');
      
      const result = loadTabState();
      
      expect(result).toBeNull();
    });
    
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const result = loadTabState();
      
      expect(result).toBeNull();
    });
  });
  
  describe('saveTabState', () => {
    it('should save tab state to localStorage', () => {
      const state = {
        leftTab: 2,
        rightTab: 5,
        leftOpen: true,
        rightOpen: true,
        leftWidth: 450,
        rightWidth: 300,
      };
      
      saveTabState(state);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'editor-tab-state',
        JSON.stringify(state)
      );
    });
    
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full');
      });
      
      const state = { leftTab: 0, rightTab: 5 };
      
      // Should not throw
      expect(() => saveTabState(state)).not.toThrow();
    });
  });
  
  describe('parseTabStateFromURL', () => {
    it('should parse both sidebars open', () => {
      const query = {
        sidebars: 'files,chat',
      };
      
      const result = parseTabStateFromURL(query);
      
      expect(result.leftTab).toBe(4); // files
      expect(result.rightTab).toBe(5); // chat
      expect(result.leftOpen).toBe(true);
      expect(result.rightOpen).toBe(true);
    });
    
    it('should parse left sidebar only', () => {
      const query = {
        sidebars: 'dictionary',
      };
      
      const result = parseTabStateFromURL(query);
      
      expect(result.leftTab).toBe(2); // dictionary
      expect(result.leftOpen).toBe(true);
      expect(result.rightTab).toBeUndefined();
      expect(result.rightOpen).toBe(false);
    });
    
    it('should parse right sidebar only', () => {
      const query = {
        sidebars: 'chat',
      };
      
      const result = parseTabStateFromURL(query);
      
      expect(result.rightTab).toBe(5); // chat
      expect(result.rightOpen).toBe(true);
      expect(result.leftTab).toBeUndefined();
      expect(result.leftOpen).toBe(false);
    });
    
    it('should parse both sidebars closed', () => {
      const query = {
        sidebars: '',
      };
      
      const result = parseTabStateFromURL(query);
      
      expect(result.leftOpen).toBe(false);
      expect(result.rightOpen).toBe(false);
    });
    
    it('should parse custom widths', () => {
      const query = {
        sidebars: 'files,chat',
        leftWidth: '500',
        rightWidth: '400',
      };
      
      const result = parseTabStateFromURL(query);
      
      expect(result.leftWidth).toBe(500);
      expect(result.rightWidth).toBe(400);
    });
    
    it('should handle different tab combinations', () => {
      const testCases = [
        { input: 'toc,suggestions', expected: { leftTab: 1, rightTab: 7 } },
        { input: 'questions,grades', expected: { leftTab: 3, rightTab: 8 } },
        { input: 'assignments,cohortChat', expected: { leftTab: 0, rightTab: 9 } },
        { input: 'config,chat', expected: { leftTab: 6, rightTab: 5 } },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = parseTabStateFromURL({ sidebars: input });
        expect(result.leftTab).toBe(expected.leftTab);
        expect(result.rightTab).toBe(expected.rightTab);
      });
    });
    
    it('should handle empty query object', () => {
      const result = parseTabStateFromURL({});
      
      expect(result).toEqual({});
    });
    
    it('should ignore unknown tab names', () => {
      const query = {
        sidebars: 'unknown,invalid',
      };
      
      const result = parseTabStateFromURL(query);
      
      // Should not set any tabs for unknown names
      expect(result.leftTab).toBeUndefined();
      expect(result.rightTab).toBeUndefined();
    });
  });
  
  describe('buildTabStateQuery', () => {
    it('should build query for both sidebars open', () => {
      const state = {
        leftTab: 4,
        rightTab: 5,
        leftOpen: true,
        rightOpen: true,
      };
      
      const result = buildTabStateQuery(state);
      
      expect(result.sidebars).toBe('files,chat');
    });
    
    it('should build query for left sidebar only', () => {
      const state = {
        leftTab: 2,
        rightTab: 5,
        leftOpen: true,
        rightOpen: false,
      };
      
      const result = buildTabStateQuery(state);
      
      expect(result.sidebars).toBe('dictionary');
    });
    
    it('should build query for right sidebar only', () => {
      const state = {
        leftTab: 4,
        rightTab: 7,
        leftOpen: false,
        rightOpen: true,
      };
      
      const result = buildTabStateQuery(state);
      
      expect(result.sidebars).toBe('suggestions');
    });
    
    it('should omit sidebars param when both closed', () => {
      const state = {
        leftTab: 4,
        rightTab: 5,
        leftOpen: false,
        rightOpen: false,
      };
      
      const result = buildTabStateQuery(state);
      
      expect(result.sidebars).toBeUndefined();
    });
    
    it('should include custom widths in query', () => {
      const state = {
        leftTab: 4,
        rightTab: 5,
        leftOpen: true,
        rightOpen: true,
        leftWidth: 500,
        rightWidth: 400,
      };
      
      const result = buildTabStateQuery(state);
      
      expect(result.leftWidth).toBe('500');
      expect(result.rightWidth).toBe('400');
    });
    
    it('should omit default widths from query', () => {
      const state = {
        leftTab: 4,
        rightTab: 5,
        leftOpen: true,
        rightOpen: true,
        leftWidth: 350, // Default width
        rightWidth: 350, // Default width
      };
      
      const result = buildTabStateQuery(state);
      
      expect(result.leftWidth).toBeUndefined();
      expect(result.rightWidth).toBeUndefined();
    });
    
    it('should handle various tab index combinations', () => {
      const testCases = [
        { state: { leftTab: 0, rightTab: 9, leftOpen: true, rightOpen: true }, expected: 'assignments,cohortChat' },
        { state: { leftTab: 1, rightTab: 7, leftOpen: true, rightOpen: true }, expected: 'toc,suggestions' },
        { state: { leftTab: 3, rightTab: 8, leftOpen: true, rightOpen: true }, expected: 'questions,grades' },
        { state: { leftTab: 6, rightTab: 5, leftOpen: true, rightOpen: true }, expected: 'config,chat' },
      ];
      
      testCases.forEach(({ state, expected }) => {
        const result = buildTabStateQuery(state);
        expect(result.sidebars).toBe(expected);
      });
    });
  });
  
  describe('mergeTabState', () => {
    it('should prefer URL state over localStorage state', () => {
      const urlState = {
        leftTab: 2,
        leftOpen: true,
      };
      
      const localState = {
        leftTab: 4,
        rightTab: 5,
        leftOpen: false,
        rightOpen: true,
        leftWidth: 400,
        rightWidth: 300,
      };
      
      const result = mergeTabState(urlState, localState);
      
      expect(result.leftTab).toBe(2); // From URL
      expect(result.leftOpen).toBe(true); // From URL
      expect(result.rightTab).toBe(5); // From localStorage
      expect(result.rightOpen).toBe(true); // From localStorage
      expect(result.leftWidth).toBe(400); // From localStorage
      expect(result.rightWidth).toBe(300); // From localStorage
    });
    
    it('should use defaults when neither URL nor localStorage has values', () => {
      const result = mergeTabState({}, null);
      
      expect(result.leftTab).toBe(4); // Default: files
      expect(result.rightTab).toBe(5); // Default: chat
      expect(result.leftOpen).toBe(false); // Default: closed
      expect(result.rightOpen).toBe(false); // Default: closed
      expect(result.leftWidth).toBe(350); // Default width
      expect(result.rightWidth).toBe(350); // Default width
    });
    
    it('should handle URL state only', () => {
      const urlState = {
        leftTab: 3,
        rightTab: 7,
        leftOpen: true,
        rightOpen: true,
        leftWidth: 450,
        rightWidth: 380,
      };
      
      const result = mergeTabState(urlState, null);
      
      expect(result).toEqual(urlState);
    });
    
    it('should handle localStorage state only', () => {
      const localState = {
        leftTab: 2,
        rightTab: 8,
        leftOpen: false,
        rightOpen: true,
        leftWidth: 400,
        rightWidth: 350,
      };
      
      const result = mergeTabState({}, localState);
      
      expect(result).toEqual(localState);
    });
    
    it('should handle partial URL state', () => {
      const urlState = {
        leftOpen: true,
        // leftTab not specified in URL
      };
      
      const localState = {
        leftTab: 2,
        rightTab: 5,
        leftOpen: false,
        rightOpen: false,
        leftWidth: 400,
        rightWidth: 350,
      };
      
      const result = mergeTabState(urlState, localState);
      
      expect(result.leftTab).toBe(2); // From localStorage
      expect(result.leftOpen).toBe(true); // From URL
      expect(result.rightTab).toBe(5); // From localStorage
      expect(result.rightOpen).toBe(false); // From localStorage
    });
    
    it('should handle nullish coalescing correctly', () => {
      const urlState = {
        leftTab: 0, // Falsy but valid
        leftOpen: false, // Falsy but valid
      };
      
      const localState = {
        leftTab: 4,
        leftOpen: true,
      };
      
      const result = mergeTabState(urlState, localState);
      
      expect(result.leftTab).toBe(0); // Should use URL value even though it's 0
      expect(result.leftOpen).toBe(false); // Should use URL value even though it's false
    });
  });
  
  describe('clearTabState', () => {
    it('should remove tab state from localStorage', () => {
      localStorageMock.setItem('editor-tab-state', JSON.stringify({ leftTab: 4 }));
      
      clearTabState();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('editor-tab-state');
    });
    
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw
      expect(() => clearTabState()).not.toThrow();
    });
  });
  
  describe('Round-trip encoding/decoding', () => {
    it('should correctly round-trip state through URL and back', () => {
      const originalState = {
        leftTab: 3,
        rightTab: 8,
        leftOpen: true,
        rightOpen: true,
        leftWidth: 450,
        rightWidth: 380,
      };
      
      // Build query
      const query = buildTabStateQuery(originalState);
      
      // Parse it back
      const parsedState = parseTabStateFromURL(query);
      
      // Merge to get full state
      const finalState = mergeTabState(parsedState, null);
      
      expect(finalState.leftTab).toBe(originalState.leftTab);
      expect(finalState.rightTab).toBe(originalState.rightTab);
      expect(finalState.leftOpen).toBe(originalState.leftOpen);
      expect(finalState.rightOpen).toBe(originalState.rightOpen);
      expect(finalState.leftWidth).toBe(originalState.leftWidth);
      expect(finalState.rightWidth).toBe(originalState.rightWidth);
    });
    
    it('should handle state persistence workflow', () => {
      // 1. User sets state
      const userState = {
        leftTab: 2,
        rightTab: 5,
        leftOpen: true,
        rightOpen: false,
        leftWidth: 400,
        rightWidth: 350,
      };
      
      // 2. Save to localStorage
      saveTabState(userState);
      
      // 3. Build URL query
      const query = buildTabStateQuery(userState);
      
      // 4. Load from localStorage
      const localState = loadTabState();
      
      // 5. Parse from URL
      const urlState = parseTabStateFromURL(query);
      
      // 6. Merge (URL takes precedence)
      const finalState = mergeTabState(urlState, localState);
      
      expect(finalState).toEqual(userState);
    });
  });
});
