/**
 * Educational format extraction: SCORM, IMS Common Cartridge, QTI
 */
import type { FormatExtractionResult } from "./formatRegistry.js";
import { getS3Object } from "./textExtraction.js";

/**
 * Extract content from an IMS Common Cartridge (.imscc) package
 * Structure: ZIP with imsmanifest.xml + embedded QTI assessments + web content
 */
export async function extractIMSCC(
  s3Key: string,
): Promise<FormatExtractionResult> {
  console.log("[extractIMSCC] Loading IMS CC from S3...");
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

  const pages: Array<{ pageNumber: number; text: string }> = [];
  const directQuestions: unknown[] = [];
  const directObjectives: unknown[] = [];
  const mediaFiles: Array<{
    filename: string;
    mimeType: string;
    data: Buffer;
    description?: string;
  }> = [];
  let sourceFormat = "imscc-1.3"; // default, updated from manifest
  let pageNum = 0;

  // Parse manifest
  const manifestFile = zip.files["imsmanifest.xml"];
  if (!manifestFile) {
    throw new Error("Invalid IMS CC package: missing imsmanifest.xml");
  }

  const manifestXml = await manifestFile.async("text");
  const manifest = parser.parse(manifestXml);

  // Detect CC version from manifest schema
  const schemaVersion = findValue(manifest, "schemaversion");
  if (schemaVersion) {
    if (schemaVersion.includes("1.1")) sourceFormat = "imscc-1.1";
    else if (schemaVersion.includes("1.2")) sourceFormat = "imscc-1.2";
    else if (schemaVersion.includes("1.3")) sourceFormat = "imscc-1.3";
  }

  // Extract organization/structure titles as objectives
  const orgs = findAll(manifest, "organization");
  for (const org of orgs) {
    const items = findAll(org, "item");
    for (const item of items) {
      const title = findValue(item, "title");
      if (title) {
        directObjectives.push({ objective: title, bloom_level: "understand" });
      }
    }
  }

  // Find resources in manifest
  const resources = findAll(manifest, "resource");

  for (const resource of resources) {
    const type = resource["@_type"] || "";
    const href = resource["@_href"] || "";

    // QTI assessment items
    if (type.includes("qti") || type.includes("assessment")) {
      const qtiFiles = findAll(resource, "file")
        .map((f: any) => f["@_href"])
        .filter((h: string) => h && h.endsWith(".xml"));

      for (const qtiHref of qtiFiles) {
        const qtiFile = zip.files[qtiHref];
        if (qtiFile) {
          const qtiXml = await qtiFile.async("text");
          const questions = parseQTIXml(parser, qtiXml);
          directQuestions.push(...questions);
        }
      }
    }

    // Web content (HTML)
    if (type.includes("webcontent") && href) {
      const contentFile = zip.files[href];
      if (
        contentFile &&
        (href.endsWith(".html") ||
          href.endsWith(".htm") ||
          href.endsWith(".xhtml"))
      ) {
        const html = await contentFile.async("text");
        const text = convert(html, {
          wordwrap: false,
          selectors: [
            { selector: "img", format: "skip" },
            { selector: "script", format: "skip" },
            { selector: "style", format: "skip" },
          ],
        });

        if (text.trim()) {
          pageNum++;
          pages.push({ pageNumber: pageNum, text: text.trim() });
        }
      }
    }
  }

  const text = pages.map((p) => p.text).join("\n\n");

  // Extract media files (images, audio, video) from the package
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

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
    const mimeType = mediaExtensions[ext];
    if (mimeType) {
      try {
        const data = await (file as any).async("nodebuffer");
        const filename = path.split("/").pop() || path;
        mediaFiles.push({
          filename,
          mimeType,
          data,
          description: `Extracted from IMS CC package`,
        });
      } catch {
        /* skip unreadable files */
      }
    }
  }

  console.log(
    `[extractIMSCC] Extracted ${text.length} chars, ${directQuestions.length} questions, ${directObjectives.length} objectives, ${mediaFiles.length} media files`,
  );

  return {
    text,
    pages,
    pageCount: pages.length || 1,
    sourceFormat,
    directContent: {
      questionsJSON: directQuestions.length > 0 ? directQuestions : undefined,
      objectivesJSON:
        directObjectives.length > 0 ? directObjectives : undefined,
    },
    mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
  };
}

