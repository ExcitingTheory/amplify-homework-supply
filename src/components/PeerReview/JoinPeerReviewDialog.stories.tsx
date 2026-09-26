import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import JoinPeerReviewDialog from "./JoinPeerReviewDialog";

const meta: Meta<typeof JoinPeerReviewDialog> = {
  title: "🤝 Peer Review/Join Dialog",
  component: JoinPeerReviewDialog,
};
export default meta;

export const JoinDialogOpen: StoryObj<typeof JoinPeerReviewDialog> = {
  render: () => (
    <JoinPeerReviewDialog
      open={true}
      onClose={() => console.log("Closed")}
      onJoin={(info) => console.log("Joined:", info)}
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
