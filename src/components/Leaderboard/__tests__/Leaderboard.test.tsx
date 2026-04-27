/**
 * Leaderboard Component Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { LeaderboardTable } from '../LeaderboardTable'
import { CompletionGrid } from '../CompletionGrid'
import type { CompletionStatus } from '../CompletionGrid'

describe('LeaderboardTable', () => {
  const entries = [
    { studentId: 's1', studentName: 'Maria Garcia', avatarColor: '#e91e63', totalXP: 1840, level: 5, currentStreak: 12 },
    { studentId: 's2', studentName: 'James Kim', avatarColor: '#2196f3', totalXP: 1620, level: 5, currentStreak: 8 },
    { studentId: 's3', studentName: 'Priya Patel', avatarColor: '#4caf50', totalXP: 1450, level: 4, currentStreak: 5 },
    { studentId: 's4', studentName: 'Tom Nguyen', avatarColor: '#ff9800', totalXP: 1200, level: 4, currentStreak: 2 },
    { studentId: 's5', studentName: 'Alice Wong', avatarColor: '#9c27b0', totalXP: 950, level: 3, currentStreak: 4 },
    { studentId: 's6', studentName: 'Bob Smith', avatarColor: '#795548', totalXP: 800, level: 3, currentStreak: 0 },
  ]

  it('renders top entries with medals', () => {
    render(<LeaderboardTable entries={entries} currentStudentId="s5" />)
    expect(screen.getByText('🥇')).toBeDefined()
    expect(screen.getByText('🥈')).toBeDefined()
    expect(screen.getByText('🥉')).toBeDefined()
  })

  it('renders column headers', () => {
    render(<LeaderboardTable entries={entries} currentStudentId="s1" />)
    expect(screen.getByText('#')).toBeDefined()
    expect(screen.getByText('Student')).toBeDefined()
    expect(screen.getByText('XP')).toBeDefined()
    expect(screen.getByText('Lvl')).toBeDefined()
    expect(screen.getByText('Streak')).toBeDefined()
  })

  it('marks the current user with (You)', () => {
    render(<LeaderboardTable entries={entries} currentStudentId="s1" />)
    expect(screen.getByText('Maria Garcia (You)')).toBeDefined()
  })

  it('shows gap indicator when current user is below topN', () => {
    render(<LeaderboardTable entries={entries} currentStudentId="s6" topN={3} />)
    expect(screen.getByText('···')).toBeDefined()
    expect(screen.getByText('Bob Smith (You)')).toBeDefined()
  })

  it('shows streak fire icon for active streaks', () => {
    render(<LeaderboardTable entries={entries} currentStudentId="s1" />)
    expect(screen.getByText('🔥 12d')).toBeDefined()
  })

  it('shows dash for zero streak', () => {
    render(<LeaderboardTable entries={entries} currentStudentId="s6" topN={6} />)
    expect(screen.getByText('—')).toBeDefined()
  })
})

describe('CompletionGrid', () => {
  const assignments = [
    { id: 'hw1', title: 'HW1' },
    { id: 'hw2', title: 'HW2' },
    { id: 'hw3', title: 'HW3' },
  ]

  const students = [
    {
      studentId: 's1',
      studentName: 'Maria Garcia',
      assignments: { hw1: 'completed' as CompletionStatus, hw2: 'completed' as CompletionStatus, hw3: 'in_progress' as CompletionStatus },
    },
    {
      studentId: 's2',
      studentName: 'James Kim',
      assignments: { hw1: 'completed' as CompletionStatus, hw2: 'not_started' as CompletionStatus, hw3: 'not_started' as CompletionStatus },
    },
  ]

  it('renders student names', () => {
    render(
      <CompletionGrid
        assignments={assignments}
        students={students}
        currentStudentId="s1"
      />,
    )
    expect(screen.getByText('Maria Garcia (You)')).toBeDefined()
    expect(screen.getByText('James Kim')).toBeDefined()
  })

  it('renders assignment headers', () => {
    render(
      <CompletionGrid
        assignments={assignments}
        students={students}
        currentStudentId="s1"
      />,
    )
    expect(screen.getByText('HW1')).toBeDefined()
    expect(screen.getByText('HW2')).toBeDefined()
    expect(screen.getByText('HW3')).toBeDefined()
  })

  it('renders status icons', () => {
    render(
      <CompletionGrid
        assignments={assignments}
        students={students}
        currentStudentId="s1"
      />,
    )
    const allCells = screen.getAllByText('✅')
    expect(allCells.length).toBe(3) // 2 for Maria + 1 for James
    expect(screen.getByText('⏳')).toBeDefined()
    expect(screen.getAllByText('⬜').length).toBe(2) // James hw2 + hw3
  })
})
