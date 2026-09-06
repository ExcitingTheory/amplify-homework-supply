import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CampaignTimeline, type CampaignChapter } from "./CampaignTimeline";
import { expect, within } from "storybook/test";

const meta: Meta<typeof CampaignTimeline> = {
  title: "🏆 Gamification/XP & Progression/Campaign Timeline",
  component: CampaignTimeline,
};
export default meta;

type Story = StoryObj<typeof CampaignTimeline>;

const sampleChapters: CampaignChapter[] = [
  {
    id: "1",
    title: "The Beginning",
    setting: "Forest",
    targetXP: 100,
    currentXP: 100,
    active: false,
    chapterOrder: 1,
  },
  {
    id: "2",
    title: "The Challenge",
    setting: "Mountain",
    targetXP: 200,
    currentXP: 120,
    active: true,
    chapterOrder: 2,
  },
  {
    id: "3",
    title: "The Summit",
    setting: "Peak",
    targetXP: 300,
    currentXP: 0,
    active: false,
    chapterOrder: 3,
  },
];

export const Default: Story = {
  args: { chapters: sampleChapters },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/The Beginning/);
    await canvas.findByText(/The Challenge/);
    await canvas.findByText(/The Summit/);
  },
};

export const AllComplete: Story = {
  args: {
    chapters: sampleChapters.map((c) => ({
      ...c,
      currentXP: c.targetXP,
      active: false,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/The Beginning/);
    await canvas.findByText(/Campaign Progress/);
  },
};
