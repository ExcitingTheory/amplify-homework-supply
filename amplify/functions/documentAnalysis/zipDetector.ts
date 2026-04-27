/**
 * ZIP-based format detection
 * Peeks inside .zip files to determine if they are SCORM, IMS CC, EPUB, QTI, or generic archives
 */
import type { FormatExtractionResult } from './formatRegistry.js';
import { getS3Object } from './textExtraction.js';

/**
 * Detect the format of a ZIP file and extract its content accordingly
 * 
 * Detection markers:
 * - imsmanifest.xml present + adlcp namespace → SCORM
 * - imsmanifest.xml present + no SCORM markers → IMS Content Package / Common Cartridge
 * - META-INF/container.xml → EPUB
 * - *.qti.xml or imsqti namespace → QTI Package
 * - None of the above → Generic ZIP (not analyzable)
 */
export async function detectAndExtractZip(s3Key: string): Promise<FormatExtractionResult> {
  console.log('[detectAndExtractZip] Loading ZIP from S3...');
  const buffer = await getS3Object(s3Key);
  
  // @ts-ignore
  const JSZip = (await import('jszip')).default;
  const { XMLParser } = await import('fast-xml-parser');
  
  const zip = await JSZip.loadAsync(buffer);
  const fileList = Object.keys(zip.files);
  
  console.log(`[detectAndExtractZip] ZIP contains ${fileList.length} files`);
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  
  // Check 1: imsmanifest.xml → SCORM or IMS CC
  if (zip.files['imsmanifest.xml']) {
    const manifestXml = await zip.files['imsmanifest.xml'].async('text');
    const manifest = parser.parse(manifestXml);
    
    // Check for SCORM markers (adlcp namespace, scormtype attribute, etc.)
    const isSCORM = manifestXml.includes('adlcp:') || 
                    manifestXml.includes('adlcp_rootv1p2') ||
                    manifestXml.includes('adlcp_v3p0') ||
                    manifestXml.includes('imsss:') ||
                    manifestXml.includes('adlseq:');
    
    if (isSCORM) {
      console.log('[detectAndExtractZip] Detected: SCORM package');
      const { extractSCORM } = await import('./eduExtraction.js');
      return extractSCORM(s3Key, buffer, zip, manifest);
    } else {
      console.log('[detectAndExtractZip] Detected: IMS Content Package / Common Cartridge');
      const { extractIMSCC } = await import('./eduExtraction.js');
      return extractIMSCC(s3Key);
    }
  }
  
  // Check 2: META-INF/container.xml → EPUB
  if (zip.files['META-INF/container.xml']) {
    console.log('[detectAndExtractZip] Detected: EPUB');
    const { extractEpub } = await import('./epubExtraction.js');
    return extractEpub(s3Key);
  }
  
  // Check 3: QTI files in the ZIP
  const qtiFiles = fileList.filter(f => f.endsWith('.qti.xml'));
  if (qtiFiles.length > 0) {
    console.log('[detectAndExtractZip] Detected: QTI Package');
    // Extract all QTI files and merge
    return await extractQTIPackage(zip, parser, qtiFiles);
  }
  
  // Check for any XML files with QTI namespace
  for (const filename of fileList) {
    if (filename.endsWith('.xml') && !filename.startsWith('__MACOSX')) {
      const xmlContent = await zip.files[filename].async('text');
      if (xmlContent.includes('imsqti') || xmlContent.includes('assessmentItem') || xmlContent.includes('assessmentTest')) {
        console.log('[detectAndExtractZip] Detected: QTI Package (by namespace)');
        const qtiXmlFiles = fileList.filter(f => f.endsWith('.xml') && !f.startsWith('__MACOSX'));
        return await extractQTIPackage(zip, parser, qtiXmlFiles);
      }
      break; // Only check the first XML file for performance
    }
  }
  
  // None detected — generic ZIP, not analyzable
  console.log('[detectAndExtractZip] Generic ZIP detected — not an analyzable educational format');
  throw new Error('ZIP file does not contain a recognized educational format (SCORM, IMS CC, EPUB, or QTI)');
}

/**
 * Extract questions from a ZIP package containing multiple QTI XML files
 */
async function extractQTIPackage(
  zip: any,
  parser: any,
  qtiFiles: string[]
): Promise<FormatExtractionResult> {
  const allQuestions: unknown[] = [];
  const allText: string[] = [];
  let sourceFormat = 'qti-2.1';
  
  for (const filename of qtiFiles) {
    const file = zip.files[filename];
    if (!file || file.dir) continue;
    
    const xmlContent = await file.async('text');
    
    // Detect version
    if (xmlContent.includes('qti/3') || xmlContent.includes('qtiv3')) {
      sourceFormat = 'qti-3.0';
    }
    
    // Parse using the same logic as eduExtraction
    const { XMLParser: XP } = await import('fast-xml-parser');
    const p = new XP({ ignoreAttributes: false, removeNSPrefix: true });
    const parsed = p.parse(xmlContent);
    
    // Find assessment items
    const items = findAll(parsed, 'assessmentItem');
    for (const item of items) {
      const title = item['@_title'] || '';
      const bodyTexts: string[] = [];
      collectText(findFirst(item, 'itemBody'), bodyTexts);
      const prompt = bodyTexts.join(' ').trim() || title;
      
      if (prompt) {
        allQuestions.push({
          prompt,
          answer: '', // Would need full QTI parsing for correctResponse
          questionType: 'short-answer',
          difficulty: 'medium',
        });
        allText.push(`Q: ${prompt}`);
      }
    }
  }
  
  const text = allText.join('\n\n');
  
  return {
    text,
    pages: [{ pageNumber: 1, text }],
    pageCount: 1,
    sourceFormat,
    directContent: {
      questionsJSON: allQuestions.length > 0 ? allQuestions : undefined,
    },
  };
}

// --- Helpers (duplicated from eduExtraction to avoid circular imports) ---

function findAll(obj: any, key: string): any[] {
  const results: any[] = [];
  if (obj == null || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) { obj.forEach(i => results.push(...findAll(i, key))); return results; }
  for (const k of Object.keys(obj)) {
    if (k === key) {
      const val = obj[k];
      if (Array.isArray(val)) results.push(...val);
      else if (val != null) results.push(val);
    } else if (typeof obj[k] === 'object') {
      results.push(...findAll(obj[k], key));
    }
  }
  return results;
}

function findFirst(obj: any, key: string): any {
  const all = findAll(obj, key);
  return all[0] ?? null;
}

function collectText(obj: any, results: string[]): void {
  if (obj == null) return;
  if (typeof obj === 'string') { results.push(obj); return; }
  if (typeof obj === 'number') { results.push(String(obj)); return; }
  if (Array.isArray(obj)) { obj.forEach(i => collectText(i, results)); return; }
  if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k.startsWith('@_')) continue;
      collectText(obj[k], results);
    }
  }
}
