import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressRings } from "./ProgressRings";
import { expect, within } from "storybook/test";

const meta: Meta<typeof ProgressRings> = {
  title: "🏆 Gamification/XP & Progression/Progress Rings",
  component: ProgressRings,
};
export default meta;

type Story = StoryObj<typeof ProgressRings>;

export const MultipleModules: Story = {
  args: {
    modules: [
      {
        moduleId: "m1",
        moduleName: "Foundations",
        completionPercent: 75,
        totalWorkbooks: 4,
        completedWorkbooks: 3,
      },
      {
        moduleId: "m2",
        moduleName: "Advanced",
        completionPercent: 25,
        totalWorkbooks: 8,
        completedWorkbooks: 2,
      },
      {
        moduleId: "m3",
        moduleName: "Projects",
        completionPercent: 100,
        totalWorkbooks: 3,
        completedWorkbooks: 3,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Foundations/);
    await canvas.findByText(/Advanced/);
    await canvas.findByText(/Projects/);
  },
};

export const SingleModule: Story = {
  args: {
    modules: [
      {
        moduleId: "m1",
        moduleName: "Spanish Verbs",
        completionPercent: 50,
        totalWorkbooks: 6,
        completedWorkbooks: 3,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Spanish Verbs/);
  },
};

export const Empty: Story = {
  args: { modules: [] },
  play: async ({ canvasElement }) => {
    // Empty modules — no module names rendered
    const canvas = within(canvasElement);
    expect(canvas.queryByText(/Foundations|Advanced|Projects/)).toBeNull();
  },
};
