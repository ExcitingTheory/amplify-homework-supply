/**
 * Builds a content context string for AI feedback personalization.
 * Summarizes uploaded documents and unit content so the AI can reference
 * specific pages, sections, or documents in its feedback.
 */

interface FileInfo {
  id?: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

interface DocumentInfo {
  id?: string;
  name?: string;
  extractedText?: string;
  status?: string;
  pageCount?: number;
}

interface UnitInfo {
  id?: string;
  name?: string;
  description?: string;
}

/**
 * Build a compact content context string for inclusion in AI verify calls.
 * Keeps output under ~2KB to avoid bloating Lambda payloads.
 */
export function buildContentContext(options: {
  unit?: UnitInfo | null;
  files?: FileInfo[] | Record<string, FileInfo> | null;
  documents?: DocumentInfo[] | null;
}): string | undefined {
  const { unit, files, documents } = options;
  const parts: string[] = [];

  // Unit info
  if (unit?.name) {
    parts.push(`Unit: "${unit.name}"${unit.description ? ` — ${unit.description}` : ''}`);
  }

  // Uploaded documents with extracted text summaries
  if (documents && Array.isArray(documents)) {
    const completedDocs = documents.filter(
      (d) => d?.extractedText && d.status === 'completed'
    );
    for (const doc of completedDocs.slice(0, 5)) {
      let entry = `Document: "${doc.name || 'Untitled'}"`;
      if (doc.pageCount) entry += ` (${doc.pageCount} pages)`;
      // Include first ~300 chars of extracted text as a summary
      if (doc.extractedText) {
        const preview = doc.extractedText.slice(0, 300).replace(/\n+/g, ' ').trim();
        entry += `\n  Summary: ${preview}...`;
      }
      parts.push(entry);
    }
  }

  // File listing (PDFs, images, audio that may contain relevant content)
  if (files) {
    const fileList = Array.isArray(files) ? files : Object.values(files);
    const contentFiles = fileList.filter(
      (f) => f?.name && (f.mimeType?.includes('pdf') || f.mimeType?.includes('image'))
    );
    if (contentFiles.length > 0 && !documents?.length) {
      const names = contentFiles.slice(0, 10).map((f) => `"${f.name}"`).join(', ');
      parts.push(`Available files: ${names}`);
    }
  }

  if (parts.length === 0) return undefined;
  return parts.join('\n\n');
}
