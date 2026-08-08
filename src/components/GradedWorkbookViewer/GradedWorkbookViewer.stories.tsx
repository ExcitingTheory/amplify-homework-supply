/**
 * Stories for GradedWorkbookViewer
 *
 * Shows instructor view of a student's completed workbook with
 * gutter annotations for wrong answers and moderation panel.
 */

import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GradedWorkbookViewer } from './GradedWorkbookViewer'
import type { GradeAttempt, ModerationInfo } from './GradedWorkbookViewer'
import { expect } from 'storybook/test'

// ============================================================================
// Mock Lexical content (minimal valid Lexical state)
// ============================================================================

const MOCK_LEXICAL_CONTENT = JSON.stringify({
  root: {
    children: [
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Japanese Greetings - Unit 1', type: 'text', version: 1 },
        ],
        direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h1',
      },
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Learn basic Japanese greetings and their usage in daily life.', type: 'text', version: 1 },
        ],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Complete the quiz below to test your knowledge of Japanese greetings.', type: 'text', version: 1 },
        ],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Match the Japanese words to their English meanings in the exercise below.', type: 'text', version: 1 },
        ],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'Write a short paragraph about when you would use each greeting.', type: 'text', version: 1 },
        ],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
    ],
    direction: 'ltr', format: '', indent: 0, type: 'root', version: 1,
  },
})

// ============================================================================
// Mock grade data (multiple attempts)
// ============================================================================

const MOCK_GRADES: GradeAttempt[] = [
  // Latest attempt (attempt 3) — much improved
  {
    id: 'grade-attempt-3',
    attempt: 3,
    accuracy: 92,
    percentComplete: 100,
    complete: true,
    data: {
      'quiz-block-1': {
        complete: true,
        accuracy: 100,
        responses: {
          'quiz-q1': { selected: 'こんにちは', correct: true },
          'quiz-q2': { selected: 'さようなら', correct: true },
          'quiz-q3': { selected: 'ありがとう', correct: true },
          'quiz-q4': { selected: 'すみません', correct: true },
        },
      },
      'meaning-assoc-1': {
        complete: true,
        accuracy: 100,
        matches: {
          'vocab-word-1': 'Hello → こんにちは',
          'vocab-word-2': 'Goodbye → さようなら',
          'vocab-word-3': 'Thank you → ありがとう',
        },
      },
      'custom-q-1': {
        complete: true,
        accuracy: 85,
        userAnswer: 'In Japan, you say こんにちは during the daytime. In the morning you use おはようございます, and at night こんばんは.',
        feedback: 'Good explanation but could include more context about formality levels.',
      },
    },
    feedback: {
      overall: 'Excellent improvement! You have shown great progress from your earlier attempts.',
      blockFeedback: {
        'quiz-block-1': 'Perfect score this time!',
        'meaning-assoc-1': 'All matches correct!',
        'custom-q-1': 'Good detail, consider mentioning keigo next time.',
      },
      instructorNotes: 'Student improved significantly between attempts. Ready for Unit 2.',
    },
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: '2024-02-10T15:30:00Z',
    createdAt: '2024-02-10T14:00:00Z',
    updatedAt: '2024-02-10T15:30:00Z',
  },
  // Attempt 2 — some improvement
  {
    id: 'grade-attempt-2',
    attempt: 2,
    accuracy: 72,
    percentComplete: 100,
    complete: true,
    data: {
      'quiz-block-1': {
        complete: true,
        accuracy: 75,
        responses: {
          'quiz-q1': { selected: 'こんにちは', correct: true },
          'quiz-q2': { selected: 'ありがとう', correct: false }, // Wrong — confused with "thank you"
          'quiz-q3': { selected: 'ありがとう', correct: true },
          'quiz-q4': { selected: 'すみません', correct: true },
        },
      },
      'meaning-assoc-1': {
        complete: true,
        accuracy: 67,
        matches: {
          'vocab-word-1': 'Hello → こんにちは',
          'vocab-word-2': 'Goodbye → ありがとう', // Wrong
          'vocab-word-3': 'Thank you → さようなら', // Wrong
        },
      },
      'custom-q-1': {
        complete: true,
        accuracy: 70,
        userAnswer: 'You say hello in Japanese with konnichiwa.',
        feedback: 'Correct but too brief. Add more greetings and when to use them.',
      },
    },
    feedback: {
      overall: 'Some improvement from attempt 1. Keep studying the difference between farewell and gratitude expressions.',
      blockFeedback: {
        'quiz-block-1': 'Still confusing さようなら with ありがとう',
        'meaning-assoc-1': 'Swapped goodbye and thank you',
        'custom-q-1': 'Need more detail',
      },
    },
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: '2024-02-08T11:00:00Z',
    createdAt: '2024-02-08T10:00:00Z',
    updatedAt: '2024-02-08T11:00:00Z',
  },
  // Attempt 1 — first try, lowest score
  {
    id: 'grade-attempt-1',
    attempt: 1,
    accuracy: 45,
    percentComplete: 100,
    complete: true,
    data: {
      'quiz-block-1': {
        complete: true,
        accuracy: 25,
        responses: {
          'quiz-q1': { selected: 'さようなら', correct: false }, // Wrong
          'quiz-q2': { selected: 'ありがとう', correct: false }, // Wrong
          'quiz-q3': { selected: 'こんにちは', correct: false }, // Wrong
          'quiz-q4': { selected: 'すみません', correct: true },
        },
      },
      'meaning-assoc-1': {
        complete: true,
        accuracy: 33,
        matches: {
          'vocab-word-1': 'Hello → さようなら', // Wrong
          'vocab-word-2': 'Goodbye → こんにちは', // Wrong
          'vocab-word-3': 'Thank you → ありがとう',
        },
      },
      'custom-q-1': {
        complete: true,
        accuracy: 40,
        userAnswer: 'Konichiwa means hello.',
        feedback: 'Very brief answer. The romanization is also slightly off (konnichiwa with double n). Please elaborate on other greetings.',
      },
    },
    feedback: {
      overall: 'First attempt shows you need more study time with the vocabulary.',
      blockFeedback: {
        'quiz-block-1': 'Many confusions between greetings — review flashcards',
        'meaning-assoc-1': 'Most matches were swapped',
        'custom-q-1': 'Too brief — assignment asks for a paragraph',
      },
    },
    moderationStatus: 'approved',
    moderationFlags: null,
    moderationCheckedAt: '2024-02-05T10:00:00Z',
    createdAt: '2024-02-05T09:00:00Z',
    updatedAt: '2024-02-05T10:00:00Z',
  },
]

