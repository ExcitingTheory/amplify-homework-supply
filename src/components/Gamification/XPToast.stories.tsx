import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { XPToast } from "./XPToast";

const meta: Meta<typeof XPToast> = {
  title: "🏆 Gamification/XP & Progression/XP Toast",
  component: XPToast,
};
export default meta;

export const XPToastOpen: StoryObj<typeof XPToast> = {
  render: () => (
    <XPToast
      open={true}
      xpAmount={50}
      xpReason="Homework submitted"
      onClose={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const xpMatches = canvas.getAllByText(/50/);
    expect(xpMatches.length).toBeGreaterThan(0);
    const reasonMatches = canvas.getAllByText(/Homework submitted/);
    expect(reasonMatches.length).toBeGreaterThan(0);
  },
};
