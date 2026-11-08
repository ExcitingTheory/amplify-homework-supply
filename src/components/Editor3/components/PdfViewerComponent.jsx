/**
 * @fileoverview PdfViewerComponent - React component for viewing PDF documents.
 * 
 * Displays PDF documents using react-pdf with navigation controls,
 * zoom capabilities, and page tracking.
 * 
 * @module PdfViewerComponent
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, Paper, ButtonGroup, Skeleton, Tooltip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
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
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
} from '@mui/icons-material';
import getCachedUrl from '../../../utils/getCachedUrl';

// Configure PDF.js worker from local public directory (skip if already configured by Storybook)
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const viewerLayout = {
    width: '100%',
    my: 2,
    boxSizing: 'border-box',
};
const SELECTION_OUTLINE_WIDTH = 2;
const SELECTION_OUTLINE_OFFSET = 2;
// Reserve room for the frame's outline so ancestors that clip overflow do not cut it off.
const SELECTION_OUTLINE_INSET = SELECTION_OUTLINE_WIDTH + SELECTION_OUTLINE_OFFSET;
// Inverting and rotating hue turns white paper dark while keeping colors recognizable.
const DARK_PAGE_FILTER = 'invert(0.9) hue-rotate(180deg)';
export const DARK_PAGES_STORAGE_KEY = 'pdfViewer.darkPages';

function readDarkPagesOverride() {
    try {
        const value = window.localStorage.getItem(DARK_PAGES_STORAGE_KEY);
        return value === 'on' ? true : value === 'off' ? false : null;
    } catch {
        return null;
    }
}

function writeDarkPagesOverride(value) {
    try {
        if (value === null) window.localStorage.removeItem(DARK_PAGES_STORAGE_KEY);
        else window.localStorage.setItem(DARK_PAGES_STORAGE_KEY, value ? 'on' : 'off');
    } catch {
        // Storage can be unavailable (private mode); the toggle still works for this session.
    }
}

const pdfOptions = {
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
};

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
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
    // Fallback for browsers without element fullscreen (e.g. iPhone Safari).
    const [isExpanded, setIsExpanded] = useState(false);
    const isFullscreen = isNativeFullscreen || isExpanded;
    const { mode, systemMode } = useColorScheme();
    const prefersDark = (mode === 'system' ? systemMode : mode) === 'dark';
    const [darkPagesOverride, setDarkPagesOverride] = useState(null);
    const darkPages = darkPagesOverride ?? prefersDark;

    useEffect(() => {
        setDarkPagesOverride(readDarkPagesOverride());
    }, []);

    const toggleDarkPages = () => {
        const next = !darkPages;
        // Matching the color scheme clears the override so the viewer follows it again.
        const override = next === prefersDark ? null : next;
        setDarkPagesOverride(override);
        writeDarkPagesOverride(override);
    };

    useEffect(() => {
        const sync = () => {
            const element = document.fullscreenElement ?? document.webkitFullscreenElement;
            setIsNativeFullscreen(Boolean(element) && element === containerRef.current);
        };
        document.addEventListener('fullscreenchange', sync);
        document.addEventListener('webkitfullscreenchange', sync);
        return () => {
            document.removeEventListener('fullscreenchange', sync);
            document.removeEventListener('webkitfullscreenchange', sync);
        };
    }, []);

    useEffect(() => {
        if (!isExpanded) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setIsExpanded(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isExpanded]);

    const toggleFullscreen = async () => {
        if (isNativeFullscreen) {
            const exit = document.exitFullscreen ?? document.webkitExitFullscreen;
            await exit?.call(document);
            return;
        }
        if (isExpanded) {
            setIsExpanded(false);
            return;
        }
        const element = containerRef.current;
        const request = element?.requestFullscreen ?? element?.webkitRequestFullscreen;
        if (request) {
            try {
                await request.call(element);
                return;
            } catch {
                // Fall through to the in-page overlay when fullscreen is refused.
            }
        }
        setIsExpanded(true);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry.contentRect.width > 0) {
                setPageWidth(Math.floor(entry.contentRect.width));
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [loading, error]);

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
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5));
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
                elevation={0}
                sx={{ 
                    ...viewerLayout,
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: 'transparent',
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
                    ...viewerLayout,
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: 'error.50',
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
        <Box
            ref={containerRef}
            data-pdf-viewport
            data-fullscreen={isFullscreen || undefined}
            sx={(theme) => {
                const fullscreen = {
                    my: 0,
                    overflowY: 'auto',
                    bgcolor: 'background.default',
                    // The viewport becomes the sticky controls' scroller.
                    '--editor-scroll-padding': `${SELECTION_OUTLINE_INSET}px`,
                };
                return {
                    ...viewerLayout,
                    p: `${SELECTION_OUTLINE_INSET}px`,
                    bgcolor: 'transparent',
                    '&:fullscreen': fullscreen,
                    ...(isExpanded && {
                        ...fullscreen,
                        position: 'fixed',
                        inset: 0,
                        zIndex: theme.zIndex.modal,
                    }),
                };
            }}
        >
        <Box
            data-pdf-page-frame
            sx={{
                width: pageWidth * scale,
                maxWidth: '100%',
                mx: 'auto',
                outline: isSelected ? `${SELECTION_OUTLINE_WIDTH}px solid` : 'none',
                outlineColor: 'primary.main',
                outlineOffset: `${SELECTION_OUTLINE_OFFSET}px`,
                cursor: 'pointer',
                transition: 'outline 0.2s ease-in-out',
            }}
        >
            {/* Controls stay pinned to the top of the document scroller while the page is in view. */}
            <Box 
                data-pdf-controls
                sx={{ 
                    position: 'sticky',
                    // Sticky offsets start inside the scroller's padding; cancel it to sit flush under the menu.
                    top: 'calc(-1 * var(--editor-scroll-padding, 0px))',
                    zIndex: 2,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                    p: 1,
                    width: '100%',
                    boxSizing: 'border-box',
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <PdfIcon sx={{ color: 'error.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, overflowWrap: 'anywhere', minWidth: 0 }}>
                        {filename}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Page Navigation */}
                    {numPages && (
                        <ButtonGroup size="small" variant="outlined">
                            <IconButton 
                                size="small" 
                                onClick={handlePrevPage}
                                aria-label={t('pdfViewerComponent.previousPage')}
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
                                aria-label={t('pdfViewerComponent.nextPage')}
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
                            aria-label={t('pdfViewerComponent.zoomOut')}
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
                            aria-label={t('pdfViewerComponent.zoomIn')}
                            disabled={scale >= 3.0}
                        >
                            <ZoomInIcon fontSize="small" />
                        </IconButton>
                    </ButtonGroup>

                    <Tooltip title={t('pdfViewerComponent.darkPages')}>
                        <IconButton
                            size="small"
                            onClick={toggleDarkPages}
                            aria-label={t('pdfViewerComponent.darkPages')}
                            aria-pressed={darkPages}
                            color={darkPages ? 'primary' : 'default'}
                        >
                            {darkPages ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t(isFullscreen ? 'pdfViewerComponent.exitFullScreen' : 'pdfViewerComponent.enterFullScreen')}>
                        <IconButton
                            size="small"
                            onClick={toggleFullscreen}
                            aria-label={t(isFullscreen ? 'pdfViewerComponent.exitFullScreen' : 'pdfViewerComponent.enterFullScreen')}
                        >
                            {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* PDF Viewer */}
            <Box 
                data-pdf-page-content
                sx={{ 
                    width: '100%',
                    // Scroll zoomed pages here: an overflow container around the controls would trap sticky positioning.
                    overflowX: 'auto',
                    bgcolor: 'transparent',
                }}
            >
                {pdfUrl ? (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        options={pdfOptions}
                        loading={
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                                <Skeleton variant="rectangular" width="80%" height={300} sx={{ borderRadius: 1 }} />
                                <Skeleton variant="text" width={100} height={20} />
                            </Box>
                        }
                    >
                        <Box
                            sx={{
                                width: 'fit-content',
                                maxWidth: 'none',
                                mx: 'auto',
                                '& .react-pdf__Page': {
                                    width: '100%',
                                    filter: darkPages ? DARK_PAGE_FILTER : 'none',
                                },
                                // Override the editor's global max-width cap, which squashed zoomed canvases
                                // horizontally while react-pdf kept their pixel height.
                                '& .react-pdf__Page, & .react-pdf__Page *': {
                                    maxWidth: 'none',
                                },
                                '& .react-pdf__Page__canvas': {
                                    display: 'block',
                                },
                            }}
                        >
                            <Page
                                pageNumber={currentPage}
                                width={pageWidth * scale}
                                onLoadError={onDocumentLoadError}
                                onRenderError={onDocumentLoadError}
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
        </Box>
        </Box>
    );
}
