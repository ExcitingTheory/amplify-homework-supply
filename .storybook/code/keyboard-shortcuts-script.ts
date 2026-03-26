/**
 * Keyboard Shortcuts Demonstration Script
 * 
 * Automated playthrough of all available keyboard shortcuts in the Editor.
 * Demonstrates text formatting, block types, alignment, and other features.
 * Based on shortcuts documented in docs/KEYBOARD_SHORTCUTS.md
 * 
 * @module code/keyboard-shortcuts-script
 */

import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';

// Type alias for compatibility
type Canvas = ReturnType<typeof within>;

/**
 * Utility to add delays between actions for better visualization
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the main editor contenteditable element
 */
async function getEditorElement(canvas: Canvas): Promise<HTMLElement> {
  const textboxes = await canvas.findAllByRole('textbox');
  const editorContent = textboxes.find(el => el.getAttribute('contenteditable') === 'true');
  
  if (!editorContent) {
    throw new Error('Could not find contenteditable editor element');
  }
  
  return editorContent as HTMLElement;
}

/**
 * Get the block format dropdown
 */
async function getBlockFormatSelect(canvas: Canvas): Promise<HTMLElement> {
  return canvas.getByRole('combobox', { name: /block format/i });
}

/**
 * Type text with optional delay after
 */
async function typeText(
  user: ReturnType<typeof userEvent.setup>, 
  text: string, 
  delayMs: number = 300
): Promise<void> {
  await user.keyboard(text);
  await delay(delayMs);
}

/**
 * Execute a keyboard shortcut
 */
async function executeShortcut(
  user: ReturnType<typeof userEvent.setup>,
  shortcut: string,
  delayMs: number = 500
): Promise<void> {
  await user.keyboard(shortcut);
  await delay(delayMs);
}

/**
 * Select the last N characters from the current cursor position using the DOM
 * Selection API. userEvent's Shift+Arrow doesn't work in contenteditable because
 * synthetic keyboard events (isTrusted: false) don't move the browser caret.
 * This creates a real DOM selection that Lexical can read, so keyboard shortcuts
 * that operate on selected text (Bold, Italic, etc.) work correctly.
 */
function selectLastNChars(n: number): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const { endContainer, endOffset } = range;

  // Walk backwards through text nodes to cover N characters
  let remaining = n;
  let startNode: Node = endContainer;
  let startOffset = endOffset;

  // If the anchor is in a text node, try to select within it first
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const available = endOffset;
    if (available >= n) {
      startOffset = endOffset - n;
    } else {
      startOffset = 0;
      remaining = n - available;

      // Walk to previous text nodes if needed
      const walker = document.createTreeWalker(
        endContainer.parentElement!.closest('[contenteditable="true"]') || endContainer.parentElement!,
        NodeFilter.SHOW_TEXT,
      );
      // Position walker at current node
      while (walker.nextNode() !== endContainer) { /* advance */ }
      let prev = walker.previousNode();
      while (prev && remaining > 0) {
        const len = (prev as Text).length;
        if (len >= remaining) {
          startNode = prev;
          startOffset = len - remaining;
          remaining = 0;
        } else {
          remaining -= len;
          startNode = prev;
          startOffset = 0;
          prev = walker.previousNode();
        }
      }
    }
  }

  const newRange = document.createRange();
  newRange.setStart(startNode, startOffset);
  newRange.setEnd(endContainer, endOffset);
  sel.removeAllRanges();
  sel.addRange(newRange);
}

/**
 * Collapse the current selection to its end point (deselect).
 * Synthetic ArrowRight events don't reliably move the caret in contenteditable,
 * so we use the Selection API directly.
 */
function collapseSelectionToEnd(): void {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    sel.collapseToEnd();
  }
}

/**
 * Section 1: Text Formatting Shortcuts
 * Tests: Bold, Italic, Underline, Strikethrough
 * 
 * Types text, selects a portion via the DOM Selection API, then applies the
 * keyboard shortcut. This actually tests that the shortcut formats selected text.
 * We use selectLastNChars() instead of Shift+Arrow because synthetic keyboard
 * events don't move the browser caret in contenteditable.
 */
