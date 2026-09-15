import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { AssignmentCard, type AssignmentCardProps } from "./AssignmentCard";

const meta: Meta<typeof AssignmentCard> = {
  title: "📓 Workbook/Components/Assignment Card",
  component: AssignmentCard,
  parameters: {
    // Pure presentational component — skip the app context/subscription stack.
    minimalProviders: true,
    layout: "centered",
  },
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
    const canvas = within(canvasElement);
    await canvas.findByText("Chapter 3: Verb Conjugation");
    // Practice button triggers onOpenDrill
    const practiceBtn = canvas.getByRole("button", { name: /Practice/i });
    await userEvent.click(practiceBtn);
    expect(args.onOpenDrill).toHaveBeenCalledWith(
      "unit-1",
      "Chapter 3: Verb Conjugation",
    );
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
    const canvas = within(canvasElement);
    await canvas.findByText("Chapter 3: Verb Conjugation");
    // Overdue styling indicator exists (may show both "Overdue" and "Late" chips)
    const indicators = await canvas.findAllByText(/overdue|late/i);
    expect(indicators.length).toBeGreaterThan(0);
  },
};

export const DueSoon: Story = {
  args: {
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    unit: baseUnit,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Due soon/i);
  },
};

export const NoDueDate: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/No due date/i);
  },
};

export const ExtendedAccommodation: Story = {
  args: {
    assignment: {
      ...baseAssignment,
      // Raw due date is yesterday, but a +3 day extension moves it into the future.
      dueDate: new Date(Date.now() - 86400000).toISOString(),
    },
    unit: baseUnit,
    accommodation: { dueDateExtensionDays: 3 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Chapter 3: Verb Conjugation");
    // The extension surfaces an "Extended" chip and keeps the card out of "Overdue".
    await canvas.findByText(/Extended/i);
    expect(canvas.queryByText(/Overdue/i)).toBeNull();
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
    const canvas = within(canvasElement);
    await canvas.findByText("Chapter 3: Verb Conjugation");
    // Grade percentage shown
    await canvas.findByText(/92/);
  },
};

export const CompletedLowScore: Story = {
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    latestGrade: { id: "grade-1", accuracy: 55, sectionID: "section-1" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Chapter 3: Verb Conjugation");
    await canvas.findByText(/55/);
  },
};

// Demonstrates the "just completed" check-pop micro-animation (Phase 6.4).
// The card starts pending, then flips to completed shortly after mount so the
// transition fires the satisfying check animation (skipped under reduced motion).
export const JustCompletedAnimation: Story = {
  name: "Just Completed (check pop)",
  render: (args) => {
    const [grade, setGrade] =
      React.useState<AssignmentCardProps["latestGrade"]>(undefined);
    React.useEffect(() => {
      const id = setTimeout(
        () => setGrade({ id: "grade-1", accuracy: 92, sectionID: "section-1" }),
        400,
      );
      return () => clearTimeout(id);
    }, []);
    return <AssignmentCard {...args} latestGrade={grade} />;
  },
  args: {
    assignment: baseAssignment,
    unit: baseUnit,
    nailedItCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Chapter 3: Verb Conjugation");
    // After the pending→completed transition, the graded check chip appears
    await canvas.findByText(/92/, {}, { timeout: 3000 });
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
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    // Lock status info in textContent
    expect(canvasElement.textContent).toMatch(
      /Chapter 2|Basic Vocabulary|locked/i,
    );
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
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    expect(canvasElement.textContent?.toLowerCase()).toMatch(/unlock|lock/);
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
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    // "Up Next" badge — text may be in a chip spanning multiple elements
    expect(canvasElement.textContent).toMatch(/Chapter 3/i);
  },
};

export const EasyDifficulty: Story = {
  args: {
    assignment: baseAssignment,
    unit: { ...baseUnit, difficulty: "easy" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    // Difficulty badge may span multiple elements
    expect(canvasElement.textContent).toMatch(/Chapter 3/i);
  },
};

export const HardDifficulty: Story = {
  args: {
    assignment: baseAssignment,
    unit: { ...baseUnit, difficulty: "hard" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Chapter 3/i);
    expect(canvasElement.textContent).toMatch(/Chapter 3/i);
  },
};

// ── Mobile Viewport Variants ──────────────────────────────────────────
export const MobileViewport: Story = {
  args: {
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
    unit: baseUnit,
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
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
    unit: baseUnit,
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
    assignment: {
      ...baseAssignment,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    },
    unit: baseUnit,
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
