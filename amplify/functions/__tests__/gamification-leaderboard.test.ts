/**
 * Unit tests for the gamification handler — leaderboard rebuild
 *
 * rebuildLeaderboard goes through maybeRebuildLeaderboard which:
 * 1) getSection (debounce/lock check)
 * 2) UPDATE_SECTION (acquire lock)
 * 3) handleRebuildLeaderboard:
 *    a) getSection (leaderboardEnabled check)
 *    b) listGradeBySectionID
 *    c) listStudentXPLogByCohortId
 *    d) per student: getOrCreateStudentProfile + updateStudentProfile
 * 4) UPDATE_SECTION (clear lock, stamp completion)
 *
 * maybeRebuildLeaderboard returns void, so tests verify side-effects.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

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

describe("gamification handler — rebuildLeaderboard", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should rebuild leaderboard for multiple students in a cohort", async () => {
    let getSectionCallCount = 0;
    let updateSectionCallCount = 0;
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("getSection")) {
        getSectionCallCount++;
        if (getSectionCallCount === 1) {
          // maybeRebuildLeaderboard: debounce/lock check
          return Promise.resolve({
            data: {
              getSection: {
                id: "sec1",
                leaderboardEnabled: true,
                leaderboardRebuiltAt: null,
                leaderboardUpdateInProgressAt: null,
              },
            },
          });
        }
        // handleRebuildLeaderboard: leaderboardEnabled check
        return Promise.resolve({
          data: { getSection: { id: "sec1", leaderboardEnabled: true } },
        });
      }
      if (query?.includes("updateSection")) {
        updateSectionCallCount++;
        return Promise.resolve({ data: { updateSection: { id: "sec1" } } });
      }
      if (query?.includes("listGradeBySectionID")) {
        return Promise.resolve({
          data: {
            listGradeBySectionID: {
              items: [
                {
                  id: "g1",
                  owner: "student-1",
                  sectionID: "sec1",
                  complete: true,
                  accuracy: 90,
                  _version: 1,
                },
                {
                  id: "g2",
                  owner: "student-2",
                  sectionID: "sec1",
                  complete: true,
                  accuracy: 85,
                  _version: 1,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("listStudentXPLogByCohortId")) {
        return Promise.resolve({
          data: {
            listStudentXPLogByCohortId: {
              items: [
                {
                  id: "xp1",
                  studentId: "student-1",
                  xpAmount: 200,
                  reason: "HOMEWORK_SUBMITTED",
                },
                {
                  id: "xp2",
                  studentId: "student-2",
                  xpAmount: 100,
                  reason: "HOMEWORK_SUBMITTED",
                },
              ],
            },
          },
        });
      }
      if (query?.includes("listStudentProfileByStudentId")) {
        // Return profile for whichever student is being queried
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [
                {
                  id: "p-default",
                  studentId: "unknown",
                  totalXP: 0,
                  level: 1,
                  _version: 1,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: { updateStudentProfile: { id: "p-default", _version: 2 } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    await handler(
      {
        fieldName: "rebuildLeaderboard",
        arguments: { cohortId: "sec1" },
      },
      {} as any,
      vi.fn(),
    );

    // Verify updateStudentProfile was called for both students
    const updateProfileCalls = mockGraphql.mock.calls.filter(
      (call: any) =>
        typeof call[0]?.query === "string" &&
        call[0].query.includes("updateStudentProfile"),
    );
    expect(updateProfileCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("should skip rebuild when leaderboard is disabled", async () => {
    let getSectionCallCount = 0;
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("getSection")) {
        getSectionCallCount++;
        if (getSectionCallCount === 1) {
          // maybeRebuildLeaderboard: debounce check — enabled, no lock
          return Promise.resolve({
            data: {
              getSection: {
                id: "sec1",
                leaderboardEnabled: true,
                leaderboardRebuiltAt: null,
                leaderboardUpdateInProgressAt: null,
              },
            },
          });
        }
        // handleRebuildLeaderboard: leaderboardEnabled=false
        return Promise.resolve({
          data: { getSection: { id: "sec1", leaderboardEnabled: false } },
        });
      }
      if (query?.includes("updateSection")) {
        return Promise.resolve({ data: { updateSection: { id: "sec1" } } });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    await handler(
      {
        fieldName: "rebuildLeaderboard",
        arguments: { cohortId: "sec1" },
      },
      {} as any,
      vi.fn(),
    );

    // Should NOT have called updateStudentProfile
    const updateProfileCalls = mockGraphql.mock.calls.filter(
      (call: any) =>
        typeof call[0]?.query === "string" &&
        call[0].query.includes("updateStudentProfile"),
    );
    expect(updateProfileCalls.length).toBe(0);
  });
});
