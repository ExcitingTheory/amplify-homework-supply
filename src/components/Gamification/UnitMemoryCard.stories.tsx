import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UnitMemoryCard } from "./UnitMemoryCard";
import { expect, within } from "storybook/test";

const meta: Meta<typeof UnitMemoryCard> = {
  title: "🏆 Gamification/Adaptive Learning/Unit Memory Card",
  component: UnitMemoryCard,
};
export default meta;

type Story = StoryObj<typeof UnitMemoryCard>;

export const Default: Story = {
  args: {
    unitId: "unit-123",
    studentId: "student-456",
  },
  play: async ({ canvasElement }) => {
    // Component renders — may show skeleton, card, or empty state
    expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