/**
 * Extract content from a SCORM package (.zip with imsmanifest.xml + SCORM markers)
 */
export async function extractSCORM(
  s3Key: string,
  buffer: Buffer,
  zip: any,
  manifest: any,
): Promise<FormatExtractionResult> {
  console.log("[extractSCORM] Extracting SCORM content...");

  const { XMLParser } = await import("fast-xml-parser");
  const { convert } = await import("html-to-text");

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });

  const pages: Array<{ pageNumber: number; text: string }> = [];
  const directObjectives: unknown[] = [];
  const directSummaries: unknown[] = [];
  const directQuestions: unknown[] = [];
  const mediaFiles: Array<{
    filename: string;
    mimeType: string;
    data: Buffer;
    description?: string;
  }> = [];
  let pageNum = 0;

  // Detect SCORM version
  const schemaVersion = findValue(manifest, "schemaversion");
  const sourceFormat =
    schemaVersion && schemaVersion.includes("2004")
      ? "scorm-2004"
      : "scorm-1.2";

  // Extract organization structure as summaries
  const orgs = findAll(manifest, "organization");
  for (const org of orgs) {
    const orgTitle = findValue(org, "title");
    const items = findAll(org, "item");

    if (orgTitle) {
      directSummaries.push({
        title: orgTitle,
        content: `Course module with ${items.length} items`,
        page_range: "1",
      });
    }

    for (const item of items) {
      const title = findValue(item, "title");
      if (title) {
        directObjectives.push({ objective: title, bloom_level: "understand" });
      }
    }
  }

  // Extract SCORM-specific objectives
  const objectives = findAll(manifest, "objective");
  for (const obj of objectives) {
    const id = obj["@_objectiveID"] || "";
    const title = findValue(obj, "title") || id;
    if (title) {
      directObjectives.push({ objective: title, bloom_level: "understand" });
    }
  }

  // Find HTML content resources and extract questions from quiz patterns
  const resources = findAll(manifest, "resource");
  for (const resource of resources) {
    const href = resource["@_href"] || "";
    if (!href) continue;

    const file = zip.files[href];
    if (
      file &&
      (href.endsWith(".html") ||
        href.endsWith(".htm") ||
        href.endsWith(".xhtml"))
    ) {
      const html = await file.async("text");
      const text = convert(html, {
        wordwrap: false,
        selectors: [
          { selector: "img", format: "skip" },
          { selector: "script", format: "skip" },
          { selector: "style", format: "skip" },
        ],
      });

      if (text.trim()) {
        pageNum++;
        pages.push({ pageNumber: pageNum, text: text.trim() });
      }

      // Extract quiz questions from SCORM HTML (common patterns)
      const questions = extractQuestionsFromHtml(html);
      directQuestions.push(...questions);
    }
  }

  // Extract media files (images, audio, video) from the SCORM package
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
          description: `Extracted from SCORM package`,
        });
      } catch {
        /* skip unreadable files */
      }
    }
  }

  const text = pages.map((p) => p.text).join("\n\n");

  console.log(
    `[extractSCORM] Extracted ${text.length} chars, ${directObjectives.length} objectives, ${directQuestions.length} questions, ${mediaFiles.length} media files`,
  );

  return {
    text,
    pages,
    pageCount: pages.length || 1,
    sourceFormat,
    directContent: {
      objectivesJSON:
        directObjectives.length > 0 ? directObjectives : undefined,
      summariesJSON: directSummaries.length > 0 ? directSummaries : undefined,
      questionsJSON: directQuestions.length > 0 ? directQuestions : undefined,
    },
    mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
  };
}

/**
 * Extract questions from a QTI XML file
 */
