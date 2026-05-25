import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock aws-amplify/analytics before importing the module
vi.mock("aws-amplify/analytics", () => ({
  record: vi.fn(),
  configureAutoTrack: vi.fn(),
  identifyUser: vi.fn(),
}));

import {
  record,
  configureAutoTrack,
  identifyUser,
} from "aws-amplify/analytics";
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

describe("analytics utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackEvent", () => {
    it("calls record with event name", () => {
      trackEvent(AnalyticsEvents.PAGE_VIEW);
      expect(record).toHaveBeenCalledWith({ name: "pageView" });
    });

    it("includes attributes when provided", () => {
      trackEvent(AnalyticsEvents.AUDIO_PLAYED, { unitId: "u1" });
      expect(record).toHaveBeenCalledWith({
        name: "audioPlayed",
        attributes: { unitId: "u1" },
      });
    });

    it("includes metrics when provided", () => {
      trackEvent(
        AnalyticsEvents.ENGAGED_TIME_UPDATE,
        { unitId: "u1" },
        { engagedTimeMs: 5000 },
      );
      expect(record).toHaveBeenCalledWith({
        name: "engagedTimeUpdate",
        attributes: { unitId: "u1" },
        metrics: { engagedTimeMs: 5000 },
      });
    });

    it("does not crash if record throws", () => {
      vi.mocked(record).mockImplementationOnce(() => {
        throw new Error("Network error");
      });
      expect(() => trackEvent(AnalyticsEvents.PAGE_VIEW)).not.toThrow();
    });
  });

  describe("trackPageView", () => {
    it("records a pageView event with path", () => {
      trackPageView("/workbook/abc");
      expect(record).toHaveBeenCalledWith({
        name: "pageView",
        attributes: { path: "/workbook/abc" },
      });
    });

    it("merges additional attributes", () => {
      trackPageView("/unit/123", { unitId: "123" });
      expect(record).toHaveBeenCalledWith({
        name: "pageView",
        attributes: { path: "/unit/123", unitId: "123" },
      });
    });
  });

  describe("trackEngagedTime", () => {
    it("records engaged time with unit and grade ids", () => {
      trackEngagedTime("unit-1", "grade-1", 45000);
      expect(record).toHaveBeenCalledWith({
        name: "engagedTimeUpdate",
        attributes: { unitId: "unit-1", gradeId: "grade-1" },
        metrics: { engagedTimeMs: 45000 },
      });
    });
  });

  describe("trackWorkbookCompleted", () => {
    it("records completion with accuracy and time", () => {
      trackWorkbookCompleted("unit-1", "grade-1", 92.5, 120000);
      expect(record).toHaveBeenCalledWith({
        name: "workbookCompleted",
        attributes: { unitId: "unit-1", gradeId: "grade-1" },
        metrics: { accuracy: 92.5, engagedTimeMs: 120000 },
      });
    });
  });

  describe("initAnalytics", () => {
    it("configures session and pageView auto-tracking", () => {
      initAnalytics();
      expect(configureAutoTrack).toHaveBeenCalledTimes(2);
      expect(configureAutoTrack).toHaveBeenCalledWith({
        enable: true,
        type: "session",
      });
      expect(configureAutoTrack).toHaveBeenCalledWith({
        enable: true,
        type: "pageView",
        options: { appType: "singlePage" },
      });
    });

    it("does not crash if configureAutoTrack throws", () => {
      vi.mocked(configureAutoTrack).mockImplementationOnce(() => {
        throw new Error("Not configured");
      });
      expect(() => initAnalytics()).not.toThrow();
    });
  });

  describe("identifyAnalyticsUser", () => {
    it("calls identifyUser with section membership and role", () => {
      identifyAnalyticsUser({
        userId: "user-123",
        userRole: "Learner",
        sectionIds: ["section-a", "section-b"],
        sectionNames: ["Japanese 101", "Biology 101"],
      });
      expect(identifyUser).toHaveBeenCalledWith({
        userId: "user-123",
        userProfile: {
          customProperties: {
            userRole: ["Learner"],
            sectionIds: ["section-a", "section-b"],
            sectionNames: ["Japanese 101", "Biology 101"],
          },
        },
      });
    });

    it("does not crash if identifyUser throws", () => {
      vi.mocked(identifyUser).mockImplementationOnce(() => {
        throw new Error("Not configured");
      });
      expect(() => identifyAnalyticsUser({ userId: "user-1" })).not.toThrow();
    });
  });

  describe("section-aware tracking (multi-section user)", () => {
    it("trackSectionWorkbookStarted tags with correct sectionId", () => {
      trackSectionWorkbookStarted("unit-1", "section-a", "assignment-1");
      expect(record).toHaveBeenCalledWith({
        name: "sectionWorkbookStarted",
        attributes: {
          unitId: "unit-1",
          sectionId: "section-a",
          assignmentId: "assignment-1",
        },
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
      expect(record).toHaveBeenCalledWith({
        name: "workbookCompleted",
        attributes: {
          unitId: "unit-2",
          gradeId: "grade-2",
          sectionId: "section-b",
        },
        metrics: { accuracy: 88, engagedTimeMs: 300000 },
      });
    });

    it("trackSectionEngagedTime includes section context", () => {
      trackSectionEngagedTime("unit-1", "grade-1", "section-a", 60000);
      expect(record).toHaveBeenCalledWith({
        name: "engagedTimeUpdate",
        attributes: {
          unitId: "unit-1",
          gradeId: "grade-1",
          sectionId: "section-a",
        },
        metrics: { engagedTimeMs: 60000 },
      });
    });

    it("trackGuildViewed tags with section context", () => {
      trackGuildViewed("section-b", "leaderboard");
      expect(record).toHaveBeenCalledWith({
        name: "guildViewed",
        attributes: { sectionId: "section-b", guildType: "leaderboard" },
      });
    });
  });

  describe("chat engagement tracking", () => {
    it("trackChatMessageSent records with chatId, sectionId, and message length", () => {
      trackChatMessageSent("chat-1", "section-a", 42);
      expect(record).toHaveBeenCalledWith({
        name: "chatMessageSent",
        attributes: { chatId: "chat-1", sectionId: "section-a" },
        metrics: { messageLength: 42 },
      });
    });

    it("trackChatMessageSent works without optional params", () => {
      trackChatMessageSent("chat-2");
      expect(record).toHaveBeenCalledWith({
        name: "chatMessageSent",
        attributes: { chatId: "chat-2" },
      });
    });

    it("trackChatResponseReceived records tools used", () => {
      trackChatResponseReceived("chat-1", ["search_content", "practice_drill"]);
      expect(record).toHaveBeenCalledWith({
        name: "chatResponseReceived",
        attributes: {
          chatId: "chat-1",
          toolsUsed: "search_content,practice_drill",
        },
      });
    });

    it("trackChatToolUsed records tool name with section", () => {
      trackChatToolUsed("chat-1", "search_content", "section-a");
      expect(record).toHaveBeenCalledWith({
        name: "chatToolUsed",
        attributes: {
          chatId: "chat-1",
          toolName: "search_content",
          sectionId: "section-a",
        },
      });
    });

    it("trackChatFileUploaded records file type", () => {
      trackChatFileUploaded("chat-1", "application/pdf");
      expect(record).toHaveBeenCalledWith({
        name: "chatFileUploaded",
        attributes: { chatId: "chat-1", fileType: "application/pdf" },
      });
    });

    it("trackChatSessionStarted records with section", () => {
      trackChatSessionStarted("section-b");
      expect(record).toHaveBeenCalledWith({
        name: "chatSessionStarted",
        attributes: { sectionId: "section-b" },
      });
    });

    it("trackChatBlockInserted records block type", () => {
      trackChatBlockInserted("chat-1", "quiz");
      expect(record).toHaveBeenCalledWith({
        name: "chatBlockInserted",
        attributes: { chatId: "chat-1", blockType: "quiz" },
      });
    });

    it("trackChatRegenerated records chatId", () => {
      trackChatRegenerated("chat-1");
      expect(record).toHaveBeenCalledWith({
        name: "chatRegenerated",
        attributes: { chatId: "chat-1" },
      });
    });
  });

  describe("squad engagement tracking", () => {
    it("trackSquadViewed records squad and section", () => {
      trackSquadViewed("squad-1", "section-a");
      expect(record).toHaveBeenCalledWith({
        name: "squadViewed",
        attributes: { squadId: "squad-1", sectionId: "section-a" },
      });
    });

    it("trackSquadJoined records squad and section", () => {
      trackSquadJoined("squad-1", "section-a");
      expect(record).toHaveBeenCalledWith({
        name: "squadJoined",
        attributes: { squadId: "squad-1", sectionId: "section-a" },
      });
    });

    it("trackSquadLeft records squad and section", () => {
      trackSquadLeft("squad-1", "section-a");
      expect(record).toHaveBeenCalledWith({
        name: "squadLeft",
        attributes: { squadId: "squad-1", sectionId: "section-a" },
      });
    });

    it("trackSquadPostCreated records squad and section", () => {
      trackSquadPostCreated("squad-1", "section-b");
      expect(record).toHaveBeenCalledWith({
        name: "squadPostCreated",
        attributes: { squadId: "squad-1", sectionId: "section-b" },
      });
    });

    it("trackSquadPostDeleted records squad and section", () => {
      trackSquadPostDeleted("squad-1", "section-b");
      expect(record).toHaveBeenCalledWith({
        name: "squadPostDeleted",
        attributes: { squadId: "squad-1", sectionId: "section-b" },
      });
    });

    it("trackSquadEdited records squad and field", () => {
      trackSquadEdited("squad-1", "name");
      expect(record).toHaveBeenCalledWith({
        name: "squadEdited",
        attributes: { squadId: "squad-1", field: "name" },
      });
    });

    it("trackSquadLeaderboardViewed records sectionId", () => {
      trackSquadLeaderboardViewed("section-a");
      expect(record).toHaveBeenCalledWith({
        name: "squadLeaderboardViewed",
        attributes: { sectionId: "section-a" },
      });
    });

    it("trackSquadLeaderboardModeChanged records section and mode", () => {
      trackSquadLeaderboardModeChanged("section-a", "squads");
      expect(record).toHaveBeenCalledWith({
        name: "squadLeaderboardModeChanged",
        attributes: { sectionId: "section-a", mode: "squads" },
      });
    });
  });
});
