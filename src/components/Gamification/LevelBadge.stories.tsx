import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LevelBadge } from './LevelBadge'
import { expect, within } from 'storybook/test'

const meta: Meta<typeof LevelBadge> = {
  title: '🏆 Gamification/XP & Progression/Level Badge',
  component: LevelBadge,
}
export default meta

type Story = StoryObj<typeof LevelBadge>

export const Beginner: Story = {
  args: {
    level: { level: 1, label: 'Beginner', xpRequired: 0, xpForNextLevel: 150, progress: 33 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Level chip shows level number
    await canvas.findByText(/Lvl\. 1/)
    // Progress bar renders at 33%
    const progressBar = canvasElement.querySelector('[role="progressbar"]')
    expect(progressBar).not.toBeNull()
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('33')
  },
}

export const Explorer: Story = {
  args: {
    level: { level: 2, label: 'Explorer', xpRequired: 150, xpForNextLevel: 400, progress: 60 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Lvl\. 2/)
  },
}

export const Practitioner: Story = {
  args: {
    level: { level: 3, label: 'Practitioner', xpRequired: 400, xpForNextLevel: 800, progress: 45 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Lvl\. 3/)
  },
}

export const Contributor: Story = {
  args: {
    level: { level: 4, label: 'Contributor', xpRequired: 800, xpForNextLevel: 1500, progress: 20 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Lvl\. 4/)
  },
}

export const Expert: Story = {
  args: {
    level: { level: 5, label: 'Expert', xpRequired: 1500, xpForNextLevel: 2500, progress: 80 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Lvl\. 5/)
    // 80% progress bar
    const progressBar = canvasElement.querySelector('[role="progressbar"]')
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('80')
  },
}

export const Master: Story = {
  args: {
    level: { level: 6, label: 'Master', xpRequired: 2500, xpForNextLevel: null, progress: 100 },
    showProgress: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Lvl\. 6/)
    // No progress bar when showProgress=false and max level
    const progressBar = canvasElement.querySelector('[role="progressbar"]')
    expect(progressBar).toBeNull()
  },
}

export const Small: Story = {
  args: {
    level: { level: 3, label: 'Practitioner', xpRequired: 400, xpForNextLevel: 800, progress: 55 },
    size: 'small',
  },
  play: async ({ canvasElement }) => {
    // Small chip renders
    const chip = canvasElement.querySelector('.MuiChip-sizeSmall')
    expect(chip).not.toBeNull()
  },
}

export const NoProgress: Story = {
  args: {
    level: { level: 4, label: 'Contributor', xpRequired: 800, xpForNextLevel: 1500, progress: 70 },
    showProgress: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Lvl\. 4/)
    // No progress bar when showProgress is false
    const progressBar = canvasElement.querySelector('[role="progressbar"]')
    expect(progressBar).toBeNull()
  },
}
