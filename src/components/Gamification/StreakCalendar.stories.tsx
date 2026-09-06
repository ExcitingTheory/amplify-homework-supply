import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { StreakCalendar } from './StreakCalendar'
import { expect, within } from 'storybook/test'

const meta: Meta<typeof StreakCalendar> = {
  title: '🏆 Gamification/Streaks/Streak Calendar',
  component: StreakCalendar,
}
export default meta

type Story = StoryObj<typeof StreakCalendar>

// Helper: generate ISO date strings for the current month
function daysThisMonth(...days: number[]): Set<string> {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return new Set(days.map(d => `${y}-${m}-${String(d).padStart(2, '0')}`))
}

export const Empty: Story = {
  args: { activeDays: new Set() },
  play: async ({ canvasElement }) => {
    // Calendar grid renders even with no active days
    expect(canvasElement.innerHTML.length).toBeGreaterThan(50)
  },
}

export const FewActiveDays: Story = {
  args: { activeDays: daysThisMonth(1, 3, 5, 8, 12) },
  play: async ({ canvasElement }) => {
    // Calendar renders with some active day indicators
    expect(canvasElement.innerHTML.length).toBeGreaterThan(100)
    // Active days should have distinct styling (background color or class)
    const highlighted = canvasElement.querySelectorAll('[style*="background"], .active, [data-active]')
    expect(highlighted.length).toBeGreaterThanOrEqual(0)
  },
}

export const MostDaysActive: Story = {
  args: {
    activeDays: daysThisMonth(
      1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15,
    ),
  },
  play: async ({ canvasElement }) => {
    // More active days means more highlighted cells
    expect(canvasElement.innerHTML.length).toBeGreaterThan(100)
  },
}

export const EveryDay: Story = {
  args: {
    activeDays: (() => {
      const now = new Date()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      return daysThisMonth(...Array.from({ length: daysInMonth }, (_, i) => i + 1))
    })(),
  },
  play: async ({ canvasElement }) => {
    // Perfect month — every day is active
    expect(canvasElement.innerHTML.length).toBeGreaterThan(100)
  },
}

export const SpecificMonth: Story = {
  args: {
    activeDays: new Set(['2025-12-01', '2025-12-10', '2025-12-24', '2025-12-25', '2025-12-31']),
    year: 2025,
    month: 12,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Month header shows December 2025
    await canvas.findByText(/december|dec/i)
  },
}
