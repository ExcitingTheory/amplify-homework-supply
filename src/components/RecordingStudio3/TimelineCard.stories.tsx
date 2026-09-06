import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TimelineCard from "./TimelineCard";
import { expect, within } from "storybook/test";

const meta: Meta<typeof TimelineCard> = {
  title: "🎙️ Recording Studio/TimelineCard",
  component: TimelineCard,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 120, width: "100%" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimelineCard>;

export const Default: Story = {
  args: {
    line: {
      id: "line-1",
      text: "Hello, welcome to today's lesson.",
      emotion: "neutral",
    },
    speaker: { name: "Instructor", color: "#1976d2" },
    isSelected: false,
    left: 10,
    width: 200,
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Hello, welcome/);
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    isSelected: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Hello, welcome/);
  },
};

export const LongText: Story = {
  args: {
    line: {
      id: "line-2",
      text: "This is a much longer dialogue line that demonstrates how the timeline card handles overflow text in constrained width scenarios.",
      emotion: "excited",
    },
    speaker: { name: "Student", color: "#9c27b0" },
    isSelected: false,
    left: 50,
    width: 300,
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/much longer dialogue/);
  },
};

export const NarrowCard: Story = {
  args: {
    line: { id: "line-3", text: "Short", emotion: "calm" },
    speaker: { name: "Narrator", color: "#388e3c" },
    isSelected: false,
    left: 0,
    width: 80,
    onClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Short");
  },
};
