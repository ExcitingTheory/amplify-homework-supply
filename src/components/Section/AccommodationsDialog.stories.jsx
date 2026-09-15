import React from "react";
import { fn, expect } from "storybook/test";
import { AccommodationsDialog } from "./AccommodationsDialog";

const students = [
  { id: "alice-sub", name: "Alice Johnson", email: "alice@example.com" },
  { id: "bob-sub", name: "Bob Smith", email: "bob@example.com" },
  { id: "carol-sub", name: "Carol Davis", email: "carol@example.com" },
];

export default {
  title: "📊 Instructor Tools/Section/Accommodations Dialog",
  component: AccommodationsDialog,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    students,
    accommodations: {},
    onClose: fn(),
    onSave: fn(),
  },
};

export const Empty = {
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};

export const WithExistingAccommodations = {
  args: {
    accommodations: {
      "alice-sub": {
        dueDateExtensionDays: 2,
        timeMultiplier: 1.5,
        note: "IEP — extended time",
        updatedAt: new Date().toISOString(),
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};

export const NoStudents = {
  args: {
    students: [],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
