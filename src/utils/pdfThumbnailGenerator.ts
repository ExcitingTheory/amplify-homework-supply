/**
 * @fileoverview PDF Thumbnail Generator - Generate and save PDF page thumbnails to S3
 * 
 * Generates thumbnail images from PDF pages and uploads them to S3 for efficient display.
 * Should be called during document upload/processing, not on-demand during viewing.
 * 
 * @module pdfThumbnailGenerator
 */

import { pdfjs } from 'react-pdf';
import { uploadData } from 'aws-amplify/storage';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface ThumbnailOptions {
    /** Width of thumbnail in pixels */
    width?: number;
    /** JPEG quality (0-1) */
    quality?: number;
    /** Image format */
    format?: 'png' | 'jpeg';
}

interface GenerateThumbnailsResult {
    /** Array of S3 keys for uploaded thumbnails */
    thumbnailKeys: string[];
    /** Total pages in PDF */
    pageCount: number;
    /** Any errors encountered */
    errors: Array<{ page: number; error: string }>;
}

/**
 * Generate thumbnail for a single PDF page
 * @param pdfUrl - URL of the PDF file
 * @param pageNumber - Page number (1-based)
 * @param options - Thumbnail generation options
 * @returns Data URL of the thumbnail image
 */
async function generatePageThumbnail(
    pdfUrl: string,
    pageNumber: number,
    options: ThumbnailOptions = {}
): Promise<string> {
    const { width = 300, quality = 0.85, format = 'jpeg' } = options;

    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);

    // Calculate viewport with desired width
    const viewport = page.getViewport({ scale: 1 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    if (!context) {
        throw new Error('Could not get canvas context');
    }

    // Render PDF page to canvas
    await page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas,
    }).promise;

    // Convert canvas to data URL
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(mimeType, quality);
}

/**
 * Convert data URL to Blob for uploading
 */
function dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Generate and upload thumbnails for multiple PDF pages
 * 
 * @param pdfUrl - URL of the PDF file (must be accessible)
 * @param fileId - File ID for organizing thumbnails in S3
 * @param identityId - User's Cognito identity ID
 * @param options - Thumbnail generation options
 * @param maxPages - Maximum number of pages to generate thumbnails for (default: 5)
 * @param onProgress - Progress callback (current page, total pages)
 * @returns Result with S3 keys and metadata
 */
export async function generateAndUploadThumbnails(
    pdfUrl: string,
    fileId: string,
    identityId: string,
    options: ThumbnailOptions = {},
    maxPages: number = 5,
    onProgress?: (current: number, total: number) => void
): Promise<GenerateThumbnailsResult> {
    const thumbnailKeys: string[] = [];
    const errors: Array<{ page: number; error: string }> = [];

    try {
        // Load PDF to get page count
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;
        const pagesToGenerate = Math.min(maxPages, pageCount);

        // Generate and upload thumbnails for each page
        for (let i = 1; i <= pagesToGenerate; i++) {
            try {
                if (onProgress) {
                    onProgress(i, pagesToGenerate);
                }

                // Generate thumbnail
                const dataUrl = await generatePageThumbnail(pdfUrl, i, options);
                const blob = dataUrlToBlob(dataUrl);

                // Upload to S3
                const extension = options.format === 'png' ? 'png' : 'jpg';
                const s3Key = `thumbnails/${identityId}/${fileId}/page-${i}.${extension}`;
                
                const result = await uploadData({
                    key: s3Key,
                    data: blob,
                    options: {
                        contentType: blob.type,
                    },
                }).result;

                thumbnailKeys.push(result.key);
            } catch (error) {
                console.error(`Error generating thumbnail for page ${i}:`, error);
                errors.push({
                    page: i,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            thumbnailKeys,
            pageCount,
            errors,
        };
    } catch (error) {
        console.error('Error processing PDF:', error);
        throw error;
    }
}

/**
 * Generate a single thumbnail and upload to S3
 * Useful for generating just the first page preview
 * 
 * @param pdfUrl - URL of the PDF file
 * @param fileId - File ID for organizing in S3
 * @param identityId - User's Cognito identity ID
 * @param pageNumber - Page number to generate (default: 1)
 * @param options - Thumbnail generation options
 * @returns S3 key of the uploaded thumbnail
 */
export async function generateSingleThumbnail(
    pdfUrl: string,
    fileId: string,
    identityId: string,
    pageNumber: number = 1,
    options: ThumbnailOptions = {}
): Promise<string> {
    const dataUrl = await generatePageThumbnail(pdfUrl, pageNumber, options);
    const blob = dataUrlToBlob(dataUrl);

    const extension = options.format === 'png' ? 'png' : 'jpg';
    const s3Key = `thumbnails/${identityId}/${fileId}/page-${pageNumber}.${extension}`;

    const result = await uploadData({
        key: s3Key,
        data: blob,
        options: {
            contentType: blob.type,
        },
    }).result;

    return result.key;
}

/**
 * Get thumbnail S3 key for a specific page
 * Used to construct the key without generating
 */
export function getThumbnailKey(
    fileId: string,
    identityId: string,
    pageNumber: number,
    format: 'png' | 'jpeg' = 'jpeg'
): string {
    const extension = format === 'png' ? 'png' : 'jpg';
    return `thumbnails/${identityId}/${fileId}/page-${pageNumber}.${extension}`;
}
