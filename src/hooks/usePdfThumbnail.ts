/**
 * @fileoverview usePdfThumbnail - Hook for generating and caching PDF thumbnails
 * 
 * Provides utilities for rendering PDF pages as thumbnails with caching support.
 * 
 * @module usePdfThumbnail
 */

import { useState, useEffect, useCallback } from 'react';
import { pdfjs } from 'react-pdf';

interface PdfThumbnailOptions {
    url: string;
    pageNumber?: number;
    width?: number;
    cacheKey?: string;
}

interface PdfInfo {
    numPages: number;
    title?: string;
    author?: string;
}

/**
 * Hook for loading PDF information
 */
export function usePdfInfo(url: string | null) {
    const [info, setInfo] = useState<PdfInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!url) {
            setInfo(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        const loadPdf = async () => {
            try {
                const loadingTask = pdfjs.getDocument(url);
                const pdf = await loadingTask.promise;

                if (cancelled) return;

                const metadata = await pdf.getMetadata();
                
                setInfo({
                    numPages: pdf.numPages,
                    title: (metadata.info as any)?.Title,
                    author: (metadata.info as any)?.Author,
                });
                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                setError(err as Error);
                setLoading(false);
            }
        };

        loadPdf();

        return () => {
            cancelled = true;
        };
    }, [url]);

    return { info, loading, error };
}

/**
 * Hook for generating PDF page thumbnail as data URL
 * Useful for creating preview images that can be cached or saved
 */
export function usePdfThumbnailDataUrl({
    url,
    pageNumber = 1,
    width = 150,
}: PdfThumbnailOptions) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const generate = useCallback(async () => {
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const loadingTask = pdfjs.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(Math.min(pageNumber, pdf.numPages));

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
            const generatedDataUrl = canvas.toDataURL('image/png');
            setDataUrl(generatedDataUrl);
            setLoading(false);
        } catch (err) {
            setError(err as Error);
            setLoading(false);
        }
    }, [url, pageNumber, width]);

    useEffect(() => {
        generate();
    }, [generate]);

    return { dataUrl, loading, error, regenerate: generate };
}

/**
 * Simple cache for PDF thumbnails to avoid re-rendering
 */
const thumbnailCache = new Map<string, string>();

export function getCachedThumbnail(key: string): string | undefined {
    return thumbnailCache.get(key);
}

export function setCachedThumbnail(key: string, dataUrl: string): void {
    thumbnailCache.set(key, dataUrl);
}

export function clearThumbnailCache(): void {
    thumbnailCache.clear();
}
