import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { CommentThreadDrawer } from "./CommentThreadDrawer";
import type { CommentThread } from "../../yjs/WorkbookCollaborationProvider";

const meta: Meta<typeof CommentThreadDrawer> = {
  title: "📓 Workbook/Comment Thread Drawer",
  component: CommentThreadDrawer,
};
export default meta;

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
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
