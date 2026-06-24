import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
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
}

export const Submitting: Story = {
  args: {
    onSubmit: fn(),
    submitting: true,
  },
}
