/**
 * @fileoverview Storybook stories for PdfThumbnail component
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PdfThumbnail, { PdfThumbnailGrid } from './PdfThumbnail';
import { Box, Paper, Typography } from '@mui/material';

const meta: Meta<typeof PdfThumbnail> = {
    title: '📁 Content Management/PDF Thumbnail',
    component: PdfThumbnail,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'A component for rendering PDF page thumbnails using react-pdf. Useful for file listings, document references, and previews.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PdfThumbnail>;

// Sample PDF URL (using a public PDF for demo)
const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

/**
 * Default thumbnail with standard settings
 */
export const Default: Story = {
    args: {
        url: SAMPLE_PDF_URL,
        pageNumber: 1,
        width: 150,
        showPageNumber: false,
        showBorder: true,
    },
};

/**
 * Thumbnail with page number overlay
 */
export const WithPageNumber: Story = {
    args: {
        url: SAMPLE_PDF_URL,
        pageNumber: 1,
        width: 150,
        showPageNumber: true,
        showBorder: true,
    },
};

/**
 * Larger thumbnail for detailed preview
 */
export const LargeThumbnail: Story = {
    args: {
        url: SAMPLE_PDF_URL,
        pageNumber: 1,
        width: 300,
        showPageNumber: true,
        showBorder: true,
    },
};

/**
 * Small thumbnail for compact lists
 */
export const SmallThumbnail: Story = {
    args: {
        url: SAMPLE_PDF_URL,
        pageNumber: 1,
        width: 80,
        showPageNumber: false,
        showBorder: true,
    },
};

/**
 * Clickable thumbnail
 */
export const Clickable: Story = {
    args: {
        url: SAMPLE_PDF_URL,
        pageNumber: 1,
        width: 150,
        showPageNumber: true,
        showBorder: true,
        onClick: () => alert('Thumbnail clicked!'),
    },
};

/**
 * Multiple thumbnails in a file list
 */
export const FileListExample: Story = {
    render: () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map((item) => (
                <Paper key={item} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <PdfThumbnail
                        url={SAMPLE_PDF_URL}
                        pageNumber={1}
                        width={80}
                        showBorder
                        onClick={() => console.log(`Clicked document ${item}`)}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Document {item}.pdf
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sample PDF document
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Last modified: Jan 19, 2026
                        </Typography>
                    </Box>
                </Paper>
            ))}
        </Box>
    ),
};

/**
 * Thumbnail grid showing multiple pages
 */
export const ThumbnailGrid: StoryObj<typeof PdfThumbnailGrid> = {
    render: () => (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                PDF Page Previews
            </Typography>
            <PdfThumbnailGrid
                url={SAMPLE_PDF_URL}
                maxPages={4}
                thumbnailWidth={120}
                onPageClick={(page) => console.log(`Clicked page ${page}`)}
            />
        </Box>
    ),
};

/**
 * Loading state (simulated with invalid URL briefly)
 */
export const LoadingState: Story = {
    args: {
        url: 'about:blank', // Will show loading state briefly
        pageNumber: 1,
        width: 150,
        showBorder: true,
    },
};

/**
 * Error state with invalid PDF
 */
export const ErrorState: Story = {
    args: {
        url: 'https://example.com/invalid.pdf',
        pageNumber: 1,
        width: 150,
        showBorder: true,
    },
};

/**
 * Without border for embedding in cards
 */
export const NoBorder: Story = {
    args: {
        url: SAMPLE_PDF_URL,
        pageNumber: 1,
        width: 150,
        showPageNumber: false,
        showBorder: false,
    },
};

/**
 * Example: Document reference badge with thumbnail
 */
export const DocumentReferenceBadge: Story = {
    render: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
            <Typography variant="body1">
                This vocabulary word appears in:
            </Typography>
            <Paper
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: 'action.hover',
                    },
                }}
                onClick={() => console.log('Open document')}
            >
                <PdfThumbnail
                    url={SAMPLE_PDF_URL}
                    pageNumber={1}
                    width={40}
                    showBorder={false}
                />
                <Box>
                    <Typography variant="caption" fontWeight="bold">
                        Textbook.pdf
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                        Page 5
                    </Typography>
                </Box>
            </Paper>
        </Box>
    ),
};
