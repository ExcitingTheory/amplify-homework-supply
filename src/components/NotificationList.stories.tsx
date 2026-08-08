import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Box } from "@mui/material";
import NotificationList from "./NotificationList";
import NotificationContext from "../context/notificationContext";
import { action } from "storybook/actions";
import { expect, userEvent, within, fn } from "storybook/test";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const now = Date.now();

const sampleNotifications = [
  {
    id: "n1",
    recipientId: "user-1",
    type: "BADGE_EARNED",
    category: "GAMIFICATION",
    title: "You earned a badge!",
    body: "Consistent Learner badge for 7-day streak.",
    linkPath: "/profile/badges",
    linkLabel: "View Badges",
    senderName: "System",
    seen: false,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "n2",
    recipientId: "user-1",
    type: "ASSIGNMENT_DUE_SOON",
    category: "ASSIGNMENT",
    title: "Assignment due in 2 hours",
    body: "Unit 5: Cell Biology",
    linkPath: "/assignments",
    linkLabel: "View",
    senderName: "Mr. Smith",
    seen: false,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "n3",
    recipientId: "user-1",
    type: "PEER_REVIEW_INVITE",
    category: "COLLABORATION",
    title: "Peer review invitation",
    body: "Alice wants you to review Unit 3.",
    linkPath: "/review/room-abc",
    linkLabel: "Join Review",
    senderName: "Alice",
    seen: false,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "n4",
    recipientId: "user-1",
    type: "SQUAD_POST_NEW",
    category: "SQUAD",
    title: "New post in Science Explorers",
    body: "Bob shared study notes.",
    linkPath: "/squads/squad-1",
    linkLabel: "View Post",
    senderName: "Bob",
    seen: true,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "n5",
    recipientId: "user-1",
    type: "LEVEL_UP",
    category: "GAMIFICATION",
    title: "Level Up! You're now Level 5",
    body: "Keep learning to reach Level 6.",
    seen: true,
    interacted: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "n6",
    recipientId: "user-1",
    type: "SYSTEM_ANNOUNCEMENT",
    category: "SYSTEM",
    title: "New features available",
    body: "Practice drills and squad challenges are now live.",
    seen: true,
    interacted: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Mock Provider
// ---------------------------------------------------------------------------

function MockNotificationProvider({
  children,
  notifications = sampleNotifications,
  loading = false,
}: {
  children: React.ReactNode;
  notifications?: any[];
  loading?: boolean;
}) {
  const unseen = notifications.filter((n) => !n.seen);
  const unseenByCategory: Record<string, number> = {};
  unseen.forEach((n) => {
    unseenByCategory[n.category] = (unseenByCategory[n.category] || 0) + 1;
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unseenCount: unseen.length,
        unseenByCategory,
        loading,
        markSeen: action("markSeen"),
        markInteracted: action("markInteracted"),
        markAllSeen: action("markAllSeen"),
        deleteNotification: action("deleteNotification"),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Story Setup
// ---------------------------------------------------------------------------

const meta: Meta<typeof NotificationList> = {
  title: "📬 Notifications/Notification List",
  component: NotificationList,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Full notification inbox with category filter tabs, mark all read, and empty state.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 600, border: 1, borderColor: "divider", borderRadius: 1 }}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NotificationList>;

export const WithNotifications: Story = {
  name: "With Notifications",
  decorators: [
    (Story) => (
      <MockNotificationProvider>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    onNavigate: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify notification content rendered
    await canvas.findByText("You earned a badge!");
    await canvas.findByText("Assignment due in 2 hours");

    // Click "Assignments" category tab
    const assignmentTab = canvas.getByRole('tab', { name: /Assignments/i });
    await userEvent.click(assignmentTab);
    // Only assignment notification visible
    await canvas.findByText("Assignment due in 2 hours");
    expect(canvas.queryByText("You earned a badge!")).toBeNull();

    // Click back to All tab
    const allTab = canvas.getByRole('tab', { name: /^All/i });
    await userEvent.click(allTab);
    await canvas.findByText("You earned a badge!");
  },
};

export const Empty: Story = {
  name: "Empty State",
  decorators: [
    (Story) => (
      <MockNotificationProvider notifications={[]}>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    onNavigate: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Empty state message shown
    await canvas.findByText(/No notifications yet/i);
  },
};

export const Loading: Story = {
  name: "Loading",
  decorators: [
    (Story) => (
      <MockNotificationProvider loading={true} notifications={[]}>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    onNavigate: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Skeleton placeholders shown during load
    const skeletons = canvasElement.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThan(0);
  },
};

export const AllSeen: Story = {
  name: "All Read",
  decorators: [
    (Story) => (
      <MockNotificationProvider
        notifications={sampleNotifications.map((n) => ({
          ...n,
          seen: true,
        }))}
      >
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    onNavigate: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // "Mark all read" button NOT visible when all are already seen (unseenCount === 0)
    expect(canvas.queryByRole("button", { name: /mark all/i })).toBeNull();
    // Notification content still renders
    await canvas.findByText("You earned a badge!");
  },
};

export const SingleCategory: Story = {
  name: "Only Gamification",
  decorators: [
    (Story) => (
      <MockNotificationProvider
        notifications={sampleNotifications.filter(
          (n) => n.category === "GAMIFICATION",
        )}
      >
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    onNavigate: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Items for this category render
    await canvas.findByText("You earned a badge!");
    // Click the Gamification tab to filter
    const gamTab = canvas.getByRole('tab', { name: /Gamification/i })
    await userEvent.click(gamTab);
    // Still shows the badge notification
    await canvas.findByText("You earned a badge!");
  },
};
