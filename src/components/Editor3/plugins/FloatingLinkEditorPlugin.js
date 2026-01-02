/**
 * @fileoverview FloatingLinkEditorPlugin - Floating link editor UI.
 * @module FloatingLinkEditorPlugin
 * 
 * Provides a floating toolbar for editing, viewing, and removing hyperlinks.
 * Appears when a link is selected in the editor.
 */

import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_LOW,
    GridSelection,
    KEY_ESCAPE_COMMAND,
    LexicalEditor,
    NodeSelection,
    RangeSelection,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { getSelectedNode } from '../utils/getSelectedNode';

import { sanitizeUrl } from '../utils/url';
import { INSERT_YOUTUBE_COMMAND } from './YouTubePlugin';

import {
    Button,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import YouTubeIcon from '@mui/icons-material/YouTube';
import CloseIcon from '@mui/icons-material/Close';

const VERTICAL_GAP = 10;
const HORIZONTAL_OFFSET = 0;

// YouTube URL detection
function getYouTubeVideoID(url) {
  const match = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
  const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;
  return id;
}

export function setFloatingElemPositionForLinkEditor(
    targetRect,
    floatingElem,
    anchorElem,
    verticalGap = VERTICAL_GAP,
    horizontalOffset = HORIZONTAL_OFFSET,
) {
    if (targetRect === null) {
        floatingElem.style.opacity = '0';
        floatingElem.style.display = 'none';
        floatingElem.style.visibility = 'hidden';
        floatingElem.style.boxShadow = 'none';
        floatingElem.style.border = 'none';
        floatingElem.style.outline = 'none';
        floatingElem.style.borderRadius = '0';
        return;
    }

    // Make element visible but transparent to measure it
    floatingElem.style.opacity = '0';
    floatingElem.style.display = 'flex';
    floatingElem.style.visibility = 'visible';

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElementRect = anchorElem.getBoundingClientRect();

    console.log('[FloatingLink Debug]', {
        targetRect: { top: targetRect.top, bottom: targetRect.bottom, left: targetRect.left },
        anchorElementRect: { top: anchorElementRect.top, left: anchorElementRect.left },
        floatingElemRect: { height: floatingElemRect.height, width: floatingElemRect.width }
    });

    // Calculate position relative to anchor element
    // Both targetRect and anchorElementRect are viewport coordinates from getBoundingClientRect()
    // Since we're using absolute positioning within a relative-positioned anchor,
    // and both elements are in the same scroll container, the scroll is already
    // accounted for in the viewport coordinates. We just need the difference.
    let top = targetRect.bottom - anchorElementRect.top + verticalGap;
    let left = targetRect.left - anchorElementRect.left;

    console.log('[FloatingLink Debug] Initial position:', { top, left });

    // Check if it would overflow viewport bottom
    const viewportHeight = window.innerHeight;
    if (targetRect.bottom + verticalGap + floatingElemRect.height > viewportHeight) {
        // Position above the link instead
        top = targetRect.top - anchorElementRect.top - floatingElemRect.height - verticalGap;
        console.log('[FloatingLink Debug] Positioned above, new top:', top);
    }

    // Check if it would overflow viewport right
    const viewportWidth = window.innerWidth;
    if (targetRect.left + floatingElemRect.width > viewportWidth) {
        left = viewportWidth - floatingElemRect.width - anchorElementRect.left - 10;
    }

    // Check if it would overflow viewport left
    if (targetRect.left < 0) {
        left = 10 - anchorElementRect.left;
    }

    console.log('[FloatingLink Debug] Final position:', { top, left });
    console.log('[FloatingLink Debug] Setting styles - top:', `${top}px`, 'left:', `${left}px`);

    floatingElem.style.opacity = '1';
    floatingElem.style.display = 'flex';
    floatingElem.style.visibility = 'visible';
    floatingElem.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.3)';
    floatingElem.style.border = '1px solid #333';
    floatingElem.style.outline = '1px solid #eee';
    floatingElem.style.borderRadius = '0 0 9px 9px';
    floatingElem.style.top = `${top}px`;
    floatingElem.style.left = `${left}px`;
    floatingElem.style.transform = 'none';
}

