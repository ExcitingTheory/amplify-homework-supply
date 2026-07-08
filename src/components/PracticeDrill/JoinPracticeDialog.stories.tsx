import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import JoinPracticeDialog from './JoinPracticeDialog';

const meta: Meta<typeof JoinPracticeDialog> = {
  title: '🎯 Practice Drills/Components/Join Practice Dialog',
  component: JoinPracticeDialog,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof JoinPracticeDialog>;

export const Open: Story = {
  args: {
    open: true,
    onClose: fn(),
    onJoin: fn(),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onClose: fn(),
    onJoin: fn(),
  },
};
