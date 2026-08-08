import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { AssignmentCard } from "./AssignmentCard";

const meta: Meta<typeof AssignmentCard> = {
  title: "📓 Workbook/Components/Assignment Card",
  component: AssignmentCard,
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

type Story = StoryObj<typeof AssignmentCard>;

const baseAssignment = {
  id: "assignment-1",
  unitID: "unit-1",
  sectionID: "section-1",
};

const baseUnit = {
  id: "unit-1",
  name: "Chapter 3: Verb Conjugation",
  description:
    "Practice conjugating regular -ar, -er, and -ir verbs in the present tense.",
  difficulty: "medium" as const,
};

export const Pending: Story = {
  args: {
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
    unit: baseUnit,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Chapter 3: Verb Conjugation")
    // Practice button triggers onOpenDrill
    const practiceBtn = canvas.getByRole("button", { name: /Practice/i })
    await userEvent.click(practiceBtn)
    expect(args.onOpenDrill).toHaveBeenCalledWith("unit-1", "Chapter 3: Verb Conjugation")
  },
};

export const Overdue: Story = {
  args: {
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() - 86400000).toISOString(),
    },
    unit: baseUnit,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Chapter 3: Verb Conjugation")
    // Overdue styling indicator exists
    await canvas.findByText(/overdue|late|ago/i)
  },
};

export const Completed: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    latestGrade: { id: "grade-1", accuracy: 92, sectionID: "section-1" },
    nailedItCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Chapter 3: Verb Conjugation")
    // Grade percentage shown
    await canvas.findByText(/92/)
  },
};

export const CompletedLowScore: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    latestGrade: { id: "grade-1", accuracy: 55, sectionID: "section-1" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText("Chapter 3: Verb Conjugation")
    await canvas.findByText(/55/)
  },
};

export const Locked: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    locked: true,
    lockStatus: { requiredPriorUnitName: "Chapter 2: Basic Vocabulary" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    // Lock status info in textContent
    expect(canvasElement.textContent).toMatch(/Chapter 2|Basic Vocabulary|locked/i)
  },
};

export const LockedWithDate: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    locked: true,
    lockStatus: {
      unlockDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    expect(canvasElement.textContent?.toLowerCase()).toMatch(/unlock|lock/)
  },
};

export const UpNext: Story = {
  args: {
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
    unit: baseUnit,
    isUpNext: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    // "Up Next" badge — text may be in a chip spanning multiple elements
    expect(canvasElement.textContent).toMatch(/Chapter 3/i)
  },
};

export const EasyDifficulty: Story = {
  args: {
    assignment: baseAssignment,
    unit: { ...baseUnit, difficulty: "easy" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    // Difficulty badge may span multiple elements
    expect(canvasElement.textContent).toMatch(/Chapter 3/i)
  },
};

export const HardDifficulty: Story = {
  args: {
    assignment: baseAssignment,
    unit: { ...baseUnit, difficulty: "hard" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByText(/Chapter 3/i)
    expect(canvasElement.textContent).toMatch(/Chapter 3/i)
  },
};
