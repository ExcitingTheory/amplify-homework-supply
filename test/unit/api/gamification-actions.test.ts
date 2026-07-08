/**
 * Tests for gamification server action caller identity validation (A5).
 *
 * Each student-facing action must verify the caller is either:
 *   1. The student themselves (sub === studentId), or
 *   2. A privileged user (Instructors / Admins / Moderators).
 *
 * Untrusted callers must be silently rejected — no data written.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Amplify server context mock ───────────────────────────────────────────────
const mockFetchAuthSession = vi.fn();

vi.mock("@/utils/amplifyServerUtils", () => ({
  runWithAmplifyServerContext: vi.fn(
    async ({ operation }: { operation: (ctx: object) => Promise<unknown> }) =>
      operation({}),
  ),
}));

vi.mock("aws-amplify/auth/server", () => ({
  fetchAuthSession: (...args: unknown[]) => mockFetchAuthSession(...args),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({})),
}));

// ── Data client mock ──────────────────────────────────────────────────────────
const mockSectionList = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: [] }),
);
const mockAssignmentList = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: [] }),
);

vi.mock("@/utils/amplifyServerClient", () => ({
  getServerClient: vi.fn(() => ({
    models: {
      Section: { list: mockSectionList },
      Assignment: { list: mockAssignmentList },
    },
  })),
}));

// ── Engine mock — we only care about whether it is called, not what it returns
const mockEngineAwardXP = vi.fn().mockResolvedValue({
  alreadyAwarded: false,
  xpAmount: 10,
  totalXP: 100,
});
const mockEngineCheckBadges = vi.fn().mockResolvedValue(null);
const mockEngineUpdateStreak = vi.fn().mockResolvedValue(null);
const mockEngineUpdateSquadXP = vi.fn().mockResolvedValue(null);
const mockEngineCheckPersonalBest = vi.fn().mockResolvedValue({
  isNewBest: false,
  firstAttempt: false,
  bestScore: 80,
  previousBest: null,
});
const mockEngineCheckEasterEggs = vi.fn().mockResolvedValue(null);
const mockEngineAdvanceSkillProgress = vi
  .fn()
  .mockResolvedValue({ success: true });
const mockEngineDiscoverEasterEgg = vi.fn().mockResolvedValue({
  alreadyDiscovered: false,
  message: "Found it!",
  xpReward: 5,
});
const mockEngineUpdateStudentUnitMemory = vi.fn().mockResolvedValue(null);
const mockEngineRebuildStudentMemoryProfile = vi.fn().mockResolvedValue(null);
const mockEngineGenerateSkillTree = vi.fn().mockResolvedValue(null);
const mockEngineRebuildLeaderboard = vi.fn().mockResolvedValue(null);

vi.mock("../../../app/actions/gamification-engine", () => ({
  engineAwardXP: (...a: unknown[]) => mockEngineAwardXP(...a),
  engineCheckBadges: (...a: unknown[]) => mockEngineCheckBadges(...a),
  engineUpdateStreak: (...a: unknown[]) => mockEngineUpdateStreak(...a),
  engineUpdateSquadXP: (...a: unknown[]) => mockEngineUpdateSquadXP(...a),
  engineCheckPersonalBest: (...a: unknown[]) =>
    mockEngineCheckPersonalBest(...a),
  engineCheckEasterEggs: (...a: unknown[]) => mockEngineCheckEasterEggs(...a),
  engineDiscoverEasterEgg: (...a: unknown[]) =>
    mockEngineDiscoverEasterEgg(...a),
  engineUpdateStudentUnitMemory: (...a: unknown[]) =>
    mockEngineUpdateStudentUnitMemory(...a),
  engineRebuildStudentMemoryProfile: (...a: unknown[]) =>
    mockEngineRebuildStudentMemoryProfile(...a),
  engineAdvanceSkillProgress: (...a: unknown[]) =>
    mockEngineAdvanceSkillProgress(...a),
  engineGenerateSkillTree: (...a: unknown[]) =>
    mockEngineGenerateSkillTree(...a),
  engineRebuildLeaderboard: (...a: unknown[]) =>
    mockEngineRebuildLeaderboard(...a),
}));

vi.mock("../../../app/actions/chat", () => ({
  chatCompletion: vi.fn().mockResolvedValue(null),
}));

import {
  awardXP,
  recordGradeCompletion,
  updateLearningMemory,
  advanceSkill,
  discoverEasterEgg,
} from "../../../app/actions/gamification";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockSession(sub: string, groups: string[] = []) {
  mockFetchAuthSession.mockResolvedValue({
    tokens: {
      idToken: {
        payload: {
          sub,
          "cognito:groups": groups,
        },
      },
    },
  });
}

function mockUnauthenticated() {
  mockFetchAuthSession.mockResolvedValue({ tokens: undefined });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("gamification server actions — caller identity validation", () => {
  const STUDENT_ID = "student-abc-123";
  const OTHER_STUDENT_ID = "student-xyz-999";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── awardXP ──────────────────────────────────────────────────────────────────

  describe("awardXP", () => {
    it("allows student to award XP to themselves", async () => {
      mockSession(STUDENT_ID, ["Learners"]);
      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).not.toBeNull();
      expect(mockEngineAwardXP).toHaveBeenCalledOnce();
    });

    it("allows instructor to award XP to student in their section", async () => {
      mockSession("instructor-111", ["Instructors"]);
      mockSectionList.mockResolvedValue({ data: [{ id: "section-1" }] });
      mockAssignmentList.mockResolvedValue({ data: [{ id: "assignment-1" }] });
      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).not.toBeNull();
      expect(mockEngineAwardXP).toHaveBeenCalledOnce();
    });

    it("allows admin to award XP to any student", async () => {
      mockSession("admin-222", ["Admins"]);
      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).not.toBeNull();
    });

    it("blocks a student from awarding XP to another student", async () => {
      mockSession(OTHER_STUDENT_ID, ["Learners"]);
      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).toBeNull();
      expect(mockEngineAwardXP).not.toHaveBeenCalled();
    });

    it("blocks an unauthenticated caller", async () => {
      mockUnauthenticated();
      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).toBeNull();
      expect(mockEngineAwardXP).not.toHaveBeenCalled();
    });
  });

  // ── recordGradeCompletion ─────────────────────────────────────────────────

  describe("recordGradeCompletion", () => {
    it("allows student to record their own grade completion", async () => {
      mockSession(STUDENT_ID, ["Learners"]);
      const result = await recordGradeCompletion(
        STUDENT_ID,
        "unit-1",
        90,
        "grade-ref-1",
      );
      expect(result.xp).not.toBeNull();
      expect(mockEngineAwardXP).toHaveBeenCalledOnce();
    });

    it("blocks student from submitting for another student", async () => {
      mockSession(OTHER_STUDENT_ID, ["Learners"]);
      const result = await recordGradeCompletion(
        STUDENT_ID,
        "unit-1",
        90,
        "grade-ref-1",
      );
      expect(result.xp).toBeNull();
      expect(result.personalBest).toBeNull();
      expect(result.easterEggs).toBeNull();
      expect(mockEngineAwardXP).not.toHaveBeenCalled();
    });

    it("blocks unauthenticated grade completion", async () => {
      mockUnauthenticated();
      const result = await recordGradeCompletion(
        STUDENT_ID,
        "unit-1",
        90,
        "grade-ref-1",
      );
      expect(result.xp).toBeNull();
      expect(mockEngineAwardXP).not.toHaveBeenCalled();
    });
  });

  // ── updateLearningMemory ──────────────────────────────────────────────────

  describe("updateLearningMemory", () => {
    it("allows student to update their own memory", async () => {
      mockSession(STUDENT_ID, ["Learners"]);
      const result = await updateLearningMemory(
        STUDENT_ID,
        "unit-1",
        85,
        [],
        [],
      );
      expect(result.success).toBe(true);
      expect(mockEngineUpdateStudentUnitMemory).toHaveBeenCalledOnce();
    });

    it("blocks a student from updating another student's memory", async () => {
      mockSession(OTHER_STUDENT_ID, ["Learners"]);
      const result = await updateLearningMemory(
        STUDENT_ID,
        "unit-1",
        85,
        [],
        [],
      );
      expect(result.success).toBe(false);
      expect(mockEngineUpdateStudentUnitMemory).not.toHaveBeenCalled();
    });
  });

  // ── advanceSkill ──────────────────────────────────────────────────────────

  describe("advanceSkill", () => {
    it("allows student to advance their own skill", async () => {
      mockSession(STUDENT_ID, ["Learners"]);
      const result = await advanceSkill(STUDENT_ID, "skill-123", "mastered");
      expect(result).not.toBeNull();
      expect(mockEngineAdvanceSkillProgress).toHaveBeenCalledOnce();
    });

    it("blocks student from advancing another student's skill", async () => {
      mockSession(OTHER_STUDENT_ID, ["Learners"]);
      const result = await advanceSkill(STUDENT_ID, "skill-123", "mastered");
      expect(result).toBeNull();
      expect(mockEngineAdvanceSkillProgress).not.toHaveBeenCalled();
    });
  });

  // ── discoverEasterEgg ─────────────────────────────────────────────────────

  describe("discoverEasterEgg", () => {
    it("allows student to discover their own easter egg", async () => {
      mockSession(STUDENT_ID, ["Learners"]);
      const result = await discoverEasterEgg(STUDENT_ID, "egg-1");
      expect(result).not.toBeNull();
      expect(mockEngineDiscoverEasterEgg).toHaveBeenCalledOnce();
    });

    it("blocks student from discovering on behalf of another student", async () => {
      mockSession(OTHER_STUDENT_ID, ["Learners"]);
      const result = await discoverEasterEgg(STUDENT_ID, "egg-1");
      expect(result).toBeNull();
      expect(mockEngineDiscoverEasterEgg).not.toHaveBeenCalled();
    });

    it("allows instructor to discover egg on behalf of student", async () => {
      mockSession("instructor-111", ["Instructors"]);
      mockSectionList.mockResolvedValue({ data: [{ id: "section-1" }] });
      mockAssignmentList.mockResolvedValue({ data: [{ id: "assignment-1" }] });
      const result = await discoverEasterEgg(STUDENT_ID, "egg-1");
      expect(result).not.toBeNull();
    });
  });

  // ── Cross-section denial ──────────────────────────────────────────────────

  describe("cross-section denial", () => {
    it("denies instructor awarding XP to student not in their section", async () => {
      mockSession("instructor-111", ["Instructors"]);
      // Instructor owns section-A, but student has no assignments there
      mockSectionList.mockResolvedValue({ data: [{ id: "section-A" }] });
      mockAssignmentList.mockResolvedValue({ data: [] });

      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).toBeNull();
      expect(mockEngineAwardXP).not.toHaveBeenCalled();
    });

    it("denies instructor when they own no sections", async () => {
      mockSession("instructor-111", ["Instructors"]);
      mockSectionList.mockResolvedValue({ data: [] });

      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).toBeNull();
      expect(mockEngineAwardXP).not.toHaveBeenCalled();
    });

    it("allows admin to award XP to any student regardless of section", async () => {
      mockSession("admin-222", ["Admins"]);
      // Admin does NOT need section membership
      mockSectionList.mockResolvedValue({ data: [] });

      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).not.toBeNull();
      expect(mockEngineAwardXP).toHaveBeenCalledOnce();
    });

    it("allows instructor to award XP to student in their section", async () => {
      mockSession("instructor-111", ["Instructors"]);
      mockSectionList.mockResolvedValue({ data: [{ id: "section-B" }] });
      mockAssignmentList.mockResolvedValue({ data: [{ id: "assignment-99" }] });

      const result = await awardXP(STUDENT_ID, "NAILED_IT");
      expect(result).not.toBeNull();
      expect(mockEngineAwardXP).toHaveBeenCalledOnce();
    });
  });
});
