import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { PeerReviewInvitations } from "./PeerReviewInvitations";
import type { PeerReviewInvitation } from "./PeerReviewInvitations";

const meta: Meta<typeof PeerReviewInvitations> = {
  title: "🤝 Peer Review/Invitations",
  component: PeerReviewInvitations,
};
export default meta;

const sampleInvitations: PeerReviewInvitation[] = [
  {
    id: "room-1",
    gradeId: "grade-1",
    ownerId: "alice",
    ownerDisplayName: "Alice",
    unitName: "Biology 101",
    status: "OPEN",
  },
  {
    id: "room-2",
    gradeId: "grade-2",
    ownerId: "bob",
    ownerDisplayName: "Bob",
    unitName: "French Basics",
    status: "IN_REVIEW",
  },
];

export const InvitationsStory: StoryObj<typeof PeerReviewInvitations> = {
  render: () => (
    <PeerReviewInvitations
      invitations={sampleInvitations}
      onJoinReview={(roomId) => console.log("Join:", roomId)}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Alice/)).toBeInTheDocument();
    await expect(canvas.getByText(/Bob/)).toBeInTheDocument();
    await expect(canvas.getByText(/Biology 101/)).toBeInTheDocument();
  },
};

export const NoInvitations: StoryObj<typeof PeerReviewInvitations> = {
  render: () => (
    <PeerReviewInvitations invitations={[]} onJoinReview={() => {}} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("button")).toBeFalsy();
  },
};
