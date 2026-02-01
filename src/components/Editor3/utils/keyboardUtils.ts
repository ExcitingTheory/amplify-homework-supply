/**
 * Keyboard Utilities for Editor3
 * 
 * Platform-aware keyboard shortcut detection for Lexical Editor.
 * Handles differences between Mac (⌘) and Windows/Linux (Ctrl) modifier keys.
 * 
 * @module keyboardUtils
 */

/**
 * Modifier key configuration for keyboard shortcuts
 */
export interface KeyboardModifiers {
  /** Require Cmd (Mac) or Ctrl (Win/Linux) for OS-standard shortcuts */
  mod?: boolean;
  /** Require Ctrl only (app-specific shortcuts, avoids Mac Cmd conflicts) */
  ctrl?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
}

/**
 * Detect if running on Apple platform (Mac, iPad, iPhone)
 * 
 * @constant
 * 
 * @example
 * if (IS_APPLE) {
 *   console.log('Running on Mac - use ⌘ key');
 * } else {
 *   console.log('Running on Windows/Linux - use Ctrl key');
 * }
 */
export const IS_APPLE: boolean = typeof navigator !== 'undefined' && 
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Check if the modifier key is pressed (⌘ on Mac, Ctrl on Windows/Linux)
 * 
 * This function abstracts the platform difference between Mac (metaKey)
 * and Windows/Linux (ctrlKey) for keyboard shortcuts.
 * 
 * @param event - The keyboard event to check
 * @returns True if the appropriate modifier key is pressed
 * 
 * @example
 * editor.registerCommand(KEY_MODIFIER_COMMAND, (event) => {
 *   if (isModifierKey(event) && event.code === 'KeyB') {
 *     // Handle Ctrl/⌘+B
 *     return true;
 *   }
 *   return false;
 * });
 */
export function isModifierKey(event: KeyboardEvent): boolean {
  return IS_APPLE ? event.metaKey : event.ctrlKey;
}

/**
 * Check if a specific keyboard shortcut is pressed
 * 
 * Matches keyboard events against expected key combinations, handling
 * platform differences automatically (⌘ vs Ctrl).
 * 
 * @param event - The keyboard event to check
 * @param key - Key code to match (e.g., 'KeyB', 'Digit1', 'Escape')
 * @param modifiers - Required modifier keys
 * @returns True if the shortcut matches
 * 
 * @example
 * // Check for Ctrl/⌘+B (bold)
 * if (isShortcut(event, 'KeyB', { mod: true })) {
 *   editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
 *   return true;
 * }
 * 
 * @example
 * // Check for Ctrl/⌘+Shift+S (strikethrough)
 * if (isShortcut(event, 'KeyS', { mod: true, shift: true })) {
 *   editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
 *   return true;
 * }
 * 
 * @example
 * // Check for Ctrl/⌘+Alt+1 (heading 1)
 * if (isShortcut(event, 'Digit1', { mod: true, alt: true })) {
 *   formatHeading(editor, 'h1');
 *   return true;
 * }
 * 
 * @example
 * // Check for Escape (no modifiers)
 * if (isShortcut(event, 'Escape')) {
 *   closeDialog();
 *   return true;
 * }
 */
export function isShortcut(
  event: KeyboardEvent,
  key: string,
  { mod = false, shift = false, alt = false, ctrl = false }: KeyboardModifiers = {}
): boolean {
  // mod: Accept either metaKey (⌘ on Mac) or ctrlKey (Ctrl) for OS-standard shortcuts
  // ctrl: Use ONLY ctrlKey for app-specific shortcuts (avoids Mac Cmd+Shift conflicts)
  const modPressed = event.metaKey || event.ctrlKey;
  const ctrlPressed = event.ctrlKey;
  
  return (
    event.code === key &&
    (!mod || modPressed) &&
    (!ctrl || ctrlPressed) &&
    (!shift || event.shiftKey) &&
    (!alt || event.altKey)
  );
}
