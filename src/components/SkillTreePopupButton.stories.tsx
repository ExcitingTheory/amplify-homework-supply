import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import { SkillTreePopupButton } from "./SkillTreePopupButton";

const meta: Meta<typeof SkillTreePopupButton> = {
  title: "� Gamification/Skill Tree/Skill Tree Popup Button",
  component: SkillTreePopupButton,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof SkillTreePopupButton>;

export const Default: Story = {
  args: {
    sectionId: "section-abc-123",
    label: "View Skill Tree",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("View Skill Tree Skill Tree");
  },
};

export const CustomLabel: Story = {
  args: {
    sectionId: "section-xyz-456",
    label: "Skills & Progress",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Skills & Progress Skill Tree");
  },
};
