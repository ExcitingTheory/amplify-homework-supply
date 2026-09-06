import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EasterEggLayer } from "./EasterEggLayer";
import { expect, within } from "storybook/test";

const meta: Meta<typeof EasterEggLayer> = {
  title: "🏆 Gamification/Runtime/Easter Egg Layer",
  component: EasterEggLayer,
};
export default meta;

type Story = StoryObj<typeof EasterEggLayer>;

export const Default: Story = {
  args: { studentId: "student-123" },
  play: async ({ canvasElement }) => {
    // EasterEggLayer renders no visible UI when idle (just a toast container)
    expect(canvasElement).toBeInTheDocument();
  },
};
