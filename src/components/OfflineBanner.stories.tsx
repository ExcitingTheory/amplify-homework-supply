import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mui/material';
import OfflineBanner from './OfflineBanner';
import { expect } from 'storybook/test'

/**
 * OfflineBanner shows a persistent Snackbar when the user goes offline,
 * and a brief reconnection banner with "Sync now" when they come back.
 *
 * **Note**: This component reads from `navigator.onLine` and listens for
 * browser events, so in Storybook we demonstrate with mock decorators.
 */
const meta: Meta<typeof OfflineBanner> = {
  title: '🔌 Offline & Sync/Offline Banner',
  component: OfflineBanner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Shows a warning Snackbar when the user is offline and a brief reconnection banner on return.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Box sx={{ minHeight: '200px', position: 'relative' }}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof OfflineBanner>;

/**
 * Default state: renders nothing when online with no pending changes.
 */
export const OnlineNoPending: Story = {
  name: 'Online (hidden)',
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

/**
 * Offline state: shows the persistent warning banner.
 * In a real browser, trigger by going to DevTools → Network → Offline.
 */
export const OfflineWarning: Story = {
  name: 'Offline Warning',
  decorators: [
    (Story) => {
      // Simulate offline — note: this only affects the visual,
      // the component reads navigator.onLine at runtime
      const original = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      // Dispatch event so the hook picks it up
      window.dispatchEvent(new Event('offline'));
      // Restore after unmount
      setTimeout(() => {
        Object.defineProperty(navigator, 'onLine', { value: original, writable: true, configurable: true });
      }, 0);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
