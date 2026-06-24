import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, within } from 'storybook/test'
import { ThemeMixer } from './ThemeMixer'
import type { CustomThemePaletteInput } from './ThemeMixer'

const meta: Meta<typeof ThemeMixer> = {
  title: '🏆 Gamification/Avatars & Cosmetics/Theme Mixer',
  component: ThemeMixer,
}
export default meta

/** Default state — no saved palette, starts with default colors */
export const Default: StoryObj<typeof ThemeMixer> = {
  args: {
    value: null,
    onSave: fn(),
  },
}

/** Pre-loaded with a custom purple palette */
export const WithCustomPalette: StoryObj<typeof ThemeMixer> = {
  args: {
    value: {
      primaryMain: '#7c4dff',
      secondaryMain: '#448aff',
      backgroundDefault: '#f3e5f5',
      backgroundPaper: '#ffffff',
      accentColor: '#ea80fc',
    } satisfies CustomThemePaletteInput,
    onSave: fn(),
  },
}

/** Pre-loaded with a warm orange/red palette */
export const WarmPalette: StoryObj<typeof ThemeMixer> = {
  args: {
    value: {
      primaryMain: '#ff5722',
      secondaryMain: '#ff9800',
      backgroundDefault: '#fff8e1',
      backgroundPaper: '#ffffff',
      accentColor: '#ffc107',
    } satisfies CustomThemePaletteInput,
    onSave: fn(),
  },
}

/** Interaction: verify color wheel, harmony buttons, and inputs */
export const Interaction: StoryObj<typeof ThemeMixer> = {
  args: {
    value: null,
    onSave: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Verify heading
    await expect(canvas.getByText('Mix Your Own Theme')).toBeInTheDocument()

    // Verify color wheel canvas exists
    const canvasEl = canvasElement.querySelector('canvas')
    await expect(canvasEl).not.toBeNull()

    // Verify harmony buttons
    await expect(canvas.getByText('Color Harmonies')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Mono/i })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Analogous/i })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Split/i })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Compl/i })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Triadic/i })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /Square/i })).toBeInTheDocument()

    // Verify color input labels
    await expect(canvas.getByRole('textbox', { name: 'Primary' })).toBeInTheDocument()
    await expect(canvas.getByRole('textbox', { name: 'Secondary' })).toBeInTheDocument()
    await expect(canvas.getByRole('textbox', { name: 'Background' })).toBeInTheDocument()
    await expect(canvas.getByRole('textbox', { name: 'Paper' })).toBeInTheDocument()
    await expect(canvas.getByRole('textbox', { name: 'Accent' })).toBeInTheDocument()

    // Verify preview text
    await expect(canvas.getByText('Preview')).toBeInTheDocument()
    await expect(canvas.getByText('Light')).toBeInTheDocument()
    await expect(canvas.getByText('Dark')).toBeInTheDocument()

    // Save button should exist
    await expect(canvas.getByRole('button', { name: /Save Custom Theme/i })).toBeInTheDocument()
  },
}
