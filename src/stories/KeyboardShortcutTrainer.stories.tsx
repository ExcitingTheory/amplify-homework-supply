import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import KeyboardShortcutTrainer from './KeyboardShortcutTrainer';
import { expect } from 'storybook/test'

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
  title: '🏠 Getting Started/Keyboard Shortcuts',
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
  tags: [],
} satisfies Meta<typeof KeyboardShortcutTrainer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default trainer ready to use
 * Try pressing keyboard shortcuts to see them light up!
 */
export const Default: Story = {  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
