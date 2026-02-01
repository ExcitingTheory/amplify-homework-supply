import type { Meta, StoryObj } from '@storybook/react';
import KeyboardShortcutTrainer from './KeyboardShortcutTrainer';

/**
 * Interactive Keyboard Shortcut Trainer
 * 
 * Gamified training component that teaches users keyboard shortcuts through practice.
 * Features:
 * - Real-time shortcut detection
 * - Progress tracking by category
 * - Achievement system with tiers
 * - Visual feedback when shortcuts are performed correctly
 * 
 * Used in the Help → Keyboard Shortcuts documentation page.
 */
const meta = {
  title: 'Help/Keyboard Shortcut Trainer',
  component: KeyboardShortcutTrainer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**Interactive Keyboard Shortcut Training**

This component gamifies learning keyboard shortcuts by:

1. **Tracking Progress** - Shows completion status across 4 categories
2. **Awarding Achievements** - Unlocks badges for specific shortcuts
3. **Tiered Mastery** - Progress from Novice to Keyboard Master
4. **Visual Feedback** - Highlights rows when shortcuts are performed
5. **Secret Tasks** - Unlocks hidden onboarding tasks when completed

**Categories:**
- 📝 Formatting (Bold, Italic, Underline, etc.)
- 🔤 Block Types (Headings, Lists, Quotes, Code)
- ↔️ Alignment (Left, Center, Right, Justify)
- 🎯 Navigation (Undo, Redo, Select All)

**How It Works:**
Users practice shortcuts by pressing the key combinations listed. When a shortcut is detected:
1. The row highlights in green
2. A checkmark appears
3. Progress updates
4. Achievements unlock

**Achievement Tiers:**
- 🎯 Keyboard Novice (5 shortcuts)
- ⚡ Shortcut Apprentice (10 shortcuts)
- 🚀 Efficiency Expert (15 shortcuts)
- 👑 Keyboard Master (20 shortcuts)

Completing all shortcuts unlocks the secret "Keyboard Master Challenge" onboarding task!
        `.trim(),
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof KeyboardShortcutTrainer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default trainer ready to use
 * Try pressing keyboard shortcuts to see them light up!
 */
export const Default: Story = {};

/**
 * Example embedded in documentation
 * This is how it appears in the Help → Keyboard Shortcuts page
 */
export const InDocumentation: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This is how the trainer appears when embedded in the Keyboard Shortcuts help page.
Users can practice shortcuts right from the documentation!

**Try these shortcuts:**
- **Bold**: ⌘B (Mac) or Ctrl+B (Windows)
- **Italic**: ⌘I (Mac) or Ctrl+I (Windows)
- **Heading 1**: ⌘⌥1 (Mac) or Ctrl+Alt+1 (Windows)
- **Bullet List**: ⌘⇧8 (Mac) or Ctrl+Shift+8 (Windows)
        `.trim(),
      },
    },
  },
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
