import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import RecordingStudioEnhanced from './RecordingStudioEnhanced';

const meta: Meta<typeof RecordingStudioEnhanced> = {
  title: '🎙️ Recording Studio/RecordingStudioEnhanced',
  component: RecordingStudioEnhanced,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RecordingStudioEnhanced>;

export const Default: Story = {
  args: {
    gradeId: 'grade-abc-123',
    nodeKey: 'node-xyz',
    onRecordingComplete: fn(),
    metadata: { speaker: 'Student', prompt: 'Read the following sentence aloud.' },
    stateRef: { current: null },
  },
};

export const WithMetadata: Story = {
  args: {
    ...Default.args,
    metadata: {
      speaker: 'Narrator',
      prompt: 'Describe what you see in the image using at least three complete sentences.',
      language: 'en-US',
    },
  },
};

export const MinimalProps: Story = {
  args: {
    gradeId: 'grade-minimal',
    nodeKey: 'node-min',
    onRecordingComplete: fn(),
  },
};
