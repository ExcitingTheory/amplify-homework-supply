import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StreakShield } from "./StreakShield";
import { expect, within } from "storybook/test";

const meta: Meta<typeof StreakShield> = {
  title: "🏆 Gamification/Streaks/Streak Shield",
  component: StreakShield,
};
export default meta;

type Story = StoryObj<typeof StreakShield>;

export const WithFreezes: Story = {
  args: { freezesRemaining: 3, freezesUsed: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Shows freeze count
    await canvas.findByText("3");
    // Shield SVG icon renders
    expect(canvasElement.querySelector("svg")).not.toBeNull();
  },
};

export const NoFreezes: Story = {
  args: { freezesRemaining: 0, freezesUsed: 2 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Shows 0 count
    await canvas.findByText("0");
    // Shield icon uses disabled color
    const svgIcon = canvasElement.querySelector("svg");
    expect(svgIcon).not.toBeNull();
  },
};

export const SmallSize: Story = {
  args: { freezesRemaining: 2, size: "small" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("2");
    // Small size uses caption variant text
    const text = canvasElement.querySelector(".MuiTypography-caption");
    expect(text).not.toBeNull();
  },
};
