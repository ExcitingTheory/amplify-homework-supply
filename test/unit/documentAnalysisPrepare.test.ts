import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Runs the document-analysis `prepare`, `extract` and `vision` steps against
 * real fixture files (test/mocks/documents, built by
 * scripts/generate-document-fixtures.mjs). S3, GraphQL, OpenAI and the
 * LibreOffice-backed thumbnail Lambda are replaced; everything between them
 * (extraction, image conversion, description, weaving, page rendering) is the
 * real code.
 */

const sim = vi.hoisted(() => ({
  store: new Map<string, Buffer>(),
  document: { _version: 1, metadata: "" },
  openAiCalls: [] as Array<{ model: string; filename?: string; png: boolean }>,
  lambdaCalls: [] as Array<Record<string, unknown>>,
  visionReply: null as null | Record<string, unknown>,
  /** What LibreOffice returns per input extension (each differs, as real output would). */
  libreOfficePng: {} as Record<string, Buffer>,
}));

vi.mock("aws-amplify", () => ({ Amplify: { configure: vi.fn() } }));
vi.mock("@aws-sdk/credential-providers", () => ({
  fromNodeProviderChain: vi.fn(() => async () => ({})),
}));
vi.mock("@aws-sdk/client-sfn", () => ({
  SFNClient: class {},
  DescribeMapRunCommand: class {},
  ListMapRunsCommand: class {},
}));
vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: class {},
  GetParameterCommand: class {},
}));

vi.mock("@aws-sdk/client-s3", () => {
  class GetObjectCommand {
    constructor(public input: { Key: string }) {}
  }
  class PutObjectCommand {
    constructor(public input: { Key: string; Body: Buffer | string }) {}
  }
  return {
    GetObjectCommand,
    PutObjectCommand,
    S3Client: class {
      async send(command: GetObjectCommand | PutObjectCommand) {
        if (command instanceof PutObjectCommand) {
          const { Key, Body } = command.input;
          sim.store.set(Key, Buffer.from(Body));
          return {};
        }
        const body = sim.store.get(command.input.Key);
        if (!body) {
          throw Object.assign(new Error("NoSuchKey"), { name: "NoSuchKey" });
        }
        return {
          Body: (async function* () {
            yield body;
          })(),
        };
      }
    },
  };
});

vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({
    graphql: async ({ query, variables }: any) => {
      if (query.includes("listPlatformSettings")) {
        return { data: { listPlatformSettings: { items: [] } } };
      }
      if (query.includes("updateDocument")) {
        sim.document = {
          _version: sim.document._version + 1,
          metadata: variables.input.metadata ?? sim.document.metadata,
        };
        return { data: { updateDocument: { id: variables.input.id } } };
      }
      return { data: { getDocument: { id: "doc-1", ...sim.document } } };
    },
  }),
}));

vi.mock("../../amplify/functions/documentAnalysisWorkflow/providerRateLimiter", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  withProviderRateLimit: async ({ execute }: any) => execute(),
  DynamoProviderRateLimitStore: class {},
}));

vi.mock("openai", () => ({
  default: class {
    chat = {
      completions: {
        create: async (request: any) => {
          const content = request.messages[1].content;
          const image = content.find((part: any) => part.type === "image_url");
          const dataUrl: string = image.image_url.url;
          const bytes = Buffer.from(dataUrl.split(",")[1], "base64");
          const filename = /^Image file: (.+)$/.exec(content[0].text)?.[1];
          sim.openAiCalls.push({
            model: request.model,
            filename,
            png: bytes.subarray(1, 4).toString() === "PNG",
          });

          if (request.model === "gpt-4o") {
            return reply(sim.visionReply);
          }
          return reply({
            relevant: true,
            description: `Description of ${filename}`,
            visibleText: filename?.includes("emf") ? "Condensation" : "",
          });
        },
      },
    };
    moderations = { create: async () => ({ results: [] }) };
  },
}));

function reply(payload: unknown) {
  return {
    choices: [{ message: { content: JSON.stringify(payload) } }],
    usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
  };
}

