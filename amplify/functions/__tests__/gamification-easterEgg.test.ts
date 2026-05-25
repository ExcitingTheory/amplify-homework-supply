/**
 * Unit tests for the gamification handler — easter egg detection & discovery
 *
 * The handler now embeds discoveries directly in EasterEgg.discoveries array
 * instead of a separate EasterEggDiscovery model. checkEasterEggs checks the
 * discoveries array on the egg itself. discoverEasterEgg reads via getEasterEgg.
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

describe("gamification handler — checkEasterEggs", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should return empty discovered array when no active easter eggs", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listEasterEggs")) {
        return Promise.resolve({ data: { listEasterEggs: { items: [] } } });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkEasterEggs",
        arguments: { studentId: "student-1", submissionText: "hello world" },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.discovered).toEqual([]);
  });

  it("should discover keyword-based easter egg on match", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listEasterEggs")) {
        return Promise.resolve({
          data: {
            listEasterEggs: {
              items: [
                {
                  id: "egg-1",
                  trigger: "KEYWORD",
                  triggerValue: "photosynthesis",
                  xpReward: 50,
                  badgeId: null,
                  revealMessage: "You found a science secret!",
                  active: true,
                  discoveries: [],
                  _version: 1,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("updateEasterEgg")) {
        return Promise.resolve({
          data: { updateEasterEgg: { id: "egg-1", _version: 2 } },
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
            createStudentXPLog: { id: "xp-1", xpAmount: 50, _version: 1 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkEasterEggs",
        arguments: {
          studentId: "student-1",
          submissionText: "I learned about photosynthesis today!",
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.discovered).toHaveLength(1);
    expect(result.discovered[0].eggId).toBe("egg-1");
    expect(result.discovered[0].message).toBe("You found a science secret!");
    expect(result.discovered[0].xpReward).toBe(50);
  });

  it("should skip already-discovered eggs", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listEasterEggs")) {
        return Promise.resolve({
          data: {
            listEasterEggs: {
              items: [
                {
                  id: "egg-1",
                  trigger: "KEYWORD",
                  triggerValue: "secret",
                  xpReward: 25,
                  revealMessage: "Found it!",
                  active: true,
                  discoveries: [
                    {
                      studentId: "student-1",
                      discoveredAt: "2026-04-01T00:00:00Z",
                    },
                  ],
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
        fieldName: "checkEasterEggs",
        arguments: {
          studentId: "student-1",
          submissionText: "this has a secret keyword",
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.discovered).toEqual([]);
  });

  it("should be case-insensitive for keyword matching", async () => {
    mockGraphql.mockImplementation(({ query }: any) => {
      if (query?.includes("listEasterEggs")) {
        return Promise.resolve({
          data: {
            listEasterEggs: {
              items: [
                {
                  id: "egg-2",
                  trigger: "KEYWORD",
                  triggerValue: "EUREKA",
                  xpReward: 10,
                  revealMessage: "Eureka!",
                  active: true,
                  discoveries: [],
                  _version: 1,
                },
              ],
            },
          },
        });
      }
      if (query?.includes("updateEasterEgg")) {
        return Promise.resolve({
          data: { updateEasterEgg: { id: "egg-2", _version: 2 } },
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
            createStudentXPLog: { id: "xp-2", xpAmount: 10, _version: 1 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "checkEasterEggs",
        arguments: {
          studentId: "student-1",
          submissionText: "I had a eureka moment!",
        },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.discovered).toHaveLength(1);
    expect(result.discovered[0].eggId).toBe("egg-2");
  });
});

describe("gamification handler — discoverEasterEgg", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGraphql.mockReset();
    process.env.API_ENDPOINT = "http://localhost/graphql";
    process.env.AWS_REGION = "us-east-1";
  });

  it("should return alreadyDiscovered true when egg already found", async () => {
    // getEasterEgg returns egg with student already in discoveries
    mockGraphql.mockResolvedValueOnce({
      data: {
        getEasterEgg: {
          id: "egg-1",
          trigger: "SECRET_LINK",
          xpReward: 100,
          revealMessage: "Secret unlocked!",
          active: true,
          discoveries: [
            { studentId: "student-1", discoveredAt: "2026-04-01T00:00:00Z" },
          ],
          _version: 1,
        },
      },
    });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "discoverEasterEgg",
        arguments: { studentId: "student-1", eggId: "egg-1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.alreadyDiscovered).toBe(true);
  });

  it("should create discovery and award XP for new egg", async () => {
    // getEasterEgg returns egg with no discoveries for this student
    mockGraphql
      .mockResolvedValueOnce({
        data: {
          getEasterEgg: {
            id: "egg-1",
            trigger: "SECRET_LINK",
            xpReward: 100,
            revealMessage: "Secret unlocked!",
            active: true,
            discoveries: [],
            _version: 1,
          },
        },
      })
      // updateEasterEgg (embed discovery)
      .mockResolvedValueOnce({
        data: { updateEasterEgg: { id: "egg-1", _version: 2 } },
      })
      // handleAwardXP: listStudentXPLogByStudentId
      .mockResolvedValueOnce({
        data: { listStudentXPLogByStudentId: { items: [] } },
      })
      // handleAwardXP: createStudentXPLog
      .mockResolvedValueOnce({
        data: {
          createStudentXPLog: { id: "xp-1", xpAmount: 100, _version: 1 },
        },
      })
      // Catch-all
      .mockResolvedValue({ data: {} });

    const { handler } = await import("../gamification/handler");
    const result = await handler(
      {
        fieldName: "discoverEasterEgg",
        arguments: { studentId: "student-1", eggId: "egg-1" },
      },
      {} as any,
      vi.fn(),
    );

    expect(result.alreadyDiscovered).toBe(false);
    expect(result.message).toBe("Secret unlocked!");
    expect(result.xpReward).toBe(100);
  });
});
