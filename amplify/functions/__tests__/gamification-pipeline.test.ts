/**
 * Integration test: Full XP pipeline flow through the Lambda handler
 *
 * Tests the realistic sequence:
 *   awardXP → checkBadges → updateStreak → checkPersonalBest → updateGuildXP → contributeToChallenge
 *
 * Each call is independent but this test verifies they chain correctly
 * with the same mocked GraphQL layer.
 *
 * Key handler changes:
 * - checkBadges: uses getOrCreateStudentProfile (listStudentProfileByStudentId) + listStudentXPLogByStudentId
 * - updateStreak: uses getOrCreateStudentProfile + updateStudentProfile
 * - checkPersonalBest: uses getOrCreateStudentProfile (reads personalBests JSON) + updateStudentProfile
 * - updateGuildXP: uses getOrCreateStudentProfile (reads cohortId) + listGuildByCohortId + updateGuild
 * - contributeToChallenge: listGroupChallengeByCohortId + updateGroupChallenge (contributions array)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Amplify
vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

vi.mock("@aws-sdk/credential-providers", () => ({
  fromEnv: vi.fn(() =>
    vi.fn().mockResolvedValue({
      accessKeyId: "test",
      secretAccessKey: "test",
    }),
  ),
}));

const mockGraphql = vi.fn();
vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({ graphql: mockGraphql }),
}));

const baseProfile = (overrides: Record<string, any> = {}) => ({
  id: "profile-1",
  studentId: "student-1",
  totalXP: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  badges: "[]",
  personalBests: "[]",
  moduleProgress: "[]",
  activeDebuffs: "[]",
  cohortId: "cohort-1",
  freezesRemaining: 0,
  freezesUsed: 0,
  lastActivityDate: null,
  nailedItCount: 0,
  completedAssignments: 0,
  _version: 1,
  ...overrides,
});

describe("gamification handler — full XP pipeline integration", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("completes the full award → badge → streak → personalBest → guild → challenge pipeline", async () => {
    const { handler } = await import("../gamification/handler");

    // =====================================================================
    // Step 1: awardXP — no cohortId so no getSection/profile needed
    // Sequence: listStudentXPLogByStudentId (dedup) → createStudentXPLog
    // =====================================================================
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentXPLogByStudentId")) {
        return Promise.resolve({
          data: { listStudentXPLogByStudentId: { items: [] } },
        });
      }
      if (query?.includes("createStudentXPLog")) {
        return Promise.resolve({
          data: {
            createStudentXPLog: {
              id: "xp-1",
              studentId: "student-1",
              xpAmount: 50,
              reason: "HOMEWORK_SUBMITTED",
              _version: 1,
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const xpResult = await handler(
      {
        fieldName: "awardXP",
        arguments: {
          studentId: "student-1",
          reason: "HOMEWORK_SUBMITTED",
          referenceId: "grade-1",
        },
        identity: { sub: "student-1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(xpResult).toEqual(
      expect.objectContaining({
        alreadyAwarded: false,
        xpAmount: 50,
        totalXP: 50,
      }),
    );

    // =====================================================================
    // Step 2: checkBadges — uses parallel: listStudentXPLogByStudentId + getOrCreateStudentProfile
    // Then updateStudentProfile for badges JSON
    // =====================================================================
    mockGraphql.mockReset();
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentXPLogByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentXPLogByStudentId: {
              items: [{ xpAmount: 50, reason: "HOMEWORK_SUBMITTED" }],
            },
          },
        });
      }
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [baseProfile({ totalXP: 50 })],
            },
          },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: { updateStudentProfile: { id: "profile-1", _version: 2 } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const badgeResult = await handler(
      { fieldName: "checkBadges", arguments: { studentId: "student-1" } },
      {} as any,
      vi.fn(),
    );

    expect(badgeResult).toEqual(
      expect.objectContaining({
        newBadges: expect.any(Array),
        totalBadges: expect.any(Number),
      }),
    );

    // =====================================================================
    // Step 3: updateStreak — getOrCreateStudentProfile → updateStudentProfile
    // First activity: currentStreak=0, lastActivityDate=null → set to 1
    // =====================================================================
    mockGraphql.mockReset();
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: { listStudentProfileByStudentId: { items: [baseProfile()] } },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: { updateStudentProfile: { id: "profile-1", _version: 2 } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const streakResult = await handler(
      { fieldName: "updateStreak", arguments: { studentId: "student-1" } },
      {} as any,
      vi.fn(),
    );

    expect(streakResult).toEqual(
      expect.objectContaining({ currentStreak: 1, longestStreak: 1 }),
    );

    // =====================================================================
    // Step 4: checkPersonalBest — getOrCreateStudentProfile (reads personalBests JSON)
    // First attempt: no existing PB → add to array → updateStudentProfile
    // =====================================================================
    mockGraphql.mockReset();
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [baseProfile({ personalBests: "[]" })],
            },
          },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: { updateStudentProfile: { id: "profile-1", _version: 2 } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const pbResult = await handler(
      {
        fieldName: "checkPersonalBest",
        arguments: { studentId: "student-1", unitID: "unit-1", score: 85 },
      },
      {} as any,
      vi.fn(),
    );

    expect(pbResult).toEqual(
      expect.objectContaining({
        isNewBest: true,
        firstAttempt: true,
        bestScore: 85,
      }),
    );

    // =====================================================================
    // Step 5: updateGuildXP — getOrCreateStudentProfile (get cohortId)
    // → listGuildByCohortId (check members) → updateGuild → contributeToChallenge
    // =====================================================================
    mockGraphql.mockReset();
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [baseProfile({ cohortId: "c1" })],
            },
          },
        });
      }
      if (query?.includes("listGuildByCohortId")) {
        return Promise.resolve({
          data: {
            listGuildByCohortId: {
              items: [
                {
                  id: "guild-1",
                  cohortId: "c1",
                  totalXP: 200,
                  members: [{ studentId: "student-1", role: "MEMBER" }],
                  _version: 3,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("updateGuild")) {
        return Promise.resolve({
          data: { updateGuild: { id: "guild-1", totalXP: 250, _version: 4 } },
        });
      }
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: { listGroupChallengeByCohortId: { items: [] } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const guildResult = await handler(
      {
        fieldName: "updateGuildXP",
        arguments: { studentId: "student-1", xpAmount: 50 },
      },
      {} as any,
      vi.fn(),
    );

    expect(guildResult).toEqual(
      expect.objectContaining({
        updated: true,
        guilds: expect.arrayContaining(["guild-1"]),
      }),
    );

    // =====================================================================
    // Step 6: contributeToChallenge — listGroupChallengeByCohortId → updateGroupChallenge
    // =====================================================================
    mockGraphql.mockReset();
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: {
            listGroupChallengeByCohortId: {
              items: [
                {
                  id: "ch-1",
                  cohortId: "c1",
                  currentXP: 100,
                  targetXP: 500,
                  active: true,
                  contributions: [],
                  _version: 2,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("updateGroupChallenge")) {
        return Promise.resolve({
          data: {
            updateGroupChallenge: { id: "ch-1", currentXP: 150, _version: 3 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const challengeResult = await handler(
      {
        fieldName: "contributeToChallenge",
        arguments: {
          studentId: "student-1",
          cohortId: "c1",
          xpContributed: 50,
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(challengeResult).toEqual(
      expect.objectContaining({
        contributions: expect.arrayContaining([
          expect.objectContaining({ challengeId: "ch-1" }),
        ]),
      }),
    );
  });

  it("handles pipeline where awardXP detects duplicate", async () => {
    const { handler } = await import("../gamification/handler");

    // Existing log with same referenceId and reason → alreadyAwarded
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentXPLogByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentXPLogByStudentId: {
              items: [
                {
                  referenceId: "grade-1",
                  reason: "HOMEWORK_SUBMITTED",
                  xpAmount: 50,
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const xpResult = await handler(
      {
        fieldName: "awardXP",
        arguments: {
          studentId: "student-1",
          reason: "HOMEWORK_SUBMITTED",
          referenceId: "grade-1",
        },
        identity: { sub: "student-1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(xpResult).toEqual(
      expect.objectContaining({
        alreadyAwarded: true,
        xpAmount: 0,
        totalXP: 50,
      }),
    );
  });

  it("handles updateGuildXP when student has no guild", async () => {
    const { handler } = await import("../gamification/handler");

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: { listStudentProfileByStudentId: { items: [baseProfile()] } },
        });
      }
      if (query?.includes("listGuildByCohortId")) {
        return Promise.resolve({
          data: { listGuildByCohortId: { items: [] } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const result = await handler(
      {
        fieldName: "updateGuildXP",
        arguments: { studentId: "student-1", xpAmount: 50 },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.updated).toBe(false);
    expect(result.reason).toContain("no guild");
  });

  it("handles contributeToChallenge when no active challenges exist", async () => {
    const { handler } = await import("../gamification/handler");

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: { listGroupChallengeByCohortId: { items: [] } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const result = await handler(
      {
        fieldName: "contributeToChallenge",
        arguments: {
          studentId: "student-1",
          cohortId: "c1",
          xpContributed: 50,
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.contributed).toBe(false);
  });
});
