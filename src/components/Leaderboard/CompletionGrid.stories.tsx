import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within } from "storybook/test";
import { CompletionGrid } from "./CompletionGrid";
import type { AssignmentColumn, CompletionStatus } from "./CompletionGrid";

const meta: Meta<typeof CompletionGrid> = {
  title: "📊 Instructor Tools/Leaderboard/Completion Grid",
  component: CompletionGrid,
};
export default meta;

export const GridStory: StoryObj<typeof CompletionGrid> = {
  render: () => {
    const assignments: AssignmentColumn[] = [
      { id: "bio101", title: "Biology 101" },
      { id: "french", title: "French Basics" },
      { id: "earth", title: "Earth Science" },
      { id: "math", title: "Math Review" },
      { id: "history", title: "History" },
    ];
    const students = [
      {
        studentId: "alice",
        studentName: "Alice",
        assignments: {
          bio101: "completed" as CompletionStatus,
          french: "completed" as CompletionStatus,
          earth: "completed" as CompletionStatus,
          math: "not_started" as CompletionStatus,
          history: "completed" as CompletionStatus,
        },
      },
      {
        studentId: "bob",
        studentName: "Bob",
        assignments: {
          bio101: "completed" as CompletionStatus,
          french: "not_started" as CompletionStatus,
          earth: "completed" as CompletionStatus,
          math: "completed" as CompletionStatus,
          history: "not_started" as CompletionStatus,
        },
      },
      {
        studentId: "charlie",
        studentName: "Charlie",
        assignments: {
          bio101: "completed" as CompletionStatus,
          french: "completed" as CompletionStatus,
          earth: "not_started" as CompletionStatus,
          math: "not_started" as CompletionStatus,
          history: "not_started" as CompletionStatus,
        },
      },
    ];
    return (
      <CompletionGrid
        assignments={assignments}
        students={students}
        currentStudentId="alice"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Alice/i);
    await canvas.findByText(/Bob/i);
    await canvas.findByText(/Biology 101/i);
  },
};
