import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import PracticeDrillDialog from './PracticeDrillDialog'
import type { PracticeDrillDialogProps } from './PracticeDrillDialog'

const meta: Meta<PracticeDrillDialogProps> = {
  title: 'PracticeDrill/PracticeDrillDialog',
  component: PracticeDrillDialog,
  tags: ['autodocs'],
  argTypes: {
    sessionsCompletedToday: { control: { type: 'range', min: 0, max: 10 } },
  },
  parameters: {
    layout: 'fullscreen',
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
