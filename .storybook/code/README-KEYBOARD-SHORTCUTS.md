# Keyboard Shortcuts Demo Script

Automated demonstration system for showcasing all keyboard shortcuts available in the Homework Supply Editor.

## Overview

The keyboard shortcuts script ([keyboard-shortcuts-script.ts](./keyboard-shortcuts-script.ts)) provides automated playthrough functions that demonstrate all available keyboard shortcuts in the Editor. This is useful for:

- **Onboarding** - Teaching new users how to use the editor efficiently
- **Documentation** - Visually demonstrating shortcuts alongside written docs
- **Testing** - Verifying that all keyboard shortcuts work correctly
- **Training** - Creating training materials and walkthroughs

## Features

### 9 Demonstration Sections

1. **Text Formatting** - Bold, Italic, Underline, Strikethrough
2. **Block Types** - Headings (H1-H3), Lists, Quotes, Code Blocks
3. **Alignment** - Left, Center, Right, Justify (web editor standard: Ctrl+Shift+L/E/R/J)
4. **Links** - Insert and edit links (Cmd/Ctrl+K)
5. **Undo/Redo** - Revert and restore changes
6. **Indentation** - Tab and Shift+Tab for nesting
7. **Markdown Shortcuts** - Auto-conversion (#, -, >, etc.)
8. **Selection** - Select all and extend selection
9. **Clear Formatting** - Remove all formatting (Cmd/Ctrl+Shift+0)

**⚠️ Platform Compatibility Strategy:**

**Two types of shortcuts:**

1. **OS-Standard Shortcuts** (use Cmd on Mac / Ctrl on Windows):
   - Bold, Italic, Underline: Cmd/Ctrl+B/I/U
   - Undo/Redo: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z
   - Link: Cmd/Ctrl+K
   - Select All: Cmd/Ctrl+A

2. **App-Specific Shortcuts** (use Ctrl on ALL platforms including Mac!):
   - Headings: Ctrl+Shift+1/2/3 (⌃⇧1/2/3)
   - Lists: Ctrl+Shift+7/8 (⌃⇧7/8)
   - Quote: Ctrl+' (⌃')
   - Code Block: Ctrl+Shift+C (⌃⇧C)
   - Alignment: Ctrl+Shift+L/E/R/J (⌃⇧L/E/R/J)
   - Strikethrough: Ctrl+Shift+X (⌃⇧X)
   - Clear Formatting: Ctrl+Shift+0 (⌃⇧0)

**Why this approach?**
- Matches VS Code pattern for conflict-free shortcuts
- Avoids Mac system shortcuts: Cmd+Shift+3/4/5 (screenshots), Cmd+Option (Mission Control)
- Works identically across all platforms (Mac users simply use Ctrl key)
- OS-standard shortcuts still use Cmd on Mac for familiar behavior

### Interactive Training Mode

The keyboard shortcuts help page includes an **Interactive Training Mode** that gamifies learning:

**Features:**
- **Real-time Detection** - Press shortcuts and watch them light up
- **Progress Tracking** - See completion across 4 categories (20 total shortcuts)
- **Achievement System** - Earn badges for specific shortcuts
- **Tiered Mastery** - Progress from Novice (5) → Apprentice (10) → Expert (15) → Master (20)
- **Secret Tasks** - Unlock hidden onboarding achievements

**How to Use:**
1. Navigate to **Help → Keyboard Shortcuts** in Storybook
2. Scroll to the **Interactive Training Mode** section
3. Practice shortcuts by pressing the key combinations
4. Watch as rows highlight and progress updates
5. Complete all shortcuts to become a **Keyboard Master** 👑

**Secret Achievements:**

Completing the keyboard training unlocks **4 hidden onboarding tasks**:

1. **👑 Keyboard Master Challenge** - Complete all 20 shortcuts
2. **⚡ Speed Demon** - Complete training in under 5 minutes
3. **🏅 Achievement Hunter** - Unlock all individual achievement badges
4. **📢 Shortcut Evangelist** - Use shortcuts in daily workflow

These tasks appear in the onboarding panel under the "🎁 Extra Credit" category!

