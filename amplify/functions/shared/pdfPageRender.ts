/**
 * Renders a single PDF page to an image using pdfjs and @napi-rs/canvas.
 *
 * Shared by the Lambdas that need page images (document thumbnails and the
 * document-analysis vision pass). @napi-rs/canvas is a native module, so each
 * Lambda that bundles this file must keep it out of the esbuild bundle and
 * install it for linux/x64 (see documentThumbnail/resource.ts).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// pdfjs falls back to loading ./pdf.worker.mjs from disk, which isn't present in
// a bundled Lambda. Registering the worker module keeps it in the bundle.
// @ts-expect-error pdfjs ships no declarations for the worker entry point
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

export interface RenderPdfPageOptions {
  /** Output width in pixels. Height follows the page aspect ratio. */
  targetWidth?: number;
  /** Upper bound on the render scale so tiny pages are not blown up. */
  maxScale?: number;
  format?: "webp" | "png";
  /** WebP quality, 0-100. */
  quality?: number;
  /**
   * Directory containing `standard_fonts/` and `cmaps/`. Defaults to the
   * `pdfjs-data` folder next to the bundle, then `public/` for local runs.
   */
  dataDir?: string;
}

export interface RenderedPdfPage {
  image: Buffer;
  mimeType: "image/webp" | "image/png";
  width: number;
  height: number;
  pageCount: number;
}

function resolveDataDir(explicit?: string): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    explicit,
    join(here, "pdfjs-data"),
    join(process.cwd(), "public"),
  ];
  return candidates.find(
    (dir): dir is string =>
      !!dir && existsSync(join(dir, "standard_fonts")),
  );
}

export async function renderPdfPage(
  pdfData: Uint8Array | Buffer,
  pageNumber: number,
  options: RenderPdfPageOptions = {},
): Promise<RenderedPdfPage> {
  const {
    targetWidth = 1600,
    maxScale = 4,
    format = "webp",
    quality = 80,
  } = options;

  const dataDir = resolveDataDir(options.dataDir);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfData),
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
    verbosity: 0,
    ...(dataDir
      ? {
          standardFontDataUrl: `${join(dataDir, "standard_fonts")}/`,
          cMapUrl: `${join(dataDir, "cmaps")}/`,
          cMapPacked: true,
        }
      : {}),
  } as any);

  const pdfDocument = await loadingTask.promise;
  try {
    const pageCount = pdfDocument.numPages;
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount) {
      throw new Error(`PDF does not contain page ${pageNumber}`);
    }

    const page = await pdfDocument.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(maxScale, targetWidth / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    // PDF pages are transparent by default; paint white so the output is legible.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    await page.render({
      canvasContext: context as any,
      viewport,
    } as any).promise;
    page.cleanup();

    const image =
      format === "png"
        ? canvas.toBuffer("image/png")
        : canvas.toBuffer("image/webp", quality);
    return {
      image,
      mimeType: format === "png" ? "image/png" : "image/webp",
      width,
      height,
      pageCount,
    };
  } finally {
    await pdfDocument.destroy();
  }
}
