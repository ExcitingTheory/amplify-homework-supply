import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSchemaCache,
  createInputFields,
  modelSelection,
  pickInputFields,
} from "./schemaSelection";
import { introspectionResult } from "./fakeSchema";

const run = vi.fn(async (_query: string, variables?: Record<string, unknown>) =>
  introspectionResult(String(variables?.name)),
);

beforeEach(() => {
  clearSchemaCache();
  run.mockClear();
});

describe("modelSelection", () => {
  it("selects every stored field, including lists and custom types", async () => {
    const selection = await modelSelection(run, "Unit");
    const tokens = selection.split(/\s+/);

    for (const field of ["id", "owner", "name", "_version", "deletedAt", "deletedBy", "tags", "createdAt", "updatedAt"]) {
      expect(tokens).toContain(field);
    }
    expect(selection).toContain("settings { mode palette { primary } }");
  });

  it("leaves out relations to other models and connections", async () => {
    const selection = await modelSelection(run, "Unit");
    expect(selection).not.toContain("section");
    expect(selection).not.toContain("unitFiles");
  });

  it("selects the fields of a list of custom types", async () => {
    expect(await modelSelection(run, "ParsedContent")).toContain("questionsJSON { prompt answer page }");
    expect(await modelSelection(run, "ParsedContent")).not.toMatch(/\bdocument\b \{/);
  });

  it("learns each type once", async () => {
    await modelSelection(run, "DocumentQuestion");
    const calls = run.mock.calls.length;
    await modelSelection(run, "DocumentQuestion");
    expect(run.mock.calls.length).toBe(calls);
  });

  it("fails for a type that is not in the schema, and asks again next time", async () => {
    await expect(modelSelection(run, "Nope")).rejects.toThrow("Type Nope is not in the schema");
    await expect(modelSelection(run, "Nope")).rejects.toThrow("Type Nope is not in the schema");
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe("createInputFields", () => {
  it("lists what the create mutation accepts, which has no timestamps", async () => {
    const accepted = await createInputFields(run, "Unit");
    expect(accepted.has("name")).toBe(true);
    expect(accepted.has("createdAt")).toBe(false);
    expect(accepted.has("updatedAt")).toBe(false);
  });
});

describe("pickInputFields", () => {
  it("keeps only accepted fields and keeps nulls", () => {
    expect(
      pickInputFields({ id: "1", name: "a", createdAt: "x", deletedAt: null }, new Set(["id", "name", "deletedAt"])),
    ).toEqual({ id: "1", name: "a", deletedAt: null });
  });
});
