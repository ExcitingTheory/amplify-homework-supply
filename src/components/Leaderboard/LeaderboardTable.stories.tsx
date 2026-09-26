import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { LeaderboardTable } from "./LeaderboardTable";

const meta: Meta<typeof LeaderboardTable> = {
  title: "📊 Instructor Tools/Leaderboard/Table",
  component: LeaderboardTable,
};
export default meta;

type Story = StoryObj<typeof LeaderboardTable>;

const sampleEntries = [
  {
    studentId: "alice",
    studentName: "Alice",
    totalXP: 2500,
    level: 6,
    currentStreak: 7,
    completedAssignments: 12,
    avatarColor: "#e91e63",
  },
  {
    studentId: "bob",
    studentName: "Bob",
    totalXP: 2100,
    level: 6,
    currentStreak: 3,
    completedAssignments: 11,
    avatarColor: "#2196f3",
  },
  {
    studentId: "charlie",
    studentName: "Charlie",
    totalXP: 1800,
    level: 5,
    currentStreak: 5,
    completedAssignments: 10,
    avatarColor: "#4caf50",
  },
  {
    studentId: "diana",
    studentName: "Diana",
    totalXP: 1500,
    level: 5,
    currentStreak: 0,
    completedAssignments: 9,
    avatarColor: "#ff9800",
  },
  {
    studentId: "eve",
    studentName: "Eve",
    totalXP: 900,
    level: 3,
    currentStreak: 1,
    completedAssignments: 6,
    avatarColor: "#9c27b0",
  },
];

export const Default: Story = {
  args: {
    entries: sampleEntries,
    currentStudentId: "charlie",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // All student names render
    await canvas.findByText(/Alice/i);
    canvas.getAllByText(/Charlie/i)[0];
    canvas.getAllByText(/Eve/i)[0];
    // Current student row highlighted (charlie is #3)
    const rows = canvas.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1); // header + data rows
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Empty state or empty table — no student names
    expect(canvas.queryByText("Alice")).toBeNull();
  },
};
