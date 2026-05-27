import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock sendBeacon globally
const mockSendBeacon = vi.fn(() => true);
Object.defineProperty(globalThis.navigator, "sendBeacon", {
  value: mockSendBeacon,
  writable: true,
});

import {
  trackEvent,
  trackPageView,
  trackEngagedTime,
  trackWorkbookCompleted,
  trackSectionWorkbookStarted,
  trackSectionWorkbookCompleted,
  trackSectionEngagedTime,
  trackGuildViewed,
  identifyAnalyticsUser,
  initAnalytics,
  flush,
  trackChatMessageSent,
  trackChatResponseReceived,
  trackChatToolUsed,
  trackChatFileUploaded,
  trackChatSessionStarted,
  trackChatBlockInserted,
  trackChatRegenerated,
  trackSquadViewed,
  trackSquadJoined,
  trackSquadLeft,
  trackSquadPostCreated,
  trackSquadPostDeleted,
  trackSquadEdited,
  trackSquadLeaderboardViewed,
  trackSquadLeaderboardModeChanged,
  AnalyticsEvents,
} from "./analytics";

describe("analytics utilities (Kinesis-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Flush any leftover buffer between tests
    flush();
    mockSendBeacon.mockClear();
  });

  describe("trackEvent", () => {
    it("buffers events and flushes via sendBeacon", () => {
      trackEvent(AnalyticsEvents.PAGE_VIEW, { path: "/test" });
      flush();
      expect(mockSendBeacon).toHaveBeenCalledTimes(1);
      const [url, payload] = mockSendBeacon.mock.calls[0];
      expect(url).toBe("/api/analytics");
      const events = JSON.parse(payload as string);
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe("pageView");
      expect(events[0].attributes).toEqual({ path: "/test" });
    });

    it("includes timestamp and sessionId in events", () => {
      trackEvent(AnalyticsEvents.AUDIO_PLAYED, { unitId: "u1" });
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].timestamp).toBeDefined();
      expect(events[0].sessionId).toBeDefined();
    });

    it("includes metrics when provided", () => {
      trackEvent(
        AnalyticsEvents.ENGAGED_TIME_UPDATE,
        { unitId: "u1" },
        { engagedTimeMs: 5000 },
      );
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].metrics).toEqual({ engagedTimeMs: 5000 });
    });

    it("does not crash on errors", () => {
      mockSendBeacon.mockImplementationOnce(() => {
        throw new Error("Network error");
      });
      trackEvent(AnalyticsEvents.PAGE_VIEW);
      expect(() => flush()).not.toThrow();
    });

    it("does not flush if buffer is empty", () => {
      flush();
      expect(mockSendBeacon).not.toHaveBeenCalled();
    });
  });

  describe("initAnalytics", () => {
    it("sets userId and userRole on subsequent events", () => {
      initAnalytics({ userId: "user-1", userRole: "Learner" });
      trackEvent(AnalyticsEvents.PAGE_VIEW);
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].userId).toBe("user-1");
      expect(events[0].userRole).toBe("Learner");
    });
  });

  describe("identifyAnalyticsUser", () => {
    it("updates the userId for subsequent events", () => {
      identifyAnalyticsUser({
        userId: "user-123",
        userRole: "Instructor",
        sectionIds: ["s1"],
      });
      trackEvent(AnalyticsEvents.PAGE_VIEW);
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].userId).toBe("user-123");
      expect(events[0].userRole).toBe("Instructor");
    });
  });

  describe("trackPageView", () => {
    it("records a pageView event with path", () => {
      trackPageView("/workbook/abc");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("pageView");
      expect(events[0].attributes.path).toBe("/workbook/abc");
    });
  });

  describe("trackEngagedTime", () => {
    it("records engaged time with unit and grade ids", () => {
      trackEngagedTime("unit-1", "grade-1", 45000);
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("engagedTimeUpdate");
      expect(events[0].attributes).toEqual({
        unitId: "unit-1",
        gradeId: "grade-1",
      });
      expect(events[0].metrics).toEqual({ engagedTimeMs: 45000 });
    });
  });

  describe("trackWorkbookCompleted", () => {
    it("records completion with accuracy and time", () => {
      trackWorkbookCompleted("unit-1", "grade-1", 92.5, 120000);
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("workbookCompleted");
      expect(events[0].metrics).toEqual({
        accuracy: 92.5,
        engagedTimeMs: 120000,
      });
    });
  });

  describe("section-aware tracking", () => {
    it("trackSectionWorkbookStarted tags with correct sectionId", () => {
      trackSectionWorkbookStarted("unit-1", "section-a", "assignment-1");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("sectionWorkbookStarted");
      expect(events[0].attributes).toEqual({
        unitId: "unit-1",
        sectionId: "section-a",
        assignmentId: "assignment-1",
      });
    });

    it("trackSectionWorkbookCompleted includes section context", () => {
      trackSectionWorkbookCompleted(
        "unit-2",
        "grade-2",
        "section-b",
        88,
        300000,
      );
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes.sectionId).toBe("section-b");
    });

    it("trackSectionEngagedTime includes section context", () => {
      trackSectionEngagedTime("unit-1", "grade-1", "section-a", 60000);
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes.sectionId).toBe("section-a");
    });

    it("trackGuildViewed tags with section context", () => {
      trackGuildViewed("section-b", "leaderboard");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("guildViewed");
      expect(events[0].attributes).toEqual({
        sectionId: "section-b",
        guildType: "leaderboard",
      });
    });
  });

  describe("chat engagement tracking", () => {
    it("trackChatMessageSent records with chatId and sectionId", () => {
      trackChatMessageSent("chat-1", "section-a", 42);
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("chatMessageSent");
      expect(events[0].attributes.chatId).toBe("chat-1");
      expect(events[0].attributes.sectionId).toBe("section-a");
      expect(events[0].metrics).toEqual({ messageLength: 42 });
    });

    it("trackChatResponseReceived records tools used", () => {
      trackChatResponseReceived("chat-1", ["search_content", "practice_drill"]);
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes.toolsUsed).toBe(
        "search_content,practice_drill",
      );
    });

    it("trackChatToolUsed records tool name with section", () => {
      trackChatToolUsed("chat-1", "search_content", "section-a");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes.toolName).toBe("search_content");
    });

    it("trackChatFileUploaded records file type", () => {
      trackChatFileUploaded("chat-1", "application/pdf");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes.fileType).toBe("application/pdf");
    });

    it("trackChatSessionStarted records with section", () => {
      trackChatSessionStarted("section-b");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes.sectionId).toBe("section-b");
    });

    it("trackChatBlockInserted records block type", () => {
      trackChatBlockInserted("chat-1", "quiz");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes.blockType).toBe("quiz");
    });

    it("trackChatRegenerated records chatId", () => {
      trackChatRegenerated("chat-1");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("chatRegenerated");
    });
  });

  describe("squad engagement tracking", () => {
    it("trackSquadViewed records squad and section", () => {
      trackSquadViewed("squad-1", "section-a");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes).toEqual({
        squadId: "squad-1",
        sectionId: "section-a",
      });
    });

    it("trackSquadJoined records squad and section", () => {
      trackSquadJoined("squad-1", "section-a");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("squadJoined");
    });

    it("trackSquadLeft records squad and section", () => {
      trackSquadLeft("squad-1", "section-a");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("squadLeft");
    });

    it("trackSquadPostCreated records squad and section", () => {
      trackSquadPostCreated("squad-1", "section-b");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("squadPostCreated");
    });

    it("trackSquadPostDeleted records squad and section", () => {
      trackSquadPostDeleted("squad-1", "section-b");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("squadPostDeleted");
    });

    it("trackSquadEdited records squad and field", () => {
      trackSquadEdited("squad-1", "name");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes).toEqual({
        squadId: "squad-1",
        field: "name",
      });
    });

    it("trackSquadLeaderboardViewed records sectionId", () => {
      trackSquadLeaderboardViewed("section-a");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].name).toBe("squadLeaderboardViewed");
    });

    it("trackSquadLeaderboardModeChanged records section and mode", () => {
      trackSquadLeaderboardModeChanged("section-a", "squads");
      flush();
      const events = JSON.parse(mockSendBeacon.mock.calls[0][1] as string);
      expect(events[0].attributes).toEqual({
        sectionId: "section-a",
        mode: "squads",
      });
    });
  });
});