const MOCK_MODERATION_APPROVED: ModerationInfo = {
  status: 'approved',
  flags: null,
  checkedAt: '2024-02-10T15:30:00Z',
}

const MOCK_MODERATION_FLAGGED: ModerationInfo = {
  status: 'flagged',
  flags: {
    categories: {
      harassment: true,
      'harassment/threatening': false,
      hate: false,
      violence: false,
    },
    categoryScores: {
      harassment: 0.87,
      'harassment/threatening': 0.12,
      hate: 0.05,
      violence: 0.02,
    },
  },
  checkedAt: '2024-02-10T15:30:00Z',
}

const MOCK_MODERATION_PENDING: ModerationInfo = {
  status: 'pending',
  flags: null,
  checkedAt: null,
}

// ============================================================================
// Story configuration
// ============================================================================

const meta: Meta<typeof GradedWorkbookViewer> = {
  title: '📊 Instructor Tools/Graded Workbook Viewer',
  component: GradedWorkbookViewer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Instructor view of a student\'s completed workbook showing all attempts, wrong answers in a gutter sidebar, and moderation status.',
      },
    },
  },
  argTypes: {
    onModerationAction: { action: 'moderationAction' },
  },
}

export default meta
type Story = StoryObj<typeof GradedWorkbookViewer>

// ============================================================================
// Stories
// ============================================================================

export const MultipleAttempts: Story = {
  args: {
    contentJson: MOCK_LEXICAL_CONTENT,
    studentName: 'Yuki Tanaka',
    grades: MOCK_GRADES,
    moderation: MOCK_MODERATION_APPROVED,
    maxHeight: '70vh',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const FlaggedContent: Story = {
  args: {
    contentJson: MOCK_LEXICAL_CONTENT,
    studentName: 'Test Student',
    grades: [MOCK_GRADES[0]],
    moderation: MOCK_MODERATION_FLAGGED,
    maxHeight: '70vh',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const PendingModeration: Story = {
  args: {
    contentJson: MOCK_LEXICAL_CONTENT,
    studentName: 'Alex Rivera',
    grades: [MOCK_GRADES[1]],
    moderation: MOCK_MODERATION_PENDING,
    maxHeight: '70vh',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const SingleAttemptHighScore: Story = {
  args: {
    contentJson: MOCK_LEXICAL_CONTENT,
    studentName: 'Maria Chen',
    grades: [MOCK_GRADES[0]], // Only the high-score attempt
    moderation: MOCK_MODERATION_APPROVED,
    maxHeight: '70vh',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const SingleAttemptLowScore: Story = {
  args: {
    contentJson: MOCK_LEXICAL_CONTENT,
    studentName: 'Jordan Smith',
    grades: [MOCK_GRADES[2]], // Only the low-score attempt
    moderation: null,
    maxHeight: '70vh',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const NoModeration: Story = {
  args: {
    contentJson: MOCK_LEXICAL_CONTENT,
    studentName: 'Sam Wilson',
    grades: MOCK_GRADES,
    moderation: null,
    maxHeight: '70vh',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
