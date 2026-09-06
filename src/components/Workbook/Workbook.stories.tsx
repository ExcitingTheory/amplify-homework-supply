import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommentThreadDrawer } from "./CommentThreadDrawer";
import { CommentGutterIcon } from "./CommentGutterIcon";
import { BlockHistoryTimeline } from "./BlockHistoryTimeline";
import type { CommentThread } from "../../yjs/WorkbookCollaborationProvider";
import type { HistoryEntry } from "../../yjs/WorkbookCollaborationProvider";
import { expect, within } from "storybook/test";

// =============================================================================
// CommentGutterIcon Stories
// =============================================================================

const gutterMeta: Meta<typeof CommentGutterIcon> = {
  title: "📓 Workbook/Comment Gutter Icon",
  component: CommentGutterIcon,
};
export default gutterMeta;

type GutterStory = StoryObj<typeof CommentGutterIcon>;

export const NoComments: GutterStory = {
  args: {
    commentCount: 0,
    unresolvedCount: 0,
    onClick: () => console.log("open"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("button")).toBeTruthy();
  },
};

export const WithComments: GutterStory = {
  args: {
    commentCount: 5,
    unresolvedCount: 3,
    onClick: () => console.log("open"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("button")).toBeTruthy();
    const canvas = within(canvasElement);
    await canvas.findByText("3");
  },
};

export const AllResolved: GutterStory = {
  args: {
    commentCount: 4,
    unresolvedCount: 0,
    onClick: () => console.log("open"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};

// =============================================================================
// CommentThreadDrawer Stories
// =============================================================================

const drawerMeta: Meta<typeof CommentThreadDrawer> = {
  title: "📓 Workbook/Comment Thread Drawer",
  component: CommentThreadDrawer,
};

const sampleThreads: CommentThread[] = [
  {
    id: "thread-1",
    blockId: "block-abc",
    author: "instructor1",
    authorRole: "instructor",
    displayName: "Prof. Smith",
    text: "Great answer, but can you elaborate on the process?",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    resolved: false,
    replies: [
      {
        id: "reply-1",
        author: "student1",
        authorRole: "learner",
        displayName: "Alice",
        text: "I added more detail about the electron transport chain.",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
  },
  {
    id: "thread-2",
    blockId: "block-abc",
    author: "instructor1",
    authorRole: "instructor",
    displayName: "Prof. Smith",
    text: 'Check your spelling on "mitochondria".',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    resolved: true,
    replies: [],
  },
];

export const DrawerOpen: StoryObj<typeof CommentThreadDrawer> = {
  render: () => (
    <CommentThreadDrawer
      open={true}
      onClose={() => {}}
      blockId="block-abc"
      threads={sampleThreads}
      onAddComment={(text) => console.log("Add comment:", text)}
      onReply={(key, text) => console.log("Reply:", key, text)}
      onResolve={(key, resolved) => console.log("Resolve:", key, resolved)}
      currentUsername="student1"
    />
  ),
  parameters: { ...drawerMeta },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Great answer/);
  },
};

export const DrawerEmpty: StoryObj<typeof CommentThreadDrawer> = {
  render: () => (
    <CommentThreadDrawer
      open={true}
      onClose={() => {}}
      blockId="block-xyz"
      threads={[]}
      onAddComment={(text) => console.log("Add:", text)}
      onReply={() => {}}
      onResolve={() => {}}
    />
  ),
  parameters: { ...drawerMeta },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};

// =============================================================================
// BlockHistoryTimeline Stories
// =============================================================================

const historyMeta: Meta<typeof BlockHistoryTimeline> = {
  title: "📓 Workbook/Block History Timeline",
  component: BlockHistoryTimeline,
};

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
  parameters: { ...historyMeta },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/Alice/);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const HistoryEmpty: StoryObj<typeof BlockHistoryTimeline> = {
  render: () => <BlockHistoryTimeline entries={[]} />,
  parameters: { ...historyMeta },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
