import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import JobsDashboard from './JobsDashboard';

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
};

export const Compact: Story = {
  args: {
    compact: true,
  },
};
