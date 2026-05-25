import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { Box } from "@mui/material";
import NotificationInvitations from "./Notifications/NotificationInvitations";
import NotificationContext from "../context/notificationContext";
import { action } from "storybook/actions";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const now = Date.now();

const sampleInvitations = [
  {
    id: "inv1",
    recipientId: "user-1",
    type: "PEER_REVIEW_INVITE",
    category: "COLLABORATION",
    title: "Review Unit 3: Photosynthesis",
    body: "Alice invited you to review their work.",
    senderName: "Alice",
    linkPath: "/review/room-abc123",
    seen: false,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "inv2",
    recipientId: "user-1",
    type: "PEER_REVIEW_INVITE",
    category: "COLLABORATION",
    title: "Review Unit 7: Cell Division",
    body: "Bob shared a review session.",
    senderName: "Bob",
    linkPath: "/review/room-def456",
    seen: true,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "inv3",
    recipientId: "user-1",
    type: "PRACTICE_SESSION_INVITE",
    category: "COLLABORATION",
    title: "Practice Session: Vocabulary Quiz",
    body: "Carol wants to practice together. Code: xyz789",
    senderName: "Carol",
    seen: false,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 15).toISOString(),
    metadata: { roomCode: "xyz789" },
  },
  {
    id: "inv4",
    recipientId: "user-1",
    type: "WORKBOOK_SESSION_INVITE",
    category: "COLLABORATION",
    title: "Workbook: Science Lab Report",
    body: "Dave invited you to collaborate.",
    senderName: "Dave",
    linkPath: "/workbook/unit-5",
    seen: false,
    interacted: false,
    createdAt: new Date(now - 1000 * 60 * 60).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Mock Provider
// ---------------------------------------------------------------------------

function MockNotificationProvider({
  children,
  notifications = sampleInvitations,
  loading = false,
}: {
  children: React.ReactNode;
  notifications?: any[];
  loading?: boolean;
}) {
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unseenCount: notifications.filter((n) => !n.seen).length,
        unseenByCategory: {},
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

const meta: Meta<typeof NotificationInvitations> = {
  title: "📬 Notifications/Notification Invitations",
  component: NotificationInvitations,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Invitation list filtered by notification type. Used inside join dialogs.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 500, border: 1, borderColor: "divider", borderRadius: 1 }}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof NotificationInvitations>;

export const PeerReviewInvites: Story = {
  name: "Peer Review Invitations",
  decorators: [
    (Story) => (
      <MockNotificationProvider>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    types: ["PEER_REVIEW_INVITE"],
    onJoin: action("onJoin"),
    joinLabel: "Join Review",
    emptyMessage: "No pending review invitations",
  },
};

export const PracticeSessionInvites: Story = {
  name: "Practice Session Invitations",
  decorators: [
    (Story) => (
      <MockNotificationProvider>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    types: ["PRACTICE_SESSION_INVITE"],
    onJoin: action("onJoin"),
    joinLabel: "Join Session",
    emptyMessage: "No pending session invitations",
  },
};

export const WorkbookInvites: Story = {
  name: "Workbook Invitations",
  decorators: [
    (Story) => (
      <MockNotificationProvider>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    types: ["WORKBOOK_SESSION_INVITE"],
    onJoin: action("onJoin"),
    joinLabel: "Join Workbook",
    emptyMessage: "No pending workbook invitations",
  },
};

export const AllCollaborationInvites: Story = {
  name: "All Collaboration Types",
  decorators: [
    (Story) => (
      <MockNotificationProvider>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    types: ["PEER_REVIEW_INVITE", "PRACTICE_SESSION_INVITE", "WORKBOOK_SESSION_INVITE"],
    onJoin: action("onJoin"),
    joinLabel: "Join",
  },
};

export const EmptyState: Story = {
  name: "No Invitations",
  decorators: [
    (Story) => (
      <MockNotificationProvider notifications={[]}>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    types: ["PEER_REVIEW_INVITE"],
    onJoin: action("onJoin"),
    emptyMessage: "No pending review invitations",
  },
};

export const LoadingState: Story = {
  name: "Loading",
  decorators: [
    (Story) => (
      <MockNotificationProvider loading={true} notifications={[]}>
        <Story />
      </MockNotificationProvider>
    ),
  ],
  args: {
    types: ["PEER_REVIEW_INVITE"],
    onJoin: action("onJoin"),
  },
};
