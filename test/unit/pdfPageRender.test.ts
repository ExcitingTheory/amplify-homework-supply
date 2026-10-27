import { readFileSync } from "node:fs";
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

import { renderPdfPage } from "../../amplify/functions/shared/pdfPageRender";
import { extractPdfText } from "../../amplify/functions/documentAnalysis/textExtraction";

type PageSpec = { text?: string; imageSize?: number };

/**
 * Builds a small valid PDF. Each page can carry a line of text and/or a
 * grayscale image of `imageSize` x `imageSize` pixels.
 */
function buildPdf(pages: PageSpec[]): Buffer {
  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = add("");
  const pagesId = add("");
  const fontId = add(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  );

  const pageIds: number[] = [];
  for (const spec of pages) {
    const operators: string[] = [];
    let xObjects = "";
    if (spec.imageSize) {
      const size = spec.imageSize;
      const pixels = "7F".repeat(size * size);
      const imageId = add(
        `<< /Type /XObject /Subtype /Image /Width ${size} /Height ${size} ` +
          `/ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /ASCIIHexDecode ` +
          `/Length ${pixels.length + 1} >>\nstream\n${pixels}>\nendstream`,
      );
      xObjects = `/XObject << /Im1 ${imageId} 0 R >>`;
      operators.push(`q 300 0 0 300 50 400 cm /Im1 Do Q`);
    }
    if (spec.text) {
      operators.push(`BT /F1 14 Tf 50 750 Td (${spec.text}) Tj ET`);
    }
    const content = operators.join("\n");
    const contentId = add(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
    pageIds.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] ` +
          `/Resources << /Font << /F1 ${fontId} 0 R >> ${xObjects} >> ` +
          `/Contents ${contentId} 0 R >>`,
      ),
    );
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] ` +
    `/Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

describe("renderPdfPage", () => {
  const fixture = readFileSync("test/mocks/science-lesson-water-cycle.pdf");

  it("renders a page to a WebP at the requested width", async () => {
    const result = await renderPdfPage(fixture, 1, { targetWidth: 800 });

    expect(result.mimeType).toBe("image/webp");
    expect(result.width).toBe(800);
    expect(result.pageCount).toBeGreaterThan(1);
    expect(result.image.subarray(0, 4).toString("latin1")).toBe("RIFF");
    expect(result.image.subarray(8, 12).toString("latin1")).toBe("WEBP");
  });

  it("can render a later page and a PNG", async () => {
    const result = await renderPdfPage(fixture, 2, {
      targetWidth: 400,
      format: "png",
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.image.subarray(1, 4).toString("latin1")).toBe("PNG");
  });

  it("rejects a page number outside the document", async () => {
    await expect(renderPdfPage(fixture, 999)).rejects.toThrow(
      "PDF does not contain page 999",
    );
    await expect(renderPdfPage(fixture, 0)).rejects.toThrow(
      "PDF does not contain page 0",
    );
  });

  it("does not enlarge a small page past maxScale", async () => {
    const result = await renderPdfPage(buildPdf([{ text: "Hi" }]), 1, {
      targetWidth: 10_000,
      maxScale: 2,
    });

    expect(result.width).toBe(612 * 2);
  });
});

describe("extractPdfText image detection", () => {
  beforeEach(() => {
    s3Body.current = Buffer.alloc(0);
  });

  it("counts content images and keeps image-only pages", async () => {
    s3Body.current = buildPdf([
      { text: "Text only page" },
      { imageSize: 300 },
      { text: "Figure caption", imageSize: 300 },
      {},
    ]);

    const result = await extractPdfText("doc.pdf");

    expect(result.pageCount).toBe(4);
    expect(
      result.pages.map(({ pageNumber, text, imageCount }) => ({
        pageNumber,
        hasText: text.length > 0,
        imageCount,
      })),
    ).toEqual([
      { pageNumber: 1, hasText: true, imageCount: 0 },
      { pageNumber: 2, hasText: false, imageCount: 1 },
      { pageNumber: 3, hasText: true, imageCount: 1 },
    ]);
  });

  it("ignores small decorative images", async () => {
    s3Body.current = buildPdf([{ text: "Logo page", imageSize: 40 }]);

    const result = await extractPdfText("doc.pdf");

    expect(result.pages).toEqual([
      expect.objectContaining({ pageNumber: 1, imageCount: 0 }),
    ]);
  });
});
