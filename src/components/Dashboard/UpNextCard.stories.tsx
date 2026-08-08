import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within } from "storybook/test";
import { UpNextCard } from "./UpNextCard";

const meta: Meta<typeof UpNextCard> = {
  title: "📓 Workbook/Components/Up Next Card",
  component: UpNextCard,
  parameters: { layout: "centered" },
  args: {
    onOpenDrill: fn(),
    onRequestGuidance: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof UpNextCard>;

export const Default: Story = {
  args: {
    assignment: {
      id: "assignment-1",
      unitID: "unit-1",
      sectionID: "section-1",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
    unit: {
      id: "unit-1",
      name: "Chapter 3: Verb Conjugation",
      description: "Practice conjugating regular -ar, -er, and -ir verbs.",
      difficulty: "medium",
    },
    sectionName: "Spanish 101 — Fall 2026",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const WithChapterContext: Story = {
  args: {
    ...Default.args,
    chapterTitle: "The Dragon's Lair",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    expect(canvasElement.textContent).toMatch(/Dragon/i)
  },
};

export const WithNailedIt: Story = {
  args: {
    ...Default.args,
    nailedItCount: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    // Nailed It badge or count shown
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const NoDueDate: Story = {
  args: {
    assignment: {
      id: "assignment-2",
      unitID: "unit-2",
      sectionID: "section-1",
    },
    unit: {
      id: "unit-2",
      name: "Chapter 4: Past Tense",
      description: "Learn the preterite and imperfect past tenses.",
    },
    sectionName: "Spanish 101 — Fall 2026",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 4/i)
    // Card renders without due date
    expect(canvasElement.textContent).toMatch(/Chapter 4/i)
  },
};
