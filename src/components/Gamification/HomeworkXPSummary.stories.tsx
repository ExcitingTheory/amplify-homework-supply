import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { HomeworkXPSummary } from "./HomeworkXPSummary";

const meta: Meta<typeof HomeworkXPSummary> = {
  title: "🏆 Gamification/XP & Progression/Homework XP Summary",
  component: HomeworkXPSummary,
};
export default meta;

export const XPSummaryStory: StoryObj<typeof HomeworkXPSummary> = {
  render: () => (
    <HomeworkXPSummary
      lineItems={[
        { label: "Homework submitted", xp: 50 },
        { label: "All blocks complete", xp: 100 },
        { label: "On-time submission", xp: 15 },
      ]}
      totalXP={165}
      cumulativeXP={1250}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Homework submitted/)).toBeInTheDocument();
    await expect(canvas.getByText(/All blocks complete/)).toBeInTheDocument();
    await expect(canvas.getByText(/165/)).toBeInTheDocument();
  },
};
