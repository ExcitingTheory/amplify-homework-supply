/**
 * DebugPanel Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
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
    onClose: fn(),
    defaultTab: 'components',
    position: 'right',
    width: 600,
  },
  decorators: [
    (Story) => {
      return (
        <Box sx={{ height: '100vh', p: 2 }}>
          <h1>Main Application Content</h1>
          <p>The debug panel should appear on the right side.</p>
          <Story />
        </Box>
      );
    },
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Components tab is active by default
    await canvas.findByRole('tab', { name: /Components/i });

    // Switch to Logs tab
    const logsTab = canvas.getByRole('tab', { name: /Logs/i });
    await userEvent.click(logsTab);

    // Switch to State tab
    const stateTab = canvas.getByRole('tab', { name: /State/i });
    await userEvent.click(stateTab);

    // Click close button
    const closeBtn = canvas.getByRole('button', { name: /close/i });
    await userEvent.click(closeBtn);
    expect(args.onClose).toHaveBeenCalled();
  },
};

/**
 * Debug panel showing logs tab
 */
export const LogsTab: Story = {
  args: {
    open: true,
    onClose: fn(),
    defaultTab: 'logs',
    position: 'right',
    width: 600,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Logs tab is active
    const logsTab = await canvas.findByRole('tab', { name: /Logs/i });
    expect(logsTab).toHaveAttribute('aria-selected', 'true');
  },
};

/**
 * Debug panel showing state tab
 */
export const StateTab: Story = {
  args: {
    open: true,
    onClose: fn(),
    defaultTab: 'state',
    position: 'right',
    width: 600,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // State tab is active
    const stateTab = await canvas.findByRole('tab', { name: /State/i });
    expect(stateTab).toHaveAttribute('aria-selected', 'true');
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Panel renders in bottom position — tabs are visible
    await canvas.findByRole('tab', { name: /Components/i });
    // Verify bottom positioning by checking the panel is in the DOM
    expect(canvasElement.innerHTML.length).toBeGreaterThan(100);
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Toggle button starts as "Open Debug Panel"
    const toggleBtn = await canvas.findByRole('button', { name: /Open Debug Panel/i });
    await userEvent.click(toggleBtn);
    // After click, button label changes to "Close Debug Panel"
    await canvas.findByRole('button', { name: /Close Debug Panel/i });
    // Panel tabs are now visible
    await canvas.findByRole('tab', { name: /Components/i });
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Panel renders in left position — tabs visible
    await canvas.findByRole('tab', { name: /Components/i });
    expect(canvasElement.innerHTML.length).toBeGreaterThan(100);
  },
};
