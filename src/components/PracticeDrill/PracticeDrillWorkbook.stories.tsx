import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import PracticeDrillWorkbook from './PracticeDrillWorkbook'
import type { PracticeDrillWorkbookProps } from './PracticeDrillWorkbook'

const meta: Meta<PracticeDrillWorkbookProps> = {
  title: 'PracticeDrill/PracticeDrillWorkbook',
  component: PracticeDrillWorkbook,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<PracticeDrillWorkbookProps>

const sampleBlocks = [
  {
    type: 'quiz',
    instruction: 'What is the powerhouse of the cell?',
    sourceItemId: 'word-1',
    sourceType: 'vocabulary',
    choices: [
      { choice: 'Mitochondria', correct: true },
      { choice: 'Nucleus', correct: false },
      { choice: 'Ribosome', correct: false },
      { choice: 'Golgi apparatus', correct: false },
    ],
    audio: {
      instruction: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
    },
  },
  {
    type: 'answer',
    instruction: 'Translate "la maison" to English:',
    sourceItemId: 'word-2',
    sourceType: 'vocabulary',
    expectedAnswer: 'the house',
    hint: 'Think about where you live',
    pronunciation: {
      enabled: true,
      targetText: 'la maison',
      targetLanguage: 'fr',
      maxAttempts: 3,
    },
  },
  {
    type: 'meaning-association',
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
    answers: {},
    sessionId: 'story-session-1',
    onSubmitAnswer: (blockId, answer) => console.log('Answer:', blockId, answer),
    onPronunciationResult: (blockId, result) => console.log('Pronunciation:', blockId, result),
  },
}

export const PartiallyAnswered: Story = {
  args: {
    blocks: sampleBlocks,
    answers: {
      'word-1': { complete: true, accuracy: 100, userAnswer: 'Mitochondria' },
    },
    sessionId: 'story-session-2',
    onSubmitAnswer: (blockId, answer) => console.log('Answer:', blockId, answer),
  },
}

export const AllAnswered: Story = {
  args: {
    blocks: sampleBlocks,
    answers: {
      'word-1': { complete: true, accuracy: 100, userAnswer: 'Mitochondria' },
      'word-2': { complete: true, accuracy: 100, userAnswer: 'the house' },
      'question-3': { complete: true, accuracy: 67, userAnswer: '{}' },
    },
    sessionId: 'story-session-3',
    onSubmitAnswer: (blockId, answer) => console.log('Answer:', blockId, answer),
  },
}

export const Empty: Story = {
  args: {
    blocks: [],
    answers: {},
    sessionId: 'story-session-4',
    onSubmitAnswer: () => {},
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
    answers: {},
    sessionId: 'story-session-5',
    onSubmitAnswer: (blockId, answer) => console.log('Answer:', blockId, answer),
  },
}
