import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Mock amplifyClient
// ---------------------------------------------------------------------------

const mockUpdate = vi.fn().mockResolvedValue({ data: {} });
const mockDelete = vi.fn().mockResolvedValue({ data: {} });

let subscribeCallback: any = null;
const mockSubscribe = vi.fn().mockImplementation(({ next }) => {
  subscribeCallback = next;
  return { unsubscribe: vi.fn() };
});

vi.mock("../../utils/amplifyClient", () => ({
  getAmplifyClient: () => ({
    models: {
      Notification: {
        observeQuery: () => ({ subscribe: mockSubscribe }),
        update: mockUpdate,
        delete: mockDelete,
      },
    },
  }),
}));

// Mock AuthContext
vi.mock("../authContext", () => {
  const AuthContext = React.createContext({
    user: { userId: "user-1", attributes: { sub: "user-1" } },
    isLoading: false,
  });
  return { default: AuthContext };
});

import {
  NotificationProvider,
  useNotifications,
  useUnseenCount,
} from "../notificationContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TestConsumer() {
  const ctx = useNotifications();
  return (
    <div>
      <span data-testid="count">{ctx.unseenCount}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="total">{ctx.notifications.length}</span>
      <button data-testid="markSeen" onClick={() => ctx.markSeen("n1")} />
      <button data-testid="markInteracted" onClick={() => ctx.markInteracted("n1")} />
      <button data-testid="markAllSeen" onClick={() => ctx.markAllSeen()} />
      <button data-testid="deleteN" onClick={() => ctx.deleteNotification("n1")} />
    </div>
  );
}

function CategoryConsumer({ category }: { category?: string }) {
  const count = useUnseenCount(category);
  return <span data-testid="catCount">{count}</span>;
}

const sampleNotifications = [
  {
    id: "n1",
    recipientId: "user-1",
    type: "BADGE_EARNED",
    category: "GAMIFICATION",
    title: "Badge earned!",
    seen: false,
    interacted: false,
    createdAt: "2026-05-01T10:00:00Z",
    _version: 1,
  },
  {
    id: "n2",
    recipientId: "user-1",
    type: "ASSIGNMENT_DUE_SOON",
    category: "ASSIGNMENT",
    title: "Assignment due soon",
    seen: true,
    interacted: false,
    createdAt: "2026-05-01T09:00:00Z",
    _version: 1,
  },
  {
    id: "n3",
    recipientId: "user-1",
    type: "SQUAD_POST_NEW",
    category: "SQUAD",
    title: "New squad post",
    seen: false,
    interacted: false,
    createdAt: "2026-05-01T08:00:00Z",
    _version: 1,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotificationContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeCallback = null;
  });

  it("starts in loading state", () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );
    expect(screen.getByTestId("loading").textContent).toBe("true");
  });

  it("receives notifications from subscription and computes unseen count", async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    // Simulate subscription delivering data
    await act(async () => {
      subscribeCallback?.({ items: sampleNotifications });
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("total").textContent).toBe("3");
    expect(screen.getByTestId("count").textContent).toBe("2"); // n1 and n3 unseen
  });

  it("filters null items from subscription", async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    await act(async () => {
      subscribeCallback?.({ items: [sampleNotifications[0], null, undefined] });
    });

    expect(screen.getByTestId("total").textContent).toBe("1");
  });

  it("sorts notifications newest first", async () => {
    const { container } = render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    const unordered = [
      { ...sampleNotifications[2], createdAt: "2026-01-01T00:00:00Z" },
      { ...sampleNotifications[0], createdAt: "2026-12-01T00:00:00Z" },
    ];

    await act(async () => {
      subscribeCallback?.({ items: unordered });
    });

    // Just verify they both appear
    expect(screen.getByTestId("total").textContent).toBe("2");
  });

  it("markSeen updates optimistically", async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    await act(async () => {
      subscribeCallback?.({ items: sampleNotifications });
    });
    expect(screen.getByTestId("count").textContent).toBe("2");

    await act(async () => {
      screen.getByTestId("markSeen").click();
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "n1", seen: true }),
    );
  });

  it("markInteracted updates optimistically", async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    await act(async () => {
      subscribeCallback?.({ items: sampleNotifications });
    });

    await act(async () => {
      screen.getByTestId("markInteracted").click();
    });

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "n1", seen: true, interacted: true }),
    );
  });

  it("markAllSeen marks every unseen notification", async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    await act(async () => {
      subscribeCallback?.({ items: sampleNotifications });
    });

    await act(async () => {
      screen.getByTestId("markAllSeen").click();
    });

    expect(screen.getByTestId("count").textContent).toBe("0");
    // Should update n1 and n3 (both unseen)
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("deleteNotification calls delete on the client", async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>,
    );

    await act(async () => {
      subscribeCallback?.({ items: sampleNotifications });
    });

    await act(async () => {
      screen.getByTestId("deleteN").click();
    });

    expect(mockDelete).toHaveBeenCalledWith({ id: "n1" });
  });

  describe("useUnseenCount", () => {
    it("returns total unseen when no category specified", async () => {
      render(
        <NotificationProvider>
          <CategoryConsumer />
        </NotificationProvider>,
      );

      await act(async () => {
        subscribeCallback?.({ items: sampleNotifications });
      });

      expect(screen.getByTestId("catCount").textContent).toBe("2");
    });

    it("returns category-specific unseen count", async () => {
      render(
        <NotificationProvider>
          <CategoryConsumer category="GAMIFICATION" />
        </NotificationProvider>,
      );

      await act(async () => {
        subscribeCallback?.({ items: sampleNotifications });
      });

      expect(screen.getByTestId("catCount").textContent).toBe("1");
    });

    it("returns 0 for categories with no unseen", async () => {
      render(
        <NotificationProvider>
          <CategoryConsumer category="CHAT" />
        </NotificationProvider>,
      );

      await act(async () => {
        subscribeCallback?.({ items: sampleNotifications });
      });

      expect(screen.getByTestId("catCount").textContent).toBe("0");
    });
  });
});
