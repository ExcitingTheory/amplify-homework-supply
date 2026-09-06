import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContentUnlockAnimation } from "./ContentUnlockAnimation";
import { expect, within } from "storybook/test";

const meta: Meta<typeof ContentUnlockAnimation> = {
  title: "🏆 Gamification/XP & Progression/Content Unlock Animation",
  component: ContentUnlockAnimation,
};
export default meta;

type Story = StoryObj<typeof ContentUnlockAnimation>;

export const Playing: Story = {
  args: { show: true, title: "Advanced Biology" },
  play: async ({ canvasElement }) => {
    // Animation renders a fixed overlay with the title; uses portal-like positioning
    const body = within(document.body);
    await body.findByText(/Advanced Biology/);
  },
};

export const Idle: Story = {
  args: { show: false, title: "Advanced Biology" },
  play: async ({ canvasElement }) => {
    // When show=false, component is idle — no animation title visible
    const canvas = within(canvasElement);
    expect(canvas.queryByText(/Advanced Biology/)).toBeNull();
  },
};
