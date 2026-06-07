import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { CosmeticSelector } from './CosmeticSelector'

const meta: Meta<typeof CosmeticSelector> = {
  title: '🏆 Gamification/Avatars & Cosmetics/Cosmetic Selector',
  component: CosmeticSelector,
}
export default meta

export const SelectorLevel3: StoryObj<typeof CosmeticSelector> = {
  render: () => (
    <CosmeticSelector
      level={3}
      selectedThemeId="default"
      onThemeSelect={(id) => console.log('theme:', id)}
    />
  ),
}

export const SelectorLevel5: StoryObj<typeof CosmeticSelector> = {
  render: () => (
    <CosmeticSelector
      level={5}
      selectedThemeId="aurora"
    />
  ),
}

/** Interaction: verify editor theme section renders */
export const SelectorInteraction: StoryObj<typeof CosmeticSelector> = {
  render: () => (
    <CosmeticSelector
      level={5}
      selectedThemeId="default"
      onThemeSelect={(id) => console.log('theme:', id)}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify editor theme heading is present
    await expect(canvas.getByText('Editor Theme')).toBeInTheDocument()

    // Avatar style heading should be present
    await expect(canvas.getByText('Avatar Style')).toBeInTheDocument()
  },
}