function FloatingLinkEditor({
    editor,
    isLink,
    setIsLink,
    anchorElem,
    isSidebarOpen,
}) {
    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [editedLinkUrl, setEditedLinkUrl] = useState('');
    const [isEditMode, setEditMode] = useState(false);
    const [lastSelection, setLastSelection] = useState(null);
    const initialScrollPos = useRef({ top: 0, left: 0 });

    const drawerWidth = useMemo(() => isSidebarOpen ? HORIZONTAL_OFFSET : -70, [isSidebarOpen]);
    const verticalGap = useMemo(() => VERTICAL_GAP, [])

    // Store initial scroll position when link editor first appears
    useEffect(() => {
        if (isLink) {
            const editorScrollElem = anchorElem.querySelector('.editor');
            if (editorScrollElem) {
                const scrollPos = {
                    top: editorScrollElem.scrollTop,
                    left: editorScrollElem.scrollLeft
                };
                initialScrollPos.current = scrollPos;
                console.log('[FloatingLink] Captured initial scroll position:', scrollPos);
            }
        }
    }, [isLink, anchorElem]);

    const updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        let linkNode = null;
        
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            
            // Check multiple ways to find a link node
            // 1. Check if node itself is a link
            if ($isLinkNode(node) || $isAutoLinkNode(node)) {
                linkNode = node;
            }
            // 2. Check if parent is a link
            else if ($isLinkNode(parent) || $isAutoLinkNode(parent)) {
                linkNode = parent;
            }
            // 3. Check ancestors
            else {
                linkNode = $findMatchingParent(node, (n) => $isLinkNode(n) || $isAutoLinkNode(n));
            }
            
            if (linkNode) {
                const url = linkNode.getURL();
                setLinkUrl(url);
            } else {
                setLinkUrl('');
            }
        } else {
            setLinkUrl('');
        }
        
        const editorElem = editorRef.current;
        const nativeSelection = window.getSelection();
        const activeElement = document.activeElement;

        if (editorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();

        if (
            selection !== null &&
            nativeSelection !== null &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode) &&
            editor.isEditable()
        ) {
            let domRect = null;
            
            // Try to get the rect from the actual link node's DOM element
            if (isLink && linkNode) {
                const linkDomElement = editor.getElementByKey(linkNode.getKey());
                if (linkDomElement) {
                    domRect = linkDomElement.getBoundingClientRect();
                }
            }
            
            // Fallback to native selection if we couldn't get the link element
            if (!domRect && isLink && nativeSelection.rangeCount > 0) {
                const range = nativeSelection.getRangeAt(0);
                domRect = range.getBoundingClientRect();
            }
            
            if (domRect && isLink) {
                setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem, verticalGap, drawerWidth);
            } else {
                setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem, verticalGap, drawerWidth);
            }
            setLastSelection(selection);
        } else if (!activeElement || activeElement.className !== 'link-input') {
            if (rootElement !== null) {
                setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem, verticalGap, drawerWidth);
            }
            setLastSelection(null);
            setEditMode(false);
            setLinkUrl('');
        }
    }, [editor, isLink, anchorElem, drawerWidth, verticalGap]);

    useEffect(() => {
        const editorElem = anchorElem.querySelector('.editor');

        const update = () => {
            editor.getEditorState().read(() => {
                updateLinkEditor();
            });
        };

        const handleScroll = () => {
            if (!editorElem) return;
            
            // Close the floating link editor only if scrolled more than threshold
            const SCROLL_THRESHOLD = 100; // pixels
            const currentScrollTop = editorElem.scrollTop;
            const currentScrollLeft = editorElem.scrollLeft;
            
            const scrollDeltaY = Math.abs(currentScrollTop - initialScrollPos.current.top);
            const scrollDeltaX = Math.abs(currentScrollLeft - initialScrollPos.current.left);
            
            console.log('[FloatingLink] Scroll check:', {
                current: { top: currentScrollTop, left: currentScrollLeft },
                initial: initialScrollPos.current,
                delta: { y: scrollDeltaY, x: scrollDeltaX },
                threshold: SCROLL_THRESHOLD
            });
            
            if (scrollDeltaY > SCROLL_THRESHOLD || scrollDeltaX > SCROLL_THRESHOLD) {
                console.log('[FloatingLink] Scroll threshold exceeded, closing link editor');
                setIsLink(false);
            }
        };

        window.addEventListener('resize', update, { passive: true });

        if (editorElem) {
            editorElem.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener('resize', update);

            if (editorElem) {
                editorElem.removeEventListener('scroll', handleScroll);
            }
        };
    }, [anchorElem, editor, updateLinkEditor, setIsLink]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateLinkEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    editor.getEditorState().read(() => {
                        updateLinkEditor();
                    });
                    return true;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_ESCAPE_COMMAND,
                () => {
                    if (isLink) {
                        setIsLink(false);
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_HIGH,
            ),
        );
    }, [editor, updateLinkEditor, setIsLink, isLink]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateLinkEditor();
        });
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        if (isEditMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditMode]);

    const monitorInputInteraction = (
        event,
    ) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleLinkSubmission();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setEditMode(false);
        }
    };

    const handleLinkSubmission = () => {
        if (lastSelection !== null) {
            if (linkUrl !== '') {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl));
            }
            setEditMode(false);
        }
    };

    const handleConvertToYouTube = () => {
        const videoID = getYouTubeVideoID(linkUrl);
        if (videoID) {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const node = getSelectedNode(selection);
                    const parent = node.getParent();
                    const linkNode = $isLinkNode(parent) || $isAutoLinkNode(parent)
                        ? parent 
                        : ($isLinkNode(node) || $isAutoLinkNode(node) ? node : null);
                    if (linkNode) {
                        linkNode.remove();
                    }
                }
            });
            editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, videoID);
            setIsLink(false);
        }
    };

    const isYouTubeUrl = linkUrl && getYouTubeVideoID(linkUrl) !== null;

    return (<>
        <style global jsx>{`
        .link-editor {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 2010;
            max-width: 400px;
            min-width: 400px;
            width: fit-content;
            opacity: 0;
            visibility: hidden;
            display: flex;
            background-color: #fff;
            border-radius: 0 0 9px 9px;
            transition: opacity 0.5s, visibility 0.5s;
            will-change: transform;
            outline: 1px solid #eee;
            outline-offset: -1px;
            border: 1px solid #333;
        }

        .link-editor a,
        .link-editor input {
            display: inline-block;
            margin: 1rem 0.5rem 1rem 0.5rem;
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.875rem;
            line-height: 1.25rem;
        }

        .link-editor [role="button"] {
            min-width: 1rem;
            flex-shrink: 0;
        }
      `}</style>
        <div ref={editorRef} className="link-editor">
            {!isLink ? null : (
                <>
                    {isEditMode ? (
                        <>
                            <Button
                                className="link-cancel"
                                aria-label="Cancel link editing"
                                title="Cancel link editing"
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    setEditMode(false);
                                }}
                            >
                                <CloseIcon />
                            </Button>
                            <input
                                ref={inputRef}
                                className="link-input"
                                type="text"
                                title="Link URL"
                                value={editedLinkUrl}
                                onChange={(event) => {
                                    setEditedLinkUrl(event.target.value);
                                }}
                                onKeyDown={(event) => {
                                    monitorInputInteraction(event);
                                }}
                            />
                                <Button
                                    className="link-confirm"
                                    aria-label="Confirm link"
                                    title="Confirm link"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={handleLinkSubmission}
                                >
                                    <CheckIcon />
                                </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                aria-label="Close link editor"
                                className="link-close"
                                role="button"
                                tabIndex={0}
                                title="Close link editor"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    setIsLink(false);
                                    setEditMode(false);
                                }}
                            >
                                <CloseIcon />
                            </Button>
                            <a
                                href={sanitizeUrl(linkUrl)}
                                target="_blank"
                                rel="noopener noreferrer">
                                {linkUrl}
                            </a>
                            {isYouTubeUrl && (
                                <Button
                                    className="link-youtube"
                                    aria-label="YouTube Embed"
                                    title="Convert to YouTube embed"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={handleConvertToYouTube}
                                >
                                    <YouTubeIcon />
                                </Button>
                            )}
                            <Button
                                className="link-edit"
                                aria-label="Edit link"
                                title="Edit link"
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    setEditedLinkUrl(linkUrl);
                                    setEditMode(true);
                                }}
                            >
                                <EditIcon />
                            </Button>
                            <Button
                                aria-label="Remove link"
                                className="link-trash"
                                title="Remove link"
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
                                }}
                            >
                                <DeleteIcon />
                            </Button>
                        </>
                    )}
                </>
            )}
        </div>
    </>
    );
}

