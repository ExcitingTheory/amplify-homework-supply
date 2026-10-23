import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import AppShell from "../components/AppShell";
import { FilesProvider } from "../context/fileContext";
import { setMockUser } from "../../.storybook/__mocks__/aws-amplify-auth";

const meta = {
  title: "🛠️ Admin/Menu",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "desktop" },
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
  loaders: [
    ({ parameters }) => {
      const { user, session } = parameters.mockAuth;
      setMockUser({
        username: session.username,
        userId: user.attributes.sub,
        attributes: user.attributes,
        groups: session.groups,
      });
      window.localStorage.removeItem("appShell.navHidden");
      window.localStorage.removeItem("appShell.navCollapsed");
      return {};
    },
  ],
  decorators: [
    (Story) => (
      <FilesProvider>
        <Story />
      </FilesProvider>
    ),
  ],
  args: {
    toolbarChildren: null,
    children: <p>Use the sidebar to open an administration tool.</p>,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    if (!window.matchMedia("(min-width:900px)").matches) {
      const buttons = await canvas.findAllByRole("button", {
        name: "Menu",
        exact: true,
      });
      await userEvent.click(buttons[0]);
    }
    await expect(
      await canvas.findByRole("link", { name: "Admin Dashboard", exact: true }),
    ).toHaveAttribute("href", "/admin");
    for (const path of [
      "/admin/moderation",
      "/admin/analytics",
      "/admin/words",
      "/admin/files",
      "/admin/questions",
      "/admin/archives",
      "/admin/settings",
    ]) {
      await expect(
        canvasElement.ownerDocument.querySelector(`a[href="${path}"]`),
      ).toBeVisible();
    }
  },
};

export const LearnerNavigation: Story = {
  parameters: {
    mockAuth: {
      user: {
        attributes: { sub: "learner-1", email: "learner@example.com" },
      },
      session: {
        username: "learner-1",
        identityId: "identity-learner-1",
        groups: ["Learners"],
      },
    },
    nextjs: { navigation: { pathname: "/" } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    if (!window.matchMedia("(min-width:900px)").matches) {
      const buttons = await canvas.findAllByRole("button", {
        name: "Menu",
        exact: true,
      });
      await userEvent.click(buttons[0]);
    }
    await canvas.findByText("Use the sidebar to open an administration tool.");
    await expect(
      canvasElement.ownerDocument.querySelector('a[href="/admin"]'),
    ).toBeNull();
    await expect(
      canvasElement.ownerDocument.querySelector('a[href^="/admin/"]'),
    ).toBeNull();
  },
};
