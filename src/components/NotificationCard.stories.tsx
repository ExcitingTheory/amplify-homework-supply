import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Box } from "@mui/material";
import NotificationCard from "./NotificationCard";
import { action } from "storybook/actions";

const meta: Meta<typeof NotificationCard> = {
  title: "📬 Notifications/Notification Card",
  component: NotificationCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Displays a single notification with visual states: unseen (bold, left border), seen, and interacted (faded).",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 500 }}>
        <Story />
      </Box>
    ),
  ],
  argTypes: {
    onMarkSeen: { action: "markSeen" },
    onMarkInteracted: { action: "markInteracted" },
    onDelete: { action: "delete" },
    onNavigate: { action: "navigate" },
  },
};
export default meta;

type Story = StoryObj<typeof NotificationCard>;

const baseNotification = {
  id: "n1",
  recipientId: "user-1",
  category: "GAMIFICATION",
  title: "You earned the 'Consistent Learner' badge!",
  body: "Congratulations! You've maintained a 7-day learning streak.",
  linkPath: "/profile/badges",
  linkLabel: "View Badges",
  senderName: "System",
  createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
};

export const Unseen: Story = {
  args: {
    notification: {
      ...baseNotification,
      seen: false,
      interacted: false,
    },
    onMarkSeen: action("markSeen"),
    onMarkInteracted: action("markInteracted"),
    onDelete: action("delete"),
    onNavigate: action("navigate"),
  },
};

export const Seen: Story = {
  args: {
    notification: {
      ...baseNotification,
      id: "n2",
      seen: true,
      interacted: false,
    },
    onMarkSeen: action("markSeen"),
    onDelete: action("delete"),
    onNavigate: action("navigate"),
  },
};

export const Interacted: Story = {
  args: {
    notification: {
      ...baseNotification,
      id: "n3",
      seen: true,
      interacted: true,
    },
    onDelete: action("delete"),
  },
};

export const AssignmentDue: Story = {
  name: "Assignment Category",
  args: {
    notification: {
      ...baseNotification,
      id: "n4",
      category: "ASSIGNMENT",
      title: "Assignment due in 2 hours",
      body: "Unit 5: Cell Biology - submit before the deadline.",
      linkPath: "/assignments",
      linkLabel: "View Assignment",
      seen: false,
      interacted: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    },
    onMarkSeen: action("markSeen"),
    onDelete: action("delete"),
    onNavigate: action("navigate"),
  },
};

export const CollaborationInvite: Story = {
  name: "Collaboration Category",
  args: {
    notification: {
      ...baseNotification,
      id: "n5",
      category: "COLLABORATION",
      title: "Peer Review Invitation",
      body: "Alice invited you to review Unit 3: Photosynthesis",
      linkPath: "/review/room-abc123",
      linkLabel: "Join Review",
      senderName: "Alice",
      seen: false,
      interacted: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    },
    onMarkSeen: action("markSeen"),
    onMarkInteracted: action("markInteracted"),
    onDelete: action("delete"),
    onNavigate: action("navigate"),
  },
};

export const SquadPost: Story = {
  name: "Squad Category",
  args: {
    notification: {
      ...baseNotification,
      id: "n6",
      category: "SQUAD",
      title: "New post in Science Explorers",
      body: "Bob posted in your squad.",
      linkPath: "/squads/squad-1",
      linkLabel: "View Post",
      senderName: "Bob",
      seen: true,
      interacted: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    onDelete: action("delete"),
    onNavigate: action("navigate"),
  },
};

export const SystemAnnouncement: Story = {
  name: "System Category",
  args: {
    notification: {
      ...baseNotification,
      id: "n7",
      category: "SYSTEM",
      title: "New features available!",
      body: "Check out the new practice drill modes and squad challenges.",
      linkPath: undefined,
      linkLabel: undefined,
      senderName: "System",
      seen: false,
      interacted: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    },
    onMarkSeen: action("markSeen"),
    onDelete: action("delete"),
  },
};

export const NoBody: Story = {
  name: "Title Only (no body)",
  args: {
    notification: {
      ...baseNotification,
      id: "n8",
      body: undefined,
      seen: false,
      interacted: false,
    },
    onMarkSeen: action("markSeen"),
    onDelete: action("delete"),
  },
};

export const AllCategories: Story = {
  name: "All Categories (stacked)",
  render: () => (
    <Box>
      {[
        { category: "ASSIGNMENT", title: "Assignment due tomorrow" },
        { category: "COLLABORATION", title: "Peer review invitation" },
        { category: "GAMIFICATION", title: "New badge earned!" },
        { category: "SQUAD", title: "New squad post" },
        { category: "CHAT", title: "You were mentioned" },
        { category: "SYSTEM", title: "Scheduled maintenance" },
      ].map((n, i) => (
        <NotificationCard
          key={i}
          notification={{
            ...baseNotification,
            id: `cat-${i}`,
            ...n,
            seen: i % 2 === 0,
            interacted: i === 5,
          }}
          onMarkSeen={action("markSeen")}
          onDelete={action("delete")}
          onNavigate={action("navigate")}
        />
      ))}
    </Box>
  ),
};
