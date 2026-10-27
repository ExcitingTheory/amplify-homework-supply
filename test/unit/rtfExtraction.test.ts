import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rtfToText } from "../../amplify/functions/documentAnalysis/rtfExtraction";

const rtf = (body: string, header = "\\ansi\\ansicpg1252\\deff0") =>
  `{\\rtf1${header}${body}}`;

describe("rtfToText", () => {
  it("rejects input that is not RTF", () => {
    expect(() => rtfToText("plain text")).toThrow("Invalid RTF");
  });

  it("extracts paragraphs and ignores formatting, font and colour tables", () => {
    const text = rtfToText(
      rtf(
        "{\\fonttbl{\\f0 Times New Roman;}}{\\colortbl;\\red0\\green0\\blue0;}" +
          "\\pard\\qc\\b\\fs32 Title\\par\\pard\\b0 Body text.\\par",
      ),
    );
    expect(text).toBe("Title\nBody text.");
  });

  it("decodes code-page hex escapes", () => {
    expect(rtfToText(rtf("Caf\\'e9 na\\'efve\\par"))).toBe("Café naïve");
  });

  it("decodes Unicode escapes and drops their fallback characters", () => {
    expect(
      rtfToText(rtf("dash \\u8212? and pi \\u960? done\\par")),
    ).toBe("dash — and pi π done");
    expect(rtfToText(rtf("\\uc2\\u8212\\'3f\\'3f ok"))).toBe("— ok");
    expect(rtfToText(rtf("\\uc0\\u8212  ok"))).toBe("— ok");
    expect(rtfToText(rtf("\\u-10179?\\u-8704? ok"))).toBe("\u{1F600} ok");
  });

  it("emits typographic symbols", () => {
    expect(
      rtfToText(
        rtf("\\ldblquote Hi\\rdblquote \\emdash it\\rquote s\\bullet x\\par"),
      ),
    ).toBe("“Hi”—it’s•x");
  });

  it("never leaks embedded pictures, field instructions or generator metadata", () => {
    const text = rtfToText(
      rtf(
        "{\\*\\generator Word 16;}{\\info{\\title SECRET}}" +
          "before{\\pict\\wmetafile8 0102030405060708090a}after\\par" +
          '{\\field{\\*\\fldinst HYPERLINK "http://x.test"}{\\fldrslt link text}} end\\par',
      ),
    );
    expect(text).toBe("beforeafter\nlink text end");
  });

  it("skips binary data declared with \\bin", () => {
    expect(rtfToText(rtf("a\\bin5 {}}\\\\ b"))).toBe("a b");
  });

  it("separates table cells and rows", () => {
    const text = rtfToText(
      rtf(
        "\\trowd\\cellx3000\\cellx6000 \\intbl Cell A\\cell Cell B\\cell\\row" +
          "\\trowd\\cellx3000\\cellx6000 \\intbl C\\cell D\\cell\\row",
      ),
    );
    expect(text).toBe("Cell A\tCell B\nC\tD");
  });

  it("keeps escaped braces and backslashes", () => {
    expect(rtfToText(rtf("set \\{a\\} and path C:\\\\temp\\par"))).toBe(
      "set {a} and path C:\\temp",
    );
  });

  it("decodes multi-byte code pages", () => {
    const shiftJis = rtfToText(
      rtf("\\'93\\'fa\\'96\\'7b\\'8c\\'ea", "\\ansi\\ansicpg932"),
    );
    expect(shiftJis).toBe("日本語");
  });

  it("uses a font's charset for its hex escapes", () => {
    const text = rtfToText(
      rtf(
        "{\\fonttbl{\\f0\\fcharset0 Arial;}{\\f1\\fcharset204 Arial;}}" +
          "\\f0 caf\\'e9 \\f1 \\'cf\\'f0\\'e8\\'e2\\'e5\\'f2",
      ),
    );
    expect(text).toBe("café Привет");
  });

  it("keeps text inside text boxes", () => {
    expect(
      rtfToText(
        rtf(
          "{\\shp{\\*\\shpinst{\\sp{\\sn shapeType}{\\sv 202}}{\\shptxt Boxed text}}}",
        ),
      ),
    ).toBe("Boxed text");
  });

  it("extracts the seeded study guide", () => {
    const source = readFileSync(
      resolve(__dirname, "../mocks/philosophy-presocratics.rtf"),
      "latin1",
    );
    const text = rtfToText(source);
    expect(text).toContain("Philosophy of Science");
    expect(text).toContain("1. Thales of Miletus (c. 624-546 BCE)");
    expect(text).toContain("- Everything is made of water");
    expect(text).not.toMatch(/\\|fonttbl|colortbl|Times New Roman/);
  });
});
