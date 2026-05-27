/**
 * Builds a content context string for AI feedback personalization.
 * Summarizes uploaded documents and unit content so the AI can reference
 * specific pages, sections, or documents in its feedback.
 */

import getCachedUrl from "./getCachedUrl";

interface FileInfo {
  id?: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

interface DocumentInfo {
  id?: string;
  name?: string;
  identityId?: string;
  extractedText?: string;
  textExtractedAt?: number;
  status?: string;
  pageCount?: number;
}

interface UnitInfo {
  id?: string;
  name?: string;
  description?: string;
}

/**
 * Load first N chars of extracted text from S3 for a document.
 */
async function loadExtractedTextPreview(
  identityId: string,
  documentId: string,
  maxChars = 300,
): Promise<string | null> {
  try {
    const s3Path = `private/${identityId}/documents/${documentId}/extracted-text.txt`;
    const url = await getCachedUrl(s3Path);
    if (!url) return null;
    const response = await fetch(url, {
      headers: { Range: `bytes=0-${maxChars * 4}` }, // UTF-8 can be up to 4 bytes per char
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text.slice(0, maxChars);
  } catch {
    return null;
  }
}

/**
 * Build a compact content context string for inclusion in AI verify calls.
 * Keeps output under ~2KB to avoid bloating Lambda payloads.
 */
export async function buildContentContext(options: {
  unit?: UnitInfo | null;
  files?: FileInfo[] | Record<string, FileInfo> | null;
  documents?: DocumentInfo[] | null;
}): Promise<string | undefined> {
  const { unit, files, documents } = options;
  const parts: string[] = [];

  // Unit info
  if (unit?.name) {
    parts.push(
      `Unit: "${unit.name}"${unit.description ? ` — ${unit.description}` : ""}`,
    );
  }

  // Uploaded documents with extracted text summaries (loaded from S3)
  if (documents && Array.isArray(documents)) {
    const completedDocs = documents.filter(
      (d) =>
        (d?.textExtractedAt || d?.extractedText) && d.status === "completed",
    );
    const docPreviews = await Promise.all(
      completedDocs.slice(0, 5).map(async (doc) => {
        let entry = `Document: "${doc.name || "Untitled"}"`;
        if (doc.pageCount) entry += ` (${doc.pageCount} pages)`;

        // Try S3 first, fall back to inline extractedText
        let preview: string | null = null;
        if (doc.identityId && doc.id) {
          preview = await loadExtractedTextPreview(doc.identityId, doc.id);
        }
        if (!preview && doc.extractedText) {
          preview = doc.extractedText.slice(0, 300).replace(/\n+/g, " ").trim();
        }
        if (preview) {
          entry += `\n  Summary: ${preview}...`;
        }
        return entry;
      }),
    );
    parts.push(...docPreviews);
  }

  // File listing (PDFs, images, audio that may contain relevant content)
  if (files) {
    const fileList = Array.isArray(files) ? files : Object.values(files);
    const contentFiles = fileList.filter(
      (f) =>
        f?.name &&
        (f.mimeType?.includes("pdf") || f.mimeType?.includes("image")),
    );
    if (contentFiles.length > 0 && !documents?.length) {
      const names = contentFiles
        .slice(0, 10)
        .map((f) => `"${f.name}"`)
        .join(", ");
      parts.push(`Available files: ${names}`);
    }
  }

  if (parts.length === 0) return undefined;
  return parts.join("\n\n");
}
