/**
 * Keyboard Shortcuts Demonstration Script
 * 
 * Automated playthrough of all available keyboard shortcuts in the Editor.
 * Demonstrates text formatting, block types, alignment, and other features.
 * Based on shortcuts documented in docs/KEYBOARD_SHORTCUTS.md
 * 
 * @module code/keyboard-shortcuts-script
 */

import { within, userEvent as testUserEvent } from '@storybook/test';
import type { Canvas } from '@storybook/test';

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
  userEvent: typeof testUserEvent, 
  text: string, 
  delayMs: number = 300
): Promise<void> {
  await userEvent.keyboard(text);
  await delay(delayMs);
}

/**
 * Execute a keyboard shortcut
 */
async function executeShortcut(
  userEvent: typeof testUserEvent,
  shortcut: string,
  delayMs: number = 500
): Promise<void> {
  await userEvent.keyboard(shortcut);
  await delay(delayMs);
}

/**
 * Section 1: Text Formatting Shortcuts
 * Tests: Bold, Italic, Underline, Strikethrough
 */
export async function demonstrateTextFormatting(
  canvas: Canvas, 
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 1: Text Formatting');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Bold: Cmd/Ctrl + B
  await typeText(userEvent, 'Bold Text');
  await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}'); // Select "Text"
  await executeShortcut(userEvent, '{Meta>}b{/Meta}'); // Mac: Cmd+B
  await userEvent.keyboard('{ArrowRight}'); // Deselect
  await typeText(userEvent, '{Enter}');
  
  // Italic: Cmd/Ctrl + I
  await typeText(userEvent, 'Italic Text');
  await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await executeShortcut(userEvent, '{Meta>}i{/Meta}');
  await userEvent.keyboard('{ArrowRight}');
  await typeText(userEvent, '{Enter}');
  
  // Underline: Cmd/Ctrl + U
  await typeText(userEvent, 'Underlined Text');
  await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await executeShortcut(userEvent, '{Meta>}u{/Meta}');
  await userEvent.keyboard('{ArrowRight}');
  await typeText(userEvent, '{Enter}');
  
  // Strikethrough: Ctrl + Shift + X (ALL platforms including Mac!)
  await typeText(userEvent, 'Strikethrough Text');
  await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await executeShortcut(userEvent, '{Control>}{Shift>}x{/Shift}{/Control}');
  await userEvent.keyboard('{ArrowRight}');
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 2: Block Type Shortcuts
 * Tests: Headings, Lists, Quotes, Code Blocks
 */
