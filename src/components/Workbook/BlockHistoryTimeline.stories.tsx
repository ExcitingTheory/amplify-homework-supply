import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { BlockHistoryTimeline } from "./BlockHistoryTimeline";
import type { HistoryEntry } from "../../yjs/WorkbookCollaborationProvider";

const meta: Meta<typeof BlockHistoryTimeline> = {
  title: "📓 Workbook/Block History Timeline",
  component: BlockHistoryTimeline,
};
export default meta;

const sampleEntries: HistoryEntry[] = [
  {
    userId: "student1",
    displayName: "Alice",
    fieldChanged: "userAnswer",
    oldValue: "Osmosis is...",
    newValue:
      "Osmosis is the movement of water through a semi-permeable membrane from low to high concentration.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    userId: "student1",
    displayName: "Alice",
    fieldChanged: "complete",
    oldValue: false,
    newValue: true,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    userId: "instructor1",
    displayName: "Prof. Smith",
    fieldChanged: "accuracy",
    oldValue: 0,
    newValue: 85,
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
];

export const HistoryStory: StoryObj<typeof BlockHistoryTimeline> = {
  render: () => <BlockHistoryTimeline entries={sampleEntries} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/Alice/);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const HistoryEmpty: StoryObj<typeof BlockHistoryTimeline> = {
  render: () => <BlockHistoryTimeline entries={[]} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
