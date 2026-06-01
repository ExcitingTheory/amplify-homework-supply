/**
 * Unit tests for the gamification handler — progress recompute
 *
 * The handler now stores module progress in StudentProfile.moduleProgress JSON
 * field via getOrCreateStudentProfile(), not a separate StudentProgress model.
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

describe("gamification handler — recomputeProgress", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should create progress record when none exists", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
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
                  owner: "student-1",
                  sectionID: "sec1",
                  complete: true,
                  accuracy: 85,
                  _version: 1,
                },
                {
                  id: "g3",
                  owner: "student-1",
                  sectionID: "sec1",
                  complete: false,
                  accuracy: 0,
                  _version: 1,
                },
                {
                  id: "g4",
                  owner: "student-2",
                  sectionID: "sec1",
                  complete: true,
                  accuracy: 88,
                  _version: 1,
                },
              ],
            },
          },
        });
      }
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
        fieldName: "recomputeProgress",
        arguments: { studentId: "student-1", moduleId: "sec1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.created).toBe(true);
    expect(result.completedWorkbooks).toBe(2);
    expect(result.completionPercent).toBe(67);
  });

  it("should update existing progress record", async () => {
    const existingProgress = JSON.stringify([
      {
        moduleId: "sec1",
        completionPercent: 50,
        totalWorkbooks: 2,
        completedWorkbooks: 1,
      },
    ]);

    mockGraphql.mockImplementation(({ query }: any) => {
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
                  owner: "student-1",
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
      if (query?.includes("listStudentProfileByStudentId")) {
        return Promise.resolve({
          data: {
            listStudentProfileByStudentId: {
              items: [baseProfile({ moduleProgress: existingProgress })],
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
      {
        fieldName: "recomputeProgress",
        arguments: { studentId: "student-1", moduleId: "sec1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.updated).toBe(true);
    expect(result.completionPercent).toBe(100);
    expect(result.completedWorkbooks).toBe(2);
  });

  it("should handle zero grades gracefully", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listGradeBySectionID")) {
        return Promise.resolve({
          data: { listGradeBySectionID: { items: [] } },
        });
      }
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
        fieldName: "recomputeProgress",
        arguments: { studentId: "student-1", moduleId: "sec1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.created).toBe(true);
    expect(result.completionPercent).toBe(0);
  });
});
