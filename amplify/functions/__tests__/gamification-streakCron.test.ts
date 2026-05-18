/**
 * Unit tests for the streak reset cron handler
 *
 * The handler now queries listStudentProfiles and updates StudentProfile directly,
 * not a separate StudentStreak model.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

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

describe("streakResetCron handler", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should export a handler function", async () => {
    const { handler } = await import("../streakResetCron/handler");
    expect(handler).toBeDefined();
  });

  it("should reset streaks older than yesterday", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfiles")) {
        return Promise.resolve({
          data: {
            listStudentProfiles: {
              items: [
                {
                  id: "p1",
                  studentId: "u1",
                  currentStreak: 5,
                  longestStreak: 10,
                  lastActivityDate: "2025-03-10",
                  _version: 1,
                },
                {
                  id: "p2",
                  studentId: "u2",
                  currentStreak: 3,
                  longestStreak: 3,
                  lastActivityDate: "2025-03-14",
                  _version: 1,
                },
              ],
              nextToken: null,
            },
          },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: { updateStudentProfile: { id: "p1", currentStreak: 0 } },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../streakResetCron/handler");
    const result = await handler({}, {} as any, vi.fn());

    expect(JSON.parse(result.body).resetCount).toBe(1);
    // Should have called graphql twice: list + 1 update
    expect(mockGraphql).toHaveBeenCalledTimes(2);
  });

  it("should skip streaks that are already 0", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));

    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listStudentProfiles")) {
        return Promise.resolve({
          data: {
            listStudentProfiles: {
              items: [
                {
                  id: "p1",
                  studentId: "u1",
                  currentStreak: 0,
                  longestStreak: 5,
                  lastActivityDate: "2025-03-01",
                  _version: 1,
                },
              ],
              nextToken: null,
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../streakResetCron/handler");
    const result = await handler({}, {} as any, vi.fn());

    expect(JSON.parse(result.body).resetCount).toBe(0);
    expect(mockGraphql).toHaveBeenCalledTimes(1); // Only the list query
  });

  it("should paginate through all streak records", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-15T12:00:00Z"));

    let listCallCount = 0;
    mockGraphql.mockImplementation(({ query, variables }: any) => {
      if (query?.includes("listStudentProfiles")) {
        listCallCount++;
        if (listCallCount === 1) {
          return Promise.resolve({
            data: {
              listStudentProfiles: {
                items: [
                  {
                    id: "p1",
                    studentId: "u1",
                    currentStreak: 2,
                    longestStreak: 5,
                    lastActivityDate: "2025-03-01",
                    _version: 1,
                  },
                ],
                nextToken: "page2token",
              },
            },
          });
        }
        return Promise.resolve({
          data: {
            listStudentProfiles: {
              items: [
                {
                  id: "p2",
                  studentId: "u2",
                  currentStreak: 1,
                  longestStreak: 1,
                  lastActivityDate: "2025-03-05",
                  _version: 1,
                },
              ],
              nextToken: null,
            },
          },
        });
      }
      if (query?.includes("updateStudentProfile")) {
        return Promise.resolve({
          data: {
            updateStudentProfile: {
              id: variables?.input?.id,
              currentStreak: 0,
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../streakResetCron/handler");
    const result = await handler({}, {} as any, vi.fn());

    expect(JSON.parse(result.body).resetCount).toBe(2);
    expect(mockGraphql).toHaveBeenCalledTimes(4);
  });
});
