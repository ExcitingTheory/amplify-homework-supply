import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SecretLinkIcon } from "./SecretLinkIcon";
import { expect, within } from "storybook/test";

const meta: Meta<typeof SecretLinkIcon> = {
  title: "🏆 Gamification/Runtime/Secret Link Icon",
  component: SecretLinkIcon,
};
export default meta;

type Story = StoryObj<typeof SecretLinkIcon>;

export const Default: Story = {
  args: { unitId: "unit-abc-123" },
  play: async ({ canvasElement }) => {
    // Component renders with no secret links found — no interactive content
    const canvas = within(canvasElement);
    expect(canvas.queryByRole("link")).toBeNull();
  },
};
