/**
 * EPUB extraction — reads EPUB (ZIP-based) ebook files
 * Follows reading order from spine, extracts chapter text
 */
import type { FormatExtractionResult } from "./formatRegistry.js";
import { getS3Object } from "./textExtraction.js";

/**
 * Extract content from an EPUB file
 * EPUB is a ZIP containing:
 * - META-INF/container.xml → points to .opf file
 * - .opf → manifest (all files) + spine (reading order) + metadata
 * - XHTML files → actual content
 */
export async function extractEpub(
  s3Key: string,
): Promise<FormatExtractionResult> {
  console.log("[extractEpub] Loading EPUB from S3...");
  const buffer = await getS3Object(s3Key);

  // @ts-ignore
  const JSZip = (await import("jszip")).default;
  const { XMLParser } = await import("fast-xml-parser");
  const { convert } = await import("html-to-text");

  const zip = await JSZip.loadAsync(buffer);
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });

  // Step 1: Find .opf file from container.xml
  const containerFile = zip.files["META-INF/container.xml"];
  if (!containerFile) {
    throw new Error("Invalid EPUB: missing META-INF/container.xml");
  }

  const containerXml = await containerFile.async("text");
  const container = parser.parse(containerXml);

  // Find rootfile path
  const rootfiles = findAllElements(container, "rootfile");
  const opfPath = rootfiles[0]?.["@_full-path"];
  if (!opfPath) {
    throw new Error("Invalid EPUB: no rootfile in container.xml");
  }

  // Step 2: Parse OPF file
  const opfFile = zip.files[opfPath];
  if (!opfFile) {
    throw new Error(`Invalid EPUB: missing OPF file at ${opfPath}`);
  }

  const opfXml = await opfFile.async("text");
  const opf = parser.parse(opfXml);

  // Get base directory of OPF for resolving relative paths
  const opfDir = opfPath.includes("/")
    ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1)
    : "";

  // Step 3: Build manifest map (id → href)
  const manifestItems = findAllElements(opf, "item");
  const manifestMap: Record<string, string> = {};
  for (const item of manifestItems) {
    const id = item["@_id"];
    const href = item["@_href"];
    if (id && href) {
      manifestMap[id] = opfDir + href;
    }
  }

  // Step 4: Get spine reading order
  const spineItems = findAllElements(opf, "itemref");
  const readingOrder: string[] = [];
  for (const ref of spineItems) {
    const idref = ref["@_idref"];
    if (idref && manifestMap[idref]) {
      readingOrder.push(manifestMap[idref]);
    }
  }

  // Step 5: Extract metadata
  const metadata = findFirstElement(opf, "metadata");
  const title = findTextContent(metadata, "title");
  const creator = findTextContent(metadata, "creator");
  const language = findTextContent(metadata, "language");
  const subject = findTextContent(metadata, "subject");

  // Step 6: Extract chapter content in reading order
  const pages: Array<{ pageNumber: number; text: string }> = [];
  const directSummaries: unknown[] = [];
  const directVocabulary: unknown[] = [];
  const mediaFiles: Array<{
    filename: string;
    mimeType: string;
    data: Buffer;
    description?: string;
  }> = [];

  for (let i = 0; i < readingOrder.length; i++) {
    const href = readingOrder[i];
    const file = zip.files[href];

    if (!file) continue;

    const html = await file.async("text");
    const text = convert(html, {
      wordwrap: false,
      selectors: [
        { selector: "img", format: "skip" },
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
        { selector: "nav", format: "skip" },
      ],
    });

    if (text.trim()) {
      pages.push({ pageNumber: i + 1, text: text.trim() });
    }

    // Extract vocabulary from definition lists (dl/dt/dd), glossary sections, or bold terms
    const vocabFromPage = extractVocabularyFromHtml(html, i + 1);
    directVocabulary.push(...vocabFromPage);
  }

  // Step 7: Try to parse TOC for summaries
  const tocSummaries = await extractTOC(zip, parser, opf, opfDir);
  if (tocSummaries.length > 0) {
    directSummaries.push(...tocSummaries);
  }

  // Step 8: Extract media files (images, audio) from the EPUB
  const mediaExtensions: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };

  for (const [path, zipFile] of Object.entries(zip.files)) {
    if ((zipFile as any).dir) continue;
    const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
    const mimeType = mediaExtensions[ext];
    if (mimeType) {
      try {
        const data = await (zipFile as any).async("nodebuffer");
        const filename = path.split("/").pop() || path;
        mediaFiles.push({
          filename,
          mimeType,
          data,
          description: `Extracted from EPUB`,
        });
      } catch {
        /* skip unreadable files */
      }
    }
  }

  // Detect EPUB version
  const epubVersion = findFirstElement(opf, "package")?.["@_version"] || "3.0";
  const sourceFormat = epubVersion.startsWith("2") ? "epub-2" : "epub-3";

  const fullText = pages.map((p) => p.text).join("\n\n");

  console.log(
    `[extractEpub] Extracted ${fullText.length} chars from ${pages.length} chapters (${sourceFormat}), ${directVocabulary.length} vocab, ${mediaFiles.length} media`,
  );

  return {
    text: fullText,
    pages,
    pageCount: pages.length,
    sourceFormat,
    metadata: { title, creator, language, subject },
    directContent: {
      summariesJSON: directSummaries.length > 0 ? directSummaries : undefined,
      vocabularyJSON:
        directVocabulary.length > 0 ? directVocabulary : undefined,
    },
    mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
  };
}

