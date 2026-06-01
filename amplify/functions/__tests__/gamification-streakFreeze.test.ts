/**
 * Unit tests for the gamification handler — streak freeze/comeback logic
 *
 * The handler now stores streak data directly on StudentProfile via
 * getOrCreateStudentProfile(), not a separate StudentStreak model.
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
  lastActivityDate: null,
  badges: "[]",
  personalBests: "[]",
  moduleProgress: "[]",
  freezesRemaining: 0,
  freezesUsed: 0,
  _version: 1,
  ...overrides,
});

describe("gamification handler — updateStreak (freeze/comeback)", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should create a new streak with freezesRemaining=0 for first activity", async () => {
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

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "updateStreak", arguments: { studentId: "student-1" } },
      {} as any,
      vi.fn(),
    );

    expect(result.currentStreak).toBe(1);
  });

  it("should use a freeze when student missed exactly 1 day", async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const lastActivityDate = twoDaysAgo.toISOString().split("T")[0];

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [
                baseProfile({
                  currentStreak: 5,
                  longestStreak: 5,
                  lastActivityDate,
                  freezesRemaining: 1,
                  freezesUsed: 0,
                }),
              ],
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

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "updateStreak", arguments: { studentId: "student-1" } },
      {} as any,
      vi.fn(),
    );

    expect(result.freezeUsed).toBe(true);
  });

  it("should break the streak when missed 2+ days without freeze", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const lastActivityDate = threeDaysAgo.toISOString().split("T")[0];

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [
                baseProfile({
                  currentStreak: 10,
                  longestStreak: 10,
                  lastActivityDate,
                  freezesRemaining: 0,
                  freezesUsed: 0,
                }),
              ],
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

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "updateStreak", arguments: { studentId: "student-1" } },
      {} as any,
      vi.fn(),
    );

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10);
  });

  it("should trigger comeback when returning after 7+ days", async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const lastActivityDate = tenDaysAgo.toISOString().split("T")[0];

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [
                baseProfile({
                  currentStreak: 5,
                  longestStreak: 12,
                  lastActivityDate,
                  freezesRemaining: 0,
                  freezesUsed: 0,
                }),
              ],
            },
          },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: { updateStudentProfile: { id: "profile-1", _version: 2 } },
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
            createStudentXPLog: { id: "xp1", xpAmount: 50, reason: "COMEBACK" },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "updateStreak", arguments: { studentId: "student-1" } },
      {} as any,
      vi.fn(),
    );

    expect(result.comebackTriggered).toBe(true);
    expect(result.currentStreak).toBe(1);
  });

  it("should award a freeze at 7-day milestone", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastActivityDate = yesterday.toISOString().split("T")[0];

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [
                baseProfile({
                  currentStreak: 6,
                  longestStreak: 6,
                  lastActivityDate,
                  freezesRemaining: 0,
                  freezesUsed: 0,
                }),
              ],
            },
          },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: { updateStudentProfile: { id: "profile-1", _version: 2 } },
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
            createStudentXPLog: {
              id: "xp1",
              xpAmount: 75,
              reason: "STREAK_7DAY",
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      { fieldName: "updateStreak", arguments: { studentId: "student-1" } },
      {} as any,
      vi.fn(),
    );

    // The update input should have had freezesRemaining: 1
    const updateCall = mockGraphql.mock.calls.find((call: any) => {
      const query = call[0]?.query;
      return (
        typeof query === "string" && query.includes("updateStudentProfile")
      );
    });
    expect(updateCall).toBeDefined();
    const input = updateCall?.[0]?.variables?.input;
    expect(input?.freezesRemaining).toBe(1);
    expect(input?.currentStreak).toBe(7);
  });
});
