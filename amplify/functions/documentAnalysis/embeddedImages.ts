/**
 * Finds the visual content inside ZIP-based document formats (DOCX, XLSX,
 * ODF): raster images a vision model can read, plus charts, SmartArt and SVG
 * whose text can be read straight from their XML.
 *
 * Vector and legacy image formats a vision model cannot read (EMF, WMF, TIFF,
 * BMP) are returned as `unconverted` so the caller can convert them to PNG.
 */
import { createHash } from "node:crypto";
import { chartXmlToText, diagramXmlToText, svgToText } from "./officeCharts.js";

export interface EmbeddedImage {
  filename: string;
  mimeType: string;
  data: Buffer;
  /**
   * Placeholder left in the document text where this image appears. The
   * description replaces it, so it lands next to the surrounding text.
   */
  marker?: string;
  /**
   * Set on an image produced by converting a legacy format. Vector formats are
   * compact, so a small file is not evidence of a decorative image.
   */
  converted?: boolean;
}

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

/** Image extensions that carry content but that a vision model cannot read. */
const UNREADABLE_EXTENSIONS = new Set([
  "emf",
  "wmf",
  "tif",
  "tiff",
  "bmp",
  "wdp",
  "jxr",
]);

interface MediaLayout {
  imageFolder: string;
  /** Folders holding chart and SmartArt parts, if the format has them. */
  chartFolders: string[];
  diagramFolders: string[];
}

const MEDIA_LAYOUT: Record<string, MediaLayout> = {
  docx: {
    imageFolder: "word/media/",
    chartFolders: ["word/charts/"],
    diagramFolders: ["word/diagrams/"],
  },
  xlsx: {
    imageFolder: "xl/media/",
    chartFolders: ["xl/charts/"],
    diagramFolders: ["xl/diagrams/"],
  },
  odt: { imageFolder: "Pictures/", chartFolders: [], diagramFolders: [] },
  ods: { imageFolder: "Pictures/", chartFolders: [], diagramFolders: [] },
  odp: { imageFolder: "Pictures/", chartFolders: [], diagramFolders: [] },
};

/** Larger images are skipped: the vision API rejects them and they bloat memory. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

/** Formats whose pages are not rendered, so their visuals are read instead. */
export const EMBEDDED_IMAGE_FORMATS = new Set(Object.keys(MEDIA_LAYOUT));

const MARKER_PATTERN = /⟦IMG:[^⟧]*⟧/g;

/**
 * File types pulled out of EPUB, IMS CC and SCORM packages. The legacy image
 * formats are included so they can be converted to PNG before use.
 */
export const PACKAGE_MEDIA_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".emf": "image/x-emf",
  ".wmf": "image/x-wmf",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".bmp": "image/bmp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export interface PackageMediaFile {
  filename: string;
  mimeType: string;
  data: Buffer;
  description?: string;
  /** True for a PNG produced by converting EMF, WMF, TIFF or BMP media. */
  converted?: boolean;
}

/**
 * Swaps package media that is in a format browsers and vision models cannot
 * use for its PNG conversion, keeping the original's description. Originals
 * that were not converted are dropped, as a file nobody can open is not worth
 * staging. A converted file is named `<original name>.png`.
 */
export function replaceUnreadableMedia(
  mediaFiles: PackageMediaFile[],
  converted: Array<{ filename: string; mimeType: string; data: Buffer }>,
): PackageMediaFile[] {
  const originals = new Map(mediaFiles.map((media) => [media.filename, media]));
  const swapped = converted.map((image) => {
    const original = originals.get(image.filename.replace(/\.png$/, ""));
    return {
      filename: image.filename,
      mimeType: image.mimeType,
      data: image.data,
      converted: true,
      ...(original?.description ? { description: original.description } : {}),
    };
  });
  return [
    ...mediaFiles.filter((media) => !isUnreadableImage(media.filename)),
    ...swapped,
  ];
}

export function imageMarker(id: string | number): string {
  return `⟦IMG:${id}⟧`;
}

export function stripImageMarkers(text: string): string {
  return text.replace(MARKER_PATTERN, "");
}

export function imageMimeType(filename: string): string | undefined {
  return IMAGE_MIME_BY_EXTENSION[fileExtension(filename)];
}

