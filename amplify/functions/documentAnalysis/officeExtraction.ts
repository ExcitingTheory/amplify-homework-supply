/**
 * Office format text extraction utilities
 * Handles: XLS, XLSX, PPT, PPTX, ODT, ODS, ODP
 */
import { getS3Object } from './textExtraction.js';
import { chartXmlToText, diagramXmlToText } from './officeCharts.js';

export interface ExtractionResult {
  text: string;
  pages: Array<{ pageNumber: number; text: string; imageCount?: number }>;
  pageCount: number;
  metadata?: Record<string, unknown>;
  directContent?: {
    questionsJSON?: unknown[];
    vocabularyJSON?: unknown[];
  };
}

/**
 * Extract text from XLS/XLSX spreadsheets using SheetJS
 */
export async function extractSpreadsheetText(s3Key: string): Promise<ExtractionResult> {
  console.log('[extractSpreadsheetText] Loading spreadsheet from S3...');
  const buffer = await getS3Object(s3Key);
  
  // @ts-ignore - xlsx types not available at compile time
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  const pages: Array<{ pageNumber: number; text: string }> = [];
  
  workbook.SheetNames.forEach((sheetName: string, index: number) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    
    if (csv.trim()) {
      pages.push({
        pageNumber: index + 1,
        text: `--- Sheet: ${sheetName} ---\n${csv}`,
      });
    }
  });
  
  const text = pages.map(p => p.text).join('\n\n');
  console.log(`[extractSpreadsheetText] Extracted ${text.length} characters from ${pages.length} sheets`);
  
  // Smart shape detection: check first sheet for vocabulary or quiz columns
  const directContent = detectSpreadsheetShape(workbook);
  
  return {
    text,
    pages,
    pageCount: pages.length,
    metadata: { sheetNames: workbook.SheetNames },
    directContent,
  };
}

/**
 * Reads the charts and SmartArt diagrams a slide points to through its
 * relationships file, as text. Slides keep their own data parts, so the
 * values land on the slide they belong to.
 */
async function readSlideVisuals(zip: any, slideFile: string): Promise<string[]> {
  const slideName = slideFile.split('/').pop() ?? '';
  const relsFile = zip.files[`ppt/slides/_rels/${slideName}.rels`];
  if (!relsFile) return [];

  const rels: string = await relsFile.async('text');
  const visuals: string[] = [];
  for (const match of rels.matchAll(/Target="([^"]+)"/g)) {
    const target = match[1].replace(/^\.\.\//, 'ppt/');
    const part = zip.files[target];
    if (!part) continue;
    if (/^ppt\/charts\/chart\d+\.xml$/i.test(target)) {
      const text = chartXmlToText(await part.async('text'));
      if (text) visuals.push(text);
    } else if (/^ppt\/diagrams\/data\d*\.xml$/i.test(target)) {
      const text = diagramXmlToText(await part.async('text'));
      if (text) visuals.push(text);
    }
  }
  return visuals;
}

/**
 * Extract text from PPT/PPTX presentations
 * PPTX is an OOXML ZIP; slide text is in <a:t> elements within ppt/slides/slide*.xml
 */
export async function extractPresentationText(s3Key: string): Promise<ExtractionResult> {
  console.log('[extractPresentationText] Loading presentation from S3...');
  const buffer = await getS3Object(s3Key);
  
  // @ts-ignore - jszip types not available at compile time
  const JSZip = (await import('jszip')).default;
  const { XMLParser } = await import('fast-xml-parser');
  
  const zip = await JSZip.loadAsync(buffer);
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  
  // Find slide XML files and sort numerically
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });
  
  const pages: Array<{ pageNumber: number; text: string; imageCount: number }> = [];
  
  for (let i = 0; i < slideFiles.length; i++) {
    const slideXml = await zip.files[slideFiles[i]].async('text');
    const parsed = parser.parse(slideXml);
    
    // Extract all text nodes (<a:t> elements) recursively
    const texts: string[] = [];
    extractTextNodes(parsed, texts);
    
    const visuals = await readSlideVisuals(zip, slideFiles[i]);
    const slideText = [texts.join(' '), ...visuals]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Pictures and charts live on the slide itself; a slide with no text but
    // with either is kept so the vision pass can read it.
    const imageCount = (slideXml.match(/<(?:p:pic|c:chart)[\s>/]/g) ?? []).length;
    if (slideText || imageCount > 0) {
      pages.push({
        pageNumber: i + 1,
        text: slideText,
        imageCount,
      });
    }
  }
  
  const text = pages.map(p => p.text).filter(Boolean).join('\n\n');
  console.log(`[extractPresentationText] Extracted ${text.length} characters from ${pages.length} slides`);
  
  return {
    text,
    pages,
    pageCount: pages.length,
  };
}

