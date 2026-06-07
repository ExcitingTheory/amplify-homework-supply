/**
 * DebugPanel Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DebugPanel } from './DebugPanel';
import { useDebugPanel } from './useDebugPanel';
import { Button, Box } from '@mui/material';

const meta: Meta<typeof DebugPanel> = {
  title: '🛠️ Developer Tools/Debug Panel',
  component: DebugPanel,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DebugPanel>;

/**
 * Default debug panel with all tabs
 */
export const Default: Story = {
  args: {
    open: true,
    onClose: () => {},
    defaultTab: 'components',
    position: 'right',
    width: 600,
  },
  decorators: [
    (Story) => {
      // Initialize some test data in window globals
      if (typeof window !== 'undefined') {
        // Add some test logs
        setTimeout(() => {
          console.log('Test log message');
          console.warn('Test warning message');
          console.error('Test error message');
        }, 100);
      }
      
      return (
        <Box sx={{ height: '100vh', p: 2 }}>
          <h1>Main Application Content</h1>
          <p>The debug panel should appear on the right side.</p>
          <Story />
        </Box>
      );
    },
  ],
};

/**
 * Debug panel showing logs tab
 */
export const LogsTab: Story = {
  args: {
    open: true,
    onClose: () => {},
    defaultTab: 'logs',
    position: 'right',
    width: 600,
  },
};

/**
 * Debug panel showing state tab
 */
export const StateTab: Story = {
  args: {
    open: true,
    onClose: () => {},
    defaultTab: 'state',
    position: 'right',
    width: 600,
  },
};

/**
 * Debug panel positioned at bottom
 */
export const BottomPosition: Story = {
  args: {
    open: true,
    onClose: () => {},
    defaultTab: 'components',
    position: 'bottom',
    height: 400,
  },
};

/**
 * Interactive example with toggle button
 */
export const Interactive: Story = {
  render: () => {
    const { isOpen, toggle, close } = useDebugPanel();
    
    return (
      <Box sx={{ p: 2 }}>
        <h1>Interactive Debug Panel Demo</h1>
        <p>Press Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows) to toggle the debug panel.</p>
        <Button variant="contained" onClick={toggle}>
          {isOpen ? 'Close' : 'Open'} Debug Panel
        </Button>
        <DebugPanel open={isOpen} onClose={close} />
      </Box>
    );
  },
};

/**
 * Left-sided panel
 */
export const LeftPosition: Story = {
  args: {
    open: true,
    onClose: () => {},
    defaultTab: 'components',
    position: 'left',
    width: 500,
  },
};
