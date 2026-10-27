/**
 * Unit tests for the gamification handler — progress recompute
 *
 * The handler stores module progress in StudentProfile.moduleProgress JSON
 * field via getOrCreateStudentProfile(). `moduleId` is the Section this
 * student is enrolled in (not a Unit) — totalWorkbooks/completedWorkbooks are
 * the distinct units assigned in that section vs. distinct units this student
 * has completed, bounded by this student's own grades (listGradeByOwnerAndSectionID)
 * and the section's own assignment list (listAssignments), never a scan of
 * every student's attempts in the section.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("aws-amplify", () => ({
  Amplify: { configure: vi.fn() },
}));

vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: vi.fn(() =>
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
      if (query?.includes("listGradeByOwnerAndSection")) {
        return Promise.resolve({
          data: {
            listGradeByOwnerAndSectionID: {
              items: [
                { id: "g1", unitID: "unit-a", complete: true },
                { id: "g2", unitID: "unit-b", complete: true },
                { id: "g3", unitID: "unit-c", complete: false },
              ],
            },
          },
        });
      }
      if (query?.includes("listAssignments")) {
        return Promise.resolve({
          data: {
            listAssignments: {
              items: [
                { id: "a1", unitID: "unit-a" },
                { id: "a2", unitID: "unit-b" },
                { id: "a3", unitID: "unit-c" },
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
    expect(result.totalWorkbooks).toBe(3);
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
      if (query?.includes("listGradeByOwnerAndSection")) {
        return Promise.resolve({
          data: {
            listGradeByOwnerAndSectionID: {
              items: [
                { id: "g1", unitID: "unit-a", complete: true },
                { id: "g2", unitID: "unit-b", complete: true },
              ],
            },
          },
        });
      }
      if (query?.includes("listAssignments")) {
        return Promise.resolve({
          data: {
            listAssignments: {
              items: [
                { id: "a1", unitID: "unit-a" },
                { id: "a2", unitID: "unit-b" },
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
      if (query?.includes("listGradeByOwnerAndSection")) {
        return Promise.resolve({
          data: { listGradeByOwnerAndSectionID: { items: [] } },
        });
      }
      if (query?.includes("listAssignments")) {
        return Promise.resolve({
          data: {
            listAssignments: {
              items: [
                { id: "a1", unitID: "unit-a" },
                { id: "a2", unitID: "unit-b" },
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
    expect(result.completedWorkbooks).toBe(0);
    expect(result.completionPercent).toBe(0);
  });
});
