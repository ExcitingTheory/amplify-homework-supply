import { describe, expect, it, vi } from "vitest";
import {
  collectAll,
  findExistingByField,
  listUnitLinkIds,
  mapWithConcurrency,
  matchKey,
  singleFlight,
} from "../../src/utils/importBatch";

describe("mapWithConcurrency", () => {
  it("keeps results in input order however the tasks finish", async () => {
    const results = await mapWithConcurrency([30, 10, 20, 0], 3, async (delay, index) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return `${index}:${delay}`;
    });
    expect(results).toEqual(["0:30", "1:10", "2:20", "3:0"]);
  });

  it("never runs more than the limit at once", async () => {
    let running = 0;
    let peak = 0;
    await mapWithConcurrency(Array.from({ length: 20 }), 5, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running -= 1;
    });
    expect(peak).toBe(5);
  });

  it("does nothing when there is nothing to do", async () => {
    const task = vi.fn();
    expect(await mapWithConcurrency([], 5, task)).toEqual([]);
    expect(task).not.toHaveBeenCalled();
  });
});

describe("collectAll", () => {
  it("follows every page", async () => {
    const pages: Record<string, any> = {
      undefined: { data: [1, 2], nextToken: "a" },
      a: { data: [3], nextToken: "b" },
      b: { data: [4, null], nextToken: null },
    };
    const run = vi.fn(async (token?: string) => pages[String(token)]);
    expect(await collectAll<number>(run)).toEqual([1, 2, 3, 4]);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("raises what the query reported rather than returning a short list", async () => {
    await expect(
      collectAll(async () => ({ data: [], errors: [{ message: "Not authorized" }] }), "list words"),
    ).rejects.toThrow("Could not list words: Not authorized");
  });
});

describe("findExistingByField", () => {
  it("asks for the values being imported in batches, not one query per value", async () => {
    const list = vi.fn(async ({ filter }: any) => ({
      data: filter.or
        .map(({ phrase }: any) => phrase.eq)
        .filter((value: string) => value === "Known")
        .map((value: string) => ({ id: "w1", phrase: value })),
    }));
    const values = Array.from({ length: 45 }, (_, index) => `Word${index}`);

    const found = await findExistingByField({ list } as any, "phrase", [...values, "Known"]);

    // 46 values at 20 per query.
    expect(list).toHaveBeenCalledTimes(3);
    expect(found.get("known")).toMatchObject({ id: "w1" });
    expect(found.has("word0")).toBe(false);
  });

  it("matches on case and spacing, and ignores blanks", async () => {
    const list = vi.fn(async () => ({ data: [{ id: "w1", phrase: "  Golgi   Apparatus " }] }));
    const found = await findExistingByField({ list } as any, "phrase", ["Golgi Apparatus", "", "  "]);
    expect(list.mock.calls[0][0].filter.or).toEqual([{ phrase: { eq: "Golgi Apparatus" } }]);
    expect(found.get("golgi apparatus")).toMatchObject({ id: "w1" });
  });

  it("asks nothing when there is nothing to look up", async () => {
    const list = vi.fn();
    expect((await findExistingByField({ list } as any, "phrase", [])).size).toBe(0);
    expect(list).not.toHaveBeenCalled();
  });
});

describe("listUnitLinkIds", () => {
  it("indexes a unit's live links by the item they point at", async () => {
    const list = vi.fn(async () => ({
      data: [
        { id: "uw1", wordID: "w1" },
        { id: "uw2", wordID: "w2", _deleted: true },
      ],
    }));
    const links = await listUnitLinkIds({ list } as any, "unitID", "unit-1", "wordID");
    expect(list.mock.calls[0][0].filter).toEqual({ unitID: { eq: "unit-1" } });
    expect(links.has("w1")).toBe(true);
    // A link in the recycle bin is not a link.
    expect(links.has("w2")).toBe(false);
  });
});

describe("singleFlight", () => {
  it("runs one call per key and gives every caller the same result", async () => {
    const create = vi.fn(async (key: string) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return `made-${key}`;
    });
    const once = singleFlight<string>();

    const [a, b, c] = await Promise.all([
      once("x", () => create("x")),
      once("x", () => create("x")),
      once("y", () => create("y")),
    ]);

    expect(create).toHaveBeenCalledTimes(2);
    expect([a, b, c]).toEqual(["made-x", "made-x", "made-y"]);
  });
});

describe("matchKey", () => {
  it("ignores case, surrounding space and repeated spaces", () => {
    expect(matchKey("  Golgi   Apparatus ")).toBe("golgi apparatus");
    expect(matchKey(null)).toBe("");
  });
});
