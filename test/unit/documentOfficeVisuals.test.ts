import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { beforeEach, describe, expect, it, vi } from "vitest";

const s3Body = vi.hoisted(() => ({ current: Buffer.alloc(0) }));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = vi.fn(async () => ({
      Body: (async function* () {
        yield s3Body.current;
      })(),
    }));
  },
  GetObjectCommand: vi.fn(),
}));

import { extractByFormat } from "../../amplify/functions/documentAnalysis/formatRegistry";
import { replaceUnreadableMedia } from "../../amplify/functions/documentAnalysis/embeddedImages";

const CHART_XML = `<c:chartSpace xmlns:c="c" xmlns:a="a"><c:chart>
  <c:title><c:tx><c:rich><a:p><a:r><a:t>Population</a:t></a:r></a:p></c:rich></c:tx></c:title>
  <c:plotArea><c:pieChart><c:ser>
    <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Urban</c:v></c:pt><c:pt idx="1"><c:v>Rural</c:v></c:pt></c:strCache></c:strRef></c:cat>
    <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>60</c:v></c:pt><c:pt idx="1"><c:v>40</c:v></c:pt></c:numCache></c:numRef></c:val>
  </c:ser></c:pieChart></c:plotArea></c:chart></c:chartSpace>`;

async function pptx(slides: Array<{ text?: string; xml?: string; rels?: string }>) {
  const zip = new JSZip();
  slides.forEach((slide, index) => {
    const number = index + 1;
    zip.file(
      `ppt/slides/slide${number}.xml`,
      slide.xml ??
        `<p:sld xmlns:p="p" xmlns:a="a"><a:t>${slide.text ?? ""}</a:t></p:sld>`,
    );
    if (slide.rels) {
      zip.file(`ppt/slides/_rels/slide${number}.xml.rels`, slide.rels);
    }
  });
  zip.file("ppt/charts/chart1.xml", CHART_XML);
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("PPTX slides", () => {
  beforeEach(() => {
    s3Body.current = Buffer.alloc(0);
  });

  it("puts a slide's chart data on that slide and keeps picture-only slides", async () => {
    s3Body.current = await pptx([
      {
        text: "Census results",
        rels: '<Relationships><Relationship Target="../charts/chart1.xml"/></Relationships>',
      },
      { xml: '<p:sld xmlns:p="p" xmlns:a="a"><p:pic><p:blipFill/></p:pic></p:sld>' },
      { text: "Summary" },
    ]);

    const result = await extractByFormat("deck.pptx");

    expect(result.pages.map((page) => page.pageNumber)).toEqual([1, 2, 3]);
    expect(result.pages[0].text).toContain("Census results");
    expect(result.pages[0].text).toContain(
      "[Chart: Population] pie chart. Series: Urban=60, Rural=40",
    );
    expect(result.pages[1]).toMatchObject({ text: "", imageCount: 1 });
    expect(result.pages[2].text).toBe("Summary");
  });
});

describe("DOCX visual content", () => {
  it("reads chart data and leaves text-only documents unchanged", async () => {
    const plain = readFileSync("test/mocks/biology-cell-structure.docx");
    s3Body.current = plain;
    const before = await extractByFormat("doc.docx");
    expect(before.embeddedImages).toBeUndefined();
    expect(before.inlineText).toBeUndefined();
    expect(before.visualText).toBeUndefined();

    const zip = await JSZip.loadAsync(plain);
    zip.file("word/charts/chart1.xml", CHART_XML);
    s3Body.current = await zip.generateAsync({ type: "nodebuffer" });

    const withChart = await extractByFormat("doc.docx");

    expect(withChart.text).toBe(before.text);
    expect(withChart.visualText).toEqual([
      expect.stringContaining("[Chart: Population]"),
    ]);
  });
});

describe("package media", () => {
  it("extracts legacy image formats from an EPUB so they can be converted", async () => {
    const zip = await JSZip.loadAsync(readFileSync("test/mocks/water-cycle-guide.epub"));
    zip.file("OEBPS/images/cycle.emf", Buffer.from("emf"));
    zip.file("OEBPS/images/scan.TIF", Buffer.from("tif"));
    zip.file("OEBPS/images/icon.bmp", Buffer.from("bmp"));
    s3Body.current = await zip.generateAsync({ type: "nodebuffer" });

    const result = await extractByFormat("guide.epub");

    const media = Object.fromEntries(
      (result.mediaFiles ?? []).map((file) => [file.filename, file.mimeType]),
    );
    expect(media).toMatchObject({
      "cycle.emf": "image/x-emf",
      "scan.TIF": "image/tiff",
      "icon.bmp": "image/bmp",
    });
  });
});

describe("replaceUnreadableMedia", () => {
  const media = (filename: string, mimeType: string, description?: string) => ({
    filename,
    mimeType,
    data: Buffer.from(filename),
    ...(description ? { description } : {}),
  });

  it("swaps converted files in, keeping their description, and drops the rest", () => {
    const result = replaceUnreadableMedia(
      [
        media("photo.png", "image/png", "Extracted from EPUB"),
        media("cycle.emf", "image/x-emf", "Extracted from EPUB"),
        media("big.wmf", "image/x-wmf"),
        media("clip.mp4", "video/mp4"),
      ],
      [{ filename: "cycle.emf.png", mimeType: "image/png", data: Buffer.from("png") }],
    );

    expect(result.map((file) => file.filename)).toEqual([
      "photo.png",
      "clip.mp4",
      "cycle.emf.png",
    ]);
    expect(result[2]).toMatchObject({
      mimeType: "image/png",
      description: "Extracted from EPUB",
    });
  });
});
