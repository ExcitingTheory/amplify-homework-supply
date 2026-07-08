import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GlobalSearchBar from './GlobalSearchBar';

const meta: Meta<typeof GlobalSearchBar> = {
  title: '🧩 UI Components/Global Search Bar',
  component: GlobalSearchBar,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof GlobalSearchBar>;

export const Default: Story = {};

export const InToolbar: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 400, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};
