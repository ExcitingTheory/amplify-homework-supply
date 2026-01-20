/**
 * @fileoverview SavedPdfThumbnail - Component for displaying pre-generated PDF thumbnails
 * 
 * Displays thumbnails that were previously generated and saved to S3.
 * Much more efficient than rendering PDFs on-the-fly.
 * 
 * @module SavedPdfThumbnail
 */

import React, { useState, useEffect } from 'react';
import { Box, Paper, CircularProgress, Typography } from '@mui/material';
import { PictureAsPdf as PdfIcon, Error as ErrorIcon } from '@mui/icons-material';
import getCachedUrl from '../utils/getCachedUrl';

interface SavedPdfThumbnailProps {
    /** S3 key of the thumbnail image */
    thumbnailKey: string;
    /** Identity ID for accessing protected files */
    identityId?: string;
    /** Storage level (public, protected, private) */
    level?: 'public' | 'protected' | 'private';
    /** Width of the thumbnail */
    width?: number;
    /** Height of the thumbnail */
    height?: number;
    /** Alt text for accessibility */
    alt?: string;
    /** Whether to show a border */
    showBorder?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Optional page number overlay */
    pageNumber?: number;
    /** Show loading spinner */
    showLoading?: boolean;
}

/**
 * SavedPdfThumbnail - Displays a pre-generated PDF thumbnail from S3
 * 
 * Use this instead of PdfThumbnail when you have pre-generated images.
 * This is much more performant for file listings and repeated views.
 */
export default function SavedPdfThumbnail({
    thumbnailKey,
    identityId,
    level = 'protected',
    width = 150,
    height,
    alt = 'PDF thumbnail',
    showBorder = true,
    onClick,
    pageNumber,
    showLoading = true,
}: SavedPdfThumbnailProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadImage = async () => {
            try {
                setLoading(true);
                setError(null);

                // @ts-ignore - getCachedUrl is JS file, types don't match
                const url = await getCachedUrl(thumbnailKey, level, identityId);
                
                if (cancelled) return;
                
                setImageUrl(url);
                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                
                console.error('Error loading thumbnail:', err);
                setError('Failed to load thumbnail');
                setLoading(false);
            }
        };

        loadImage();

        return () => {
            cancelled = true;
        };
    }, [thumbnailKey, level, identityId]);

    const containerStyle = {
        width,
        height: height || width * 1.414, // A4 aspect ratio
        position: 'relative' as const,
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
            '& .page-overlay': {
                opacity: 1,
            },
        } : undefined,
    };

    if (loading && showLoading) {
        return (
            <Paper
                sx={{
                    ...containerStyle,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.50',
                    border: showBorder ? '1px solid' : 'none',
                    borderColor: 'divider',
                }}
            >
                <PdfIcon sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
                <CircularProgress size={20} />
            </Paper>
        );
    }

    if (error || !imageUrl) {
        return (
            <Paper
                sx={{
                    ...containerStyle,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'error.50',
                    border: showBorder ? '1px solid' : 'none',
                    borderColor: 'error.200',
                }}
                onClick={onClick}
            >
                <ErrorIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
                <Typography variant="caption" color="error.main" align="center" px={1}>
                    {error || 'No thumbnail'}
                </Typography>
            </Paper>
        );
    }

    return (
        <Box sx={containerStyle} onClick={onClick}>
            <Paper
                component="img"
                src={imageUrl}
                alt={alt}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    border: showBorder ? '1px solid' : 'none',
                    borderColor: 'divider',
                    boxShadow: showBorder ? 1 : 0,
                }}
            />

            {/* Page number overlay */}
            {pageNumber && (
                <Box
                    className="page-overlay"
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
                    p.{pageNumber}
                </Box>
            )}
        </Box>
    );
}

/**
 * SavedPdfThumbnailGrid - Display multiple saved thumbnails in a grid
 */
export function SavedPdfThumbnailGrid({
    thumbnailKeys,
    identityId,
    level = 'protected',
    thumbnailWidth = 120,
    onPageClick,
}: {
    thumbnailKeys: string[];
    identityId?: string;
    level?: 'public' | 'protected' | 'private';
    thumbnailWidth?: number;
    onPageClick?: (index: number) => void;
}) {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {thumbnailKeys.map((key, index) => (
                <SavedPdfThumbnail
                    key={key}
                    thumbnailKey={key}
                    identityId={identityId}
                    level={level}
                    width={thumbnailWidth}
                    pageNumber={index + 1}
                    onClick={onPageClick ? () => onPageClick(index) : undefined}
                />
            ))}
        </Box>
    );
}
