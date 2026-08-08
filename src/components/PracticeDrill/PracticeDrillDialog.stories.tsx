import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PracticeDrillDialog from './PracticeDrillDialog'
import type { PracticeDrillDialogProps } from './PracticeDrillDialog'
import {
  seedMockUnit,
  seedMockWords,
  clearMockData,
} from '../../../.storybook/__mocks__/aws-amplify-data'

// Stable unit ID matching the args passed to PracticeDrillDialog
const DRILL_UNIT_ID = 'unit-abc-123'

// Words that the mock generatePracticeDrill action references via sourceItemId
const drillWords = [
  {
    id: 'drill-word-1',
    phrase: 'photosynthesis',
    pronunciation: 'foh-toh-SIN-thuh-sis',
    definition:
      'The process by which plants convert light energy into chemical energy',
    owner: 'mock-user-sub',
    _version: 1,
  },
]

const meta: Meta<PracticeDrillDialogProps> = {
  title: '🎯 Practice Drills/Dialog',
  component: PracticeDrillDialog,
  argTypes: {
    sessionsCompletedToday: { control: { type: 'range', min: 0, max: 10 } },
  },
  loaders: [
    async () => {
      clearMockData()
      seedMockWords(drillWords)
      seedMockUnit(
        {
          id: DRILL_UNIT_ID,
          name: 'Japanese Grammar Guide',
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
        { words: drillWords },
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
    unitId: DRILL_UNIT_ID,
    initializeMockData: false,
  },
}

export default meta
type Story = StoryObj<PracticeDrillDialogProps>

const defaultConfig = {
  sources: { vocabulary: true, questions: true, text: true, documents: true },
  count: 10,
  drillType: 'mixed',
}

export const Default: Story = {
  args: {
    open: true,
    onClose: () => console.log('Dialog closed'),
    unitId: 'unit-abc-123',
    unitName: 'Biology: Cell Structure',
    config: defaultConfig,
    sessionsCompletedToday: 0,
  },
}

export const VocabularyOnly: Story = {
  args: {
    open: true,
    onClose: () => console.log('Dialog closed'),
    unitId: 'unit-abc-123',
    unitName: 'Spanish AR Verbs',
    config: {
      sources: { vocabulary: true, questions: false, text: false, documents: false },
      count: 5,
      drillType: 'vocabulary',
    },
    sessionsCompletedToday: 0,
  },
}

export const DiminishedXP: Story = {
  args: {
    open: true,
    onClose: () => console.log('Dialog closed'),
    unitId: 'unit-abc-123',
    unitName: 'Biology: Cell Structure',
    config: defaultConfig,
    sessionsCompletedToday: 3,
  },
}

export const ReviewDrill: Story = {
  args: {
    open: true,
    onClose: () => console.log('Dialog closed'),
    unitId: 'unit-abc-123',
    unitName: 'Japanese Grammar Guide',
    config: {
      sources: { vocabulary: true, questions: true, text: true, documents: true },
      count: 15,
      drillType: 'review',
    },
    sessionsCompletedToday: 1,
  },
}

export const Closed: Story = {
  args: {
    open: false,
    onClose: () => console.log('Dialog closed'),
    unitId: 'unit-abc-123',
    unitName: 'Biology: Cell Structure',
    config: defaultConfig,
    sessionsCompletedToday: 0,
  },
}
