import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import JoinWorkbookDialog from './JoinWorkbookDialog';

const meta: Meta<typeof JoinWorkbookDialog> = {
  title: '📓 Workbook/JoinWorkbookDialog',
  component: JoinWorkbookDialog,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof JoinWorkbookDialog>;

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
