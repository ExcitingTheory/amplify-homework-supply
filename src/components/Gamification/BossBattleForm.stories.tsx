import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'
import { fn } from 'storybook/test'
import { BossBattleForm, DEFAULT_STAKES } from './BossBattleForm'

const meta: Meta<typeof BossBattleForm> = {
  title: '🏆 Gamification/Instructor/Boss Battle Form',
  component: BossBattleForm,
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
  },
}
export default meta

type Story = StoryObj<typeof BossBattleForm>

/** Default empty form */
export const Default: Story = {}

/** Form in submitting state */
export const Submitting: Story = {
  args: {
    submitting: true,
  },
}

/** Interaction: fill and submit the form */
export const FillAndSubmit: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Fill required fields
    await userEvent.type(canvas.getByLabelText(/Title/i), 'The Algorithm Dragon')
    await userEvent.type(canvas.getByLabelText(/Target XP/i), '2000')

    // Fill optional fields
    await userEvent.type(
      canvas.getByLabelText(/Narrative Setting/i),
      'A world where bugs rule the codebase'
    )

    // Toggle some stakes
    await userEvent.click(canvas.getByLabelText(/Lose a level/i))
    await userEvent.click(canvas.getByLabelText(/Lose XP points/i))

    // Submit
    const btn = canvas.getByRole('button', { name: /Create Boss Battle/i })
    await expect(btn).not.toBeDisabled()
    await userEvent.click(btn)

    // Verify callback
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'The Algorithm Dragon',
        targetXP: 2000,
        bonusMultiplier: 1.5,
        setting: 'A world where bugs rule the codebase',
      })
    )
  },
}

/** Interaction: attempt submit with missing required fields */
export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Only fill title, skip targetXP
    await userEvent.type(canvas.getByLabelText(/Title/i), 'Half-filled')

    // Button should still be disabled
    const btn = canvas.getByRole('button', { name: /Create Boss Battle/i })
    await expect(btn).toBeDisabled()
  },
}
