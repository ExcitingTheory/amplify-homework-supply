import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { NailedItWall } from "./NailedItWall";

const meta: Meta<typeof NailedItWall> = {
  title: "🏆 Gamification/Badges & Celebrations/Nailed-It Wall",
  component: NailedItWall,
};
export default meta;

export const WallStory: StoryObj<typeof NailedItWall> = {
  render: () => (
    <NailedItWall
      blocks={[
        {
          id: "1",
          question: "Explain the process of photosynthesis",
          nailedItReason: "Perfect photosynthesis analysis",
          homeworkTitle: "Biology 101",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          question: "Describe French seasonal vocabulary",
          nailedItReason: "Excellent vocabulary usage",
          homeworkTitle: "French Basics",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          question: "How does the water cycle work?",
          nailedItReason: "Deep understanding of water cycle",
          homeworkTitle: "Earth Science",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const photoMatches = canvas.getAllByText(/photosynthesis/);
    expect(photoMatches.length).toBeGreaterThan(0);
    await expect(canvas.getByText(/Biology 101/)).toBeInTheDocument();
    await expect(canvas.getByText(/French Basics/)).toBeInTheDocument();
    await expect(canvas.getByText(/Earth Science/)).toBeInTheDocument();
  },
};
