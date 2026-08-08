import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PracticeDrillWorkbook from './PracticeDrillWorkbook'
import type { PracticeDrillWorkbookProps } from './PracticeDrillWorkbook'
import {
  seedMockUnit,
  seedMockWords,
  clearMockData,
} from '../../../.storybook/__mocks__/aws-amplify-data'
import { expect } from 'storybook/test'

// Seeded words — IDs must match sourceItemId values in sampleBlocks below.
// Phrases must also match pair.term values (case-insensitive) for the
// meaning-association block's dictionary-resolution path in buildDrillEditorState.
const workbookWords = [
  {
    id: 'word-1',
    phrase: 'mitochondria',
    pronunciation: 'my-tuh-KON-dree-uh',
    definition: 'Organelle that produces energy for the cell',
    owner: 'mock-user-sub',
    _version: 1,
  },
  {
    id: 'word-2',
    phrase: 'la maison',
    pronunciation: 'lah meh-ZON',
    definition: 'the house',
    owner: 'mock-user-sub',
    _version: 1,
  },
  {
    id: 'word-3',
    phrase: 'Photosynthesis',
    pronunciation: 'foh-toh-SIN-thuh-sis',
    definition: 'Process of converting light to energy',
    owner: 'mock-user-sub',
    _version: 1,
  },
  {
    id: 'word-4',
    phrase: 'Respiration',
    pronunciation: 'res-puh-RAY-shun',
    definition: 'Process of converting glucose to ATP',
    owner: 'mock-user-sub',
    _version: 1,
  },
  {
    id: 'word-5',
    phrase: 'Osmosis',
    pronunciation: 'oz-MOH-sis',
    definition: 'Movement of water across a membrane',
    owner: 'mock-user-sub',
    _version: 1,
  },
]

const meta: Meta<PracticeDrillWorkbookProps> = {
  title: '\ud83c\udfaf Practice Drills/Workbook',
  component: PracticeDrillWorkbook,
  loaders: [
    async () => {
      clearMockData()
      seedMockWords(workbookWords)
      seedMockUnit(
        {
          id: 'drill-workbook-story-unit',
          name: 'Drill Workbook Story Unit',
          data: JSON.stringify({
            root: {
              children: [],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          }),
          _version: 1,
          owner: 'mock-user-sub',
        },
        { words: workbookWords },
      )
    },
  ],
  parameters: {
    unitId: 'drill-workbook-story-unit',
    initializeMockData: false,
  },
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
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}

export const Empty: Story = {
  args: {
    blocks: [],
    sessionId: 'story-session-4',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
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
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
}