/**
 * Extract Table of Contents entries as summaries
 */
async function extractTOC(
  zip: any,
  parser: any,
  opf: any,
  opfDir: string,
): Promise<unknown[]> {
  const summaries: unknown[] = [];

  // Try EPUB 3 nav.xhtml first
  const manifestItems = findAllElements(opf, "item");
  const navItem = manifestItems.find((item: any) =>
    item["@_properties"]?.includes("nav"),
  );

  if (navItem?.["@_href"]) {
    const navPath = opfDir + navItem["@_href"];
    const navFile = zip.files[navPath];
    if (navFile) {
      const navHtml = await navFile.async("text");
      // Simple regex to extract nav > ol > li > a text from XHTML
      const linkPattern = /<a[^>]*>([^<]+)<\/a>/gi;
      let match;
      while ((match = linkPattern.exec(navHtml)) !== null) {
        const title = match[1].trim();
        if (title) {
          summaries.push({ title, content: "", page_range: "" });
        }
      }
      if (summaries.length > 0) return summaries;
    }
  }

  // Fallback: Try EPUB 2 NCX
  const ncxItem = manifestItems.find(
    (item: any) => item["@_media-type"] === "application/x-dtbncx+xml",
  );

  if (ncxItem?.["@_href"]) {
    const ncxPath = opfDir + ncxItem["@_href"];
    const ncxFile = zip.files[ncxPath];
    if (ncxFile) {
      const ncxXml = await ncxFile.async("text");
      const ncx = parser.parse(ncxXml);
      const navPoints = findAllElements(ncx, "navPoint");

      for (const np of navPoints) {
        const label = findTextContent(np, "text");
        if (label) {
          summaries.push({ title: label, content: "", page_range: "" });
        }
      }
    }
  }

  return summaries;
}

// --- Internal XML Helpers ---

function findAllElements(obj: any, key: string): any[] {
  const results: any[] = [];
  if (obj == null || typeof obj !== "object") return results;
  if (Array.isArray(obj)) {
    obj.forEach((i) => results.push(...findAllElements(i, key)));
    return results;
  }
  for (const k of Object.keys(obj)) {
    if (k === key) {
      const val = obj[k];
      if (Array.isArray(val)) results.push(...val);
      else if (val != null) results.push(val);
    } else if (typeof obj[k] === "object") {
      results.push(...findAllElements(obj[k], key));
    }
  }
  return results;
}

function findFirstElement(obj: any, key: string): any {
  const all = findAllElements(obj, key);
  return all[0] ?? null;
}

function findTextContent(obj: any, key: string): string | undefined {
  const items = findAllElements(obj, key);
  for (const item of items) {
    if (typeof item === "string") return item;
    if (typeof item === "number") return String(item);
    if (item?.["#text"] != null) return String(item["#text"]);
  }
  return undefined;
}

/**
 * Extract vocabulary from HTML content using common patterns:
 * - Definition lists (<dl><dt>term</dt><dd>definition</dd></dl>)
 * - Glossary sections with <strong>/<b> terms followed by definitions
 * - Spans with class="term" or class="vocab"
 */
function extractVocabularyFromHtml(html: string, page: number): unknown[] {
  const vocabulary: unknown[] = [];

  // Pattern 1: Definition lists (dt/dd pairs)
  const dlPattern = /<dl[^>]*>([\s\S]*?)<\/dl>/gi;
  let dlMatch;
  while ((dlMatch = dlPattern.exec(html)) !== null) {
    const dlContent = dlMatch[1];
    const dtPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    let pair;
    while ((pair = dtPattern.exec(dlContent)) !== null) {
      const word = pair[1].replace(/<[^>]+>/g, "").trim();
      const definition = pair[2].replace(/<[^>]+>/g, "").trim();
      if (word && definition) {
        vocabulary.push({ word, definition, context: "", page });
      }
    }
  }

  // Pattern 2: Glossary sections (common in educational EPUBs)
  const glossaryPattern =
    /<(?:section|div)[^>]*(?:class|id)="[^"]*(?:glossary|vocabulary|key-terms)[^"]*"[^>]*>([\s\S]*?)<\/(?:section|div)>/gi;
  let glossMatch;
  while ((glossMatch = glossaryPattern.exec(html)) !== null) {
    const section = glossMatch[1];
    // Look for bold term followed by text (e.g., <b>Term</b> - Definition)
    const termPattern =
      /<(?:strong|b|em)[^>]*>([\s\S]*?)<\/(?:strong|b|em)>\s*[-–:]\s*([^<]+)/gi;
    let termMatch;
    while ((termMatch = termPattern.exec(section)) !== null) {
      const word = termMatch[1].replace(/<[^>]+>/g, "").trim();
      const definition = termMatch[2].trim();
      if (word && definition && word.length < 50) {
        vocabulary.push({ word, definition, context: "", page });
      }
    }
  }

  // Pattern 3: Spans with vocab-related classes
  const vocabSpanPattern =
    /<span[^>]*class="[^"]*(?:vocab|term|keyword|definition-term)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let spanMatch;
  while ((spanMatch = vocabSpanPattern.exec(html)) !== null) {
    const word = spanMatch[1].replace(/<[^>]+>/g, "").trim();
    if (
      word &&
      word.length < 50 &&
      !vocabulary.some((v: any) => v.word === word)
    ) {
      vocabulary.push({ word, definition: "", context: "", page });
    }
  }

  return vocabulary;
}
