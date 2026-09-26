import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PeerReviewFeedbackPrompt } from "./PeerReviewFeedbackPrompt";

const meta: Meta<typeof PeerReviewFeedbackPrompt> = {
  title: "🤝 Peer Review/Feedback Prompt",
  component: PeerReviewFeedbackPrompt,
};
export default meta;

export const FeedbackPromptOpen: StoryObj<typeof PeerReviewFeedbackPrompt> = {
  args: {
    open: true,
    onSubmit: (helpful) =>
      console.log("Feedback:", helpful ? "helpful" : "not helpful"),
    onClose: () => console.log("Dismissed"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
