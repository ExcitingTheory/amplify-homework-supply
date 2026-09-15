import React from "react";
import { fn, expect } from "storybook/test";
import { RosterEnrollDialog } from "./RosterEnrollDialog";

export default {
  title: "📊 Instructor Tools/Section/Roster Enroll Dialog",
  component: RosterEnrollDialog,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    sectionId: "section-1",
    onClose: fn(),
    onEnrolled: fn(),
  },
};

export const Default = {
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