export function isUnreadableImage(filename: string): boolean {
  return UNREADABLE_EXTENSIONS.has(fileExtension(filename));
}

function fileExtension(filename: string): string {
  return filename.toLowerCase().split(".").pop() ?? "";
}

export interface ZipMedia {
  images: EmbeddedImage[];
  /** Images in formats a vision model cannot read; convert before use. */
  unconverted: EmbeddedImage[];
  /** Text read from charts, SmartArt and SVG; one entry per source part. */
  visualText: string[];
}

function sortedNames(zip: any, folder: string, extension?: RegExp): string[] {
  return Object.keys(zip.files)
    .filter(
      (name) =>
        name.startsWith(folder) &&
        !zip.files[name].dir &&
        (!extension || extension.test(name)),
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** Reads charts and SmartArt parts as text, in part-number order. */
export async function readChartAndDiagramText(
  zip: any,
  format: string,
): Promise<string[]> {
  const layout = MEDIA_LAYOUT[format];
  if (!layout) return [];

  const texts: string[] = [];
  for (const folder of layout.chartFolders) {
    for (const name of sortedNames(zip, folder, /\.xml$/i)) {
      const text = chartXmlToText(await zip.files[name].async("text"));
      if (text) texts.push(text);
    }
  }
  for (const folder of layout.diagramFolders) {
    for (const name of sortedNames(zip, folder, /\/data\d*\.xml$/i)) {
      const text = diagramXmlToText(await zip.files[name].async("text"));
      if (text) texts.push(text);
    }
  }
  return texts;
}

/**
 * Reads the visual content of a document from its ZIP media. Pass
 * `includeRaster: false` when the raster images come from elsewhere (for
 * DOCX they are read in document order by the inline extractor).
 */
export async function extractZipMedia(
  buffer: Buffer,
  format: string,
  { includeRaster = true }: { includeRaster?: boolean } = {},
): Promise<ZipMedia> {
  const layout = MEDIA_LAYOUT[format];
  const media: ZipMedia = { images: [], unconverted: [], visualText: [] };
  if (!layout) return media;

  // @ts-ignore - jszip types not available at compile time
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);

  let totalBytes = 0;
  for (const name of sortedNames(zip, layout.imageFolder)) {
    const filename = name.split("/").pop() || name;
    if (fileExtension(name) === "svg") {
      const text = svgToText(await zip.files[name].async("text"));
      if (text) media.visualText.push(`[Diagram: ${filename}] ${text}`);
      continue;
    }
    const unreadable = isUnreadableImage(name);
    const mimeType = unreadable
      ? "application/octet-stream"
      : imageMimeType(name);
    if (!mimeType || !includeRaster) continue;

    const data: Buffer = await zip.files[name].async("nodebuffer");
    if (data.length > MAX_IMAGE_BYTES) continue;
    totalBytes += data.length;
    if (totalBytes > MAX_TOTAL_BYTES) break;
    (unreadable ? media.unconverted : media.images).push({
      filename,
      mimeType,
      data,
    });
  }

  media.visualText.push(...(await readChartAndDiagramText(zip, format)));
  return media;
}

export interface ImageSelectionOptions {
  /** Smaller files are almost always icons, bullets, or rules. */
  minBytes: number;
  maxImages: number;
}

/**
 * Drops duplicates (the same logo repeated on every page is stored once) and
 * images too small to carry content, then keeps the largest `maxImages`,
 * returned in their original document order.
 */
export function selectImagesForDescription<
  T extends { data: Buffer; converted?: boolean },
>(images: T[], { minBytes, maxImages }: ImageSelectionOptions): T[] {
  const seen = new Set<string>();
  const unique: Array<{ image: T; index: number }> = [];
  images.forEach((image, index) => {
    if (image.data.length < minBytes && !image.converted) return;
    const hash = createHash("sha256").update(image.data).digest("hex");
    if (seen.has(hash)) return;
    seen.add(hash);
    unique.push({ image, index });
  });

  return unique
    .sort((a, b) => b.image.data.length - a.image.data.length)
    .slice(0, maxImages)
    .sort((a, b) => a.index - b.index)
    .map(({ image }) => image);
}
