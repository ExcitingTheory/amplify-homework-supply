/**
 * Format Registry — Unified extension→extractor routing
 * Replaces the if/else chain in handler.ts with a declarative dispatch table
 */
import type { ExtractionResult } from "./officeExtraction.js";
import {
  extractPdfText,
  extractTextFromBuffer,
  getS3Object,
} from "./textExtraction.js";
import {
  EMBEDDED_IMAGE_FORMATS,
  extractZipMedia,
  type EmbeddedImage,
} from "./embeddedImages.js";
import {
  extractDocxInline,
  extractOdfInline,
  type InlineExtraction,
} from "./inlineImages.js";
import {
  extractSpreadsheetText,
  extractPresentationText,
  extractOdfText,
  detectCsvShape,
} from "./officeExtraction.js";

export interface FormatExtractionResult {
  text: string;
  /** `imageCount` is the number of content images on the page, when known. */
  pages: Array<{ pageNumber: number; text: string; imageCount?: number }>;
  pageCount: number;
  sourceFormat: string;
  metadata?: Record<string, unknown>;
  directContent?: {
    questionsJSON?: unknown[];
    vocabularyJSON?: unknown[];
    objectivesJSON?: unknown[];
    summariesJSON?: unknown[];
  };
  /**
   * Images found inside formats whose pages cannot be rendered (DOCX, XLSX,
   * ODF). They are described for analysis, not stored as files.
   */
  embeddedImages?: EmbeddedImage[];
  /**
   * `text` with a placeholder at each image, when image positions are known.
   * Each image's `marker` appears in it exactly where the image sits.
   */
  inlineText?: string;
  /** Text read from charts, SmartArt and SVG, with no model call needed. */
  visualText?: string[];
  /**
   * Images the vision model cannot read (EMF, WMF, TIFF, BMP). They are
   * converted to PNG before being described.
   */
  unconvertedImages?: EmbeddedImage[];
  /** Media files extracted from packages (SCORM, IMS CC, EPUB) ready for S3 upload */
  mediaFiles?: Array<{
    filename: string;
    mimeType: string;
    data: Buffer;
    description?: string;
  }>;
}

type ExtractorFn = (s3Key: string) => Promise<FormatExtractionResult>;

/**
 * Get the file extension from an S3 key (lowercase, without dot)
 */
function getExtension(s3Key: string): string {
  const lower = s3Key.toLowerCase();
  // Handle .qti.xml compound extension
  if (lower.endsWith(".qti.xml")) return "qti.xml";
  const lastDot = lower.lastIndexOf(".");
  if (lastDot === -1) return "";
  return lower.substring(lastDot + 1);
}

/**
 * Create a simple text-based extractor (for .txt, .md, .csv, .gift)
 */
function plainTextExtractor(sourceFormat: string): ExtractorFn {
  return async (s3Key: string) => {
    const buffer = await getS3Object(s3Key);
    const text = buffer.toString("utf-8");
    return {
      text,
      pages: [{ pageNumber: 1, text }],
      pageCount: Math.ceil(text.length / 2000),
      sourceFormat,
    };
  };
}

/**
 * Create a mammoth-based extractor (for .doc, .docx)
 */
function mammothExtractor(
  sourceFormat: string,
  fileType: "doc" | "docx",
): ExtractorFn {
  return async (s3Key: string) => {
    const text = await extractTextFromBuffer(s3Key, fileType);
    return {
      text,
      pages: [{ pageNumber: 1, text }],
      pageCount: Math.ceil(text.length / 2000),
      sourceFormat,
    };
  };
}

/**
 * The format registry — maps file extensions to their extractors
 */
