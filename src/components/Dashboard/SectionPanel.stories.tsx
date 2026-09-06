import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { SectionPanel } from "./SectionPanel";

const meta: Meta<typeof SectionPanel> = {
  title: "📓 Workbook/Components/Section Panel",
  component: SectionPanel,
  parameters: { layout: "padded" },
  args: {
    onOpenDrill: fn(),
    onRequestGuidance: fn(),
    isLocked: () => false,
    getLockStatus: () => null,
  },
};
export default meta;

type Story = StoryObj<typeof SectionPanel>;

const units: Record<
  string,
  { id: string; name: string; description: string; difficulty?: string }
> = {
  "unit-1": {
    id: "unit-1",
    name: "Chapter 1: Greetings",
    description: "Learn basic greetings and introductions in Spanish.",
    difficulty: "easy",
  },
  "unit-2": {
    id: "unit-2",
    name: "Chapter 2: Basic Vocabulary",
    description: "Essential vocabulary for everyday conversations.",
    difficulty: "easy",
  },
  "unit-3": {
    id: "unit-3",
    name: "Chapter 3: Verb Conjugation",
    description: "Practice conjugating regular -ar, -er, and -ir verbs.",
    difficulty: "medium",
  },
  "unit-4": {
    id: "unit-4",
    name: "Chapter 4: Past Tense",
    description: "Learn the preterite and imperfect past tenses.",
    difficulty: "hard",
  },
  "unit-5": {
    id: "unit-5",
    name: "Chapter 5: Subjunctive Mood",
    description: "Introduction to the subjunctive in everyday usage.",
    difficulty: "hard",
  },
};

const assignments = [
  {
    id: "a1",
    unitID: "unit-1",
    sectionID: "s1",
    dueDate: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "a2",
    unitID: "unit-2",
    sectionID: "s1",
    dueDate: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "a3",
    unitID: "unit-3",
    sectionID: "s1",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
  },
  {
    id: "a4",
    unitID: "unit-4",
    sectionID: "s1",
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
  },
  {
    id: "a5",
    unitID: "unit-5",
    sectionID: "s1",
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
  },
];

const gradeMap: Record<
  string,
  { id: string; accuracy: number; sectionID: string }[]
> = {
  "unit-1": [{ id: "g1", accuracy: 92, sectionID: "s1" }],
  "unit-2": [{ id: "g2", accuracy: 78, sectionID: "s1" }],
};

export const MixedProgress: Story = {
  args: {
    section: {
      id: "s1",
      name: "Spanish 101 — Fall 2026",
      description: "Prof. García",
    },
    assignments,
    units,
    gradeMap,
    nailedItByUnit: { "unit-1": 3, "unit-2": 1 },
    sectionLevel: { level: 3 },
    defaultExpanded: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Section name renders in accordion header
    await canvas.findByText("Spanish 101 — Fall 2026");

    // Assignment cards visible
    await canvas.findByText("Chapter 3: Verb Conjugation");

    // Click "Practice" button on a pending assignment
    const practiceButtons = canvas.getAllByRole("button", {
      name: /Practice/i,
    });
    if (practiceButtons.length > 0) {
      await userEvent.click(practiceButtons[0]);
      expect(args.onOpenDrill).toHaveBeenCalled();
    }
  },
};

export const AllCompleted: Story = {
  args: {
    section: { id: "s2", name: "Japanese 201 — Spring 2026" },
    assignments: assignments.slice(0, 3),
    units,
    gradeMap: {
      "unit-1": [{ id: "g1", accuracy: 95, sectionID: "s2" }],
      "unit-2": [{ id: "g2", accuracy: 88, sectionID: "s2" }],
      "unit-3": [{ id: "g3", accuracy: 72, sectionID: "s2" }],
    },
    sectionLevel: { level: 5 },
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Japanese 201 — Spring 2026");

    // "Completed (N)" toggle button — find specifically by button role
    const completedBtn = await canvas.findByRole("button", {
      name: /Completed \(/i,
    });
    await userEvent.click(completedBtn);
    // Assignment cards visible after expanding
    await canvas.findByText(/Chapter 1: Greetings/);
  },
};

export const AllPending: Story = {
  args: {
    section: { id: "s3", name: "French 101 — Summer 2026" },
    assignments: assignments.slice(2),
    units,
    gradeMap: {},
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("French 101 — Summer 2026");
    // No "Completed (N)" toggle button for all-pending section
    expect(canvas.queryByRole("button", { name: /Completed \(/i })).toBeNull();
    // Pending assignments visible
    await canvas.findByText("Chapter 3: Verb Conjugation");
  },
};

export const WithLockedAssignments: Story = {
  args: {
    section: { id: "s4", name: "Spanish 101 — Fall 2026" },
    assignments,
    units,
    gradeMap,
    isLocked: (unitId: string) => unitId === "unit-4" || unitId === "unit-5",
    getLockStatus: (unitId: string) => {
      if (unitId === "unit-4")
        return { requiredPriorUnitName: "Chapter 3: Verb Conjugation" };
      if (unitId === "unit-5")
        return { requiredPriorUnitName: "Chapter 4: Past Tense" };
      return null;
    },
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Spanish 101 — Fall 2026");
    const matches = await canvas.findAllByText(/Chapter 4: Past Tense/);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const WithCampaignContext: Story = {
  args: {
    ...MixedProgress.args,
    activeChapterTitle: "The Dragon's Lair",
    campaignBriefing: (
      <div style={{ padding: "8px 0", color: "#666", fontStyle: "italic" }}>
        📖 &quot;The ancient texts reveal the conjugation patterns needed to
        unlock the sealed door...&quot;
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Spanish 101 — Fall 2026");
    await canvas.findByText(/The Dragon's Lair/);
  },
};

export const Collapsed: Story = {
  args: {
    ...MixedProgress.args,
    defaultExpanded: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Section name visible in header
    await canvas.findByText("Spanish 101 — Fall 2026");

    // Accordion starts collapsed — button has aria-expanded="false"
    const header = canvas.getByRole("button", { name: /Spanish 101/i });
    expect(header).toHaveAttribute("aria-expanded", "false");

    // Click header to expand
    await userEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
  },
};

export const SingleAssignment: Story = {
  args: {
    section: { id: "s5", name: "English Composition" },
    assignments: [assignments[2]],
    units,
    gradeMap: {},
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("English Composition");
    await canvas.findByText("Chapter 3: Verb Conjugation");
  },
};

// ── Mobile Viewport Variants ──────────────────────────────────────────
export const MobileViewport: Story = {
  args: {
    section: {
      id: "s1",
      name: "Spanish 101 — Fall 2026",
      description: "Prof. García",
    },
    assignments,
    units,
    gradeMap,
    nailedItByUnit: { "unit-1": 3, "unit-2": 1 },
    sectionLevel: { level: 3 },
    defaultExpanded: false,
  },
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
  args: {
    section: {
      id: "s1",
      name: "Spanish 101 — Fall 2026",
      description: "Prof. García",
    },
    assignments,
    units,
    gradeMap,
    nailedItByUnit: { "unit-1": 3, "unit-2": 1 },
    sectionLevel: { level: 3 },
    defaultExpanded: true,
  },
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
  args: {
    section: {
      id: "s1",
      name: "Spanish 101 — Fall 2026",
      description: "Prof. García",
    },
    assignments,
    units,
    gradeMap,
    nailedItByUnit: { "unit-1": 3, "unit-2": 1 },
    sectionLevel: { level: 3 },
    defaultExpanded: true,
  },
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
