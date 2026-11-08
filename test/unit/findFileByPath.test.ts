import { describe, expect, it, vi } from "vitest";
import { findFileByPath } from "../../amplify/functions/shared/findFileByPath";

const KEY = "protected/us-east-1:abc/files/cell-biology.pdf";
const FILE = { id: "f1", path: KEY, mimeType: "application/pdf", _version: 2 };

/** A client whose index query is unknown, as before the index is deployed. */
const indexMissing = () => ({ errors: [{ message: "Unknown field listFileByPath" }] });

describe("findFileByPath", () => {
  it("reads the file straight from the byPath index", async () => {
    const graphql = vi.fn(async ({ query, variables }: any) => {
      expect(query).toContain("listFileByPath");
      expect(variables.path).toBe(KEY);
      return { data: { listFileByPath: { items: [FILE], nextToken: null } } };
    });

    expect(await findFileByPath({ graphql }, KEY)).toEqual(FILE);
    // The index answers it; no scan is needed.
    expect(graphql).toHaveBeenCalledTimes(1);
  });

  it("falls back to a scan when the index is not deployed yet", async () => {
    const graphql = vi.fn(async ({ query, variables }: any) => {
      if (query.includes("listFileByPath")) return indexMissing();
      expect(variables.filter).toEqual({ path: { eq: KEY } });
      return { data: { listFiles: { items: [FILE], nextToken: null } } };
    });

    expect(await findFileByPath({ graphql }, KEY)).toEqual(FILE);
  });

  it("finds a file that is not on the first page of the scan", async () => {
    // The original bug: the query stopped at the first page, so a file further
    // down the table was reported as missing and never processed.
    const graphql = vi.fn(async ({ query, variables }: any) => {
      if (query.includes("listFileByPath")) return indexMissing();
      if (!variables.nextToken) {
        return { data: { listFiles: { items: [], nextToken: "page-2" } } };
      }
      return { data: { listFiles: { items: [FILE], nextToken: null } } };
    });

    expect(await findFileByPath({ graphql }, KEY)).toEqual(FILE);
  });

  it("follows the index's own pages too", async () => {
    const graphql = vi.fn(async ({ query, variables }: any) => {
      if (!query.includes("listFileByPath")) throw new Error("should not scan");
      if (!variables.nextToken) {
        return { data: { listFileByPath: { items: [], nextToken: "page-2" } } };
      }
      return { data: { listFileByPath: { items: [FILE], nextToken: null } } };
    });

    expect(await findFileByPath({ graphql }, KEY)).toEqual(FILE);
  });

  it("ignores a record that is in the recycle bin", async () => {
    const graphql = vi.fn(async () => ({
      data: {
        listFileByPath: {
          items: [{ ...FILE, _deleted: true }, { ...FILE, id: "f2" }],
          nextToken: null,
        },
      },
    }));

    expect(await findFileByPath({ graphql }, KEY)).toMatchObject({ id: "f2" });
  });

  it("returns nothing when the key really has no file", async () => {
    const graphql = vi.fn(async ({ query }: any) =>
      query.includes("listFileByPath")
        ? { data: { listFileByPath: { items: [], nextToken: null } } }
        : { data: { listFiles: { items: [], nextToken: null } } },
    );

    expect(await findFileByPath({ graphql }, KEY)).toBeNull();
  });

  it("survives the index query throwing rather than returning errors", async () => {
    const graphql = vi.fn(async ({ query }: any) => {
      if (query.includes("listFileByPath")) throw new Error("ValidationException");
      return { data: { listFiles: { items: [FILE], nextToken: null } } };
    });

    expect(await findFileByPath({ graphql }, KEY)).toEqual(FILE);
  });

  it("never asks for a single row, which would filter before matching", async () => {
    // DynamoDB applies `limit` to rows scanned, not rows returned, so a
    // limit of 1 with a filter reads one row and reports no match.
    const seen: string[] = [];
    const graphql = vi.fn(async ({ query }: any) => {
      seen.push(query);
      return query.includes("listFileByPath")
        ? indexMissing()
        : { data: { listFiles: { items: [FILE], nextToken: null } } };
    });

    await findFileByPath({ graphql }, KEY);
    expect(seen.some((query) => /limit:\s*1\b/.test(query))).toBe(false);
  });
});
