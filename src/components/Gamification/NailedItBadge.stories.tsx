import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within } from "storybook/test";
import { NailedItBadge } from "./NailedItBadge";

const meta: Meta<typeof NailedItBadge> = {
  title: "🏆 Gamification/Badges & Celebrations/Nailed-It Badge",
  component: NailedItBadge,
};
export default meta;

type Story = StoryObj<typeof NailedItBadge>;

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Nailed It/);
  },
};

export const CustomSize: Story = {
  args: {
    size: "medium",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Nailed It/);
  },
};
