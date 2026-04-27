import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import DrillRecordButton from './DrillRecordButton'
import type { DrillRecordButtonProps } from './DrillRecordButton'

const meta: Meta<DrillRecordButtonProps> = {
  title: 'PracticeDrill/DrillRecordButton',
  component: DrillRecordButton,
  tags: ['autodocs'],
  argTypes: {
    maxAttempts: { control: { type: 'range', min: 1, max: 5 } },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<DrillRecordButtonProps>

export const Default: Story = {
  args: {
    targetText: 'photosynthesis',
    targetLanguage: 'en',
    blockId: 'block-1',
    sessionId: 'session-abc',
    onResult: (result) => console.log('Pronunciation result:', result),
  },
}

export const Japanese: Story = {
  args: {
    targetText: '光合成',
    targetLanguage: 'ja',
    blockId: 'block-2',
    sessionId: 'session-abc',
    onResult: (result) => console.log('Pronunciation result:', result),
  },
}

export const Spanish: Story = {
  args: {
    targetText: 'la fotosíntesis',
    targetLanguage: 'es',
    blockId: 'block-3',
    sessionId: 'session-abc',
    onResult: (result) => console.log('Pronunciation result:', result),
  },
}

export const LimitedAttempts: Story = {
  args: {
    targetText: 'chlorophyll',
    targetLanguage: 'en',
    blockId: 'block-4',
    sessionId: 'session-abc',
    onResult: (result) => console.log('Pronunciation result:', result),
    maxAttempts: 1,
  },
}

export const Disabled: Story = {
  args: {
    targetText: 'mitochondria',
    targetLanguage: 'en',
    blockId: 'block-5',
    sessionId: 'session-abc',
    onResult: (result) => console.log('Pronunciation result:', result),
    disabled: true,
  },
}
