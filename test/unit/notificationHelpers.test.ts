import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the amplifyClient before importing the module under test
const mockCreate = vi.fn().mockResolvedValue({ data: { id: "n1" } });
vi.mock("../../src/utils/amplifyClient", () => ({
  getAmplifyClient: () => ({
    models: {
      Notification: {
        create: mockCreate,
      },
    },
  }),
}));

import {
  sendNotification,
  sendNotificationToMany,
  notifications,
} from "../../src/utils/notificationHelpers";

beforeEach(() => {
  mockCreate.mockClear();
});

describe("notificationHelpers (client-side)", () => {
  describe("sendNotification", () => {
    it("creates a notification with correct category", async () => {
      await sendNotification({
        recipientId: "user-1",
        type: "BADGE_EARNED",
        title: "Badge Earned!",
      });

      expect(mockCreate).toHaveBeenCalledOnce();
      const arg = mockCreate.mock.calls[0][0];
      expect(arg).toMatchObject({
        recipientId: "user-1",
        type: "BADGE_EARNED",
        category: "GAMIFICATION",
        title: "Badge Earned!",
        seen: false,
        interacted: false,
      });
    });

    it("defaults category to SYSTEM for unknown types", async () => {
      await sendNotification({
        recipientId: "user-1",
        type: "CUSTOM_TYPE",
        title: "Custom",
      });

      const arg = mockCreate.mock.calls[0][0];
      expect(arg.category).toBe("SYSTEM");
    });

    it("stringifies metadata when provided", async () => {
      await sendNotification({
        recipientId: "user-1",
        type: "XP_MILESTONE",
        title: "1000 XP",
        metadata: { milestone: 1000 },
      });

      const arg = mockCreate.mock.calls[0][0];
      expect(arg.metadata).toBe('{"milestone":1000}');
    });

    it("does not crash on create failure", async () => {
      mockCreate.mockRejectedValueOnce(new Error("Auth error"));
      await expect(
        sendNotification({ recipientId: "user-1", type: "TEST", title: "Test" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("sendNotificationToMany", () => {
    it("sends to all recipients", async () => {
      await sendNotificationToMany(["u1", "u2", "u3"], {
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Hello!",
      });

      expect(mockCreate).toHaveBeenCalledTimes(3);
      const ids = mockCreate.mock.calls.map((c: any[]) => c[0].recipientId);
      expect(ids).toEqual(["u1", "u2", "u3"]);
    });
  });

  describe("notifications pre-built senders", () => {
    it("guildPostNew sends GUILD_POST_NEW to all recipients", async () => {
      await notifications.guildPostNew(["u1", "u2"], "Alice", "guild-1", "Study Club");

      expect(mockCreate).toHaveBeenCalledTimes(2);
      const arg = mockCreate.mock.calls[0][0];
      expect(arg.type).toBe("GUILD_POST_NEW");
      expect(arg.category).toBe("GUILD");
      expect(arg.title).toContain("Study Club");
      expect(arg.senderName).toBe("Alice");
    });

    it("practiceSessionInvite sends to a single recipient", async () => {
      await notifications.practiceSessionInvite("u1", "Bob", "room-abc", "Math Unit");

      expect(mockCreate).toHaveBeenCalledOnce();
      const arg = mockCreate.mock.calls[0][0];
      expect(arg.type).toBe("PRACTICE_SESSION_INVITE");
      expect(arg.category).toBe("COLLABORATION");
      expect(arg.recipientId).toBe("u1");
      expect(arg.body).toContain("Bob");
      expect(arg.body).toContain("Math Unit");
    });

    it("challengeStarted sends CHALLENGE_STARTED to all", async () => {
      await notifications.challengeStarted(["u1", "u2"], "Speed Run", "ch-1", "guild-1");

      expect(mockCreate).toHaveBeenCalledTimes(2);
      const arg = mockCreate.mock.calls[0][0];
      expect(arg.type).toBe("CHALLENGE_STARTED");
      expect(arg.title).toContain("Speed Run");
    });

    it("challengeCompleted sends CHALLENGE_COMPLETED to all", async () => {
      await notifications.challengeCompleted(["u1"], "Final Exam", "ch-2", "guild-2");

      expect(mockCreate).toHaveBeenCalledOnce();
      const arg = mockCreate.mock.calls[0][0];
      expect(arg.type).toBe("CHALLENGE_COMPLETED");
      expect(arg.title).toContain("Final Exam");
    });

    it("workbookSessionInvite sends WORKBOOK_SESSION_INVITE", async () => {
      await notifications.workbookSessionInvite("u3", "Carol", "unit-5", "Science");

      expect(mockCreate).toHaveBeenCalledOnce();
      const arg = mockCreate.mock.calls[0][0];
      expect(arg.type).toBe("WORKBOOK_SESSION_INVITE");
      expect(arg.recipientId).toBe("u3");
      expect(arg.linkPath).toBe("/workbook/unit-5");
    });

    it("guildMemberJoined sends GUILD_MEMBER_JOINED", async () => {
      await notifications.guildMemberJoined(["u1", "u2"], "Dave", "guild-3", "Writers");

      expect(mockCreate).toHaveBeenCalledTimes(2);
      const arg = mockCreate.mock.calls[0][0];
      expect(arg.type).toBe("GUILD_MEMBER_JOINED");
      expect(arg.title).toContain("Dave");
      expect(arg.title).toContain("Writers");
    });
  });
});