export async function extractQTI(
  s3Key: string,
): Promise<FormatExtractionResult> {
  console.log("[extractQTI] Loading QTI XML from S3...");
  const buffer = await getS3Object(s3Key);
  const xmlContent = buffer.toString("utf-8");

  const { XMLParser } = await import("fast-xml-parser");
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });

  const questions = parseQTIXml(parser, xmlContent);

  // Also extract text for GPT analysis
  const text = questions
    .map(
      (q: any) =>
        `Q: ${q.prompt}\nA: ${q.answer}${q.options ? "\nOptions: " + q.options.join(", ") : ""}`,
    )
    .join("\n\n");

  // Detect QTI version from namespace
  const sourceFormat =
    xmlContent.includes("qti/3") || xmlContent.includes("qtiv3")
      ? "qti-3.0"
      : "qti-2.1";

  console.log(
    `[extractQTI] Extracted ${questions.length} questions (${sourceFormat})`,
  );

  return {
    text,
    pages: [{ pageNumber: 1, text }],
    pageCount: 1,
    sourceFormat,
    directContent: {
      questionsJSON: questions,
    },
  };
}

// --- Internal Helpers ---

/**
 * Parse QTI XML content and extract questions
 */
function parseQTIXml(parser: any, xmlContent: string): unknown[] {
  const parsed = parser.parse(xmlContent);
  const questions: unknown[] = [];

  const assessmentItems = findAll(parsed, "assessmentItem");

  for (const item of assessmentItems) {
    const identifier = item["@_identifier"] || "";
    const title = item["@_title"] || "";

    // Extract question prompt from itemBody
    const itemBody = findFirst(item, "itemBody");
    const promptTexts: string[] = [];
    if (itemBody) {
      collectText(itemBody, promptTexts);
    }
    const prompt = promptTexts.join(" ").replace(/\s+/g, " ").trim() || title;

    // Determine interaction type and extract options
    const { questionType, options, correctAnswer } = parseInteraction(item);

    // Extract hints/feedback
    const feedback =
      findFirst(item, "feedbackInline") || findFirst(item, "feedbackBlock");
    const hintTexts: string[] = [];
    if (feedback) collectText(feedback, hintTexts);
    const hint = hintTexts.join(" ").trim() || undefined;

    questions.push({
      prompt,
      answer: correctAnswer,
      options: options.length > 0 ? options : undefined,
      questionType,
      difficulty: "medium",
      hint,
      metadata: { qtiIdentifier: identifier },
    });
  }

  return questions;
}

/** QTI interaction type mapping */
const QTI_TYPE_MAP: Record<string, string> = {
  choiceInteraction: "multiple-choice",
  textEntryInteraction: "short-answer",
  extendedTextInteraction: "essay",
  orderInteraction: "ordering",
  matchInteraction: "matching",
  inlineChoiceInteraction: "fill-in-the-blank",
  hottextInteraction: "highlight",
};

/**
 * Parse interaction elements from a QTI assessment item
 */
function parseInteraction(item: any): {
  questionType: string;
  options: string[];
  correctAnswer: string;
} {
  const options: string[] = [];
  let questionType = "short-answer";
  let correctAnswer = "";

  // Find correct response
  const correctResponse = findFirst(item, "correctResponse");
  const correctValues: string[] = [];
  if (correctResponse) {
    const values = findAll(correctResponse, "value");
    for (const v of values) {
      const text = typeof v === "string" ? v : v["#text"] || "";
      if (text) correctValues.push(String(text));
    }
  }

  // Check each interaction type
  for (const [interactionName, mappedType] of Object.entries(QTI_TYPE_MAP)) {
    const interaction = findFirst(item, interactionName);
    if (interaction) {
      questionType = mappedType;

      // For choice interactions, also check maxChoices for select-all
      if (interactionName === "choiceInteraction") {
        const maxChoices = interaction["@_maxChoices"];
        if (maxChoices && parseInt(maxChoices) > 1) {
          questionType = "select-all";
        }

        // Extract simpleChoice options
        const choices = findAll(interaction, "simpleChoice");
        for (const choice of choices) {
          const choiceTexts: string[] = [];
          collectText(choice, choiceTexts);
          const choiceText = choiceTexts.join(" ").trim();
          const choiceId = choice["@_identifier"] || "";

          options.push(choiceText);

          // Map correct response identifier to text
          if (correctValues.includes(choiceId)) {
            correctAnswer = correctAnswer
              ? `${correctAnswer}; ${choiceText}`
              : choiceText;
          }
        }
      }

      break;
    }
  }

  // Fallback: use correctValues directly if we didn't map them
  if (!correctAnswer && correctValues.length > 0) {
    correctAnswer = correctValues.join("; ");
  }

  return { questionType, options, correctAnswer };
}

