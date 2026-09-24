import { describe, expect, it } from "vitest";
import {
  createLanguageEditorTheme,
  mergeEditorTheme,
} from "../../components/Editor3/config/LanguageEditorTheme";

describe("LanguageEditorTheme", () => {
  it("keeps semantic defaults while applying nested overrides", () => {
    const theme = createLanguageEditorTheme({
      heading: { h1: "CustomHeading" },
      text: { bold: "CustomBold" },
    });

    expect(theme.heading.h1).toBe("CustomHeading");
    expect(theme.heading.h2).toBe("LanguageEditorTheme__h2");
    expect(theme.text.bold).toBe("CustomBold");
    expect(theme.text.italic).toBe("LanguageEditorTheme__textItalic");
  });

  it("replaces arrays instead of merging array indexes", () => {
    const theme = mergeEditorTheme(
      { list: { olDepth: ["one", "two", "three"] } },
      { list: { olDepth: ["custom-one"] } },
    );

    expect(theme.list.olDepth).toEqual(["custom-one"]);
  });

  it("allows new override keys without mutating the defaults", () => {
    const baseTheme = { paragraph: "paragraph" };
    const theme = mergeEditorTheme(baseTheme, { customBlock: "custom" });

    expect(theme).toEqual({ paragraph: "paragraph", customBlock: "custom" });
    expect(baseTheme).toEqual({ paragraph: "paragraph" });
  });
});
