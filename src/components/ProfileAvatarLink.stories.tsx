import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Avatar from "@mui/material/Avatar";
import { expect, within } from "storybook/test";
import { ProfileAvatarLink } from "./ProfileAvatarLink";
import { AvatarDisplay } from "./Gamification/AvatarDisplay";
import { AppFooter } from "./AppFooter";

const meta = {
  title: "Components/ProfileAvatarLink",
  component: ProfileAvatarLink,
  args: { username: "student-alice", displayName: "Alice" },
} satisfies Meta<typeof ProfileAvatarLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {
  render: (args) => <Avatar component={ProfileAvatarLink} {...args}>A</Avatar>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link"))
      .toHaveAttribute("href", "/profile/student-alice");
  },
};

export const CustomizedAvatar: Story = {
  render: (args) => (
    <AvatarDisplay profileUsername={args.username} label={args.displayName || undefined} seed="custom-avatar-seed" size={64} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link")).toHaveAttribute("href", "/profile/student-alice");
  },
};

export const Localized: Story = {
  ...Initials,
  globals: { translationLanguage: "fr" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link"))
      .toHaveAttribute("href", "/fr/profile/student-alice");
  },
};

export const Anonymous: Story = {
  args: { username: null, displayName: null },
  render: (args) => <Avatar component={ProfileAvatarLink} {...args}>?</Avatar>,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("link")).not.toBeInTheDocument();
  },
};

export const Footer: Story = {
  render: () => <AppFooter />,
  play: async ({ canvasElement }) => {
    const footer = within(canvasElement).getByRole("contentinfo");
    await expect(within(footer).getByRole("link")).toHaveAttribute("href", "/privacy");
  },
};
