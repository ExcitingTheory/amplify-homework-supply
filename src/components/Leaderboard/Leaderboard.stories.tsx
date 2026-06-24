import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LeaderboardTable } from './LeaderboardTable'
import { CompletionGrid } from './CompletionGrid'
import type { AssignmentColumn, CompletionStatus } from './CompletionGrid'

// =============================================================================
// LeaderboardTable Stories
// =============================================================================

const leaderboardMeta: Meta<typeof LeaderboardTable> = {
  title: '📊 Instructor Tools/Leaderboard/Table',
  component: LeaderboardTable,
}
export default leaderboardMeta

type LeaderboardStory = StoryObj<typeof LeaderboardTable>

const sampleEntries = [
  { studentId: 'alice', studentName: 'Alice', totalXP: 2500, level: 6, currentStreak: 7, completedAssignments: 12, avatarColor: '#e91e63' },
  { studentId: 'bob', studentName: 'Bob', totalXP: 2100, level: 6, currentStreak: 3, completedAssignments: 11, avatarColor: '#2196f3' },
  { studentId: 'charlie', studentName: 'Charlie', totalXP: 1800, level: 5, currentStreak: 5, completedAssignments: 10, avatarColor: '#4caf50' },
  { studentId: 'diana', studentName: 'Diana', totalXP: 1500, level: 5, currentStreak: 0, completedAssignments: 9, avatarColor: '#ff9800' },
  { studentId: 'eve', studentName: 'Eve', totalXP: 900, level: 3, currentStreak: 1, completedAssignments: 6, avatarColor: '#9c27b0' },
]

export const Default: LeaderboardStory = {
  args: {
    entries: sampleEntries,
    currentStudentId: 'charlie',
  },
}

export const Empty: LeaderboardStory = {
  args: {
    entries: [],
  },
}

// =============================================================================
// CompletionGrid Stories
// =============================================================================

const completionMeta: Meta<typeof CompletionGrid> = {
  title: '📊 Instructor Tools/Leaderboard/Completion Grid',
  component: CompletionGrid,
}

export const GridStory: StoryObj<typeof CompletionGrid> = {
  render: () => {
    const assignments: AssignmentColumn[] = [
      { id: 'bio101', title: 'Biology 101' },
      { id: 'french', title: 'French Basics' },
      { id: 'earth', title: 'Earth Science' },
      { id: 'math', title: 'Math Review' },
      { id: 'history', title: 'History' },
    ]
    const students = [
      {
        studentId: 'alice',
        studentName: 'Alice',
        assignments: { 'bio101': 'completed' as CompletionStatus, 'french': 'completed' as CompletionStatus, 'earth': 'completed' as CompletionStatus, 'math': 'not_started' as CompletionStatus, 'history': 'completed' as CompletionStatus },
      },
      {
        studentId: 'bob',
        studentName: 'Bob',
        assignments: { 'bio101': 'completed' as CompletionStatus, 'french': 'not_started' as CompletionStatus, 'earth': 'completed' as CompletionStatus, 'math': 'completed' as CompletionStatus, 'history': 'not_started' as CompletionStatus },
      },
      {
        studentId: 'charlie',
        studentName: 'Charlie',
        assignments: { 'bio101': 'completed' as CompletionStatus, 'french': 'completed' as CompletionStatus, 'earth': 'not_started' as CompletionStatus, 'math': 'not_started' as CompletionStatus, 'history': 'not_started' as CompletionStatus },
      },
    ]
    return <CompletionGrid assignments={assignments} students={students} currentStudentId="alice" />
  },
  parameters: { ...completionMeta },
}
