import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { OpenPeerReviewButton } from "./OpenPeerReviewButton";

const meta: Meta<typeof OpenPeerReviewButton> = {
  title: "🤝 Peer Review/Open Button",
  component: OpenPeerReviewButton,
};
export default meta;

type Story = StoryObj<typeof OpenPeerReviewButton>;

export const OpenButtonDefault: Story = {
  args: {
    gradeId: "grade-123",
    onCreateRoom: async (gradeId, invitedUserIds) => {
      await new Promise((r) => setTimeout(r, 800));
      console.log(
        "Created room for grade",
        gradeId,
        "with invites:",
        invitedUserIds,
      );
      return "room-mock-001";
    },
    onRoomCreated: (roomId) => console.log("Room created:", roomId),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await expect(button).toBeInTheDocument();
  },
};

export const OpenButtonDisabled: Story = {
  args: {
    gradeId: "grade-123",
    disabled: true,
    onCreateRoom: async () => "room-mock-001",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await expect(button).toBeInTheDocument();
    await expect(button).toBeDisabled();
  },
};

export const OpenButtonCreateError: Story = {
  args: {
    gradeId: "grade-123",
    onCreateRoom: async () => {
      await new Promise((r) => setTimeout(r, 500));
      throw new Error("Failed to create room — section capacity reached");
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await expect(button).toBeInTheDocument();
  },
};