export async function demonstrateTextFormatting(
  canvas: Canvas, 
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 1: Text Formatting');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Bold: Ctrl + B (using Control key — synthetic Meta events don't work in Storybook,
  // and the editor's isShortcut({ mod: true }) accepts both Ctrl and Cmd)
  await typeText(user, 'Bold Text');
  selectLastNChars(4); // Select "Text"
  await delay(300);
  await executeShortcut(user, '{Control>}b{/Control}');
  await user.keyboard('{ArrowRight}'); // Unselect
  await typeText(user, '{Enter}');
  await executeShortcut(user, '{Control>}b{/Control}'); // Toggle bold off on new line
  
  // Italic: Ctrl + I
  await typeText(user, 'Italic Text');
  selectLastNChars(4); // Select "Text"
  await delay(300);
  await executeShortcut(user, '{Control>}i{/Control}');
  await user.keyboard('{ArrowRight}');
  await typeText(user, '{Enter}');
  await executeShortcut(user, '{Control>}i{/Control}');
  
  // Underline: Ctrl + U
  await typeText(user, 'Underlined Text');
  selectLastNChars(4); // Select "Text"
  await delay(300);
  await executeShortcut(user, '{Control>}u{/Control}');
  await user.keyboard('{ArrowRight}');
  await typeText(user, '{Enter}');
  await executeShortcut(user, '{Control>}u{/Control}');
  
  // Strikethrough: Ctrl + Shift + X (ALL platforms including Mac!)
  await typeText(user, 'Strikethrough Text');
  selectLastNChars(4); // Select "Text"
  await delay(300);
  await executeShortcut(user, '{Control>}{Shift>}x{/Shift}{/Control}');
  collapseSelectionToEnd(); // Deselect before toggling off
  await delay(300);
  await executeShortcut(user, '{Control>}{Shift>}x{/Shift}{/Control}');
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 2: Block Type Shortcuts
 * Tests: Headings, Lists, Quotes, Code Blocks
 */
export async function demonstrateBlockTypes(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 2: Block Types');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Heading 1: Ctrl + Shift + 1 (ALL platforms)
  await typeText(user, 'This is a Heading 1');
  await executeShortcut(user, '{Control>}{Shift>}1{/Shift}{/Control}');
  await typeText(user, '{Enter}');
  
  // Heading 2: Ctrl + Shift + 2
  await typeText(user, 'This is a Heading 2');
  await executeShortcut(user, '{Control>}{Shift>}2{/Shift}{/Control}');
  await typeText(user, '{Enter}');
  
  // Heading 3: Ctrl + Shift + 3
  await typeText(user, 'This is a Heading 3');
  await executeShortcut(user, '{Control>}{Shift>}3{/Shift}{/Control}');
  await typeText(user, '{Enter}');
  
  // Bullet List: Ctrl + Shift + 8
  await typeText(user, 'First bullet item');
  await executeShortcut(user, '{Control>}{Shift>}8{/Shift}{/Control}');
  await typeText(user, '{Enter}Second bullet item{Enter}Third bullet item{Enter}{Enter}');
  
  // Numbered List: Ctrl + Shift + 7
  await typeText(user, 'First numbered item');
  await executeShortcut(user, '{Control>}{Shift>}7{/Shift}{/Control}');
  await typeText(user, '{Enter}Second numbered item{Enter}Third numbered item{Enter}{Enter}');
  
  // Quote: Ctrl + '
  await typeText(user, 'This is a block quote demonstrating wisdom.');
  await executeShortcut(user, "{Control>}'{/Control}");
  await typeText(user, '{Enter}{Enter}');
  
  // Code Block: Ctrl + Shift + C
  await typeText(user, 'const hello = "world";');
  await executeShortcut(user, '{Control>}{Shift>}c{/Shift}{/Control}');
  await delay(300);
  // Exit code block: triple Enter escapes it (same pattern as EmptyEditorTextFormatting story)
  await user.keyboard('{Enter}{Enter}{Enter}');
  await delay(300);
}

/**
 * Section 3: Alignment Shortcuts
 * Tests: Left, Center, Right, Justify
 */
export async function demonstrateAlignment(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 3: Alignment');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Align Left: Ctrl + Shift + L (ALL platforms)
  await typeText(user, 'Left aligned text');
  await executeShortcut(user, '{Control>}{Shift>}l{/Shift}{/Control}');
  await typeText(user, '{Enter}');
  
  // Align Center: Ctrl + Shift + E
  await typeText(user, 'Center aligned text');
  await executeShortcut(user, '{Control>}{Shift>}e{/Shift}{/Control}');
  await typeText(user, '{Enter}');
  
  // Align Right: Ctrl + Shift + R
  await typeText(user, 'Right aligned text');
  await executeShortcut(user, '{Control>}{Shift>}r{/Shift}{/Control}');
  await typeText(user, '{Enter}');
  
  // Justify: Ctrl + Shift + J
  await typeText(user, 'Justified text that spreads across the full width of the container evenly.');
  await executeShortcut(user, '{Control>}{Shift>}j{/Shift}{/Control}');
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 4: Link Shortcuts
 * Tests: Insert/Edit Link
 */
export async function demonstrateLinks(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 4: Links');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Insert Link: Cmd/Ctrl + K
  await typeText(user, 'Click here to visit our site');
  
  // Select "here" using DOM Selection API
  // "here" is 4 chars, and it ends 21 chars from the end ("here to visit our site" = 22, minus "h" = position)
  // Actually: "Click here to visit our site" - we want "here" which is chars 6-9
  // Use a targeted approach: select text by finding the text node
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    // Walk to find the text node containing "here"
    const editorEl = editor;
    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT);
    let textNode: Text | null = null;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.textContent?.includes('here')) {
        textNode = node;
        break;
      }
    }
    if (textNode) {
      const idx = textNode.textContent!.indexOf('here');
      const newRange = document.createRange();
      newRange.setStart(textNode, idx);
      newRange.setEnd(textNode, idx + 4);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }
  await delay(300);
  
  // Open link dialog: Ctrl + K
  await executeShortcut(user, '{Control>}k{/Control}');
  await delay(1000);
  
  // Note: Link dialog interaction would need to happen here in a real scenario
  // Pressing Escape to close dialog for demo purposes
  await user.keyboard('{Escape}');
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 5: Undo/Redo Shortcuts
 * Tests: Undo and Redo operations
 */
