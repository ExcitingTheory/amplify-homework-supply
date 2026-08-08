import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { RecordingStudio2 } from './RecordingStudio2';

const meta: Meta<typeof RecordingStudio2> = {
  title: '🎙️ Recording Studio/RecordingStudio2',
  component: RecordingStudio2,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RecordingStudio2>;

export const Default: Story = {
  args: {
    word: { word: 'ephemeral', phonetic: '/ɪˈfem.ər.əl/', definition: 'lasting for a very short time' },
    item: { id: 'item-1' },
    qk: 'question-key-1',
    setFeedback: fn(),
    setFileOperations: fn(),
    requestDefinition: fn(),
    feedback: null,
    isCorrect: false,
    onRecordingComplete: fn(),
    embedded: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const Embedded: Story = {
  args: {
    ...Default.args,
    embedded: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const WithFeedback: Story = {
  args: {
    ...Default.args,
    feedback: 'Great pronunciation! Try emphasizing the second syllable.',
    isCorrect: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
