import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
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
};

export const Overdue: Story = {
  args: {
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() - 86400000).toISOString(),
    },
    unit: baseUnit,
  },
};

export const Completed: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    latestGrade: { id: "grade-1", accuracy: 92, sectionID: "section-1" },
    nailedItCount: 3,
  },
};

export const CompletedLowScore: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    latestGrade: { id: "grade-1", accuracy: 55, sectionID: "section-1" },
  },
};

export const Locked: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    locked: true,
    lockStatus: { requiredPriorUnitName: "Chapter 2: Basic Vocabulary" },
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
};

export const EasyDifficulty: Story = {
  args: {
    assignment: baseAssignment,
    unit: { ...baseUnit, difficulty: "easy" },
  },
};

export const HardDifficulty: Story = {
  args: {
    assignment: baseAssignment,
    unit: { ...baseUnit, difficulty: "hard" },
  },
};
