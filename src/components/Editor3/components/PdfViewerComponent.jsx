/**
 * @fileoverview PdfViewerComponent - React component for viewing PDF documents.
 * 
 * Displays PDF documents using react-pdf with navigation controls,
 * zoom capabilities, and page tracking.
 * 
 * @module PdfViewerComponent
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Paper, ButtonGroup, Skeleton } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useTranslations } from 'next-intl';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    $createParagraphNode,
    $insertNodes,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    KEY_ESCAPE_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ARROW_DOWN_COMMAND,
} from 'lexical';
import { $isPdfViewerNode } from './PdfViewerNode';
import { 
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    NavigateBefore as NavigateBeforeIcon,
    NavigateNext as NavigateNextIcon,
    PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import getCachedUrl from '../../../utils/getCachedUrl';

// Configure PDF.js worker from local public directory (skip if already configured by Storybook)
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * PdfViewerComponent - Displays PDF documents with controls.
 * 
 * @param {Object} props - Component props
 * @param {string} props.path - S3 path to the PDF file
 * @param {string} props.identityId - AWS Cognito identity ID
 * @param {string} props.filename - Display name for the PDF
 * @param {string} props.nodeKey - Lexical node key
 * @returns {React.ReactElement} PDF viewer component
 */
export default function PdfViewerComponent({ 
    path, 
    identityId, 
    filename,
    nodeKey 
}) {
    const t = useTranslations('editor.shared');
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const containerRef = useRef(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageWidth, setPageWidth] = useState(600);

    // Callback when PDF document loads successfully
    const onDocumentLoadSuccess = useCallback(({ numPages: pages }) => {
        setNumPages(pages);
        setLoading(false);
        setError(null);
    }, []);

    // Callback when PDF document fails to load
    const onDocumentLoadError = useCallback((error) => {
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF');
        setLoading(false);
    }, []);

    // Delete handler
    const onDelete = useCallback(
        (payload) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                editor.update(() => {
                    const node = $getNodeByKey(nodeKey);
                    if ($isPdfViewerNode(node)) {
                        node.remove();
                    }
                });
                return true;
            }
            return false;
        },
        [isSelected, nodeKey, editor]
    );

    // Escape handler
    const onEscape = useCallback(
        (payload) => {
            if (isSelected) {
                const event = payload;
                event.preventDefault();
                clearSelection();
                return true;
            }
            return false;
        },
        [isSelected, clearSelection]
    );

    // Enter handler - insert paragraph below
    const onEnter = useCallback(
        (payload) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                editor.update(() => {
                    const node = $getNodeByKey(nodeKey);
                    if ($isPdfViewerNode(node)) {
                        const paragraph = $createParagraphNode();
                        node.insertAfter(paragraph);
                        paragraph.select();
                    }
                });
                return true;
            }
            return false;
        },
        [isSelected, nodeKey, editor]
    );

    // Arrow down handler - move to content below
    const onArrowDown = useCallback(
        (payload) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                editor.update(() => {
                    const node = $getNodeByKey(nodeKey);
                    if ($isPdfViewerNode(node)) {
                        const nextSibling = node.getNextSibling();
                        if (nextSibling) {
                            nextSibling.selectStart();
                        } else {
                            // Create new paragraph if none exists
                            const paragraph = $createParagraphNode();
                            node.insertAfter(paragraph);
                            paragraph.select();
                        }
                    }
                });
                return true;
            }
            return false;
        },
        [isSelected, nodeKey, editor]
    );

    // Register keyboard commands
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;
                    if (containerRef.current && containerRef.current.contains(event.target)) {
                        if (event.shiftKey) {
                            setSelected(!isSelected);
                        } else {
                            clearSelection();
                            setSelected(true);
                        }
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_DELETE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_ESCAPE_COMMAND,
                onEscape,
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_ENTER_COMMAND,
                onEnter,
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_ARROW_DOWN_COMMAND,
                onArrowDown,
                COMMAND_PRIORITY_LOW
            )
        );
    }, [
        editor,
        isSelected,
        setSelected,
        clearSelection,
        onDelete,
        onEscape,
        onEnter,
        onArrowDown
    ]);

    // Load PDF from S3 on mount
    React.useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const url = await getCachedUrl(path);
                
                setPdfUrl(url);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('Failed to load PDF');
            } finally {
                setLoading(false);
            }
        };
        
        loadPdf();
    }, [path, identityId]);

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3.0));
        setPageWidth(prev => Math.min(prev * 1.25, 1200));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
        setPageWidth(prev => Math.max(prev * 0.8, 300));
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, numPages || 1));
    };

    if (loading) {
        return (
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: 'action.hover',
                    my: 2,
                }}
            >
                <PdfIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                    {t('pdfViewerComponent.loadingPdf', { filename })}
                </Typography>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper 
                elevation={2} 
                sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: 'error.50',
                    my: 2,
                    border: '1px solid',
                    borderColor: 'error.200',
                }}
            >
                <PdfIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                <Typography variant="body1" color="error.main" gutterBottom>
                    {error}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {filename}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper 
            ref={containerRef}
            elevation={2} 
            sx={{ 
                my: 2,
                overflow: 'hidden',
                outline: isSelected ? '2px solid #1976d2' : 'none',
                outlineOffset: '2px',
                cursor: 'pointer',
                transition: 'outline 0.2s ease-in-out',
            }}
        >
            {/* Controls Bar */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 1,
                    bgcolor: 'action.hover',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon sx={{ color: 'error.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {filename}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Page Navigation */}
                    {numPages && (
                        <ButtonGroup size="small" variant="outlined">
                            <IconButton 
                                size="small" 
                                onClick={handlePrevPage}
                                disabled={currentPage <= 1}
                            >
                                <NavigateBeforeIcon fontSize="small" />
                            </IconButton>
                            <Box 
                                sx={{ 
                                    px: 2, 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="body2">
                                    {currentPage} / {numPages}
                                </Typography>
                            </Box>
                            <IconButton 
                                size="small" 
                                onClick={handleNextPage}
                                disabled={currentPage >= numPages}
                            >
                                <NavigateNextIcon fontSize="small" />
                            </IconButton>
                        </ButtonGroup>
                    )}

                    {/* Zoom Controls */}
                    <ButtonGroup size="small" variant="outlined">
                        <IconButton 
                            size="small" 
                            onClick={handleZoomOut}
                            disabled={scale <= 0.5}
                        >
                            <ZoomOutIcon fontSize="small" />
                        </IconButton>
                        <Box 
                            sx={{ 
                                px: 2, 
                                display: 'flex', 
                                alignItems: 'center',
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="body2">
                                {Math.round(scale * 100)}%
                            </Typography>
                        </Box>
                        <IconButton 
                            size="small" 
                            onClick={handleZoomIn}
                            disabled={scale >= 3.0}
                        >
                            <ZoomInIcon fontSize="small" />
                        </IconButton>
                    </ButtonGroup>
                </Box>
            </Box>

            {/* PDF Viewer */}
            <Box 
                sx={{ 
                    p: 2,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    justifyContent: 'center',
                    minHeight: 400,
                    maxHeight: 800,
                    overflow: 'auto',
                    '& .react-pdf__Document': {
                        minHeight: 400,
                    },
                }}
            >
                {pdfUrl ? (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        options={{
                            cMapUrl: '/cmaps/',
                            cMapPacked: true,
                            standardFontDataUrl: '/standard_fonts/',
                        }}
                        loading={
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                                <Skeleton variant="rectangular" width="80%" height={300} sx={{ borderRadius: 1 }} />
                                <Skeleton variant="text" width={100} height={20} />
                            </Box>
                        }
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                bgcolor: 'white',
                                boxShadow: 2,
                                '& .react-pdf__Page': {
                                    maxWidth: '100%',
                                },
                                '& .react-pdf__Page__canvas': {
                                    maxWidth: '100%',
                                    height: 'auto !important',
                                },
                            }}
                        >
                            <Page
                                pageNumber={currentPage}
                                width={pageWidth}
                                scale={scale}
                                customTextRenderer={({ str }) => str}
                            />
                        </Box>
                    </Document>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        {t('pdfViewerComponent.noPdfToDisplay')}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}
