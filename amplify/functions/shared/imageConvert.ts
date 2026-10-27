/**
 * Converts images a vision model cannot read (TIFF, BMP, EMF, WMF, ...) to PNG.
 *
 * Runs in the Lambda that has sharp, @napi-rs/canvas and the LibreOffice
 * layer. TIFF goes through sharp, BMP through the canvas decoder, and the
 * vector formats (EMF, WMF and anything else LibreOffice can open) through
 * LibreOffice, which is the only converter here that can draw them.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import sharp from "sharp";

/** Longest side of the converted image; larger images are scaled down. */
const MAX_DIMENSION = 2000;

/** Converts `inputPath` with LibreOffice and returns the path of the PNG. */
export type LibreOfficeToPng = (inputPath: string) => string;

export interface ConvertImageOptions {
  runLibreOffice: LibreOfficeToPng;
  /** Writable scratch directory for LibreOffice input files. */
  tmpDir: string;
}

function extensionOf(filename: string): string {
  return filename.toLowerCase().split(".").pop() ?? "";
}

async function bmpToPng(data: Buffer): Promise<Buffer> {
  const image = await loadImage(data);
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext("2d").drawImage(image, 0, 0);
  return canvas.toBuffer("image/png");
}

/**
 * LibreOffice exports a whole page with the drawing somewhere on it. Crop the
 * blank margin so the model sees the drawing, not a mostly empty page.
 */
async function trimBlankMargin(png: Buffer): Promise<Buffer> {
  try {
    return await sharp(png).trim().png().toBuffer();
  } catch {
    // A fully blank image cannot be trimmed; keep it as is.
    return png;
  }
}

export async function convertImageToPng(
  data: Buffer,
  filename: string,
  { runLibreOffice, tmpDir }: ConvertImageOptions,
): Promise<Buffer> {
  const extension = extensionOf(filename);

  let png: Buffer;
  if (extension === "tif" || extension === "tiff") {
    png = await sharp(data).png().toBuffer();
  } else if (extension === "bmp") {
    png = await bmpToPng(data);
  } else {
    mkdirSync(tmpDir, { recursive: true });
    const inputPath = join(
      tmpDir,
      `convert-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension || "bin"}`,
    );
    writeFileSync(inputPath, data);
    png = await trimBlankMargin(readFileSync(runLibreOffice(inputPath)));
  }

  return sharp(png)
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
}