### Flexible Execution

Run all sections at once or pick specific ones:

```typescript
// Run all sections
createKeyboardShortcutsPlay(['all'])

// Run specific sections only
createKeyboardShortcutsPlay(['textFormatting', 'blockTypes'])

// Run single section
createKeyboardShortcutsPlay(['alignment'])
```

## Usage in Storybook Stories

### Basic Usage

Add to any Editor story's `play` function:

```jsx
export const KeyboardDemo = {
  render: () => <Editor />,
  play: async ({ canvasElement }) => {
    const { createKeyboardShortcutsPlay } = await import(
      '../../../.storybook/code/keyboard-shortcuts-script.ts'
    );
    
    const playFn = createKeyboardShortcutsPlay(['all']);
    await playFn({ canvasElement });
  },
};
```

### Focused Demos

Create focused stories for specific shortcut categories:

```jsx
export const FormattingShortcuts = {
  render: () => <Editor />,
  play: async ({ canvasElement }) => {
    const { createKeyboardShortcutsPlay } = await import(
      '../../../.storybook/code/keyboard-shortcuts-script.ts'
    );
    
    const playFn = createKeyboardShortcutsPlay([
      'textFormatting', 
      'clearFormatting'
    ]);
    await playFn({ canvasElement });
  },
};
```

### Custom Section Order

```jsx
export const CustomOrder = {
  render: () => <Editor />,
  play: async ({ canvasElement }) => {
    const { createKeyboardShortcutsPlay } = await import(
      '../../../.storybook/code/keyboard-shortcuts-script.ts'
    );
    
    // Run sections in specific order
    const playFn = createKeyboardShortcutsPlay([
      'blockTypes',
      'textFormatting',
      'alignment',
    ]);
    await playFn({ canvasElement });
  },
};
```

## Direct Function Usage

You can also call individual demonstration functions:

```typescript
import { within, userEvent } from '@storybook/test';
import { 
  demonstrateTextFormatting,
  demonstrateBlockTypes,
  demonstrateAlignment,
  runCompleteKeyboardShortcutsDemo 
} from '.storybook/code/keyboard-shortcuts-script';

export const CustomDemo = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const userEvent = testUserEvent.setup({ delay: 50 });
    
    // Run specific sections manually
    await demonstrateTextFormatting(canvas, userEvent);
    await demonstrateAlignment(canvas, userEvent);
    
    // Or run everything
    await runCompleteKeyboardShortcutsDemo(canvas, userEvent);
  },
};
```

## Available Sections

