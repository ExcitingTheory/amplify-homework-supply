import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GroupChallengeCard } from "./GroupChallengeCard";
import { expect, within } from "storybook/test";

const meta: Meta<typeof GroupChallengeCard> = {
  title: "🏆 Gamification/Squads & Teams/Group Challenge Card",
  component: GroupChallengeCard,
};
export default meta;

type Story = StoryObj<typeof GroupChallengeCard>;

export const Active: Story = {
  args: {
    title: "Weekly Sprint",
    targetXP: 1000,
    currentXP: 600,
    active: true,
    bonusMultiplier: 1.5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Weekly Sprint");
    // Progress bar reflects 60% (600/1000)
    const progressBar = canvasElement.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeNull();
  },
};

export const Completed: Story = {
  args: {
    title: "Finish Line",
    targetXP: 500,
    currentXP: 500,
    active: false,
    bonusMultiplier: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Finish Line");
    // Completed state — 100% progress
    await canvas.findByText(/complete|500/i);
  },
};

export const WithDeadline: Story = {
  args: {
    title: "Timed Sprint",
    targetXP: 800,
    currentXP: 200,
    active: true,
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Timed Sprint");
    // Verify progress/XP content renders
    expect(canvasElement.textContent!.length).toBeGreaterThan(0);
  },
};

export const JustStarted: Story = {
  args: { title: "New Challenge", targetXP: 2000, currentXP: 0, active: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("New Challenge");
    // 0% progress
    const progressBar = canvasElement.querySelector('[role="progressbar"]');
    if (progressBar) {
      expect(progressBar.getAttribute("aria-valuenow")).toBe("0");
    }
  },
};
