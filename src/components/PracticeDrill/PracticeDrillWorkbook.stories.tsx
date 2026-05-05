import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import PracticeDrillWorkbook from './PracticeDrillWorkbook'
import type { PracticeDrillWorkbookProps } from './PracticeDrillWorkbook'

const meta: Meta<PracticeDrillWorkbookProps> = {
  title: '🎯 Practice Drills/Workbook',
  component: PracticeDrillWorkbook,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<PracticeDrillWorkbookProps>

const sampleBlocks = [
  {
    type: 'quiz' as const,
    instruction: 'What is the powerhouse of the cell?',
    sourceItemId: 'word-1',
    sourceType: 'vocabulary',
    choices: [
      { choice: 'Mitochondria', correct: true },
      { choice: 'Nucleus', correct: false },
      { choice: 'Ribosome', correct: false },
      { choice: 'Golgi apparatus', correct: false },
    ],
  },
  {
    type: 'answer' as const,
    instruction: 'Translate "la maison" to English:',
    sourceItemId: 'word-2',
    sourceType: 'vocabulary',
    expectedAnswer: 'the house',
    hint: 'Think about where you live',
  },
  {
    type: 'meaning-association' as const,
    instruction: 'Match each term to its definition:',
    sourceItemId: 'question-3',
    sourceType: 'questions',
    pairs: [
      { term: 'Photosynthesis', definition: 'Process of converting light to energy' },
      { term: 'Respiration', definition: 'Process of converting glucose to ATP' },
      { term: 'Osmosis', definition: 'Movement of water across a membrane' },
    ],
  },
]

export const Default: Story = {
  args: {
    blocks: sampleBlocks,
    sessionId: 'story-session-1',
    onStatsChange: (stats) => console.log('Stats:', stats),
  },
}

export const Empty: Story = {
  args: {
    blocks: [],
    sessionId: 'story-session-4',
  },
}

export const WithDocumentRefs: Story = {
  args: {
    blocks: [
      {
        ...sampleBlocks[0],
        documentRef: { filename: 'biology-notes.pdf', page: 12 },
      },
      {
        ...sampleBlocks[1],
        documentRef: { filename: 'french-vocab.pdf', page: '3-4' },
      },
    ],
    sessionId: 'story-session-5',
    onStatsChange: (stats) => console.log('Stats:', stats),
  },
}
