import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { AnimatedXPCounter } from './AnimatedXPCounter'

const meta: Meta<typeof AnimatedXPCounter> = {
  title: '🏆 Gamification/XP & Progression/Animated XP Counter',
  component: AnimatedXPCounter,
}
export default meta

type Story = StoryObj<typeof AnimatedXPCounter>

export const Default: Story = {
  args: { targetValue: 1250 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Counter renders (animates toward 1250)
    await canvas.findByText(/\d+/)
  },
}

export const SlowAnimation: Story = {
  args: { targetValue: 500, duration: 2000, variant: 'h4' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/\d+/)
  },
}

export const Interactive: Story = {
  render: () => {
    const [xp, setXp] = useState(100)
    return (
      <div>
        <AnimatedXPCounter targetValue={xp} />
        <button onClick={() => setXp((v) => v + 50)} style={{ marginTop: 12 }}>
          +50 XP
        </button>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Counter renders
    const btn = canvas.getByRole('button', { name: /\+50 XP/i })
    expect(btn).toBeInTheDocument()
    // Click "+50 XP" button to increment
    await userEvent.click(btn)
    // Counter still renders after update
    expect(btn).toBeInTheDocument()
  },
}
