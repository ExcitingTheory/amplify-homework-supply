/**
 * @fileoverview DocumentSourceBadge - Badge component showing document source with PDF thumbnail
 * 
 * Displays a clickable badge with PDF thumbnail, filename, and page number.
 * Used in VocabularyCard and QuestionCard to show source document references.
 * 
 * @module DocumentSourceBadge
 */

import React from 'react';
import { Box, Chip, Tooltip, Paper } from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import PdfThumbnail from './PdfThumbnail';
import { useTranslation } from 'react-i18next';

interface DocumentSourceBadgeProps {
    /** Filename of the source document */
    filename: string;
    /** Page number in the source document */
    page?: number;
    /** URL of the PDF file (optional - for thumbnail) */
    pdfUrl?: string;
    /** Whether to show PDF thumbnail preview */
    showThumbnail?: boolean;
    /** Click handler to open the document */
    onClick?: () => void;
}

/**
 * DocumentSourceBadge - Shows document source reference with optional thumbnail
 */
export default function DocumentSourceBadge({
    filename,
    page,
    pdfUrl,
    showThumbnail = true,
    onClick,
}: DocumentSourceBadgeProps) {
    const { t } = useTranslation('components');
    const [showPreview, setShowPreview] = React.useState(false);

    const handleMouseEnter = () => {
        if (pdfUrl && showThumbnail) {
            setShowPreview(true);
        }
    };

    const handleMouseLeave = () => {
        setShowPreview(false);
    };

    const label = page ? `${filename} - p.${page}` : filename;
    const truncatedLabel = label.length > 30 ? `${label.slice(0, 27)}...` : label;

    return (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Tooltip title={`${t('documentSourceBadge.sourcePrefix')} ${label}`}>
                <Chip
                    icon={<PdfIcon fontSize="small" />}
                    label={truncatedLabel}
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={onClick ? (e) => {
                        e.stopPropagation();
                        onClick();
                    } : undefined}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                        fontSize: '0.65rem',
                        height: '20px',
                        maxWidth: '200px',
                        cursor: onClick ? 'pointer' : 'default',
                        '&:hover': onClick ? {
                            backgroundColor: 'action.hover',
                        } : undefined,
                    }}
                />
            </Tooltip>

            {/* Hover Preview */}
            {showPreview && pdfUrl && (
                <Paper
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        mt: 1,
                        p: 1,
                        zIndex: 1300,
                        boxShadow: 4,
                        pointerEvents: 'none',
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <PdfThumbnail
                        url={pdfUrl}
                        pageNumber={page || 1}
                        width={200}
                        showPageNumber
                        showBorder={false}
                    />
                </Paper>
            )}
        </Box>
    );
}

/**
 * CompactDocumentBadge - Minimal badge for tight spaces
 */
export function CompactDocumentBadge({
    filename,
    page,
    onClick,
}: Pick<DocumentSourceBadgeProps, 'filename' | 'page' | 'onClick'>) {
    const { t } = useTranslation('components');
    
    return (
        <Tooltip title={`${t('documentSourceBadge.sourcePrefix')} ${filename}${page ? ` - ${t('documentSourceBadge.pagePrefix')} ${page}` : ''}`}>
            <Chip
                icon={<PdfIcon fontSize="small" />}
                label={page ? `p.${page}` : filename.slice(0, 10)}
                size="small"
                variant="outlined"
                color="primary"
                onClick={onClick ? (e) => {
                    e.stopPropagation();
                    onClick();
                } : undefined}
                sx={{
                    fontSize: '0.65rem',
                    height: '20px',
                    cursor: onClick ? 'pointer' : 'default',
                }}
            />
        </Tooltip>
    );
}