const formatRegistry: Record<string, ExtractorFn> = {
  // --- Existing working formats ---
  pdf: async (s3Key) => {
    const result = await extractPdfText(s3Key);
    const text = result.pages
      .map((p) => p.text)
      .filter(Boolean)
      .join("\n\n");
    return {
      text,
      pages: result.pages,
      pageCount: result.pageCount,
      sourceFormat: "pdf",
    };
  },
  txt: plainTextExtractor("txt"),
  csv: async (s3Key: string) => {
    const buffer = await getS3Object(s3Key);
    const text = buffer.toString("utf-8");
    const directContent = detectCsvShape(text);
    return {
      text,
      pages: [{ pageNumber: 1, text }],
      pageCount: Math.ceil(text.length / 2000),
      sourceFormat: "csv",
      directContent,
    };
  },
  docx: mammothExtractor("docx", "docx"),

  // --- Phase 1: Fixed broken formats ---
  md: plainTextExtractor("md"),
  doc: mammothExtractor("doc", "doc"),

  xls: async (s3Key) => {
    const result = await extractSpreadsheetText(s3Key);
    return { ...result, sourceFormat: "xls" };
  },
  xlsx: async (s3Key) => {
    const result = await extractSpreadsheetText(s3Key);
    return { ...result, sourceFormat: "xlsx" };
  },

  ppt: async (s3Key) => {
    const result = await extractPresentationText(s3Key);
    return { ...result, sourceFormat: "ppt" };
  },
  pptx: async (s3Key) => {
    const result = await extractPresentationText(s3Key);
    return { ...result, sourceFormat: "pptx" };
  },

  odt: async (s3Key) => {
    const result = await extractOdfText(s3Key, "odt");
    return { ...result, sourceFormat: "odt" };
  },
  ods: async (s3Key) => {
    const result = await extractOdfText(s3Key, "ods");
    return { ...result, sourceFormat: "ods" };
  },
  odp: async (s3Key) => {
    const result = await extractOdfText(s3Key, "odp");
    return { ...result, sourceFormat: "odp" };
  },
  rtf: async (s3Key) => {
    const { extractRtf } = await import("./rtfExtraction.js");
    return extractRtf(s3Key);
  },

  // --- Phase 2: Educational formats (lazy-loaded) ---
  gift: async (s3Key) => {
    const { extractGift } = await import("./giftParser.js");
    return extractGift(s3Key);
  },
  epub: async (s3Key) => {
    const { extractEpub } = await import("./epubExtraction.js");
    return extractEpub(s3Key);
  },
  imscc: async (s3Key) => {
    const { extractIMSCC } = await import("./eduExtraction.js");
    return extractIMSCC(s3Key);
  },
  "qti.xml": async (s3Key) => {
    const { extractQTI } = await import("./eduExtraction.js");
    return extractQTI(s3Key);
  },
  qti: async (s3Key) => {
    const { extractQTI } = await import("./eduExtraction.js");
    return extractQTI(s3Key);
  },
  // .zip handled separately — requires content detection (see zipDetector)
};

/** Formats where image positions can be recovered from the document body. */
const INLINE_IMAGE_FORMATS = new Set(["docx", "odt", "odp"]);

async function readInline(
  buffer: Buffer,
  ext: string,
): Promise<InlineExtraction | null> {
  try {
    return ext === "docx"
      ? await extractDocxInline(buffer)
      : await extractOdfInline(buffer);
  } catch (error) {
    console.warn(`[formatRegistry] Could not place images in ${ext}:`, error);
    return null;
  }
}

/**
 * Adds charts, SmartArt, SVG text and images to an extraction result. Where
 * the format allows it, images come with their position in the text.
 */
async function attachVisualContent(
  result: FormatExtractionResult,
  s3Key: string,
  ext: string,
): Promise<void> {
  const buffer = await getS3Object(s3Key);
  const inline = INLINE_IMAGE_FORMATS.has(ext)
    ? await readInline(buffer, ext)
    : null;
  const media = await extractZipMedia(buffer, ext, {
    includeRaster: !inline,
  });

  const images = inline ? inline.images : media.images;
  const unconverted = inline ? inline.unconverted : media.unconverted;
  if (images.length > 0) result.embeddedImages = images;
  if (unconverted.length > 0) result.unconvertedImages = unconverted;
  if (media.visualText.length > 0) result.visualText = media.visualText;
  if (inline && (images.length > 0 || unconverted.length > 0)) {
    result.inlineText = inline.text;
  }
}

/**
 * Check if a file extension is supported for extraction
 */
export function isSupportedFormat(s3Key: string): boolean {
  const ext = getExtension(s3Key);
  return ext in formatRegistry || ext === "zip";
}

/**
 * Extract content from a file based on its extension
 * For .zip files, uses zipDetector to determine the actual format
 */
export async function extractByFormat(
  s3Key: string,
): Promise<FormatExtractionResult> {
  const ext = getExtension(s3Key);

  // Handle .zip files with content detection
  if (ext === "zip") {
    const { detectAndExtractZip } = await import("./zipDetector.js");
    return detectAndExtractZip(s3Key);
  }

  const extractor = formatRegistry[ext];
  if (!extractor) {
    throw new Error(`Unsupported file type: ${s3Key} (extension: .${ext})`);
  }

  console.log(`[formatRegistry] Routing .${ext} file to extractor`);
  const result = await extractor(s3Key);
  if (EMBEDDED_IMAGE_FORMATS.has(ext) && !result.embeddedImages) {
    try {
      await attachVisualContent(result, s3Key, ext);
    } catch (error) {
      // Visual content is an enhancement; never fail text extraction over it.
      console.warn(`[formatRegistry] Could not read embedded visuals:`, error);
    }
  }
  return result;
}