vi.mock("@aws-sdk/client-lambda", () => {
  class InvokeCommand {
    constructor(public input: { Payload: Buffer }) {}
  }
  return {
    InvokeCommand,
    LambdaClient: class {
      /** Stands in for the thumbnail Lambda's `convertImage` mode. */
      async send(command: InvokeCommand) {
        const event = JSON.parse(command.input.Payload.toString());
        sim.lambdaCalls.push(event);
        const { convertImageToPng } = await import(
          "../../amplify/functions/shared/imageConvert"
        );
        const png = await convertImageToPng(
          sim.store.get(event.s3Key)!,
          event.s3Key.split("/").pop(),
          {
            // LibreOffice is the one converter not available in unit tests.
            runLibreOffice: (inputPath) => {
              const extension = inputPath.split(".").pop()!;
              const path = join(tmpdir(), `lo-${Date.now()}-${Math.random()}.png`);
              writeFileSync(path, sim.libreOfficePng[extension]);
              return path;
            },
            tmpDir: tmpdir(),
          },
        );
        sim.store.set(event.outputKey, png);
        return { StatusCode: 200, Payload: Buffer.from("{}") };
      }
    },
  };
});

import { handler } from "../../amplify/functions/documentAnalysisWorkflow/handler";
import { renderPdfPage } from "../../amplify/functions/shared/pdfPageRender";
import { checkPageFacts } from "../../amplify/functions/documentAnalysis/analysis";

const FIXTURES = "test/mocks/documents";
const IDENTITY = "identity-1";
const BASE = `private/${IDENTITY}/documents/doc-1/analysis/run-1`;

function event(s3Key: string, extra: Record<string, unknown> = {}) {
  return {
    workflowMode: "prepare",
    runId: "run-1",
    documentId: "doc-1",
    fileId: "file-1",
    identityId: IDENTITY,
    s3Key,
    profile: "standard",
    executionArn: "arn:execution",
    ...extra,
  } as any;
}

function upload(fixture: string): string {
  const key = `private/${IDENTITY}/files/${fixture}`;
  sim.store.set(key, readFileSync(join(FIXTURES, fixture)));
  return key;
}

const json = <T = any>(key: string): T =>
  JSON.parse(sim.store.get(key)!.toString("utf8"));

type ManifestEntry = { page: number; inputKey: string; resultKey: string };

async function prepare(fixture: string) {
  await handler(event(upload(fixture)), {} as any, () => {});
  const manifest = json<ManifestEntry[]>(`${BASE}/manifest.json`);
  return {
    manifest,
    pages: manifest.map((entry) => json(entry.inputKey)),
    pendingMedia: json<any[]>(`${BASE}/pending-media.json`),
  };
}

beforeEach(async () => {
  sim.store.clear();
  sim.openAiCalls.length = 0;
  sim.lambdaCalls.length = 0;
  sim.visionReply = null;
  sim.document = {
    _version: 1,
    metadata: JSON.stringify({ analysis: { runId: "run-1", state: "queued" } }),
  };
  // What LibreOffice would return for an EMF or WMF: a drawing on a blank page.
  const libreOfficePage = async (drawingWidth: number) =>
    sharp({
      create: { width: 300, height: 200, channels: 3, background: "#ffffff" },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: drawingWidth,
              height: 60,
              channels: 3,
              background: "#cc0000",
            },
          })
            .png()
            .toBuffer(),
          left: 90,
          top: 70,
        },
      ])
      .png()
      .toBuffer();
  sim.libreOfficePng = {
    emf: await libreOfficePage(120),
    wmf: await libreOfficePage(150),
  };

  process.env.STORAGE_BUCKET = "bucket";
  process.env.OPENAI_API_KEY = "test";
  process.env.DOCUMENT_ANALYSIS_LIMITER_TABLE = "limiter";
  process.env.DOCUMENT_THUMBNAIL_FUNCTION_NAME = "thumbnail";
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.DOCUMENT_IMAGE_MIN_BYTES;
});

