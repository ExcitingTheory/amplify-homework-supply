import { describe, it, expect, vi } from "vitest";
import {
  buildSearchBundleRequest,
  listSectionUnits,
  listUnitMembers,
} from "../publishUnit/searchBundleRequest";

type Rows = Record<string, any[]>;

/** Serves each list in pages of `pageSize`, keyed by the query's list field. */
function fakeGraphql(rows: Rows, pageSize = 2) {
  return vi.fn(async ({ query, variables }: any) => {
    const field = /list\w+/.exec(query)![0];
    let source = rows[field];
    if (field === "listAssignments") {
      source = variables.unitID
        ? rows.assignmentsByUnit
        : rows[`assignments:${variables.sectionID}`];
    }
    const start = variables.nextToken ? Number(variables.nextToken) : 0;
    const end = start + pageSize;
    return {
      data: {
        [field]: {
          items: source.slice(start, end),
          nextToken: end < source.length ? String(end) : null,
        },
      },
    };
  });
}

describe("listUnitMembers", () => {
  it("collects every page and drops soft-deleted joins", async () => {
    const graphql = fakeGraphql({
      listUnitWords: [
        { wordID: "w1" },
        { wordID: "w2", deletedAt: "2026-01-01" },
        { wordID: "w3" },
        { wordID: "w4" },
        null,
      ],
      listQuestionUnits: [{ questionID: "q1" }],
      listUnitFiles: [{ fileID: "f1" }, { fileID: "f2" }, { fileID: "f3" }],
    });

    expect(await listUnitMembers(graphql, "u1")).toEqual({
      word: ["w1", "w3", "w4"],
      question: ["q1"],
      file: ["f1", "f2", "f3"],
    });
  });

  it("fails loudly instead of publishing an empty member list", async () => {
    const graphql = vi.fn(async () => ({ data: null, errors: [{ message: "boom" }] }));
    await expect(listUnitMembers(graphql as any, "u1")).rejects.toThrow(/boom/);
  });
});

describe("listSectionUnits", () => {
  it("lists each assigning section once with all of its units", async () => {
    const graphql = fakeGraphql({
      assignmentsByUnit: [{ sectionID: "s1" }, { sectionID: "s2" }, { sectionID: "s1" }],
      "assignments:s1": [{ unitID: "u1" }, { unitID: "u2" }, { unitID: "u3" }],
      "assignments:s2": [{ unitID: "u2" }],
    });

    const sections = await listSectionUnits(graphql, "u1");
    expect(sections).toEqual([
      { sectionId: "s1", unitIds: ["u1", "u2", "u3"] },
      // The published unit is always included, even before its assignment is readable.
      { sectionId: "s2", unitIds: ["u2", "u1"] },
    ]);
  });

  it("returns nothing for a unit no section assigns", async () => {
    const graphql = fakeGraphql({ assignmentsByUnit: [] });
    expect(await listSectionUnits(graphql, "u1")).toEqual([]);
  });
});

describe("buildSearchBundleRequest", () => {
  it("assembles the Lambda payload", async () => {
    const graphql = fakeGraphql({
      listUnitWords: [{ wordID: "w1" }],
      listQuestionUnits: [],
      listUnitFiles: [],
      assignmentsByUnit: [{ sectionID: "s1" }],
      "assignments:s1": [{ unitID: "u1" }],
    });

    expect(
      await buildSearchBundleRequest(graphql, { id: "u1", name: "Plants", identityId: "id-a" }),
    ).toEqual({
      source: "unit-publish",
      identityId: "id-a",
      unitId: "u1",
      unitName: "Plants",
      members: { word: ["w1"], question: [], file: [] },
      sections: [{ sectionId: "s1", unitIds: ["u1"] }],
    });
  });
});
