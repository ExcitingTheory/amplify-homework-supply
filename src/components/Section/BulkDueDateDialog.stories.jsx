import React from "react";
import { fn, expect } from "storybook/test";
import {
  seedMockAssignments,
  clearMockData,
} from "@storybook-mocks/aws-amplify-data";
import { BulkDueDateDialog } from "./BulkDueDateDialog";

const mockAssignments = [
  {
    id: "assign-1",
    sectionID: "section-1",
    unitID: "unit-1",
    dueDate: "2026-05-01T23:59:00.000Z",
    availableUntil: "2026-05-01T23:59:00.000Z",
    _version: 1,
  },
  {
    id: "assign-2",
    sectionID: "section-1",
    unitID: "unit-2",
    dueDate: "2026-05-08T23:59:00.000Z",
    availableUntil: "2026-05-08T23:59:00.000Z",
    _version: 1,
  },
  {
    id: "assign-3",
    sectionID: "section-1",
    unitID: "unit-3",
    dueDate: "2026-05-15T23:59:00.000Z",
    _version: 1,
  },
];

const unitNames = {
  "unit-1": "Greetings & Introductions",
  "unit-2": "Numbers 1–20",
  "unit-3": "Days of the Week",
};

export default {
  title: "📊 Instructor Tools/Section/Bulk Due Date Dialog",
  component: BulkDueDateDialog,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    assignments: mockAssignments,
    getUnitName: (unitID) => unitNames[unitID] || unitID,
    onClose: fn(),
    onUpdated: fn(),
  },
  decorators: [
    (Story) => {
      clearMockData();
      seedMockAssignments(mockAssignments);
      return <Story />;
    },
  ],
};

export const Default = {
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};

export const NoAssignments = {
  args: {
    assignments: [],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
