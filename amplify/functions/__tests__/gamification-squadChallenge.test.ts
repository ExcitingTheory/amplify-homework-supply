/**
 * Unit tests for the gamification handler — squad XP and group challenges
 *
 * updateSquadXP now uses getOrCreateStudentProfile to get cohortId, then queries
 * squads via listSquadByCohortId and checks squad.members array for membership.
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
  cohortId: "cohort-1",
  freezesRemaining: 0,
  freezesUsed: 0,
  _version: 1,
  ...overrides,
});

describe("gamification handler — updateSquadXP", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should return not updated when student has no squad memberships", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: { listStudentProfileByStudentId: { items: [baseProfile()] } },
        });
      }
      if (query?.includes("listSquadByCohortId")) {
        return Promise.resolve({
          data: { listSquadByCohortId: { items: [] } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "updateSquadXP",
        arguments: { studentId: "student-1", xpAmount: 50 },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.updated).toBe(false);
    expect(result.reason).toContain("no squad");
  });

  it("should update squad totalXP and return squad IDs", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: { listStudentProfileByStudentId: { items: [baseProfile()] } },
        });
      }
      if (query?.includes("listSquadByCohortId")) {
        return Promise.resolve({
          data: {
            listSquadByCohortId: {
              items: [
                {
                  id: "squad-1",
                  name: "Alpha Squad",
                  cohortId: "cohort-1",
                  totalXP: 200,
                  members: [{ studentId: "student-1", role: "MEMBER" }],
                  _version: 3,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("updateSquad")) {
        return Promise.resolve({
          data: { updateSquad: { id: "squad-1", totalXP: 250, _version: 4 } },
        });
      }
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: { listGroupChallengeByCohortId: { items: [] } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "updateSquadXP",
        arguments: { studentId: "student-1", xpAmount: 50 },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.updated).toBe(true);
    expect(result.squads).toContain("squad-1");
    // Verify squad update call with correct totalXP
    const updateCall = mockGraphql.mock.calls.find(
      (call: any) =>
        typeof call[0]?.query === "string" &&
        call[0].query.includes("updateSquad"),
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![0].variables.input.totalXP).toBe(250);
  });
});

describe("gamification handler — contributeToChallenge", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should return not contributed when no active challenges", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: { listGroupChallengeByCohortId: { items: [] } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "contributeToChallenge",
        arguments: {
          studentId: "student-1",
          cohortId: "cohort-1",
          xpContributed: 30,
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.contributed).toBe(false);
    expect(result.reason).toContain("No active challenges");
  });

  it("should record contribution and update challenge currentXP", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: {
            listGroupChallengeByCohortId: {
              items: [
                {
                  id: "ch-1",
                  cohortId: "cohort-1",
                  title: "Weekly Sprint",
                  targetXP: 1000,
                  currentXP: 800,
                  deadline: futureDate,
                  active: true,
                  bonusMultiplier: 1.5,
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
            updateGroupChallenge: { id: "ch-1", currentXP: 830, _version: 3 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "contributeToChallenge",
        arguments: {
          studentId: "student-1",
          cohortId: "cohort-1",
          xpContributed: 30,
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.contributed).toBe(true);
    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0].challengeId).toBe("ch-1");
    expect(result.contributions[0].newTotal).toBe(830);
    expect(result.contributions[0].goalReached).toBe(false);
  });

  it("should mark goalReached and award bonus when target met", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: {
            listGroupChallengeByCohortId: {
              items: [
                {
                  id: "ch-2",
                  cohortId: "cohort-1",
                  title: "Finish Line",
                  targetXP: 500,
                  currentXP: 480,
                  deadline: futureDate,
                  active: true,
                  bonusMultiplier: 2,
                  contributions: [],
                  _version: 5,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("updateGroupChallenge")) {
        return Promise.resolve({
          data: {
            updateGroupChallenge: { id: "ch-2", currentXP: 500, _version: 6 },
          },
        });
      }
      if (query?.includes("listStudentXPLogByStudentId")) {
        return Promise.resolve({
          data: { listStudentXPLogByStudentId: { items: [] } },
        });
      }
      if (query?.includes("createStudentXPLog")) {
        return Promise.resolve({
          data: {
            createStudentXPLog: { id: "xp-bonus", xpAmount: 50, _version: 1 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "contributeToChallenge",
        arguments: {
          studentId: "student-1",
          cohortId: "cohort-1",
          xpContributed: 20,
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.contributed).toBe(true);
    expect(result.contributions[0].goalReached).toBe(true);
    expect(result.contributions[0].newTotal).toBe(500);

    // Verify challenge was deactivated
    const updateCall = mockGraphql.mock.calls.find(
      (call: any) =>
        typeof call[0]?.query === "string" &&
        call[0].query.includes("updateGroupChallenge"),
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![0].variables.input.active).toBe(false);
  });

  it("should skip expired challenges", async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listGroupChallengeByCohortId")) {
        return Promise.resolve({
          data: {
            listGroupChallengeByCohortId: {
              items: [
                {
                  id: "ch-expired",
                  cohortId: "cohort-1",
                  title: "Expired Challenge",
                  targetXP: 1000,
                  currentXP: 500,
                  deadline: pastDate,
                  active: true,
                  contributions: [],
                  _version: 1,
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "contributeToChallenge",
        arguments: {
          studentId: "student-1",
          cohortId: "cohort-1",
          xpContributed: 50,
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.contributed).toBe(true);
    expect(result.contributions).toEqual([]);
  });
});
