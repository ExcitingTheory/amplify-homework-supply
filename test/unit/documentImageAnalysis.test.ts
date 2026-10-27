import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import {
  extractZipMedia,
  imageMimeType,
  selectImagesForDescription,
} from "../../amplify/functions/documentAnalysis/embeddedImages";
import {
  describeImages,
  formatImageDescriptions,
  type ImageDescription,
} from "../../amplify/functions/documentAnalysis/imageDescriptions";
import { checkPageFacts } from "../../amplify/functions/documentAnalysis/analysis";
import {
  isSparsePage,
  mergeVisualContent,
  selectVisionPages,
} from "../../amplify/functions/documentAnalysisWorkflow/visionSelection";

const image = (name: string, bytes: number, fill = name) => ({
  filename: name,
  mimeType: "image/png",
  data: Buffer.alloc(bytes, fill),
});

describe("extractZipMedia raster images", () => {
  async function zipWith(files: Record<string, Buffer | string>) {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
      zip.file(name, content);
    }
    return zip.generateAsync({ type: "nodebuffer" });
  }

  it("reads supported images from a DOCX media folder in numeric order", async () => {
    const docx = await zipWith({
      "word/document.xml": "<xml/>",
      "word/media/image10.png": Buffer.from("ten"),
      "word/media/image2.jpeg": Buffer.from("two"),
      "word/media/chart.emf": Buffer.from("vector"),
      "word/media/diagram.svg": "<svg/>",
    });

    const { images } = await extractZipMedia(docx, "docx");

    expect(images.map((item) => item.filename)).toEqual([
      "image2.jpeg",
      "image10.png",
    ]);
    expect(images[0].mimeType).toBe("image/jpeg");
    expect(images[1].data.toString()).toBe("ten");
  });

  it("uses the format's own media folder", async () => {
    const odt = await zipWith({
      "content.xml": "<xml/>",
      "Pictures/a.png": Buffer.from("a"),
      "word/media/ignored.png": Buffer.from("b"),
    });

    expect(
      (await extractZipMedia(odt, "odt")).images.map((i) => i.filename),
    ).toEqual(["a.png"]);
    expect((await extractZipMedia(odt, "pdf")).images).toEqual([]);
  });

  it("maps file extensions to vision-supported MIME types only", () => {
    expect(imageMimeType("A.PNG")).toBe("image/png");
    expect(imageMimeType("x.webp")).toBe("image/webp");
    expect(imageMimeType("x.tiff")).toBeUndefined();
    expect(imageMimeType("x.emf")).toBeUndefined();
  });
});

describe("selectImagesForDescription", () => {
  it("drops tiny images and duplicates, keeping the first copy", () => {
    const selected = selectImagesForDescription(
      [
        image("logo.png", 500),
        image("fig1.png", 20_000, "a"),
        image("fig1-copy.png", 20_000, "a"),
        image("fig2.png", 30_000, "b"),
      ],
      { minBytes: 1_000, maxImages: 10 },
    );

    expect(selected.map((item) => item.filename)).toEqual([
      "fig1.png",
      "fig2.png",
    ]);
  });

  it("keeps the largest images when over the cap, in document order", () => {
    const selected = selectImagesForDescription(
      [
        image("a.png", 2_000, "a"),
        image("b.png", 9_000, "b"),
        image("c.png", 5_000, "c"),
        image("d.png", 8_000, "d"),
      ],
      { minBytes: 1_000, maxImages: 2 },
    );

    expect(selected.map((item) => item.filename)).toEqual(["b.png", "d.png"]);
  });
});