export async function demonstrateBlockTypes(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 2: Block Types');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Heading 1: Ctrl + Shift + 1 (ALL platforms)
  await typeText(userEvent, 'This is a Heading 1');
  await executeShortcut(userEvent, '{Control>}{Shift>}1{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}');
  
  // Heading 2: Ctrl + Shift + 2
  await typeText(userEvent, 'This is a Heading 2');
  await executeShortcut(userEvent, '{Control>}{Shift>}2{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}');
  
  // Heading 3: Ctrl + Shift + 3
  await typeText(userEvent, 'This is a Heading 3');
  await executeShortcut(userEvent, '{Control>}{Shift>}3{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}');
  
  // Bullet List: Ctrl + Shift + 8
  await typeText(userEvent, 'First bullet item');
  await executeShortcut(userEvent, '{Control>}{Shift>}8{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}Second bullet item{Enter}Third bullet item{Enter}{Enter}');
  
  // Numbered List: Ctrl + Shift + 7
  await typeText(userEvent, 'First numbered item');
  await executeShortcut(userEvent, '{Control>}{Shift>}7{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}Second numbered item{Enter}Third numbered item{Enter}{Enter}');
  
  // Quote: Ctrl + '
  await typeText(userEvent, 'This is a block quote demonstrating wisdom.');
  await executeShortcut(userEvent, "{Control>}'{/Control}");
  await typeText(userEvent, '{Enter}');
  
  // Code Block: Ctrl + Shift + C
  await typeText(userEvent, 'const hello = "world";');
  await executeShortcut(userEvent, '{Control>}{Shift>}c{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 3: Alignment Shortcuts
 * Tests: Left, Center, Right, Justify
 */
export async function demonstrateAlignment(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 3: Alignment');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Align Left: Ctrl + Shift + L (ALL platforms)
  await typeText(userEvent, 'Left aligned text');
  await executeShortcut(userEvent, '{Control>}{Shift>}l{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}');
  
  // Align Center: Ctrl + Shift + E
  await typeText(userEvent, 'Center aligned text');
  await executeShortcut(userEvent, '{Control>}{Shift>}e{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}');
  
  // Align Right: Ctrl + Shift + R
  await typeText(userEvent, 'Right aligned text');
  await executeShortcut(userEvent, '{Control>}{Shift>}r{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}');
  
  // Justify: Ctrl + Shift + J
  await typeText(userEvent, 'Justified text that spreads across the full width of the container evenly.');
  await executeShortcut(userEvent, '{Control>}{Shift>}j{/Shift}{/Control}');
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 4: Link Shortcuts
 * Tests: Insert/Edit Link
 */
export async function demonstrateLinks(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 4: Links');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Insert Link: Cmd/Ctrl + K
  await typeText(userEvent, 'Click here to visit our site');
  
  // Select "here"
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
  await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}');
  
  // Open link dialog
  await executeShortcut(userEvent, '{Meta>}k{/Meta}');
  await delay(1000);
  
  // Note: Link dialog interaction would need to happen here in a real scenario
  // Pressing Escape to close dialog for demo purposes
  await userEvent.keyboard('{Escape}');
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 5: Undo/Redo Shortcuts
 * Tests: Undo and Redo operations
 */
export async function demonstrateUndoRedo(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 5: Undo/Redo');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Type some text
  await typeText(userEvent, 'This text will be undone');
  await delay(800);
  
  // Undo: Cmd/Ctrl + Z
  await executeShortcut(userEvent, '{Meta>}z{/Meta}');
  await delay(800);
  
  // Redo: Cmd/Ctrl + Shift + Z
  await executeShortcut(userEvent, '{Meta>}{Shift>}z{/Shift}{/Meta}');
  await delay(800);
  
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 6: Indentation Shortcuts
 * Tests: Tab and Shift+Tab
 */
export async function demonstrateIndentation(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 6: Indentation');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Create a list first
  await typeText(userEvent, 'Parent item');
  await executeShortcut(userEvent, '{Meta>}{Shift>}8{/Shift}{/Meta}'); // Bullet list
  await typeText(userEvent, '{Enter}');
  
  // Indent: Tab
  await typeText(userEvent, 'Nested item');
  await executeShortcut(userEvent, '{Tab}');
  await typeText(userEvent, '{Enter}');
  
  // Outdent: Shift + Tab
  await typeText(userEvent, 'Back to parent level');
  await executeShortcut(userEvent, '{Shift>}{Tab}{/Shift}');
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 7: Markdown Shortcuts
 * Tests: Auto-conversion shortcuts like #, -, >, etc.
 */
export async function demonstrateMarkdownShortcuts(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 7: Markdown Shortcuts');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Heading with #
  await typeText(userEvent, '# Markdown Heading 1 ');
  await delay(1000);
  await typeText(userEvent, '{Enter}');
  
  // Heading with ##
  await typeText(userEvent, '## Markdown Heading 2 ');
  await delay(1000);
  await typeText(userEvent, '{Enter}');
  
  // Bullet list with -
  await typeText(userEvent, '- Markdown bullet item ');
  await delay(1000);
  await typeText(userEvent, '{Enter}{Enter}');
  
  // Numbered list with 1.
  await typeText(userEvent, '1. Markdown numbered item ');
  await delay(1000);
  await typeText(userEvent, '{Enter}{Enter}');
  
  // Block quote with >
  await typeText(userEvent, '> Markdown quote ');
  await delay(1000);
  await typeText(userEvent, '{Enter}');
  
  // Horizontal rule with ---
  await typeText(userEvent, '---');
  await delay(1000);
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 8: Selection Shortcuts
 * Tests: Select All, word selection, line selection
 */
export async function demonstrateSelection(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 8: Selection');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  await typeText(userEvent, 'This is a line of text that we will use to demonstrate selection shortcuts.');
  await delay(800);
  
  // Select All: Cmd/Ctrl + A
  await executeShortcut(userEvent, '{Meta>}a{/Meta}');
  await delay(1000);
  
  // Deselect
  await userEvent.keyboard('{ArrowRight}');
  await delay(500);
  
  // Extend selection with Shift + Arrow
  await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');
  await delay(1000);
  
  await userEvent.keyboard('{ArrowRight}'); // Deselect
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Section 9: Clear Formatting
 * Tests: Remove all formatting
 */
export async function demonstrateClearFormatting(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section 9: Clear Formatting');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Type formatted text
  await typeText(userEvent, 'Bold Italic Underlined Text');
  
  // Select all
  await userEvent.keyboard('{Meta>}a{/Meta}');
  
  // Apply multiple formats
  await executeShortcut(userEvent, '{Meta>}b{/Meta}'); // Bold
  await executeShortcut(userEvent, '{Meta>}i{/Meta}'); // Italic
  await executeShortcut(userEvent, '{Meta>}u{/Meta}'); // Underline
  await delay(1000);
  
  // Clear formatting: Ctrl + Shift + 0 (ALL platforms)
  await executeShortcut(userEvent, '{Control>}{Shift>}0{/Shift}{/Control}');
  await delay(1000);
  
  await userEvent.keyboard('{ArrowRight}'); // Deselect
  await typeText(userEvent, '{Enter}{Enter}');
}

/**
 * Complete Keyboard Shortcuts Demonstration
 * Runs through all sections sequentially
 */
export async function runCompleteKeyboardShortcutsDemo(
  canvas: Canvas,
  userEvent: typeof testUserEvent
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
    const userEvent = testUserEvent.setup({ delay: 50 });
    
    const sectionsToRun = sections || ['all'];
    
    if (sectionsToRun.includes('all')) {
      await runCompleteKeyboardShortcutsDemo(canvas, userEvent);
      return;
    }
    
    // Run specific sections
    for (const section of sectionsToRun) {
      switch (section) {
        case 'textFormatting':
          await demonstrateTextFormatting(canvas, userEvent);
          break;
        case 'blockTypes':
          await demonstrateBlockTypes(canvas, userEvent);
          break;
        case 'alignment':
          await demonstrateAlignment(canvas, userEvent);
          break;
        case 'links':
          await demonstrateLinks(canvas, userEvent);
          break;
        case 'undoRedo':
          await demonstrateUndoRedo(canvas, userEvent);
          break;
        case 'indentation':
          await demonstrateIndentation(canvas, userEvent);
          break;
        case 'markdown':
          await demonstrateMarkdownShortcuts(canvas, userEvent);
          break;
        case 'selection':
          await demonstrateSelection(canvas, userEvent);
          break;
        case 'clearFormatting':
          await demonstrateClearFormatting(canvas, userEvent);
          break;
      }
    }
  };
}