/**
 * Extract text from ODF files (ODT, ODS, ODP)
 * ODF files are ZIPs with content.xml containing the document structure
 */
export async function extractOdfText(s3Key: string, format: 'odt' | 'ods' | 'odp'): Promise<ExtractionResult> {
  console.log(`[extractOdfText] Loading ${format.toUpperCase()} from S3...`);
  const buffer = await getS3Object(s3Key);
  
  // @ts-ignore - jszip types not available at compile time
  const JSZip = (await import('jszip')).default;
  const { XMLParser } = await import('fast-xml-parser');
  
  const zip = await JSZip.loadAsync(buffer);
  
  const contentXml = zip.files['content.xml'];
  if (!contentXml) {
    throw new Error('Invalid ODF file: missing content.xml');
  }
  
  const xmlContent = await contentXml.async('text');
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  const parsed = parser.parse(xmlContent);
  
  const texts: string[] = [];
  
  if (format === 'ods') {
    // For spreadsheets, extract table-row/table-cell content
    extractOdfTableText(parsed, texts);
  } else {
    // For text docs and presentations, extract text:p, text:span, text:h elements
    extractTextNodes(parsed, texts);
  }
  
  const text = texts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const pageCount = Math.ceil(text.length / 2000);
  
  console.log(`[extractOdfText] Extracted ${text.length} characters`);
  
  return {
    text,
    pages: [{ pageNumber: 1, text }],
    pageCount,
  };
}

/**
 * Recursively extract text content from XML nodes
 * Looks for text in 't', 'p', 'span', 'h' elements
 */
function extractTextNodes(obj: any, results: string[]): void {
  if (obj == null) return;
  
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed) results.push(trimmed);
    return;
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    results.push(String(obj));
    return;
  }
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractTextNodes(item, results);
    }
    return;
  }
  
  if (typeof obj === 'object') {
    // Check for direct text content in common XML text elements
    for (const key of Object.keys(obj)) {
      // Skip attribute keys
      if (key.startsWith('@_')) continue;
      
      // These are the text-bearing elements in OOXML and ODF
      if (key === 't' || key === '#text') {
        const val = obj[key];
        if (typeof val === 'string' && val.trim()) {
          results.push(val.trim());
        } else if (typeof val === 'number') {
          results.push(String(val));
        }
      } else {
        extractTextNodes(obj[key], results);
      }
    }
  }
}

/**
 * Extract text from ODF spreadsheet table structures
 */
function extractOdfTableText(obj: any, results: string[]): void {
  if (obj == null) return;
  
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed) results.push(trimmed);
    return;
  }
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractOdfTableText(item, results);
    }
    return;
  }
  
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('@_')) continue;
      
      if (key === '#text' || key === 't' || key === 'p') {
        const val = obj[key];
        if (typeof val === 'string' && val.trim()) {
          results.push(val.trim());
        } else if (typeof val === 'number') {
          results.push(String(val));
        } else if (typeof val === 'object') {
          extractOdfTableText(val, results);
        }
      } else {
        extractOdfTableText(obj[key], results);
      }
    }
  }
}

// --- Smart shape detection for spreadsheets ---

/** Column header patterns that indicate vocabulary data */
const VOCAB_HEADERS = /^(word|term|vocabulary|vocab|kanji|hanzi|phrase|expression|lemma)$/i;
const DEFINITION_HEADERS = /^(definition|meaning|translation|gloss|english|target|explanation)$/i;

/** Column header patterns that indicate quiz/question data */
const QUESTION_HEADERS = /^(question|prompt|stem|item|q)$/i;
const ANSWER_HEADERS = /^(answer|correct|response|key|a|solution)$/i;