export async function demonstrateUndoRedo(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 5: Undo/Redo');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Type some text
  await typeText(user, 'This text will be undone');
  await delay(800);
  
  // Undo: Ctrl + Z
  await executeShortcut(user, '{Control>}z{/Control}');
  await delay(800);
  
  // Redo: Ctrl + Shift + Z
  await executeShortcut(user, '{Control>}{Shift>}z{/Shift}{/Control}');
  await delay(800);
  
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 6: Indentation Shortcuts
 * Tests: Tab and Shift+Tab
 */
export async function demonstrateIndentation(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 6: Indentation');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Create a list first
  await typeText(user, 'Parent item');
  await executeShortcut(user, '{Control>}{Shift>}8{/Shift}{/Control}'); // Bullet list
  await typeText(user, '{Enter}');
  
  // Indent: Tab
  await typeText(user, 'Nested item');
  await executeShortcut(user, '{Tab}');
  await typeText(user, '{Enter}');
  
  // Outdent: Shift + Tab
  await typeText(user, 'Back to parent level');
  await executeShortcut(user, '{Shift>}{Tab}{/Shift}');
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 7: Markdown Shortcuts
 * Tests: Auto-conversion shortcuts like #, -, >, etc.
 */
export async function demonstrateMarkdownShortcuts(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 7: Markdown Shortcuts');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Heading with #
  await typeText(user, '# Markdown Heading 1 ');
  await delay(1000);
  await typeText(user, '{Enter}');
  
  // Heading with ##
  await typeText(user, '## Markdown Heading 2 ');
  await delay(1000);
  await typeText(user, '{Enter}');
  
  // Bullet list with -
  await typeText(user, '- Markdown bullet item ');
  await delay(1000);
  await typeText(user, '{Enter}{Enter}');
  
  // Numbered list with 1.
  await typeText(user, '1. Markdown numbered item ');
  await delay(1000);
  await typeText(user, '{Enter}{Enter}');
  
  // Block quote with >
  await typeText(user, '> Markdown quote ');
  await delay(1000);
  await typeText(user, '{Enter}');
  
  // Horizontal rule with ---
  await typeText(user, '---');
  await delay(1000);
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 8: Selection Shortcuts
 * Tests: Select All, extending selection
 */
export async function demonstrateSelection(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 8: Selection');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  await typeText(user, 'This is a line of text that we will use to demonstrate selection shortcuts.');
  await delay(800);
  
  // Select All: Ctrl + A
  await executeShortcut(user, '{Control>}a{/Control}');
  await delay(1000);
  
  // Deselect
  await user.keyboard('{ArrowRight}');
  await delay(500);
  
  // Extend selection - use DOM Selection API since Shift+Arrow doesn't work with synthetic events
  selectLastNChars(5);
  await delay(1000);
  
  await user.keyboard('{ArrowRight}'); // Deselect
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 9: Clear Formatting
 * Tests: Remove all formatting
 * 
 * Types formatted text using toggle pattern, then selects all via Cmd+A
 * (Lexical handles SELECT_ALL_COMMAND) and clears formatting.
 */
export async function demonstrateClearFormatting(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 9: Clear Formatting');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Type text with bold, italic, underline applied via select-then-format
  await typeText(user, 'Bold Italic Underlined Text');
  selectLastNChars(26); // Select entire text
  await delay(300);
  await executeShortcut(user, '{Control>}b{/Control}'); // Bold
  await executeShortcut(user, '{Control>}i{/Control}'); // Italic
  await executeShortcut(user, '{Control>}u{/Control}'); // Underline
  await delay(1000);
  
  // Now select all and clear formatting
  selectLastNChars(26); // Re-select
  await delay(300);
  
  // Clear formatting: Ctrl + Shift + 0 (ALL platforms)
  await executeShortcut(user, '{Control>}{Shift>}0{/Shift}{/Control}');
  await delay(1000);
  
  await user.keyboard('{ArrowRight}'); // Deselect
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Complete Keyboard Shortcuts Demonstration
 * Runs through all sections sequentially
 */
export async function runCompleteKeyboardShortcutsDemo(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Starting complete demonstration...');
  
  try {
    await demonstrateTextFormatting(canvas, userEvent);
    await demonstrateBlockTypes(canvas, userEvent);
    await demonstrateAlignment(canvas, userEvent);
    await demonstrateLinks(canvas, userEvent);
    await demonstrateUndoRedo(canvas, userEvent);
    await demonstrateIndentation(canvas, userEvent);
    await demonstrateMarkdownShortcuts(canvas, userEvent);
    await demonstrateSelection(canvas, userEvent);
    await demonstrateClearFormatting(canvas, userEvent);
    
    console.log('[Keyboard Shortcuts Demo] Complete demonstration finished!');
  } catch (error) {
    console.error('[Keyboard Shortcuts Demo] Error during demonstration:', error);
    throw error;
  }
}

/**
 * Create a play function for Storybook stories
 * 
 * @param sections - Optional array of specific sections to demonstrate
 * @returns Storybook play function
 * 
 * @example
 * ```typescript
 * export const KeyboardShortcuts = {
 *   render: () => <Editor />,
 *   play: createKeyboardShortcutsPlay(['textFormatting', 'blockTypes'])
 * };
 * ```
 */
export function createKeyboardShortcutsPlay(
  sections?: Array<
    | 'textFormatting'
    | 'blockTypes'
    | 'alignment'
    | 'links'
    | 'undoRedo'
    | 'indentation'
    | 'markdown'
    | 'selection'
    | 'clearFormatting'
    | 'all'
  >
) {
  return async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: 50 });
    
    const sectionsToRun = sections || ['all'];
    
    if (sectionsToRun.includes('all')) {
      await runCompleteKeyboardShortcutsDemo(canvas, user);
      return;
    }
    
    // Run specific sections
    for (const section of sectionsToRun) {
      switch (section) {
        case 'textFormatting':
          await demonstrateTextFormatting(canvas, user);
          break;
        case 'blockTypes':
          await demonstrateBlockTypes(canvas, user);
          break;
        case 'alignment':
          await demonstrateAlignment(canvas, user);
          break;
        case 'links':
          await demonstrateLinks(canvas, user);
          break;
        case 'undoRedo':
          await demonstrateUndoRedo(canvas, user);
          break;
        case 'indentation':
          await demonstrateIndentation(canvas, user);
          break;
        case 'markdown':
          await demonstrateMarkdownShortcuts(canvas, user);
          break;
        case 'selection':
          await demonstrateSelection(canvas, user);
          break;
        case 'clearFormatting':
          await demonstrateClearFormatting(canvas, user);
          break;
      }
    }
  };
}
