import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mui/material';
import SyncStatusIndicator from './SyncStatusIndicator';

/**
 * SyncStatusIndicator shows a chip in the toolbar with the number of
 * pending sync operations, and a dialog to inspect/retry.
 */
const meta: Meta<typeof SyncStatusIndicator> = {
  title: '🔌 Offline & Sync/Sync Status Indicator',
  component: SyncStatusIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays pending sync count and provides a dialog to inspect queued operations.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Box sx={{ p: 4 }}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof SyncStatusIndicator>;

/**
 * When all synced, the indicator is hidden (returns null).
 * This story demonstrates the empty/idle state.
 */
export const AllSynced: Story = {
  name: 'All Synced (hidden)',
};

/**
 * Offline with no pending changes — shows "Offline" chip.
 */
export const OfflineNoPending: Story = {
  name: 'Offline — No Pending',
  decorators: [
    (Story) => {
      const original = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event('offline'));
      setTimeout(() => {
        Object.defineProperty(navigator, 'onLine', { value: original, writable: true, configurable: true });
      }, 0);
      return <Story />;
    },
  ],
};
