/**
 * Text extraction utilities for documents
 */
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// pdfjs falls back to loading ./pdf.worker.mjs from disk, which isn't present in
// the bundled Lambda. Registering the worker module keeps it in the bundle.
// @ts-expect-error pdfjs ships no declarations for the worker entry point
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

(globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;

export async function getS3Object(s3Key: string): Promise<Buffer> {
  const s3Client = new S3Client();
  const bucketName = process.env.STORAGE_BUCKET || "";

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as any;

  // Convert stream to buffer
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Images smaller than this on either side are treated as decoration (logos,
 * bullets, rules) and do not make a page a candidate for visual analysis.
 */
export const MIN_MEANINGFUL_IMAGE_PX = 120;

/**
 * Counts the raster images that look like content on a PDF page, using the
 * page's operator list. Vector drawings are not counted.
 */
export async function countPageImages(page: {
  getOperatorList: () => Promise<{ fnArray: number[]; argsArray: any[] }>;
}): Promise<number> {
  const { OPS } = pdfjsLib;
  const { fnArray, argsArray } = await page.getOperatorList();
  let count = 0;
  for (let index = 0; index < fnArray.length; index += 1) {
    const fn = fnArray[index];
    const args = argsArray[index];
    let width: unknown;
    let height: unknown;
    if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
      [, width, height] = args ?? [];
    } else if (
      fn === OPS.paintInlineImageXObject ||
      fn === OPS.paintImageMaskXObject
    ) {
      width = args?.[0]?.width;
      height = args?.[0]?.height;
    } else {
      continue;
    }
    if (
      typeof width === "number" &&
      typeof height === "number" &&
      width >= MIN_MEANINGFUL_IMAGE_PX &&
      height >= MIN_MEANINGFUL_IMAGE_PX
    ) {
      count += 1;
    }
  }
  return count;
}

export interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
  height?: number;
  transform?: number[];
}

/**
 * Joins pdfjs text items in content-stream order, starting a new line when the
 * baseline moves by more than half a text height or pdfjs reports an
 * end-of-line. Preserving line structure lets labelled lines ("Path: 11") be
 * recognised; stream order keeps each card's text together.
 */
export function joinPdfTextItems(items: PdfTextItem[]): string {
  let text = "";
  let lastBaseline: number | undefined;
  let pendingBreak = false;

  for (const item of items) {
    const baseline = item.transform?.[5];
    if (
      baseline !== undefined &&
      lastBaseline !== undefined &&
      Math.abs(baseline - lastBaseline) > Math.max(2, (item.height ?? 8) * 0.5)
    ) {
      pendingBreak = true;
    }
    if (typeof item.str === "string" && item.str.length > 0) {
      if (text) text += pendingBreak ? "\n" : " ";
      text += item.str;
      pendingBreak = false;
      if (baseline !== undefined) lastBaseline = baseline;
    }
    if (item.hasEOL) pendingBreak = true;
  }

  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Extract text from PDF file
 */
export async function extractPdfText(s3Key: string): Promise<{
  pages: Array<{ pageNumber: number; text: string; imageCount: number }>;
  pageCount: number;
}> {
  const BATCH_SIZE = 10; // Process 10 pages at a time

  console.log("[extractPdfText] Loading PDF from S3...");
  const buffer = await getS3Object(s3Key);

  // Load PDF document from buffer
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    disableWorker: true, // Disable worker threads in Lambda
    isEvalSupported: false,
    useWorkerFetch: false,
  } as any);

  const pdfDocument = await loadingTask.promise;
  const totalPages = pdfDocument.numPages;
  const extractedPages: Array<{
    pageNumber: number;
    text: string;
    imageCount: number;
  }> = [];

  console.log(`[extractPdfText] Processing ${totalPages} pages...`);

  // Process pages in batches
  for (
    let currentPage = 0;
    currentPage < totalPages;
    currentPage += BATCH_SIZE
  ) {
    const batchEnd = Math.min(currentPage + BATCH_SIZE, totalPages);
    console.log(
      `[extractPdfText] Processing pages ${currentPage + 1} to ${batchEnd}...`,
    );

    // Extract text for this batch in parallel
    const pagePromises = [];
    for (let pageNum = currentPage + 1; pageNum <= batchEnd; pageNum++) {
      pagePromises.push(
        (async (num) => {
          try {
            const page = await pdfDocument.getPage(num);
            const textContent = await page.getTextContent();

            // Combine text items, keeping line structure
            const pageText = joinPdfTextItems(
              textContent.items as PdfTextItem[],
            );

            let imageCount = 0;
            try {
              imageCount = await countPageImages(page);
            } catch (error) {
              console.warn(
                `[extractPdfText] Could not inspect images on page ${num}:`,
                error,
              );
            }

            page.cleanup();

            console.log(
              `[extractPdfText]   Page ${num}: ${pageText.length} characters, ${imageCount} images`,
            );

            return { pageNum: num, text: pageText, imageCount };
          } catch (error) {
            console.error(
              `[extractPdfText] Error extracting page ${num}:`,
              error,
            );
            return {
              pageNum: num,
              text: "",
              imageCount: 0,
              error: (error as Error).message,
            };
          }
        })(pageNum),
      );
    }

    // Wait for all pages in batch to complete
    const batchSettled = await Promise.allSettled(pagePromises);
    const batchResults = batchSettled
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);
    const batchFailures = batchSettled.filter((r) => r.status === "rejected");
    if (batchFailures.length > 0) {
      console.warn(
        `[textExtraction] ${batchFailures.length} page(s) failed to extract`,
      );
    }

    // Sort by page number and store
    batchResults
      .sort((a, b) => a.pageNum - b.pageNum)
      .forEach((result) => {
        // A page with images but no text layer is a scan or a figure page; keep
        // it so the vision pass can read it.
        if (result.text || result.imageCount > 0) {
          extractedPages.push({
            pageNumber: result.pageNum,
            text: result.text,
            imageCount: result.imageCount,
          });
        }
      });
  }

  // Clean up PDF document
  await pdfDocument.cleanup();
  await pdfDocument.destroy();

  const totalChars = extractedPages.reduce((sum, p) => sum + p.text.length, 0);
  console.log(
    `[extractPdfText] Complete: ${totalPages} pages, ${totalChars} total characters`,
  );

  return {
    pages: extractedPages,
    pageCount: totalPages,
  };
}

/**
 * Extract text from buffer based on file type
 */
export async function extractTextFromBuffer(
  s3Key: string,
  fileType: "docx" | "doc" | "md" | "txt",
): Promise<string> {
  const buffer = await getS3Object(s3Key);

  if (fileType === "docx" || fileType === "doc") {
    console.log(
      `[extractTextFromBuffer] Extracting ${fileType.toUpperCase()}...`,
    );
    // Dynamic import to avoid TypeScript type issues
    // @ts-ignore - mammoth types not available at compile time
    const mammoth = await import("mammoth");
    const result = await mammoth.default.extractRawText({ buffer });

    if (result.messages && result.messages.length > 0) {
      console.log("[extractTextFromBuffer] Mammoth warnings:", result.messages);
    }

    console.log(
      `[extractTextFromBuffer] Extracted ${result.value.length} characters`,
    );
    return result.value;
  }

  if (fileType === "md" || fileType === "txt") {
    console.log(
      `[extractTextFromBuffer] Extracting ${fileType.toUpperCase()} as plain text...`,
    );
    const text = buffer.toString("utf-8");
    console.log(`[extractTextFromBuffer] Extracted ${text.length} characters`);
    return text;
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}
