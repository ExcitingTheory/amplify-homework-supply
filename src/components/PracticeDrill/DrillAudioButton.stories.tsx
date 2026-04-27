import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import DrillAudioButton from './DrillAudioButton'
import type { DrillAudioButtonProps } from './DrillAudioButton'

const meta: Meta<DrillAudioButtonProps> = {
  title: 'PracticeDrill/DrillAudioButton',
  component: DrillAudioButton,
  tags: ['autodocs'],
  decorators: [
    // AudioPlayerContext would normally be provided by the app
    (Story) => <Story />,
  ],
}

export default meta
type Story = StoryObj<DrillAudioButtonProps>

// A tiny valid WAV file encoded in base64 (silence, 100ms)
const TINY_WAV_BASE64 =
  'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

export const WithBase64Audio: Story = {
  args: {
    audio: `data:audio/wav;base64,${TINY_WAV_BASE64}`,
    label: 'Play pronunciation',
  },
}

export const WithS3Path: Story = {
  args: {
    audio: 'public/audio/unit-123/word-hello.mp3',
    label: 'Play word',
  },
}

export const SmallSize: Story = {
  args: {
    audio: `data:audio/wav;base64,${TINY_WAV_BASE64}`,
    label: 'Play',
    size: 'small',
  },
}
