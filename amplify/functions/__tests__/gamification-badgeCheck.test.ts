/**
 * Unit tests for the gamification handler — badge check operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

// Mock AWS SDK credential provider to prevent IMDS timeout in tests
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

describe("gamification handler — checkBadges", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  /** Helper to set up query-routed mocks that handle parallel calls */
  function setupMocks(opts: { xpLogs?: any[]; profile?: any; badges?: any[] }) {
    const createdBadges: string[] = [];
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentXPLogByStudentId")) {
        return Promise.resolve({
          data: { listStudentXPLogByStudentId: { items: opts.xpLogs || [] } },
        });
      }
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: opts.profile ? [opts.profile] : [],
            },
          },
        });
      }
      if (query?.includes("createStudentProfile")) {
        return Promise.resolve({
          data: {
            createStudentProfile: { id: "new-p", studentId: "s1", _version: 1 },
          },
        });
      }
      if (query?.includes("listBadge") || query?.includes("listStudentBadge")) {
        return Promise.resolve({
          data: { listStudentBadgeByStudentId: { items: opts.badges || [] } },
        });
      }
      if (
        query?.includes("createBadge") ||
        query?.includes("createStudentBadge")
      ) {
        return Promise.resolve({
          data: { createStudentBadge: { id: `b-${createdBadges.length}` } },
        });
      }
      // Default catch-all for profile updates, etc.
      return Promise.resolve({ data: {} });
    });
  }

  it("should award FIRST_SUBMISSION badge when student has a submission", async () => {
    setupMocks({
      xpLogs: [{ id: "xp1", xpAmount: 50, reason: "HOMEWORK_SUBMITTED" }],
      profile: {
        id: "p1",
        studentId: "s1",
        totalXP: 50,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: "[]",
        _version: 1,
      },
      badges: [],
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "checkBadges", arguments: { studentId: "s1" } },
      {} as any,
      vi.fn(),
    );

    expect(result.newBadges).toContain("FIRST_SUBMISSION");
  });

  it("should not re-award existing badges", async () => {
    setupMocks({
      xpLogs: [{ id: "xp1", xpAmount: 50, reason: "HOMEWORK_SUBMITTED" }],
      profile: {
        id: "p1",
        studentId: "s1",
        totalXP: 50,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: JSON.stringify([
          { badgeType: "FIRST_SUBMISSION", awardedAt: "2025-01-01" },
        ]),
        _version: 1,
      },
      badges: [
        { id: "b1", badgeType: "FIRST_SUBMISSION", awardedAt: "2025-01-01" },
      ],
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "checkBadges", arguments: { studentId: "s1" } },
      {} as any,
      vi.fn(),
    );

    expect(result.newBadges).toEqual([]);
  });

  it("should award CONSISTENT badge for 7-day streak XP log", async () => {
    setupMocks({
      xpLogs: [
        { id: "xp1", xpAmount: 50, reason: "HOMEWORK_SUBMITTED" },
        { id: "xp2", xpAmount: 150, reason: "STREAK_7DAY" },
      ],
      profile: {
        id: "p1",
        studentId: "s1",
        totalXP: 200,
        level: 1,
        currentStreak: 7,
        longestStreak: 7,
        badges: "[]",
        _version: 1,
      },
      badges: [],
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "checkBadges", arguments: { studentId: "s1" } },
      {} as any,
      vi.fn(),
    );

    expect(result.newBadges).toContain("CONSISTENT");
    expect(result.newBadges).toContain("FIRST_SUBMISSION");
  });

  it("should skip badges disabled via section gamificationConfig", async () => {
    setupMocks({
      xpLogs: [
        { id: "xp1", xpAmount: 50, reason: "HOMEWORK_SUBMITTED" },
        { id: "xp2", xpAmount: 50, reason: "PERFECT_SCORE" },
        { id: "xp3", xpAmount: 50, reason: "PERFECT_SCORE" },
        { id: "xp4", xpAmount: 50, reason: "PERFECT_SCORE" },
      ],
      profile: {
        id: "p1",
        studentId: "s1",
        totalXP: 200,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: "[]",
        _version: 1,
      },
      badges: [],
    });

    // Override the mock to also handle PlatformSettings and Section queries
    const originalMock = mockGraphql.getMockImplementation();
    mockGraphql.mockImplementation(({ query, variables }: any) => {
      if (query?.includes("listPlatformSettings")) {
        return Promise.resolve({
          data: {
            listPlatformSettings: {
              items: [
                {
                  id: "settings-1",
                  badgesEnabled: true,
                  antiBadgesEnabled: true,
                  badgeConfigs: JSON.stringify([
                    { badgeType: "SHARPSHOOTER", enabled: false },
                  ]),
                  customBadges: null,
                  streakFreezesAllowed: 3,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("getSection")) {
        return Promise.resolve({
          data: {
            getSection: {
              id: "section-1",
              badgesEnabled: true,
              antiBadgesEnabled: true,
              gamificationConfig: null,
            },
          },
        });
      }
      // Fallback to original handler
      return originalMock!({ query, variables });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkBadges",
        arguments: { studentId: "s1", cohortId: "section-1" },
      },
      {} as any,
      vi.fn(),
    );

    // FIRST_SUBMISSION should be awarded (enabled by default)
    expect(result.newBadges).toContain("FIRST_SUBMISSION");
    // SHARPSHOOTER should NOT be awarded (disabled in global badgeConfigs)
    expect(result.newBadges).not.toContain("SHARPSHOOTER");
  });

  it("should return empty when section disables all badges", async () => {
    setupMocks({
      xpLogs: [{ id: "xp1", xpAmount: 50, reason: "HOMEWORK_SUBMITTED" }],
      profile: {
        id: "p1",
        studentId: "s1",
        totalXP: 50,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        badges: "[]",
        _version: 1,
      },
      badges: [],
    });

    const originalMock = mockGraphql.getMockImplementation();
    mockGraphql.mockImplementation(({ query, variables }: any) => {
      if (query?.includes("listPlatformSettings")) {
        return Promise.resolve({
          data: {
            listPlatformSettings: {
              items: [
                { id: "s1", badgesEnabled: true, antiBadgesEnabled: true },
              ],
            },
          },
        });
      }
      if (query?.includes("getSection")) {
        return Promise.resolve({
          data: {
            getSection: {
              id: "section-1",
              badgesEnabled: false,
              antiBadgesEnabled: false,
              gamificationConfig: null,
            },
          },
        });
      }
      return originalMock!({ query, variables });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkBadges",
        arguments: { studentId: "s1", cohortId: "section-1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.newBadges).toEqual([]);
    expect(result.newAntiBadges).toEqual([]);
  });
});
