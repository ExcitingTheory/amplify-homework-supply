import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { EasterEggLayer } from './EasterEggLayer'
import { expect } from 'storybook/test'

const meta: Meta<typeof EasterEggLayer> = {
  title: '🏆 Gamification/Runtime/Easter Egg Layer',
  component: EasterEggLayer,
}
export default meta

type Story = StoryObj<typeof EasterEggLayer>

export const Default: Story = {
  args: { studentId: 'student-123' },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