describe("describeImages", () => {
  function clientReturning(
    handler: (url: string) => string | Error,
  ): OpenAI {
    return {
      chat: {
        completions: {
          create: vi.fn(async (request: any) => {
            const url = request.messages[1].content[1].image_url.url as string;
            const result = handler(url);
            if (result instanceof Error) throw result;
            return {
              choices: [{ message: { content: result } }],
              usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
            };
          }),
        },
      },
    } as unknown as OpenAI;
  }

  it("describes images in input order and sends them as data URLs", async () => {
    const client = clientReturning(() =>
      JSON.stringify({
        relevant: true,
        description: "A labelled plant cell",
        visibleText: "Nucleus",
      }),
    );

    const results = await describeImages(
      client,
      [image("one.png", 4), image("two.png", 4)],
      { model: "gpt-4o-mini" },
    );

    expect(results.map((item) => item.filename)).toEqual([
      "one.png",
      "two.png",
    ]);
    expect(results[0]).toMatchObject({
      relevant: true,
      description: "A labelled plant cell",
      visibleText: "Nucleus",
      usage: { totalTokens: 15 },
    });
    const request = (client.chat.completions.create as any).mock.calls[0][0];
    expect(request.model).toBe("gpt-4o-mini");
    expect(request.messages[1].content[1].image_url.url).toMatch(
      /^data:image\/png;base64,/,
    );
  });

  it("skips an image that fails without failing the others", async () => {
    const bad = Buffer.alloc(4, "x").toString("base64");
    const client = clientReturning((url) =>
      url.includes(bad)
        ? new Error("boom")
        : JSON.stringify({ relevant: true, description: "ok", visibleText: "" }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const results = await describeImages(
      client,
      [image("bad.png", 4, "x"), image("good.png", 4, "y")],
      { model: "m" },
    );

    expect(results.map((item) => item.filename)).toEqual(["good.png"]);
  });

  it("treats a missing relevance flag as relevant and clips long text", async () => {
    const client = clientReturning(() =>
      JSON.stringify({ description: "d".repeat(5_000) }),
    );

    const [result] = await describeImages(client, [image("a.png", 4)], {
      model: "m",
    });

    expect(result.relevant).toBe(true);
    expect(result.description).toHaveLength(700);
  });
});

describe("formatImageDescriptions", () => {
  const description = (
    overrides: Partial<ImageDescription>,
  ): ImageDescription => ({
    filename: "a.png",
    relevant: true,
    description: "",
    visibleText: "",
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    ...overrides,
  });

  it("lists relevant images with their text and skips decorative or empty ones", () => {
    const block = formatImageDescriptions([
      description({ filename: "logo.png", relevant: false, description: "Logo" }),
      description({ filename: "empty.png" }),
      description({
        filename: "cell.png",
        description: "A plant cell",
        visibleText: "Nucleus",
      }),
    ]);

    expect(block).toBe(
      '\n\n[Embedded images]\n[Image 1: cell.png] A plant cell Text in image: "Nucleus"',
    );
  });

  it("returns nothing when no image is worth including", () => {
    expect(formatImageDescriptions([description({ relevant: false })])).toBe("");
    expect(formatImageDescriptions([])).toBe("");
  });
});

describe("selectVisionPages", () => {
  const longText = "x".repeat(500);

  it("selects sparse pages and pages with images, not plain text pages", () => {
    const selected = selectVisionPages(
      [
        { pageNumber: 1, text: longText },
        { pageNumber: 2, text: "" , imageCount: 1 },
        { pageNumber: 3, text: longText, imageCount: 2 },
        { pageNumber: 4, text: "short" },
      ],
      10,
    );

    expect([...selected].sort()).toEqual([2, 3, 4]);
  });

  it("caps the count, preferring sparse pages and then more images", () => {
    const selected = selectVisionPages(
      [
        { pageNumber: 1, text: longText, imageCount: 5 },
        { pageNumber: 2, text: longText, imageCount: 1 },
        { pageNumber: 3, text: "", imageCount: 1 },
      ],
      2,
    );

    expect([...selected].sort()).toEqual([1, 3]);
    expect(selectVisionPages([{ pageNumber: 1, text: "" }], 0).size).toBe(0);
  });

  it("flags a page as sparse by its trimmed text length", () => {
    expect(isSparsePage({ pageNumber: 1, text: "   " })).toBe(true);
    expect(isSparsePage({ pageNumber: 1, text: longText })).toBe(false);
  });
});

describe("mergeVisualContent", () => {
  it("appends the transcription under a marker so quoted facts match the page text", () => {
    expect(mergeVisualContent("Caption", "Axis: years")).toBe(
      "Caption\n\n[Visual content]\nAxis: years",
    );
    expect(mergeVisualContent("", "Only image")).toBe(
      "[Visual content]\nOnly image",
    );
  });

  it("leaves the text alone when the model returned nothing", () => {
    expect(mergeVisualContent("Caption", "  ")).toBe("Caption");
  });

  it("lets a fact quoted from the image pass the source check once merged", () => {
    const fact = {
      subject: "Water cycle diagram",
      field: "arrow from clouds",
      answer: "Precipitation",
      accept: [],
      page: 4,
      sourceText: "Arrow from clouds to ground: Precipitation",
    };
    const scanned = { pageNumber: 4, text: "" };
    const merged = {
      ...scanned,
      text: mergeVisualContent(
        scanned.text,
        "Arrow from clouds to ground: Precipitation",
      ),
    };

    expect(checkPageFacts(scanned, [fact]).suspect).toHaveLength(1);
    expect(checkPageFacts(merged, [fact]).facts).toHaveLength(1);
  });
});
