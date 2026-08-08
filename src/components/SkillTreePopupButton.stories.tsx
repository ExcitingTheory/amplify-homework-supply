import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SkillTreePopupButton } from './SkillTreePopupButton';

const meta: Meta<typeof SkillTreePopupButton> = {
  title: '� Gamification/Skill Tree/Skill Tree Popup Button',
  component: SkillTreePopupButton,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof SkillTreePopupButton>;

export const Default: Story = {
  args: {
    sectionId: 'section-abc-123',
    label: 'View Skill Tree',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const CustomLabel: Story = {
  args: {
    sectionId: 'section-xyz-456',
    label: 'Skills & Progress',
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
