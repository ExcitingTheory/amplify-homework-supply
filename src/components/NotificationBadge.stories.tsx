import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Box, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotificationBadge from "./NotificationBadge";
import NotificationContext from "../context/notificationContext";

// Create a mock provider to inject unseen counts
function MockNotificationProvider({
  children,
  unseenCount = 0,
  unseenByCategory = {},
}: {
  children: React.ReactNode;
  unseenCount?: number;
  unseenByCategory?: Record<string, number>;
}) {
  return (
    <NotificationContext.Provider
      value={{
        notifications: [],
        unseenCount,
        unseenByCategory,
        loading: false,
        markSeen: async () => {},
        markInteracted: async () => {},
        markAllSeen: async () => {},
        deleteNotification: async () => {},
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

const meta: Meta<typeof NotificationBadge> = {
  title: "📬 Notifications/Notification Badge",
  component: NotificationBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Badge wrapper that shows unseen notification count on any icon or element.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Box sx={{ p: 4, display: "flex", gap: 4, alignItems: "center" }}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NotificationBadge>;

export const NoBadge: Story = {
  name: "No Unseen (Hidden)",
  decorators: [
    (Story) => (
      <MockNotificationProvider unseenCount={0}>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  render: () => (
    <NotificationBadge>
      <NotificationsIcon fontSize="large" />
    </NotificationBadge>
  ),
};

export const FewUnseen: Story = {
  name: "3 Unseen",
  decorators: [
    (Story) => (
      <MockNotificationProvider
        unseenCount={3}
        unseenByCategory={{ GAMIFICATION: 2, ASSIGNMENT: 1 }}
      >
        <Story />
      </MockNotificationProvider>
    ),
  ],
  render: () => (
    <NotificationBadge>
      <NotificationsIcon fontSize="large" />
    </NotificationBadge>
  ),
};

export const ManyUnseen: Story = {
  name: "99+ Unseen",
  decorators: [
    (Story) => (
      <MockNotificationProvider unseenCount={150}>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  render: () => (
    <NotificationBadge>
      <NotificationsIcon fontSize="large" />
    </NotificationBadge>
  ),
};

export const CategoryFiltered: Story = {
  name: "Category-Filtered Badges",
  decorators: [
    (Story) => (
      <MockNotificationProvider
        unseenCount={8}
        unseenByCategory={{
          GAMIFICATION: 3,
          ASSIGNMENT: 2,
          COLLABORATION: 3,
        }}
      >
        <Story />
      </MockNotificationProvider>
    ),
  ],
  render: () => (
    <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
      <Box sx={{ textAlign: "center" }}>
        <NotificationBadge category="GAMIFICATION">
          <EmojiEventsIcon fontSize="large" />
        </NotificationBadge>
        <Typography variant="caption" display="block">
          Gamification
        </Typography>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <NotificationBadge category="ASSIGNMENT">
          <AssignmentIcon fontSize="large" />
        </NotificationBadge>
        <Typography variant="caption" display="block">
          Assignments
        </Typography>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <NotificationBadge category="COLLABORATION">
          <GroupsIcon fontSize="large" />
        </NotificationBadge>
        <Typography variant="caption" display="block">
          Collaboration
        </Typography>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <NotificationBadge category="CHAT">
          <NotificationsIcon fontSize="large" />
        </NotificationBadge>
        <Typography variant="caption" display="block">
          Chat (0)
        </Typography>
      </Box>
    </Box>
  ),
};
