import { describe, it, expect } from 'vitest';
import React from 'react';
import { sanitizeProps, sanitizeState, sanitizeModel, sanitizeError } from '../sanitizeComponentData';

describe('sanitizeComponentData', () => {
  describe('sanitizeProps', () => {
    it('should pass through plain objects', () => {
      const props = { name: 'John', age: 30, active: true };
      const result = sanitizeProps(props);
      
      expect(result).toEqual(props);
    });

    it('should convert functions to [Function]', () => {
      const props = { onClick: () => {}, onSubmit: function() {} };
      const result = sanitizeProps(props);
      
      expect(result.onClick).toBe('[Function]');
      expect(result.onSubmit).toBe('[Function]');
    });

    it('should convert React elements to [ReactElement]', () => {
      const props = { children: React.createElement('div', {}, 'Hello') };
      const result = sanitizeProps(props);
      
      expect(result.children).toBe('[ReactElement]');
    });

    it('should handle nested objects', () => {
      const props = {
        user: { id: 1, getName: () => 'John' },
        config: { theme: 'dark', render: () => {} }
      };
      const result = sanitizeProps(props);
      
      // Nested objects are converted to descriptive strings
      expect(result.user).toContain('[Object:');
      expect(result.config).toContain('[Object:');
    });

    it('should handle arrays', () => {
      const props = {
        items: [1, 2, 3],
        callbacks: [() => {}, () => {}]
      };
      const result = sanitizeProps(props);
      
      // Arrays are converted to descriptive strings with length
      expect(result.items).toBe('[Array(3)]');
      expect(result.callbacks).toBe('[Array(2)]');
    });

    it('should handle null and undefined', () => {
      const props = { value: null, optional: undefined };
      const result = sanitizeProps(props);
      
      expect(result.value).toBeNull();
      expect(result.optional).toBeUndefined();
    });

    it('should return empty object for undefined input', () => {
      const result = sanitizeProps(undefined as any);
      expect(result).toEqual({});
    });
  });

  describe('sanitizeState', () => {
    it('should work the same as sanitizeProps', () => {
      const state = { count: 0, increment: () => {} };
      const result = sanitizeState(state);
      
      expect(result.count).toBe(0);
      expect(result.increment).toBe('[Function]');
    });
  });

  describe('sanitizeModel', () => {
    it('should extract plain fields from DataStore model', () => {
      const model = {
        id: '123',
        name: 'Test',
        createdAt: '2024-01-01',
        owner: 'user1',
        _version: 1,
        _deleted: false,
        _lastChangedAt: 1234567890
      };
      
      const result = sanitizeModel(model);
      
      expect(result?.id).toBe('123');
      expect(result?.name).toBe('Test');
      expect(result?._version).toBe(1); // Essential metadata fields are kept
      expect(result?._deleted).toBe(false);
    });

    it('should include DataStore metadata fields', () => {
      const model = {
        id: 'abc',
        name: 'Test',
        _version: 1,
        _deleted: false,
        _lastChangedAt: 123
      };
      
      const result = sanitizeModel(model);
      
      // These are kept as essential fields
      expect(result?._version).toBe(1);
      expect(result?._deleted).toBe(false);
      expect(result?._lastChangedAt).toBe(123);
    });

    it('should return null for null input', () => {
      const result = sanitizeModel(null);
      expect(result).toBeNull();
    });
  });

  describe('sanitizeError', () => {
    it('should serialize Error objects', () => {
      const error = new Error('Test error');
      const result = sanitizeError(error);
      
      expect(result?.message).toBe('Test error');
      expect(result?.name).toBe('Error');
      expect(result?.stack).toBeDefined();
    });

    it('should handle errors with custom properties', () => {
      const error: any = new Error('Custom error');
      error.code = 'ERR_TEST';
      
      const result = sanitizeError(error);
      
      expect(result?.message).toBe('Custom error');
      expect(result?.code).toBe('ERR_TEST');
      expect(result?.type).toBe('Error');
    });

    it('should return null for null input', () => {
      const result = sanitizeError(null);
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      expect(() => sanitizeProps(circular)).not.toThrow();
    });

    it('should handle deeply nested objects', () => {
      const deep = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 42,
                fn: () => {}
              }
            }
          }
        }
      };
      
      const result = sanitizeProps(deep);
      
      // Nested objects are converted to descriptive string
      expect(result.level1).toContain('[Object:');
    });
  });
});
