import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { EasterEggLayer } from './EasterEggLayer'

const meta: Meta<typeof EasterEggLayer> = {
  title: '🏆 Gamification/Runtime/Easter Egg Layer',
  component: EasterEggLayer,
}
export default meta

type Story = StoryObj<typeof EasterEggLayer>

export const Default: Story = {
  args: { studentId: 'student-123' },
}
