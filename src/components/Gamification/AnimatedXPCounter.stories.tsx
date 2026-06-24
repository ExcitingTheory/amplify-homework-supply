import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AnimatedXPCounter } from './AnimatedXPCounter'

const meta: Meta<typeof AnimatedXPCounter> = {
  title: '🏆 Gamification/XP & Progress/Animated XP Counter',
  component: AnimatedXPCounter,
}
export default meta

type Story = StoryObj<typeof AnimatedXPCounter>

export const Default: Story = {
  args: { targetValue: 1250 },
}

export const SlowAnimation: Story = {
  args: { targetValue: 500, duration: 2000, variant: 'h4' },
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
}
