import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { PeerReviewChat } from "./PeerReviewChat";

const meta: Meta<typeof PeerReviewChat> = {
  title: "🤝 Peer Review/Chat",
  component: PeerReviewChat,
};
export default meta;

export const ChatStory: StoryObj<typeof PeerReviewChat> = {
  render: () => (
    <PeerReviewChat
      messages={[
        {
          id: "1",
          author: "alice",
          authorRole: "learner",
          content: "I think the answer for Q3 should mention osmosis.",
          messageType: "CHAT" as const,
          createdAt: new Date(Date.now() - 120000).toISOString(),
        },
        {
          id: "2",
          author: "bob",
          authorRole: "learner",
          content:
            "Good point! I also noticed the diagram labels are switched.",
          messageType: "CHAT" as const,
          createdAt: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: "3",
          author: "alice",
          authorRole: "learner",
          content:
            "@AI Can you explain the difference between osmosis and diffusion?",
          messageType: "CHAT" as const,
          createdAt: new Date().toISOString(),
        },
      ]}
      onSendMessage={(text) => console.log("Send:", text)}
      currentUsername="bob"
      typingPeers={[]}
      isClosed={false}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const osmosisMatches = canvas.getAllByText(/osmosis/);
    expect(osmosisMatches.length).toBeGreaterThan(0);
    await expect(canvas.getByText(/diagram labels/)).toBeInTheDocument();
  },
};
