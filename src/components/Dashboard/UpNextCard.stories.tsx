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
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    await canvas.findByText(/Verb Conjugation/i);
  },
};

export const WithChapterContext: Story = {
  args: {
    ...Default.args,
    chapterTitle: "The Dragon's Lair",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    expect(canvasElement.textContent).toMatch(/Dragon/i);
  },
};

export const WithNailedIt: Story = {
  args: {
    ...Default.args,
    latestGrade: { id: "grade-1", accuracy: 92 },
    nailedItCount: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    // Completed assignments show their grade alongside the Nailed It count
    expect(canvasElement.textContent).toMatch(/92%/);
    expect(canvasElement.textContent).toMatch(/5/);
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
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 4/i);
    // Card renders without due date
    expect(canvasElement.textContent).toMatch(/Chapter 4/i);
  },
};

// ── Mobile Viewport Variants ──────────────────────────────────────────
export const MobileViewport: Story = {
  args: Default.args,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "375px", padding: "16px" }}>
        <Story />
      </div>
    ),
  ],
};

export const TabletViewport: Story = {
  args: Default.args,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "tablet" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "768px", padding: "20px" }}>
        <Story />
      </div>
    ),
  ],
};

export const DesktopViewport: Story = {
  args: Default.args,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", maxWidth: "1200px", padding: "24px" }}>
        <Story />
      </div>
    ),
  ],
};
