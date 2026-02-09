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
 * Section 1: Text Formatting Shortcuts
 * Tests: Bold, Italic, Underline, Strikethrough
 */
export async function demonstrateTextFormatting(
  canvas: Canvas, 
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 1: Text Formatting');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Bold: Cmd/Ctrl + B
  await typeText(user, 'Bold Text');
  await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}'); // Select "Text"
  await executeShortcut(user, '{Meta>}b{/Meta}'); // Mac: Cmd+B
  await user.keyboard('{ArrowRight}'); // Deselect
  await typeText(user, '{Enter}');
  
  // Italic: Cmd/Ctrl + I
  await typeText(user, 'Italic Text');
  await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await executeShortcut(user, '{Meta>}i{/Meta}');
  await user.keyboard('{ArrowRight}');
  await typeText(user, '{Enter}');
  
  // Underline: Cmd/Ctrl + U
  await typeText(user, 'Underlined Text');
  await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await executeShortcut(user, '{Meta>}u{/Meta}');
  await user.keyboard('{ArrowRight}');
  await typeText(user, '{Enter}');
  
  // Strikethrough: Ctrl + Shift + X (ALL platforms including Mac!)
  await typeText(user, 'Strikethrough Text');
  await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await executeShortcut(user, '{Control>}{Shift>}x{/Shift}{/Control}');
  await user.keyboard('{ArrowRight}');
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
  await typeText(user, '{Enter}');
  
  // Code Block: Ctrl + Shift + C
  await typeText(user, 'const hello = "world";');
  await executeShortcut(user, '{Control>}{Shift>}c{/Shift}{/Control}');
  await typeText(user, '{Enter}{Enter}');
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
  
  // Select "here"
  await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}');
  
  // Open link dialog
  await executeShortcut(user, '{Meta>}k{/Meta}');
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
  
  // Undo: Cmd/Ctrl + Z
  await executeShortcut(user, '{Meta>}z{/Meta}');
  await delay(800);
  
  // Redo: Cmd/Ctrl + Shift + Z
  await executeShortcut(user, '{Meta>}{Shift>}z{/Shift}{/Meta}');
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
  await executeShortcut(user, '{Meta>}{Shift>}8{/Shift}{/Meta}'); // Bullet list
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
 * Tests: Select All, word selection, line selection
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
  
  // Select All: Cmd/Ctrl + A
  await executeShortcut(user, '{Meta>}a{/Meta}');
  await delay(1000);
  
  // Deselect
  await user.keyboard('{ArrowRight}');
  await delay(500);
  
  // Extend selection with Shift + Arrow
  await user.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await delay(1000);
  
  await user.keyboard('{ArrowRight}'); // Deselect
  await typeText(user, '{Enter}{Enter}');
}

/**
 * Section 9: Clear Formatting
 * Tests: Remove all formatting
 */
export async function demonstrateClearFormatting(
  canvas: Canvas,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 9: Clear Formatting');
  
  const editor = await getEditorElement(canvas);
  await user.click(editor);
  await delay(500);
  
  // Type formatted text
  await typeText(user, 'Bold Italic Underlined Text');
  
  // Select all
  await user.keyboard('{Meta>}a{/Meta}');
  
  // Apply multiple formats
  await executeShortcut(user, '{Meta>}b{/Meta}'); // Bold
  await executeShortcut(user, '{Meta>}i{/Meta}'); // Italic
  await executeShortcut(user, '{Meta>}u{/Meta}'); // Underline
  await delay(1000);
  
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
