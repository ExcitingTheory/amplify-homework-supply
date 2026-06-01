import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, fallback?: string) => fallback || key,
}));

// Mock notificationContext
const mockUseNotifications = vi.fn();
const mockUseUnseenCount = vi.fn();

vi.mock("../../src/context/notificationContext", () => ({
  useNotifications: () => mockUseNotifications(),
  useUnseenCount: (cat?: string) => mockUseUnseenCount(cat),
}));

import NotificationBadge from "../../src/components/NotificationBadge";
import NotificationCard from "../../src/components/NotificationCard";
import NotificationList from "../../src/components/NotificationList";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleNotification = {
  id: "n1",
  recipientId: "user-1",
  type: "BADGE_EARNED",
  category: "GAMIFICATION",
  title: "You earned a badge!",
  body: "Congrats on your progress.",
  linkPath: "/profile/badges",
  linkLabel: "View Badges",
  senderName: "System",
  seen: false,
  interacted: false,
  createdAt: new Date().toISOString(),
};

const sampleSeenNotification = {
  ...sampleNotification,
  id: "n2",
  type: "ASSIGNMENT_DUE_SOON",
  category: "ASSIGNMENT",
  title: "Assignment due soon",
  seen: true,
  interacted: false,
};

const sampleInteractedNotification = {
  ...sampleNotification,
  id: "n3",
  type: "SYSTEM_ANNOUNCEMENT",
  category: "SYSTEM",
  title: "System update",
  seen: true,
  interacted: true,
};

// ---------------------------------------------------------------------------
// NotificationBadge Tests
// ---------------------------------------------------------------------------

describe("NotificationBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children without badge when count is 0", () => {
    mockUseUnseenCount.mockReturnValue(0);
    const { container } = render(
      <NotificationBadge>
        <span data-testid="child">Icon</span>
      </NotificationBadge>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(container.querySelector(".MuiBadge-root")).toBeNull();
  });

  it("renders badge when count > 0", () => {
    mockUseUnseenCount.mockReturnValue(3);
    const { container } = render(
      <NotificationBadge>
        <span>Icon</span>
      </NotificationBadge>,
    );
    expect(container.querySelector(".MuiBadge-badge")).toHaveTextContent("3");
  });

  it("passes category to useUnseenCount", () => {
    mockUseUnseenCount.mockReturnValue(5);
    render(
      <NotificationBadge category="GUILD">
        <span>Icon</span>
      </NotificationBadge>,
    );
    expect(mockUseUnseenCount).toHaveBeenCalledWith("GUILD");
  });
});

// ---------------------------------------------------------------------------
// NotificationCard Tests
// ---------------------------------------------------------------------------

describe("NotificationCard", () => {
  it("renders notification title", () => {
    render(
      <NotificationCard
        notification={sampleNotification}
        onMarkSeen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("You earned a badge!")).toBeInTheDocument();
  });

  it("renders body text", () => {
    render(
      <NotificationCard
        notification={sampleNotification}
        onMarkSeen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Congrats on your progress.")).toBeInTheDocument();
  });

  it("renders category chip", () => {
    render(
      <NotificationCard
        notification={sampleNotification}
        onMarkSeen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("GAMIFICATION")).toBeInTheDocument();
  });

  it("renders sender name", () => {
    render(
      <NotificationCard
        notification={sampleNotification}
        onMarkSeen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("from System")).toBeInTheDocument();
  });

  it("renders link label button when linkPath exists", () => {
    render(
      <NotificationCard
        notification={sampleNotification}
        onMarkSeen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("View Badges")).toBeInTheDocument();
  });

  it("calls onMarkSeen and onNavigate on click for unseen notification", () => {
    const onMarkSeen = vi.fn();
    const onNavigate = vi.fn();
    const onMarkInteracted = vi.fn();
    render(
      <NotificationCard
        notification={sampleNotification}
        onMarkSeen={onMarkSeen}
        onMarkInteracted={onMarkInteracted}
        onNavigate={onNavigate}
        onDelete={vi.fn()}
      />,
    );

    // Click the card
    fireEvent.click(screen.getByText("You earned a badge!"));
    expect(onMarkSeen).toHaveBeenCalledWith("n1");
    expect(onNavigate).toHaveBeenCalledWith("/profile/badges");
    expect(onMarkInteracted).toHaveBeenCalledWith("n1");
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(
      <NotificationCard
        notification={sampleNotification}
        onMarkSeen={vi.fn()}
        onDelete={onDelete}
      />,
    );

    // Find and click the close button
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("n1");
  });
});

// ---------------------------------------------------------------------------
// NotificationList Tests
// ---------------------------------------------------------------------------

describe("NotificationList", () => {
  const defaultContext = {
    notifications: [sampleNotification, sampleSeenNotification, sampleInteractedNotification],
    unseenCount: 1,
    unseenByCategory: { GAMIFICATION: 1 },
    loading: false,
    markSeen: vi.fn(),
    markInteracted: vi.fn(),
    markAllSeen: vi.fn(),
    deleteNotification: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotifications.mockReturnValue(defaultContext);
  });

  it("renders notifications", () => {
    render(<NotificationList onNavigate={vi.fn()} />);
    expect(screen.getByText("You earned a badge!")).toBeInTheDocument();
    expect(screen.getByText("Assignment due soon")).toBeInTheDocument();
    expect(screen.getByText("System update")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    mockUseNotifications.mockReturnValue({ ...defaultContext, loading: true });
    const { container } = render(<NotificationList onNavigate={vi.fn()} />);
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no notifications", () => {
    mockUseNotifications.mockReturnValue({
      ...defaultContext,
      notifications: [],
      unseenCount: 0,
    });
    render(<NotificationList onNavigate={vi.fn()} />);
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("shows unseen count chip", () => {
    render(<NotificationList onNavigate={vi.fn()} />);
    // The header chip shows the unseenCount
    const chips = screen.getAllByText("1");
    expect(chips.length).toBeGreaterThan(0);
  });

  it("shows mark all read button when unseen > 0", () => {
    render(<NotificationList onNavigate={vi.fn()} />);
    expect(screen.getByText("Mark all read")).toBeInTheDocument();
  });

  it("calls markAllSeen when mark all read clicked", () => {
    render(<NotificationList onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByText("Mark all read"));
    expect(defaultContext.markAllSeen).toHaveBeenCalled();
  });

  it("renders category tabs", () => {
    render(<NotificationList onNavigate={vi.fn()} />);
    // Should have All tab plus 6 category tabs
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
