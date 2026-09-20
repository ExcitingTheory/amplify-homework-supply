import { describe, expect, it } from "vitest";
import getHeadingContext from "./headingContext";

function heading(tag: string, text: string) {
  return {
    type: "heading",
    tag,
    children: [{ type: "text", text }],
  };
}

describe("getHeadingContext", () => {
  it("returns the current heading path and next subsection level", () => {
    const result = getHeadingContext({
      root: {
        children: [
          heading("h1", "Unit"),
          heading("h2", "Greetings"),
          { type: "paragraph", children: [] },
        ],
      },
    });

    expect(result.headingPath).toEqual([
      { level: 1, tag: "h1", text: "Unit" },
      { level: 2, tag: "h2", text: "Greetings" },
    ]);
    expect(result.suggestedNextHeading).toBe("h3");
  });

  it("caps the suggested level at h6", () => {
    const result = getHeadingContext({
      root: { children: [heading("h6", "Deep section")] },
    });

    expect(result.suggestedNextHeading).toBe("h6");
  });

  it("starts at h1 when the document has no headings", () => {
    expect(getHeadingContext(null)).toEqual({
      headingPath: [],
      suggestedNextHeading: "h1",
    });
  });
});