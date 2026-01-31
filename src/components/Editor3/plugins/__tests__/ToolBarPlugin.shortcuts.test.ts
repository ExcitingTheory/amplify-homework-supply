/**
 * @fileoverview Unit tests for ToolBarPlugin keyboard shortcuts
 * @module ToolBarPlugin.shortcuts.test
 * 
 * Tests keyboard shortcut detection logic for ToolBarPlugin:
 * - Text formatting (bold, italic, underline, strikethrough, clear)
 * - Block types (headings, paragraph, quote, code)
 * - Lists (bullet, numbered)
 * - Alignment (left, center, right, justify)
 * - Links
 * 
 * Note: Integration tests with actual editor behavior are in Cypress E2E tests.
 * These unit tests verify the keyboard event detection logic.
 */

import { describe, it, expect } from 'vitest';
import { isShortcut } from '../../utils/keyboardUtils';

// Mock keyboard event factory
function createKeyboardEvent(
  code: string,
  modifiers: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}
): KeyboardEvent {
  return {
    code,
    metaKey: modifiers.metaKey || false,
    ctrlKey: modifiers.ctrlKey || false,
    shiftKey: modifiers.shiftKey || false,
    altKey: modifiers.altKey || false,
  } as unknown as KeyboardEvent;
}

describe('ToolBarPlugin Keyboard Shortcuts', () => {
  describe('Text Formatting Shortcuts', () => {
    it('should detect bold shortcut with Ctrl+B', () => {
      const event = createKeyboardEvent('KeyB', { ctrlKey: true });
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(true);
    });

    it('should detect bold shortcut with ⌘+B (Mac)', () => {
      const event = createKeyboardEvent('KeyB', { metaKey: true });
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(true);
    });

    it('should detect italic shortcut with Ctrl+I', () => {
      const event = createKeyboardEvent('KeyI', { ctrlKey: true });
      expect(isShortcut(event, 'KeyI', { mod: true })).toBe(true);
    });

    it('should detect underline shortcut with Ctrl+U', () => {
      const event = createKeyboardEvent('KeyU', { ctrlKey: true });
      expect(isShortcut(event, 'KeyU', { mod: true })).toBe(true);
    });

    it('should detect strikethrough shortcut with Ctrl+Shift+S', () => {
      const event = createKeyboardEvent('KeyS', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'KeyS', { mod: true, shift: true })).toBe(true);
    });

    it('should detect clear formatting shortcut with Ctrl+\\', () => {
      const event = createKeyboardEvent('Backslash', { ctrlKey: true });
      expect(isShortcut(event, 'Backslash', { mod: true })).toBe(true);
    });

    it('should NOT detect shortcut without modifier key', () => {
      const event = createKeyboardEvent('KeyB');
      expect(isShortcut(event, 'KeyB', { mod: true })).toBe(false);
    });
  });

  describe('Block Type Shortcuts', () => {
    it('should detect Heading 1 shortcut with Ctrl+Alt+1', () => {
      const event = createKeyboardEvent('Digit1', { ctrlKey: true, altKey: true });
      expect(isShortcut(event, 'Digit1', { mod: true, alt: true })).toBe(true);
    });

    it('should detect Heading 2 shortcut with Ctrl+Alt+2', () => {
      const event = createKeyboardEvent('Digit2', { ctrlKey: true, altKey: true });
      expect(isShortcut(event, 'Digit2', { mod: true, alt: true })).toBe(true);
    });

    it('should detect Heading 3 shortcut with Ctrl+Alt+3', () => {
      const event = createKeyboardEvent('Digit3', { ctrlKey: true, altKey: true });
      expect(isShortcut(event, 'Digit3', { mod: true, alt: true })).toBe(true);
    });

    it('should detect paragraph shortcut with Ctrl+Alt+0', () => {
      const event = createKeyboardEvent('Digit0', { ctrlKey: true, altKey: true });
      expect(isShortcut(event, 'Digit0', { mod: true, alt: true })).toBe(true);
    });

    it('should detect quote shortcut with Ctrl+Shift+Q', () => {
      const event = createKeyboardEvent('KeyQ', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'KeyQ', { mod: true, shift: true })).toBe(true);
    });

    it('should detect code block shortcut with Ctrl+Alt+C', () => {
      const event = createKeyboardEvent('KeyC', { ctrlKey: true, altKey: true });
      expect(isShortcut(event, 'KeyC', { mod: true, alt: true })).toBe(true);
    });
  });

  describe('List Shortcuts', () => {
    it('should detect bullet list shortcut with Ctrl+Shift+8', () => {
      const event = createKeyboardEvent('Digit8', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'Digit8', { mod: true, shift: true })).toBe(true);
    });

    it('should detect numbered list shortcut with Ctrl+Shift+7', () => {
      const event = createKeyboardEvent('Digit7', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'Digit7', { mod: true, shift: true })).toBe(true);
    });
  });

  describe('Alignment Shortcuts', () => {
    it('should detect align left shortcut with Ctrl+Shift+L', () => {
      const event = createKeyboardEvent('KeyL', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'KeyL', { mod: true, shift: true })).toBe(true);
    });

    it('should detect align center shortcut with Ctrl+Shift+E', () => {
      const event = createKeyboardEvent('KeyE', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'KeyE', { mod: true, shift: true })).toBe(true);
    });

    it('should detect align right shortcut with Ctrl+Shift+R', () => {
      const event = createKeyboardEvent('KeyR', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'KeyR', { mod: true, shift: true })).toBe(true);
    });

    it('should detect justify shortcut with Ctrl+Shift+J', () => {
      const event = createKeyboardEvent('KeyJ', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event, 'KeyJ', { mod: true, shift: true })).toBe(true);
    });
  });

  describe('Link Shortcuts', () => {
    it('should detect link shortcut with Ctrl+K', () => {
      const event = createKeyboardEvent('KeyK', { ctrlKey: true });
      expect(isShortcut(event, 'KeyK', { mod: true })).toBe(true);
    });

    it('should detect link shortcut with ⌘+K (Mac)', () => {
      const event = createKeyboardEvent('KeyK', { metaKey: true });
      expect(isShortcut(event, 'KeyK', { mod: true })).toBe(true);
    });
  });

  describe('Platform Detection', () => {
    it('should work with both Ctrl and Meta modifiers', () => {
      const ctrlEvent = createKeyboardEvent('KeyB', { ctrlKey: true });
      const metaEvent = createKeyboardEvent('KeyB', { metaKey: true });
      
      expect(isShortcut(ctrlEvent, 'KeyB', { mod: true })).toBe(true);
      expect(isShortcut(metaEvent, 'KeyB', { mod: true })).toBe(true);
    });

    it('should require all specified modifiers', () => {
      // Has ctrl but missing shift - should fail
      const event1 = createKeyboardEvent('KeyS', { ctrlKey: true });
      expect(isShortcut(event1, 'KeyS', { mod: true, shift: true })).toBe(false);
      
      // Has both ctrl and shift - should pass
      const event2 = createKeyboardEvent('KeyS', { ctrlKey: true, shiftKey: true });
      expect(isShortcut(event2, 'KeyS', { mod: true, shift: true })).toBe(true);
    });
  });
});
