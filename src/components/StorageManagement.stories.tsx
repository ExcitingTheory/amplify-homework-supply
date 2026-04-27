import type { Meta, StoryObj } from '@storybook/react';
import StorageManagement from './StorageManagement';

/**
 * StorageManagement is a settings panel showing offline storage usage,
 * AI model controls, and cached assignment management.
 */
const meta: Meta<typeof StorageManagement> = {
  title: '🔌 Offline/StorageManagement',
  component: StorageManagement,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Settings panel for managing offline storage: usage bar, AI model download/delete, and cached assignment list.',
      },
    },
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof StorageManagement>;

/**
 * Default state — loads real data from IndexedDB (which will be empty
 * in Storybook since no prefetch has occurred).
 */
export const Default: Story = {};
