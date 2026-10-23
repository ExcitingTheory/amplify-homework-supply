import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import AdminIndexClient from "../../app/[locale]/admin/AdminIndexClient";

const meta = {
  title: "🛠️ Admin/Dashboard",
  component: AdminIndexClient,
  parameters: {
    layout: "fullscreen",
    mockAuth: {
      user: {
        attributes: { sub: "admin-1", email: "admin@example.com" },
      },
      session: {
        username: "admin-1",
        identityId: "identity-admin-1",
        groups: ["Admins"],
      },
    },
    nextjs: { navigation: { pathname: "/admin" } },
  },
  args: { flaggedCount: 8, recycleBinCount: 3 },
} satisfies Meta<typeof AdminIndexClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NeedsAttention: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Admin", exact: true });
    await expect(canvas.getByText("Needs attention")).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "8 flagged — Moderation" }),
    ).toHaveAttribute("href", "/admin/moderation");
    await expect(
      canvas.getAllByRole("link", { name: "Open", exact: true }),
    ).toHaveLength(8);
  },
};

export const NoPendingItems: Story = {
  args: { flaggedCount: 0, recycleBinCount: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Admin", exact: true });
    await expect(canvas.queryByText("Needs attention")).not.toBeInTheDocument();
    await expect(
      canvas.getAllByRole("link", { name: "Open", exact: true }),
    ).toHaveLength(8);
  },
};

export const AccessDenied: Story = {
  parameters: {
    mockAuth: {
      session: {
        username: "learner-1",
        identityId: "identity-learner-1",
        groups: ["Learners"],
      },
      user: {
        attributes: { sub: "learner-1", email: "learner@example.com" },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Access denied" }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole("link", { name: "Open", exact: true }),
    ).not.toBeInTheDocument();
  },
};
