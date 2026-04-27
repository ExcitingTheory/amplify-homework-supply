import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import PracticeDrillDocRef from './PracticeDrillDocRef'
import type { PracticeDrillDocRefProps } from './PracticeDrillDocRef'

const meta: Meta<PracticeDrillDocRefProps> = {
  title: 'PracticeDrill/PracticeDrillDocRef',
  component: PracticeDrillDocRef,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<PracticeDrillDocRefProps>

export const Default: Story = {
  args: {
    filename: 'biology-cell-structure.pdf',
    page: 3,
  },
}

export const LongFilename: Story = {
  args: {
    filename: 'introduction-to-molecular-biology-chapter-12.pdf',
    page: 47,
  },
}

export const StringPage: Story = {
  args: {
    filename: 'vocabulary-list.pdf',
    page: '2-3',
  },
}