| Section ID | Description | Shortcuts Demonstrated |
|------------|-------------|------------------------|
| `textFormatting` | Text styling | Bold (⌘B/Ctrl+B), Italic (⌘I/Ctrl+I), Underline (⌘U/Ctrl+U), Strikethrough (⌃⇧X) |
| `blockTypes` | Block conversion | Headings (⌃⇧1/2/3), Lists (⌃⇧7/8), Quote (⌃'), Code (⌃⇧C) |
| `alignment` | Text alignment | Left (⌃⇧L), Center (⌃⇧E), Right (⌃⇧R), Justify (⌃⇧J) |
| `links` | Link operations | Insert Link (⌘K/Ctrl+K) |
| `undoRedo` | History navigation | Undo (⌘Z/Ctrl+Z), Redo (⌘⇧Z/Ctrl+Shift+Z) |
| `indentation` | Nesting | Indent (Tab), Outdent (⇧Tab) |
| `markdown` | Auto-conversion | #, ##, ###, -, >, ---, ``` |
| `selection` | Text selection | Select All (⌘A/Ctrl+A), Extend Selection (⇧Arrows) |
| `clearFormatting` | Remove styles | Clear Formatting (⌃⇧0) |
| `all` | Everything | Runs all sections sequentially |

## Demo Timing

Each action includes built-in delays for better visualization:

- **Text typing**: 300ms delay after
- **Shortcuts**: 500ms delay after
- **Custom delays**: Use `delay()` utility function

Adjust timing by modifying the delay parameters in function calls.

## Platform Compatibility

The script uses TWO keyboard modifier strategies:

**1. OS-Standard Shortcuts (`{Meta>}`)**:
- Automatically maps to Cmd on Mac, Ctrl on Windows/Linux
- Used for: Bold, Italic, Underline, Link, Undo, Select All
- Example: `{Meta>}b{/Meta}` = Cmd+B on Mac, Ctrl+B on Windows

**2. App-Specific Shortcuts (`{Control>}`)**:
- Always uses Ctrl key on ALL platforms (including Mac!)
- Used for: Headings, Lists, Alignment, Code Blocks, Quote, Strikethrough, Clear Formatting
- Example: `{Control>}{Shift>}1{/Shift}{/Control}` = Ctrl+Shift+1 on ALL platforms

This dual approach matches VS Code and avoids all Mac system conflicts.

## Related Documentation

- **[Storybook Help Page](?path=/docs/help-keyboard-shortcuts--docs)** - Interactive reference in Storybook
- **[Full Shortcuts Reference](../../docs/KEYBOARD_SHORTCUTS.md)** - Complete markdown list
- **[Editor Stories](../../src/components/Editor3/Editor.stories.jsx)** - Live examples
- **[Onboarding Tasks](./onboarding-tasks.ts)** - Tutorial tasks using shortcuts

## Example Stories

The following stories are available in [Editor.stories.jsx](../../src/components/Editor3/Editor.stories.jsx):

1. **KeyboardShortcutsDemo** - Complete demonstration of all shortcuts
2. **KeyboardShortcutsTextFormatting** - Text formatting only
3. **KeyboardShortcutsBlockTypes** - Block types and markdown
4. **KeyboardShortcutsAlignment** - Alignment shortcuts only

## Testing

Run Storybook and navigate to the stories to see the demos:

```bash
npm run storybook
```

Then:
1. Navigate to "📚 Creating Lessons" → "Editor"
2. Select "Keyboard Shortcuts Demo" story
3. Click the "Play" button (or wait for auto-play)
4. Watch the automated demonstration

## Customization

### Adjust Delays

Modify timing for slower/faster demos:

```typescript
// Slower demo (better for presentations)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms * 2));

// Faster demo (better for testing)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms / 2));
```

### Add New Sections

Create new demonstration functions following this pattern:

```typescript
export async function demonstrateNewFeature(
  canvas: Canvas,
  userEvent: typeof testUserEvent
): Promise<void> {
  console.log('[Keyboard Shortcuts Demo] Section X: New Feature');
  
  const editor = await getEditorElement(canvas);
  await userEvent.click(editor);
  await delay(500);
  
  // Your demonstration steps here
  await typeText(userEvent, 'Example text');
  await executeShortcut(userEvent, '{Meta>}x{/Meta}');
  
  await typeText(userEvent, '{Enter}{Enter}');
}
```

Then add it to the section mapping in `createKeyboardShortcutsPlay`.

## Troubleshooting

**Demo doesn't start:**
- Ensure the Editor component is fully mounted
- Check that contenteditable element exists
- Verify mock data is initialized if needed

**Shortcuts not working:**
- Check browser focus is on the editor
- Verify shortcuts are registered in Lexical config
- Test manually to confirm shortcut works outside automation

**Timing issues:**
- Increase delay times if actions happen too fast
- Check for async operations that need `waitFor`
- Use `await` on all async operations

## Contributing

When adding new keyboard shortcuts:

1. Add shortcut to [docs/KEYBOARD_SHORTCUTS.md](../../docs/KEYBOARD_SHORTCUTS.md)
2. Create demonstration function in this script
3. Add to section mapping
4. Create example story in Editor.stories.jsx
5. Update this README with new section

---

**Maintainer**: Development Team  
**Last Updated**: February 2026  
**Related Files**:
- [keyboard-shortcuts-script.ts](./keyboard-shortcuts-script.ts)
- [KEYBOARD_SHORTCUTS.md](../../docs/KEYBOARD_SHORTCUTS.md)
- [Editor.stories.jsx](../../src/components/Editor3/Editor.stories.jsx)