/**
 * Recursively find all nodes with a given key name
 */
function findAll(obj: any, key: string): any[] {
  const results: any[] = [];
  if (obj == null || typeof obj !== "object") return results;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...findAll(item, key));
    }
    return results;
  }

  for (const k of Object.keys(obj)) {
    if (k === key) {
      const val = obj[k];
      if (Array.isArray(val)) {
        results.push(...val);
      } else if (val != null) {
        results.push(val);
      }
    } else if (typeof obj[k] === "object") {
      results.push(...findAll(obj[k], key));
    }
  }

  return results;
}

/**
 * Find the first occurrence of a key in an object tree
 */
function findFirst(obj: any, key: string): any {
  const all = findAll(obj, key);
  return all.length > 0 ? all[0] : null;
}

/**
 * Find a scalar value for a key (returns first string/number match)
 */
function findValue(obj: any, key: string): string | null {
  const items = findAll(obj, key);
  for (const item of items) {
    if (typeof item === "string") return item;
    if (typeof item === "number") return String(item);
    if (item?.["#text"] != null) return String(item["#text"]);
  }
  return null;
}

/**
 * Collect all text content from an XML node
 */
function collectText(obj: any, results: string[]): void {
  if (obj == null) return;
  if (typeof obj === "string") {
    results.push(obj);
    return;
  }
  if (typeof obj === "number") {
    results.push(String(obj));
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((i) => collectText(i, results));
    return;
  }
  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      if (k.startsWith("@_")) continue;
      collectText(obj[k], results);
    }
  }
}

/**
 * Extract quiz questions from SCORM HTML content
 * Common patterns: forms with radio/checkbox inputs, labeled questions, quiz divs
 */
function extractQuestionsFromHtml(html: string): unknown[] {
  const questions: unknown[] = [];

  // Pattern 1: question/answer divs with class patterns (common SCORM authoring tools)
  const questionDivPattern =
    /<div[^>]*class="[^"]*(?:question|quiz-item|assessment-item)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;

  while ((match = questionDivPattern.exec(html)) !== null) {
    const block = match[1];
    // Extract prompt text (usually in a p, h3, or span.question-text)
    const promptMatch = block.match(
      /<(?:p|h[1-6]|span)[^>]*class="[^"]*(?:prompt|question-text|stem)[^"]*"[^>]*>(.*?)<\/(?:p|h[1-6]|span)>/is,
    );
    if (!promptMatch) continue;

    const prompt = convert(promptMatch[1], { wordwrap: false }).trim();
    if (!prompt) continue;

    // Extract options from radio/checkbox inputs
    const options: string[] = [];
    const optionPattern = /<(?:label|li)[^>]*>(.*?)<\/(?:label|li)>/gi;
    let optMatch;
    while ((optMatch = optionPattern.exec(block)) !== null) {
      const optText = convert(optMatch[1], { wordwrap: false }).trim();
      if (optText) options.push(optText);
    }

    // Try to find correct answer from data attributes or hidden inputs
    const correctMatch =
      block.match(/data-correct="([^"]+)"/i) ||
      block.match(/value="([^"]+)"[^>]*checked/i);
    const answer = correctMatch ? correctMatch[1] : options[0] || "";

    questions.push({
      prompt,
      answer,
      options: options.length > 0 ? options : undefined,
      questionType: options.length > 0 ? "multiple-choice" : "short-answer",
      difficulty: "medium",
    });
  }

  // Pattern 2: Ordered lists with question text (simpler SCORM content)
  if (questions.length === 0) {
    const olPattern =
      /<ol[^>]*class="[^"]*(?:questions|quiz)[^"]*"[^>]*>([\s\S]*?)<\/ol>/gi;
    while ((match = olPattern.exec(html)) !== null) {
      const listBlock = match[1];
      const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liPattern.exec(listBlock)) !== null) {
        const text = convert(liMatch[1], { wordwrap: false }).trim();
        if (text && text.length > 10) {
          questions.push({
            prompt: text,
            answer: "",
            questionType: "short-answer",
            difficulty: "medium",
          });
        }
      }
    }
  }

  return questions;
}
