import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { RoomInvite } from "./RoomInvite";

const meta: Meta<typeof RoomInvite> = {
  title: "🤝 Peer Review/Room Invite",
  component: RoomInvite,
};
export default meta;

export const RoomInviteStandalone: StoryObj<typeof RoomInvite> = {
  render: () => (
    <RoomInvite
      invitedUsers={["alice", "bob", "charlie"]}
      onInvite={(user) => console.log("Invite:", user)}
      onRemove={(user) => console.log("Remove:", user)}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/alice/i)).toBeInTheDocument();
    await expect(canvas.getByText(/bob/i)).toBeInTheDocument();
    await expect(canvas.getByText(/charlie/i)).toBeInTheDocument();
  },
};
