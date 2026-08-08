import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import JobsDashboard from './JobsDashboard';
import { expect } from 'storybook/test'

const meta: Meta<typeof JobsDashboard> = {
  title: '🛠️ Admin/Jobs Dashboard',
  component: JobsDashboard,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof JobsDashboard>;

export const Default: Story = {
  args: {
    compact: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const Compact: Story = {
  args: {
    compact: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