function useFloatingLinkEditorToolbar(
    editor,
    anchorElem,
    isSidebarOpen,
) {
    const [activeEditor, setActiveEditor] = useState(editor);
    const [isLink, setIsLink] = useState(false);

    // Debug effect to track state changes
    useEffect(() => {
        console.log('[DEBUG] isLink state changed to:', isLink);
    }, [isLink]);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            
            console.log('[DEBUG] Selection node:', {
                nodeType: node.getType(),
                nodeText: node.getTextContent?.(),
                parentType: parent?.getType(),
                isLinkNode: $isLinkNode(node),
                isAutoLinkNode: $isAutoLinkNode(node),
                isParentLink: parent ? $isLinkNode(parent) : false,
                isParentAutoLink: parent ? $isAutoLinkNode(parent) : false
            });
            
            // Check if the node itself is a link
            const isNodeLink = $isLinkNode(node) || $isAutoLinkNode(node);
            
            // Check if parent is a link (only if parent exists)
            const isParentLink = parent && ($isLinkNode(parent) || $isAutoLinkNode(parent));
            
            // Check ancestors using $findMatchingParent
            const linkParent = $findMatchingParent(node, $isLinkNode);
            const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);

            console.log('[DEBUG] Link detection result:', {
                isNodeLink,
                isParentLink,
                hasLinkParent: linkParent != null,
                hasAutoLinkParent: autoLinkParent != null,
                linkParentType: linkParent?.getType(),
                autoLinkParentType: autoLinkParent?.getType()
            });

            // Show for both regular links and auto links
            const shouldShowLink = isNodeLink || isParentLink || linkParent != null || autoLinkParent != null;
            
            console.log('[DEBUG] Final decision - shouldShowLink:', shouldShowLink);
            console.log('[DEBUG] About to call setIsLink with:', shouldShowLink);
            setIsLink(shouldShowLink);
            console.log('[DEBUG] setIsLink called');
        } else {
            console.log('[DEBUG] Not a range selection:', selection);
            setIsLink(false);
        }
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload, newEditor) => {
                    newEditor.getEditorState().read(() => {
                        updateToolbar();
                    });
                    setActiveEditor(newEditor);
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
        );
    }, [editor, updateToolbar]);

    return createPortal(
        <FloatingLinkEditor
            editor={activeEditor}
            isLink={isLink}
            anchorElem={anchorElem}
            setIsLink={setIsLink}
            isSidebarOpen={isSidebarOpen}
        />,
        anchorElem,
    );
}

export default function FloatingLinkEditorPlugin({
    anchorElem = document.body,
    isSidebarOpen,
}) {
    const [editor] = useLexicalComposerContext();
    return useFloatingLinkEditorToolbar(editor, anchorElem, isSidebarOpen);
}