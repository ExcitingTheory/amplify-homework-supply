import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { NailedItCelebration } from "./NailedItCelebration";

const meta: Meta<typeof NailedItCelebration> = {
  title: "🏆 Gamification/Badges & Celebrations/Nailed-It Celebration",
  component: NailedItCelebration,
};
export default meta;

export const CelebrationOpen: StoryObj<typeof NailedItCelebration> = {
  render: () => (
    <NailedItCelebration
      open={true}
      nailedItReason="You showed deep understanding of cell biology!"
      onClose={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/cell biology/)).toBeInTheDocument();
  },
};
