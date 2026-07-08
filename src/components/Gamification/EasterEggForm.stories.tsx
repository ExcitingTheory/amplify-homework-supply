import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { EasterEggForm } from './EasterEggForm'

const meta: Meta<typeof EasterEggForm> = {
  title: '🏆 Gamification/Instructor/Easter Egg Form',
  component: EasterEggForm,
}
export default meta

type Story = StoryObj<typeof EasterEggForm>

export const Default: Story = {
  args: {
    onSubmit: fn(),
    availableUnits: [
      { id: 'unit-1', name: 'Lesson 1 - Greetings' },
      { id: 'unit-2', name: 'Lesson 2 - Numbers' },
    ],
    availableBadges: [
      { id: 'badge-1', title: 'Explorer' },
      { id: 'badge-2', title: 'Codebreaker' },
    ],
    submitting: false,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    // Fill keyword (default trigger type is KEYWORD)
    const keywordInput = await canvas.findByLabelText(/Keyword \/ Sequence/i)
    await userEvent.clear(keywordInput)
    await userEvent.type(keywordInput, 'konami')

    // Fill reveal message
    const messageInput = await canvas.findByLabelText(/Reveal Message/i)
    await userEvent.clear(messageInput)
    await userEvent.type(messageInput, 'You found the secret!')

    // Submit button should now be enabled
    const submitBtn = await canvas.findByRole('button', { name: /Add Easter Egg/i })
    await expect(submitBtn).not.toBeDisabled()
    await userEvent.click(submitBtn)

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'KEYWORD',
        keyword: 'konami',
        message: 'You found the secret!',
      })
    )
  },
}

export const Submitting: Story = {
  args: {
    onSubmit: fn(),
    submitting: true,
  },
}
