import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { UnitMemoryCard } from './UnitMemoryCard'

const meta: Meta<typeof UnitMemoryCard> = {
  title: '🏆 Gamification/Adaptive Learning/Unit Memory Card',
  component: UnitMemoryCard,
}
export default meta

type Story = StoryObj<typeof UnitMemoryCard>

export const Default: Story = {
  args: {
    unitId: 'unit-123',
    studentId: 'student-456',
  },
}
