import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { JoinByCode } from "./JoinByCode";

const meta: Meta<typeof JoinByCode> = {
  title: "🤝 Peer Review/Join By Code",
  component: JoinByCode,
};
export default meta;

type Story = StoryObj<typeof JoinByCode>;

export const Default: Story = {
  args: {
    onJoin: async (code: string) => {
      await new Promise((r) => setTimeout(r, 1000));
      return {
        roomId: "mock-room-id",
        message: `Joined room with code ${code}`,
      };
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("input")).toBeTruthy();
    expect(canvasElement.querySelector("button")).toBeTruthy();
  },
};

export const WithError: Story = {
  args: {
    onJoin: async () => {
      await new Promise((r) => setTimeout(r, 500));
      throw new Error("Room not found or code expired");
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("input")).toBeTruthy();
    expect(canvasElement.querySelector("button")).toBeTruthy();
  },
};
