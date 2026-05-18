/**
 * Unit tests for the gamification handler — personal best check
 *
 * The handler now stores personal bests in StudentProfile.personalBests JSON
 * field via getOrCreateStudentProfile(), not a separate model.
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
  freezesRemaining: 0,
  freezesUsed: 0,
  _version: 1,
  ...overrides,
});

describe("gamification handler — checkPersonalBest", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should create a new PB record on first attempt", async () => {
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
      {
        fieldName: "checkPersonalBest",
        arguments: { studentId: "student-1", unitID: "unit-1", score: 85 },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.isNewBest).toBe(true);
    expect(result.firstAttempt).toBe(true);
    expect(result.bestScore).toBe(85);
    expect(result.previousBest).toBeNull();
  });

  it("should update PB when score is higher", async () => {
    const existingPBs = JSON.stringify([
      {
        unitID: "unit-1",
        bestScore: 80,
        achievedAt: "2026-04-20T10:00:00Z",
        previousBest: null,
      },
    ]);

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [baseProfile({ personalBests: existingPBs })],
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
          data: { createStudentXPLog: { id: "xp1", xpAmount: 25 } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkPersonalBest",
        arguments: { studentId: "student-1", unitID: "unit-1", score: 92 },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.isNewBest).toBe(true);
    expect(result.firstAttempt).toBe(false);
    expect(result.bestScore).toBe(92);
    expect(result.previousBest).toBe(80);
  });

  it("should not update when score is lower than PB", async () => {
    const existingPBs = JSON.stringify([
      {
        unitID: "unit-1",
        bestScore: 90,
        achievedAt: "2026-04-20T10:00:00Z",
        previousBest: 85,
      },
    ]);

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [baseProfile({ personalBests: existingPBs })],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkPersonalBest",
        arguments: { studentId: "student-1", unitID: "unit-1", score: 75 },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.isNewBest).toBe(false);
    expect(result.bestScore).toBe(90);
  });

  it("should not update when score equals PB", async () => {
    const existingPBs = JSON.stringify([
      {
        unitID: "unit-1",
        bestScore: 90,
        achievedAt: "2026-04-20T10:00:00Z",
        previousBest: 80,
      },
    ]);

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [baseProfile({ personalBests: existingPBs })],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkPersonalBest",
        arguments: { studentId: "student-1", unitID: "unit-1", score: 90 },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.isNewBest).toBe(false);
    expect(result.bestScore).toBe(90);
  });
});
