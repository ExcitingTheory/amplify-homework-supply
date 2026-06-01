/**
 * @fileoverview PdfThumbnail - Component for rendering PDF page thumbnails
 * 
 * Uses react-pdf to render a specific page of a PDF as a thumbnail.
 * Useful for file listings, document references, and previews.
 * 
 * @module PdfThumbnail
 */

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Box, Skeleton, Typography, Paper } from '@mui/material';
import { PictureAsPdf as PdfIcon, Error as ErrorIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';

// Configure PDF.js worker from local public directory (skip if already configured by Storybook)
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PdfThumbnailProps {
    /** URL of the PDF file */
    url: string;
    /** Page number to render (1-based) */
    pageNumber?: number;
    /** Width of the thumbnail in pixels */
    width?: number;
    /** Height of the thumbnail in pixels */
    height?: number;
    /** Whether to show page number overlay */
    showPageNumber?: boolean;
    /** Whether to show a border */
    showBorder?: boolean;
    /** Click handler */
    onClick?: () => void;
}

/**
 * PdfThumbnail - Renders a thumbnail preview of a PDF page
 */
export default function PdfThumbnail({
    url,
    pageNumber = 1,
    width = 150,
    height,
    showPageNumber = false,
    showBorder = true,
    onClick,
}: PdfThumbnailProps) {
    const t = useTranslations('components');
    const [numPages, setNumPages] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const onDocumentLoadSuccess = ({ numPages: pages }: { numPages: number }) => {
        setNumPages(pages);
        setLoading(false);
        setError(null);
    };

    const onDocumentLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
        setError(t('pdfThumbnail.failedToLoad'));
        setLoading(false);
    };

    if (error) {
        return (
            <Paper
                sx={{
                    width,
                    height: height || width * 1.414, // A4 aspect ratio
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'error.50',
                    border: showBorder ? '1px solid' : 'none',
                    borderColor: 'error.200',
                    cursor: onClick ? 'pointer' : 'default',
                }}
                onClick={onClick}
            >
                <ErrorIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                <Typography variant="caption" color="error.main" align="center" px={1}>
                    {error}
                </Typography>
            </Paper>
        );
    }

    return (
        <Box
            sx={{
                position: 'relative',
                width,
                height: height || 'auto',
                display: 'inline-block',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? {
                    '& .pdf-overlay': {
                        opacity: 1,
                    },
                } : undefined,
            }}
            onClick={onClick}
        >
            <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={{
                    cMapUrl: '/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: '/standard_fonts/',
                }}
                loading={
                    <Paper
                        sx={{
                            width,
                            height: height || width * 1.414,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'action.hover',
                            border: showBorder ? '1px solid' : 'none',
                            borderColor: 'divider',
                        }}
                    >
                        <PdfIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                        <Skeleton variant="rectangular" width={40} height={6} sx={{ borderRadius: 1 }} />
                    </Paper>
                }
            >
                <Paper
                    sx={{
                        overflow: 'hidden',
                        border: showBorder ? '1px solid' : 'none',
                        borderColor: 'divider',
                        boxShadow: showBorder ? 1 : 0,
                        '& .react-pdf__Page': {
                            display: 'flex',
                            justifyContent: 'center',
                        },
                        '& .react-pdf__Page__canvas': {
                            maxWidth: '100%',
                            height: 'auto !important',
                        },
                    }}
                >
                    <Page
                        pageNumber={Math.min(pageNumber, numPages || 1)}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Paper>
            </Document>

            {/* Page number overlay */}
            {showPageNumber && numPages && (
                <Box
                    className="pdf-overlay"
                    sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                    }}
                >
                    {t('pdfThumbnail.pageNumber', { current: pageNumber, total: numPages })}
                </Box>
            )}
        </Box>
    );
}

/**
 * PdfThumbnailGrid - Renders multiple page thumbnails in a grid
 */
export function PdfThumbnailGrid({
    url,
    maxPages = 4,
    thumbnailWidth = 120,
    onPageClick,
}: {
    url: string;
    maxPages?: number;
    thumbnailWidth?: number;
    onPageClick?: (page: number) => void;
}) {
    const [numPages, setNumPages] = useState<number | null>(null);

    return (
        <Box>
            <Document
                file={url}
                onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
            >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {numPages && Array.from({ length: Math.min(maxPages, numPages) }, (_, i) => (
                        <PdfThumbnail
                            key={i + 1}
                            url={url}
                            pageNumber={i + 1}
                            width={thumbnailWidth}
                            showPageNumber
                            onClick={onPageClick ? () => onPageClick(i + 1) : undefined}
                        />
                    ))}
                </Box>
            </Document>
        </Box>
    );
}
