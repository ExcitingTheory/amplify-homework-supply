/**
 * Text extraction utilities for documents
 */
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const s3Client = new S3Client();

export async function getS3Object(s3Key: string): Promise<Buffer> {
  const bucketName = process.env.STORAGE_BUCKET || '';
  
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
 * Extract text from PDF file
 */
export async function extractPdfText(s3Key: string): Promise<{
  pages: Array<{ pageNumber: number; text: string }>;
  pageCount: number;
}> {
  const BATCH_SIZE = 10; // Process 10 pages at a time
  
  console.log('[extractPdfText] Loading PDF from S3...');
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
  const extractedPages: Array<{ pageNumber: number; text: string }> = [];
  
  console.log(`[extractPdfText] Processing ${totalPages} pages...`);
  
  // Process pages in batches
  for (let currentPage = 0; currentPage < totalPages; currentPage += BATCH_SIZE) {
    const batchEnd = Math.min(currentPage + BATCH_SIZE, totalPages);
    console.log(`[extractPdfText] Processing pages ${currentPage + 1} to ${batchEnd}...`);
    
    // Extract text for this batch in parallel
    const pagePromises = [];
    for (let pageNum = currentPage + 1; pageNum <= batchEnd; pageNum++) {
      pagePromises.push(
        (async (num) => {
          try {
            const page = await pdfDocument.getPage(num);
            const textContent = await page.getTextContent();
            
            // Combine text items with proper spacing
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            page.cleanup();
            
            console.log(`[extractPdfText]   Page ${num}: ${pageText.length} characters`);
            
            return { pageNum: num, text: pageText };
          } catch (error) {
            console.error(`[extractPdfText] Error extracting page ${num}:`, error);
            return { pageNum: num, text: '', error: (error as Error).message };
          }
        })(pageNum)
      );
    }
    
    // Wait for all pages in batch to complete
    const batchResults = await Promise.all(pagePromises);
    
    // Sort by page number and store
    batchResults
      .sort((a, b) => a.pageNum - b.pageNum)
      .forEach(result => {
        if (result.text) {
          extractedPages.push({
            pageNumber: result.pageNum,
            text: result.text,
          });
        }
      });
  }
  
  // Clean up PDF document
  await pdfDocument.cleanup();
  await pdfDocument.destroy();
  
  const totalChars = extractedPages.reduce((sum, p) => sum + p.text.length, 0);
  console.log(`[extractPdfText] Complete: ${totalPages} pages, ${totalChars} total characters`);
  
  return {
    pages: extractedPages,
    pageCount: totalPages,
  };
}

/**
 * Extract text from buffer based on file type
 */
export async function extractTextFromBuffer(s3Key: string, fileType: 'docx' | 'doc' | 'md' | 'txt'): Promise<string> {
  const buffer = await getS3Object(s3Key);
  
  if (fileType === 'docx' || fileType === 'doc') {
    console.log(`[extractTextFromBuffer] Extracting ${fileType.toUpperCase()}...`);
    // Dynamic import to avoid TypeScript type issues
    // @ts-ignore - mammoth types not available at compile time
    const mammoth = await import('mammoth');
    const result = await mammoth.default.extractRawText({ buffer });
    
    if (result.messages && result.messages.length > 0) {
      console.log('[extractTextFromBuffer] Mammoth warnings:', result.messages);
    }
    
    console.log(`[extractTextFromBuffer] Extracted ${result.value.length} characters`);
    return result.value;
  }
  
  if (fileType === 'md' || fileType === 'txt') {
    console.log(`[extractTextFromBuffer] Extracting ${fileType.toUpperCase()} as plain text...`);
    const text = buffer.toString('utf-8');
    console.log(`[extractTextFromBuffer] Extracted ${text.length} characters`);
    return text;
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
}
