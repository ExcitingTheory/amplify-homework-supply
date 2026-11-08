import React from "react";
import { expect, within, waitFor, userEvent } from "storybook/test";
import { Box, Typography } from "@mui/material";
import AppShell from "./AppShell";
import MainToolbar, { SettingsMenu, HelpMenu, UserMenu } from "./MainToolbar";
import NotificationContext from "../context/notificationContext";

export default {
  title: "✏️ Lesson Editor/Toolbar",
  component: MainToolbar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
Application navigation toolbar with user menu, settings, and help.

## Features
- **Responsive Design**: Adapts to mobile, tablet, and desktop viewports
- **User Menu**: Profile, password change, sign out
- **Settings Menu**: App configuration and preferences
- **Help Menu**: Documentation and support links
- **Material UI Integration**: Built with MUI AppBar and IconButtons
- **Control Spacing**: Consistent 8px gaps between app bar buttons and chips

## Usage
Wrap page content with the MainToolbar component to add navigation.
        `.trim(),
      },
    },
  },
  tags: ["!autodocs"],
};

export const FullToolbar = {
  render: () => (
    <MainToolbar>
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          Page Content
        </Typography>
        <Typography variant="body1" paragraph>
          This is the content below the toolbar. The MainToolbar component wraps
          the page content and provides consistent navigation across the
          application.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The toolbar includes menus for user actions, settings, and help
          resources.
        </Typography>
      </Box>
    </MainToolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for toolbar to render (DeferredStory decorator delays initial render)
    const menuButton = await canvas.findByRole(
      "button",
      { name: /menu/i },
      { timeout: 10000 },
    );
    expect(menuButton).toBeInTheDocument();

    // Verify page content is visible
    await waitFor(
      () => {
        expect(canvas.getByText("Page Content")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Complete toolbar with page content, demonstrating typical usage in the application.",
      },
    },
  },
};

export const PrivacyPolicyNavigation = {
  render: () => (
    <AppShell>
      <Box sx={{ p: 4 }}>
        <Typography variant="h3">Page Content</Typography>
      </Box>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    await expect(body.queryByRole("link", { name: /privacy policy/i })).toBeNull();
    await userEvent.click(
      await within(canvasElement).findByRole("button", { name: /profile/i }),
    );
    const privacyItem = await body.findByRole("menuitem", { name: /privacy policy/i });
    await expect(privacyItem).toHaveAttribute("href", "/privacy");
    // Privacy sits last, separated from the account actions by a divider.
    const menuChildren = [...privacyItem.parentElement.children];
    await expect(menuChildren.at(-1)).toBe(privacyItem);
    await expect(menuChildren.at(-2)).toHaveClass("MuiDivider-root");
  },
};

export const ControlSpacing = {
  render: () => (
    <AppShell>
      <Typography>Page Content</Typography>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const menuButton = await within(canvasElement).findByRole("button", {
      name: /^menu$/i,
    });
    const toolbar = menuButton.closest(".MuiToolbar-root");
    const layoutChildren = (element) => (
      [...element.children].flatMap((child) =>
        getComputedStyle(child).display === "contents" ? layoutChildren(child) : [child],
      )
    );
    await waitFor(() => {
      const items = layoutChildren(toolbar)
        .map((element) => element.getBoundingClientRect())
        .filter((bounds) => bounds.width > 0 && bounds.height > 0);
      expect(items.length).toBeGreaterThan(4);
      for (let index = 1; index < items.length; index += 1) {
        expect(items[index].left - items[index - 1].right).toBeGreaterThanOrEqual(7.5);
      }
      expect(items.at(-1).right).toBeLessThanOrEqual(toolbar.getBoundingClientRect().right);
    });
  },
};

export const ShellViewportHeight = {
  render: () => (
    <AppShell>
      <Typography>Page content without a footer</Typography>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const content = await within(canvasElement).findByText("Page content without a footer");
    const view = canvasElement.ownerDocument.defaultView;
    await waitFor(() => {
      const menu = canvasElement.querySelector("header");
      expect(content.getBoundingClientRect().top)
        .toBeGreaterThanOrEqual(menu.getBoundingClientRect().bottom - 1);
      expect(canvasElement.ownerDocument.documentElement.scrollHeight)
        .toBeLessThanOrEqual(view.innerHeight + 1);
    });
  },
};

export const ControlSpacingDark = {
  ...ControlSpacing,
  globals: { colorScheme: "dark" },
};

export const NotificationBadgeClipping = {
  render: ControlSpacing.render,
  decorators: [
    (Story) => {
      const notifications = React.useContext(NotificationContext);
      return (
        <NotificationContext.Provider value={{ ...notifications, unseenCount: 150 }}>
          <Story />
        </NotificationContext.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("button", { name: /^menu$/i });
    const bell = canvasElement.querySelector('[data-tour="notification-bell"]');
    const badge = await within(bell).findByText("99+");
    const bounds = badge.getBoundingClientRect();
    expect(bounds.width).toBeGreaterThan(20);
    for (let ancestor = badge.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      const clip = ancestor.getBoundingClientRect();
      if (style.overflowX !== "visible") {
        expect(bounds.left).toBeGreaterThanOrEqual(clip.left);
        expect(bounds.right).toBeLessThanOrEqual(clip.right);
      }
      if (style.overflowY !== "visible") {
        expect(bounds.top).toBeGreaterThanOrEqual(clip.top);
        expect(bounds.bottom).toBeLessThanOrEqual(clip.bottom);
      }
    }
  },
};

export const NotificationBadgeClippingDark = {
  ...NotificationBadgeClipping,
  globals: { colorScheme: "dark" },
};

export const SettingsMenuOnly = {
  render: () => (
    <Box
      sx={{
        p: 4,
        bgcolor: "#1976d2",
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SettingsMenu />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for settings button and click it
    const settingsButton = await canvas.findByRole("button", {
      name: /settings/i,
    });
    expect(settingsButton).toBeInTheDocument();

    await userEvent.click(settingsButton);

    // Verify menu opens (using screen since menu renders in portal)
    await waitFor(
      () => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Settings menu component displayed in isolation.",
      },
    },
  },
};

export const HelpMenuOnly = {
  render: () => (
    <Box
      sx={{
        p: 4,
        bgcolor: "#1976d2",
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HelpMenu />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for help button and click it
    const helpButton = await canvas.findByRole("button", { name: /help/i });
    expect(helpButton).toBeInTheDocument();

    await userEvent.click(helpButton);

    // Verify menu opens
    await waitFor(
      () => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Help menu component displayed in isolation.",
      },
    },
  },
};

export const UserMenuOnly = {
  render: () => (
    <Box
      sx={{
        p: 4,
        bgcolor: "#1976d2",
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <UserMenu />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for user menu button and click it (DeferredStory decorator delays initial render)
    const userButton = await canvas.findByRole(
      "button",
      { name: /profile/i },
      { timeout: 10000 },
    );
    expect(userButton).toBeInTheDocument();

    await userEvent.click(userButton);

    // Verify the avatar menu exposes XP history.
    await waitFor(
      () => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
        expect(within(menu).getByRole("menuitem", { name: /xp history/i }))
          .toHaveAttribute("href", "/xp-history");
      },
      { timeout: 3000 },
    );
  },
  parameters: {
    docs: {
      description: {
        story: "User menu component displayed in isolation.",
      },
    },
  },
};

export const JoinSectionDemo = {
  render: () => (
    <MainToolbar>
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          Join a Section
        </Typography>
        <Typography variant="body1" paragraph>
          Click the person-add icon in the toolbar to open the Join Section
          dialog. Use the demo code <strong>DEMO-2026</strong> to simulate
          joining a class.
        </Typography>
      </Box>
    </MainToolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open the user menu (DeferredStory decorator delays initial render)
    const userButton = await canvas.findByRole(
      "button",
      { name: /profile/i },
      { timeout: 10000 },
    );
    await userEvent.click(userButton);

    // Wait for the menu to open (menu renders in a portal, so use screen)
    await waitFor(
      () => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Click the "Add to Section" menu item to open the dialog
    const joinButton = document.querySelector(
      '[data-tour="join-section-button"]',
    );
    expect(joinButton).toBeInTheDocument();
    await userEvent.click(joinButton);

    // Wait for the dialog to appear
    await waitFor(
      () => {
        const dialog = document.querySelector(
          '[data-tour="join-section-dialog"]',
        );
        expect(dialog).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Type the demo join code
    const codeInput =
      document.querySelector('[data-tour="join-code-input"] input') ||
      document.querySelector("#code");
    expect(codeInput).toBeInTheDocument();
    await userEvent.type(codeInput, "DEMO-2026");
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the Join Section dialog flow. Opens the dialog and fills in a demo code (`DEMO-2026`) that will succeed in Storybook.",
      },
    },
  },
};
