import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock notificationContext
const mockMarkInteracted = vi.fn();
const mockUseNotifications = vi.fn();

vi.mock("../../src/context/notificationContext", () => ({
  useNotifications: () => mockUseNotifications(),
}));

import NotificationInvitations from "../../src/components/Notifications/NotificationInvitations";

const sampleInvitations = [
  {
    id: "inv1",
    recipientId: "user-1",
    type: "PEER_REVIEW_INVITE",
    category: "COLLABORATION",
    title: "Join Alice's review",
    body: "Review of Unit 5",
    senderName: "Alice",
    linkPath: "/review/room-abc",
    seen: false,
    interacted: false,
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "inv2",
    recipientId: "user-1",
    type: "PRACTICE_SESSION_INVITE",
    category: "COLLABORATION",
    title: "Practice session",
    senderName: "Bob",
    seen: true,
    interacted: false,
    createdAt: "2026-05-01T09:00:00Z",
    metadata: { roomCode: "xyz123" },
  },
  {
    id: "inv3",
    recipientId: "user-1",
    type: "PEER_REVIEW_INVITE",
    category: "COLLABORATION",
    title: "Already joined",
    seen: true,
    interacted: true,  // should be filtered out
    createdAt: "2026-05-01T08:00:00Z",
  },
];

describe("NotificationInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotifications.mockReturnValue({
      notifications: sampleInvitations,
      loading: false,
      markInteracted: mockMarkInteracted,
    });
  });

  it("filters by type and excludes interacted", () => {
    render(
      <NotificationInvitations
        types={["PEER_REVIEW_INVITE"]}
        onJoin={vi.fn()}
      />,
    );
    expect(screen.getByText("Join Alice's review")).toBeInTheDocument();
    expect(screen.queryByText("Practice session")).not.toBeInTheDocument();
    expect(screen.queryByText("Already joined")).not.toBeInTheDocument();
  });

  it("shows empty state when no matching invitations", () => {
    render(
      <NotificationInvitations
        types={["WORKBOOK_SESSION_INVITE"]}
        onJoin={vi.fn()}
        emptyMessage="No workbook invitations"
      />,
    );
    expect(screen.getByText("No workbook invitations")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      loading: true,
      markInteracted: vi.fn(),
    });
    const { container } = render(
      <NotificationInvitations
        types={["PEER_REVIEW_INVITE"]}
        onJoin={vi.fn()}
      />,
    );
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("calls onJoin and markInteracted when Join clicked", () => {
    const onJoin = vi.fn();
    render(
      <NotificationInvitations
        types={["PEER_REVIEW_INVITE"]}
        onJoin={onJoin}
        joinLabel="Join Review"
      />,
    );

    fireEvent.click(screen.getByText("Join Review"));
    expect(mockMarkInteracted).toHaveBeenCalledWith("inv1");
    expect(onJoin).toHaveBeenCalledWith(sampleInvitations[0]);
  });

  it("shows New chip for unseen invitations", () => {
    render(
      <NotificationInvitations
        types={["PEER_REVIEW_INVITE"]}
        onJoin={vi.fn()}
      />,
    );
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("renders sender name when present", () => {
    render(
      <NotificationInvitations
        types={["PEER_REVIEW_INVITE"]}
        onJoin={vi.fn()}
      />,
    );
    expect(screen.getByText(/From: Alice/)).toBeInTheDocument();
  });

  it("supports multiple types filter", () => {
    render(
      <NotificationInvitations
        types={["PEER_REVIEW_INVITE", "PRACTICE_SESSION_INVITE"]}
        onJoin={vi.fn()}
      />,
    );
    expect(screen.getByText("Join Alice's review")).toBeInTheDocument();
    expect(screen.getByText("Practice session")).toBeInTheDocument();
  });

  it("uses custom join label", () => {
    render(
      <NotificationInvitations
        types={["PEER_REVIEW_INVITE"]}
        onJoin={vi.fn()}
        joinLabel="Accept"
      />,
    );
    expect(screen.getByText("Accept")).toBeInTheDocument();
  });
});
