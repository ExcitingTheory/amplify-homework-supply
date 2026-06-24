import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, within } from 'storybook/test'
import { ThemeUnlockEditor } from './ThemeUnlockEditor'

const meta: Meta<typeof ThemeUnlockEditor> = {
  title: '🏆 Gamification/Admin/Theme Unlock Editor',
  component: ThemeUnlockEditor,
}
export default meta

/** Default state — no existing config, shows default unlock levels */
export const Default: StoryObj<typeof ThemeUnlockEditor> = {
  args: {
    config: null,
    onSave: fn(),
    sectionName: 'Period 1',
  },
}

/** With custom config — adjusted unlock levels */
export const CustomConfig: StoryObj<typeof ThemeUnlockEditor> = {
  args: {
    config: {
      unlocks: [
        { themeId: 'default', minLevel: 1 },
        { themeId: 'midnight', minLevel: 3 },
        { themeId: 'forest', minLevel: 5 },
        { themeId: 'sunset', minLevel: 7 },
        { themeId: 'aurora', minLevel: 10 },
        { themeId: 'custom', minLevel: 4 },
      ],
    },
    onSave: fn(),
  },
}

/** Interaction: verify UI elements render correctly */
export const Interaction: StoryObj<typeof ThemeUnlockEditor> = {
  args: {
    config: null,
    onSave: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify heading
    await expect(canvas.getByText('Theme Unlock Levels')).toBeInTheDocument()

    // Verify theme names are present
    await expect(canvas.getByText('Default')).toBeInTheDocument()
    await expect(canvas.getByText('Midnight')).toBeInTheDocument()
    await expect(canvas.getByText('Forest')).toBeInTheDocument()
    await expect(canvas.getByText('Sunset')).toBeInTheDocument()
    await expect(canvas.getByText('Aurora')).toBeInTheDocument()
    await expect(canvas.getByText('Custom (User-mixed)')).toBeInTheDocument()

    // Save button should be disabled (no changes)
    const saveBtn = canvas.getByRole('button', { name: /Save/i })
    await expect(saveBtn).toBeDisabled()
  },
}