/**
 * Detect if a workbook contains vocabulary-shaped or quiz-shaped data
 * based on column headers in the first row of each sheet.
 * Returns directContent with extracted structured data, or undefined.
 */
function detectSpreadsheetShape(workbook: any): ExtractionResult['directContent'] {
  // Dynamic import not needed — xlsx is already loaded by caller
  let XLSX: any;
  try {
    XLSX = require('xlsx');
  } catch {
    return undefined;
  }

  const vocabularyJSON: unknown[] = [];
  const questionsJSON: unknown[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rows.length < 2) continue;

    const headers = rows[0].map((h: any) => String(h ?? '').trim());

    // Check for vocabulary shape
    const wordCol = headers.findIndex((h: string) => VOCAB_HEADERS.test(h));
    const defCol = headers.findIndex((h: string) => DEFINITION_HEADERS.test(h));

    if (wordCol !== -1 && defCol !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const word = String(rows[i]?.[wordCol] ?? '').trim();
        const definition = String(rows[i]?.[defCol] ?? '').trim();
        if (word && definition) {
          vocabularyJSON.push({
            word,
            definition,
            context: '',
            page: sheetName,
          });
        }
      }
      continue; // Don't also check for quiz shape on same sheet
    }

    // Check for quiz/question shape
    const qCol = headers.findIndex((h: string) => QUESTION_HEADERS.test(h));
    const aCol = headers.findIndex((h: string) => ANSWER_HEADERS.test(h));

    if (qCol !== -1 && aCol !== -1) {
      for (let i = 1; i < rows.length; i++) {
        const prompt = String(rows[i]?.[qCol] ?? '').trim();
        const answer = String(rows[i]?.[aCol] ?? '').trim();
        if (prompt && answer) {
          questionsJSON.push({
            prompt,
            answer,
            questionType: 'short-answer',
            difficulty: 'medium',
          });
        }
      }
    }
  }

  if (vocabularyJSON.length === 0 && questionsJSON.length === 0) {
    return undefined;
  }

  console.log(`[detectSpreadsheetShape] Detected ${vocabularyJSON.length} vocab entries, ${questionsJSON.length} questions`);

  return {
    vocabularyJSON: vocabularyJSON.length > 0 ? vocabularyJSON : undefined,
    questionsJSON: questionsJSON.length > 0 ? questionsJSON : undefined,
  };
}

/**
 * Detect if CSV text contains vocabulary or quiz data based on first-row headers.
 * Exported for use by formatRegistry for plain .csv files.
 */
export function detectCsvShape(csvText: string): ExtractionResult['directContent'] {
  const lines = csvText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return undefined;

  // Parse header row (simple CSV split — handles most cases)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

  const wordCol = headers.findIndex(h => VOCAB_HEADERS.test(h));
  const defCol = headers.findIndex(h => DEFINITION_HEADERS.test(h));
  const qCol = headers.findIndex(h => QUESTION_HEADERS.test(h));
  const aCol = headers.findIndex(h => ANSWER_HEADERS.test(h));

  const vocabularyJSON: unknown[] = [];
  const questionsJSON: unknown[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));

    if (wordCol !== -1 && defCol !== -1) {
      const word = cols[wordCol] ?? '';
      const definition = cols[defCol] ?? '';
      if (word && definition) {
        vocabularyJSON.push({ word, definition, context: '', page: 1 });
      }
    } else if (qCol !== -1 && aCol !== -1) {
      const prompt = cols[qCol] ?? '';
      const answer = cols[aCol] ?? '';
      if (prompt && answer) {
        questionsJSON.push({ prompt, answer, questionType: 'short-answer', difficulty: 'medium' });
      }
    }
  }

  if (vocabularyJSON.length === 0 && questionsJSON.length === 0) return undefined;

  console.log(`[detectCsvShape] Detected ${vocabularyJSON.length} vocab entries, ${questionsJSON.length} questions`);

  return {
    vocabularyJSON: vocabularyJSON.length > 0 ? vocabularyJSON : undefined,
    questionsJSON: questionsJSON.length > 0 ? questionsJSON : undefined,
  };
}
