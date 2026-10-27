import { describe, expect, it, vi } from "vitest";
import {
  extractTextBlocks,
  publishedUnitContentKey,
  readPublishedUnitContent,
  summarizeUnitText,
} from "../../../amplify/functions/shared/unitContent";

const lexical = (...texts: string[]) =>
  JSON.stringify({
    root: {
      children: texts.map((text) => ({
        type: "paragraph",
        children: [{ type: "text", text }],
      })),
    },
  });

describe("readPublishedUnitContent", () => {
  it("reads the type-scoped published.json from the configured bucket", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: { transformToString: async () => "content" },
    });
    expect(
      await readPublishedUnitContent("unit-1", { s3: { send }, bucket: "b" }),
    ).toBe("content");
    const command = send.mock.calls[0][0];
    expect(command.input).toEqual({
      Bucket: "b",
      Key: "protected/units/unit-1/published.json",
    });
    expect(publishedUnitContentKey("unit-1")).toBe(
      "protected/units/unit-1/published.json",
    );
  });

  it("returns null without a bucket or when the read fails", async () => {
    const send = vi.fn().mockRejectedValue(new Error("NoSuchKey"));
    expect(await readPublishedUnitContent("u", { s3: { send }, bucket: "b" })).toBeNull();
    const unused = vi.fn();
    expect(await readPublishedUnitContent("u", { s3: { send: unused }, bucket: "" })).toBeNull();
    expect(unused).not.toHaveBeenCalled();
  });
});

describe("extractTextBlocks", () => {
  it("collects text runs and skips tiny fragments", () => {
    const doc = JSON.parse(lexical("The water cycle moves water.", "ok", "Evaporation lifts vapor."));
    expect(extractTextBlocks(doc)).toEqual([
      "The water cycle moves water.",
      "Evaporation lifts vapor.",
    ]);
    expect(extractTextBlocks(null)).toEqual([]);
  });
});

describe("summarizeUnitText", () => {
  it("joins blocks one per line", () => {
    expect(summarizeUnitText(lexical("First long paragraph.", "Second long paragraph."), 1000)).toBe(
      "First long paragraph.\nSecond long paragraph.",
    );
  });

  it("cuts long text at a word boundary and marks the cut", () => {
    const text = summarizeUnitText(lexical(Array(40).fill("alpha").join(" ")), 100);
    expect(text.endsWith("alpha…")).toBe(true);
    expect(text.length).toBeLessThanOrEqual(101);
    expect(text).not.toMatch(/alp…$/);
  });

  it("returns an empty string for missing or unparseable content", () => {
    expect(summarizeUnitText(null, 100)).toBe("");
    expect(summarizeUnitText("{bad", 100)).toBe("");
    expect(summarizeUnitText(JSON.stringify({}), 100)).toBe("");
  });
});
