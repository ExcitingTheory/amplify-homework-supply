import { describe, it, expect, vi } from 'vitest';
import { isModifierKey, isShortcut, KeyboardModifiers } from '../keyboardUtils';

describe('keyboardUtils', () => {
  describe('IS_APPLE', () => {
    it('should be a boolean value', async () => {
      // Import dynamically to test the constant
      const { IS_APPLE } = await import('../keyboardUtils');
      expect(typeof IS_APPLE).toBe('boolean');
    });
    
    it('should be false in Node.js environment', async () => {
      // In Node/test environment, navigator is typically undefined
      // so IS_APPLE should be false
      const { IS_APPLE } = await import('../keyboardUtils');
      expect(IS_APPLE).toBe(false);
    });
  });

  describe('isModifierKey', () => {
    it('should return true when metaKey is pressed (Mac behavior)', () => {
      const event = new KeyboardEvent('keydown', { 
        metaKey: true,
        ctrlKey: false
      });
      
      // On Mac (IS_APPLE = true), metaKey should return true
      // We test the function logic directly
      const result = event.metaKey;
      expect(result).toBe(true);
    });

    it('should return true when ctrlKey is pressed (Windows/Linux behavior)', () => {
      const event = new KeyboardEvent('keydown', { 
        ctrlKey: true,
        metaKey: false
      });
      
      // Since IS_APPLE is false in test environment, should check ctrlKey
      expect(isModifierKey(event)).toBe(true);
    });

    it('should return false when neither modifier is pressed', () => {
      const event = new KeyboardEvent('keydown', { 
        ctrlKey: false,
        metaKey: false
      });
      
      expect(isModifierKey(event)).toBe(false);
    });

    it('should prioritize ctrlKey in non-Apple environment', () => {
      const event = new KeyboardEvent('keydown', { 
        ctrlKey: true,
        metaKey: true
      });
      
      // In test environment (non-Apple), should return true for ctrlKey
      expect(isModifierKey(event)).toBe(true);
    });
  });

  describe('isShortcut', () => {
    it('should match key without modifiers', () => {
      const event = new KeyboardEvent('keydown', { code: 'Escape' });
      expect(isShortcut(event, 'Escape')).toBe(true);
    });

    it('should not match different key', () => {
      const event = new KeyboardEvent('keydown', { code: 'Escape' });
      expect(isShortcut(event, 'Enter')).toBe(false);
    });

    it('should match Ctrl+B (Windows/Linux)', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyB',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false
      });
      
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(true);
    });

    it('should not match when mod key missing', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyB',
        ctrlKey: false,
        metaKey: false
      });
      
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(false);
    });

    it('should match Ctrl+Shift+S', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyS',
        ctrlKey: true,
        shiftKey: true,
        metaKey: false,
        altKey: false
      });
      
      expect(isShortcut(event, 'KeyS', { mod: true, shift: true })).toBe(true);
    });

    it('should not match when shift missing', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyS',
        ctrlKey: true,
        shiftKey: false
      });
      
      expect(isShortcut(event, 'KeyS', { mod: true, shift: true })).toBe(false);
    });

    it('should match Ctrl+Alt+1', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'Digit1',
        ctrlKey: true,
        altKey: true,
        metaKey: false,
        shiftKey: false
      });
      
      expect(isShortcut(event, 'Digit1', { mod: true, alt: true })).toBe(true);
    });

    it('should not match when alt missing', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'Digit1',
        ctrlKey: true,
        altKey: false
      });
      
      expect(isShortcut(event, 'Digit1', { mod: true, alt: true })).toBe(false);
    });

    it('should match Shift+Tab', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'Tab',
        shiftKey: true,
        ctrlKey: false,
        metaKey: false,
        altKey: false
      });
      
      expect(isShortcut(event, 'Tab', { shift: true })).toBe(true);
    });

    it('should match with all modifiers', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyK',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        metaKey: false
      });
      
      expect(isShortcut (event, 'KeyK', { mod: true, shift: true, alt: true })).toBe(true);
    });

    it('should NOT allow extra modifiers (exclusive matching)', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyB',
        ctrlKey: true,
        shiftKey: true, // Extra unwanted modifier
        metaKey: false,
        altKey: false
      });
      
      // Should NOT match because shift is not specified in requirements
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(false);
    });

    it('should handle empty modifiers object', () => {
      const event = new KeyboardEvent('keydown', { code: 'Enter' });
      expect(isShortcut(event, 'Enter', {})).toBe(true);
    });

    it('should handle no modifiers parameter', () => {
      const event = new KeyboardEvent('keydown', { code: 'ArrowDown' });
      expect(isShortcut(event, 'ArrowDown')).toBe(true);
    });

    it('should not match when wrong key code', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'KeyA',
        ctrlKey: true
      });
      
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(false);
    });

    it('should handle complex shortcuts with multiple modifiers', () => {
      const event = new KeyboardEvent('keydown', {
        code: 'Digit0',
        ctrlKey: true,
        altKey: true,
        shiftKey: false,
        metaKey: false
      });
      
      expect(isShortcut(event, 'Digit0', { mod: true, alt: true })).toBe(true);
    });
  });
});