describe("prepare: DOCX with an embedded PNG, an EMF, and a chart", () => {
  it("describes each image where it sits and reads the chart as text", async () => {
    const { pages } = await prepare("visual-lesson.docx");

    const text = pages.map((page) => page.text).join("\n");
    const order = [
      "Water moves between the ocean",
      "[Image: Description of image1.png",
      "Water vapor rises",
      "The legacy figure below",
      'Text in image: "Condensation"]',
      "Rainfall by month is charted below.",
    ].map((fragment) => text.indexOf(fragment));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);

    expect(text).toContain("[Image: Description of image2.emf.png");
    expect(text).toContain(
      '[Charts and diagrams]\n[Chart: Monthly rainfall] bar chart. Series "2024": Jan=78, Feb=64, Mar=91, Apr=120 Axes: Month / Millimetres.',
    );
    expect(text).not.toContain("⟦IMG");
  });

  it("converts the EMF to a PNG the model can read, and records the usage", async () => {
    await prepare("visual-lesson.docx");

    expect(sim.lambdaCalls).toHaveLength(1);
    expect(sim.lambdaCalls[0]).toMatchObject({ workflowMode: "convertImage" });
    expect(sim.openAiCalls.map((call) => call.filename).sort()).toEqual([
      "image1.png",
      "image2.emf.png",
    ]);
    expect(sim.openAiCalls.every((call) => call.png)).toBe(true);
    expect(json(`${BASE}/prepare-usage.json`)).toEqual({
      "gpt-4o-mini": { promptTokens: 200, completionTokens: 40, totalTokens: 240 },
    });
  });

  it("still analyzes the text when image description is switched off", async () => {
    process.env.DOCUMENT_IMAGE_MAX = "0";
    try {
      const { pages } = await prepare("visual-lesson.docx");
      const text = pages.map((page) => page.text).join("\n");

      expect(text).toContain("Water vapor rises");
      expect(text).not.toContain("[Image:");
      expect(text).not.toContain("⟦IMG");
      expect(sim.openAiCalls).toHaveLength(0);
    } finally {
      delete process.env.DOCUMENT_IMAGE_MAX;
    }
  });
});

describe("prepare: ODT with an embedded PNG and an EMF", () => {
  it("places both descriptions in document order", async () => {
    const { pages } = await prepare("visual-lesson.odt");
    const text = pages.map((page) => page.text).join("\n");

    const png = text.indexOf("[Image: Description of 10000001");
    const middle = text.indexOf("Water vapor rises");
    const emf = text.indexOf("[Image: Description of legacy1.emf.png");
    expect(png).toBeGreaterThan(text.indexOf("Water moves between"));
    expect(middle).toBeGreaterThan(png);
    expect(emf).toBeGreaterThan(middle);
    expect(text).not.toContain("⟦IMG");
  });
});

describe("prepare: PPTX", () => {
  it("renders pages instead of describing images, and keeps picture-only slides", async () => {
    const { pages } = await prepare("rainfall-deck.pptx");

    expect(pages.map((page) => page.pageNumber)).toEqual([1, 2, 3]);
    expect(pages[0].text).toContain("[Chart: Monthly rainfall]");
    expect(pages[1]).toMatchObject({ text: "", imageCount: 1, needsVision: true });
    expect(pages.every((page) => page.sourceFormat === "pptx")).toBe(true);
    expect(sim.openAiCalls).toHaveLength(0);
  });
});

describe("prepare: XLSX with a chart and a picture", () => {
  it("reads the chart and describes the picture", async () => {
    process.env.DOCUMENT_IMAGE_MIN_BYTES = "1000";

    const { pages } = await prepare("rainfall-data.xlsx");
    const text = pages.map((page) => page.text).join("\n");

    expect(text).toContain("Jan,78");
    expect(text).toContain("[Chart: Monthly rainfall]");
    expect(text).toContain("[Embedded images]\n[Image 1: image1.png]");
  });
});

