import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StreakIndicator } from "./StreakIndicator";
import { expect, within } from "storybook/test";

const meta: Meta<typeof StreakIndicator> = {
  title: "🏆 Gamification/Streaks/Streak Indicator",
  component: StreakIndicator,
};
export default meta;

type Story = StoryObj<typeof StreakIndicator>;

export const Active5Day: Story = {
  args: { currentStreak: 5 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Shows "5" streak count
    await canvas.findByText("5");
    // Has aria-label with streak info
    expect(
      canvasElement.querySelector('[aria-label="5 day streak"]'),
    ).not.toBeNull();
  },
};

export const NoStreak: Story = {
  args: { currentStreak: 0 },
  play: async ({ canvasElement }) => {
    // Streak 0 renders no streak count
    const canvas = within(canvasElement);
    expect(canvas.queryByText(/\d+ day streak/)).toBeNull();
  },
};

export const Milestone7Day: Story = {
  args: { currentStreak: 7 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("7");
    // Milestone (>=7) gets a glow/pulse animation via drop-shadow filter
    const container = canvasElement.querySelector(
      '[aria-label="7 day streak"]',
    );
    expect(container).not.toBeNull();
  },
};

export const LongStreak: Story = {
  args: { currentStreak: 30 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("30");
  },
};

export const SmallSize: Story = {
  args: { currentStreak: 3, size: "small" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("3");
    // Small size uses caption variant text
    const text = canvasElement.querySelector(".MuiTypography-caption");
    expect(text).not.toBeNull();
  },
};