describe.each([
  ["EPUB", "legacy-media.epub", "Extracted from EPUB"],
  ["IMS CC", "legacy-media.imscc", "Extracted from IMS CC package"],
])("prepare: %s package with legacy media", (_label, fixture, placeholder) => {
  it("stages PNG conversions in place of EMF, WMF, TIFF and BMP originals", async () => {
    const { pendingMedia } = await prepare(fixture);

    const names = pendingMedia.map((media) => media.filename).sort();
    expect(names).toEqual([
      "diagram.bmp.png",
      "diagram.emf.png",
      "diagram.png",
      "diagram.tif.png",
      "diagram.wmf.png",
    ]);
    for (const media of pendingMedia) {
      expect(media.mimeType).toBe("image/png");
      const staged = sim.store.get(media.s3Key)!;
      expect(staged.subarray(1, 4).toString()).toBe("PNG");
    }
    expect(sim.lambdaCalls).toHaveLength(4);
  });

  it("gives every image its description as alt text instead of the placeholder", async () => {
    const { pendingMedia } = await prepare(fixture);

    for (const media of pendingMedia) {
      expect(media.description).toBe(`Description of ${media.filename}`);
      expect(media.description).not.toBe(placeholder);
    }
  });
});

describe("scanned PDF: prepare, extract, then vision", () => {
  const FACT = "Evaporation is the process by which liquid water";

  it("routes a page with no text layer to vision without calling the text model", async () => {
    const { manifest, pages } = await prepare("scanned-page.pdf");

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      pageNumber: 1,
      text: "",
      imageCount: 1,
      needsVision: true,
    });

    const extracted = await handler(
      event(upload("scanned-page.pdf"), {
        workflowMode: "extract",
        page: 1,
        inputKey: manifest[0].inputKey,
        resultKey: manifest[0].resultKey,
      }),
      {} as any,
      () => {},
    );

    expect(extracted).toMatchObject({ needsVision: true, questionsJSON: [] });
    expect(sim.openAiCalls).toHaveLength(0);
  });

  it("accepts a fact read from the rendered image by merging its transcription into the page", async () => {
    const source = upload("scanned-page.pdf");
    const { manifest } = await prepare("scanned-page.pdf");
    await handler(
      event(source, {
        workflowMode: "extract",
        page: 1,
        inputKey: manifest[0].inputKey,
        resultKey: manifest[0].resultKey,
      }),
      {} as any,
      () => {},
    );

    // The thumbnail Lambda's renderPage step, using the real renderer.
    const imageKey = `${BASE}/images/0001.webp`;
    const { image } = await renderPdfPage(sim.store.get(source)!, 1, {
      targetWidth: 1200,
    });
    expect(image.subarray(8, 12).toString()).toBe("WEBP");
    sim.store.set(imageKey, image);

    sim.visionReply = {
      pageText: `Chapter 3: The Water Cycle\n${FACT} becomes water vapor when it is heated by the sun.`,
      facts: [
        {
          subject: "Evaporation",
          field: "definition",
          answer: "water vapor",
          accept: [],
          page: 1,
          sourceText: `${FACT} becomes water vapor when it is heated by the sun.`,
        },
      ],
      vocabulary: [],
    };

    const result = await handler(
      event(source, {
        workflowMode: "vision",
        page: 1,
        inputKey: manifest[0].inputKey,
        resultKey: manifest[0].resultKey,
        imageKey,
      }),
      {} as any,
      () => {},
    );

    expect(sim.openAiCalls).toEqual([
      expect.objectContaining({ model: "gpt-4o", png: false }),
    ]);
    const page = json(manifest[0].inputKey);
    expect(page.text).toContain("[Visual content]");
    expect(page.text).toContain(FACT);

    expect(result.suspect).toEqual([]);
    expect(result.questionsJSON).toHaveLength(1);
    // The same fact is rejected against the empty text layer it started with.
    expect(
      checkPageFacts({ pageNumber: 1, text: "" }, [
        {
          subject: "Evaporation",
          field: "definition",
          answer: "water vapor",
          accept: [],
          page: 1,
          sourceText: FACT,
        },
      ]).suspect,
    ).toHaveLength(1);
  });
});
