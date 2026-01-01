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
import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
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
    const scrollerElem = anchorElem.parentElement;

    if (targetRect === null || !scrollerElem) {
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
    const editorScrollerRect = scrollerElem.getBoundingClientRect();

    // Start by positioning below the link
    let top = targetRect.bottom + verticalGap;
    let left = targetRect.left - horizontalOffset;

    // Convert to relative coordinates early
    top -= anchorElementRect.top;
    left -= anchorElementRect.left;

    // Calculate the relative bounds of the scroller
    const scrollerTop = editorScrollerRect.top - anchorElementRect.top;
    const scrollerLeft = editorScrollerRect.left - anchorElementRect.left;
    const scrollerRight = editorScrollerRect.right - anchorElementRect.left;
    const scrollerBottom = editorScrollerRect.bottom - anchorElementRect.top;

    // If it would go below the bottom, position it above the link instead
    if (top + floatingElemRect.height > scrollerBottom) {
        const targetTop = targetRect.top - anchorElementRect.top;
        top = targetTop - floatingElemRect.height - verticalGap;
    }

    // Clamp to container bounds
    top = Math.max(scrollerTop, Math.min(top, scrollerBottom - floatingElemRect.height));
    left = Math.max(scrollerLeft, Math.min(left, scrollerRight - floatingElemRect.width));

    floatingElem.style.opacity = '1';
    floatingElem.style.display = 'flex';
    floatingElem.style.visibility = 'visible';
    floatingElem.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.3)';
    floatingElem.style.border = '1px solid #333';
    floatingElem.style.outline = '1px solid #eee';
    floatingElem.style.borderRadius = '0 0 9px 9px';
    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
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

    const drawerWidth = isSidebarOpen ? HORIZONTAL_OFFSET : -70;
    const verticalGap = VERTICAL_GAP

    const updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        let linkNode = null;
        
        console.log('[FloatingLinkEditor] updateLinkEditor called, selection:', selection);
        
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            
            console.log('[FloatingLinkEditor] node type:', node.getType(), 'parent type:', parent?.getType());
            
            // Check multiple ways to find a link node
            // 1. Check if node itself is a link
            if ($isLinkNode(node) || $isAutoLinkNode(node)) {
                linkNode = node;
                console.log('[FloatingLinkEditor] Found link as node itself');
            }
            // 2. Check if parent is a link
            else if ($isLinkNode(parent) || $isAutoLinkNode(parent)) {
                linkNode = parent;
                console.log('[FloatingLinkEditor] Found link as parent');
            }
            // 3. Check ancestors
            else {
                linkNode = $findMatchingParent(node, (n) => $isLinkNode(n) || $isAutoLinkNode(n));
                if (linkNode) {
                    console.log('[FloatingLinkEditor] Found link in ancestors');
                }
            }
            
            if (linkNode) {
                const url = linkNode.getURL();
                console.log('[FloatingLinkEditor] Link URL:', url);
                setLinkUrl(url);
            } else {
                console.log('[FloatingLinkEditor] No link found');
                setLinkUrl('');
            }
        } else {
            console.log('[FloatingLinkEditor] Selection is not a RangeSelection');
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
                // Create a mutable rect object (DOMRect is read-only)
                const adjustedRect = {
                    top: domRect.top + 40,
                    left: domRect.left,
                    bottom: domRect.bottom,
                    right: domRect.right,
                    width: domRect.width,
                    height: domRect.height,
                };
                setFloatingElemPositionForLinkEditor(adjustedRect, editorElem, anchorElem, verticalGap, drawerWidth);
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

        return true;
    }, [anchorElem, editor, drawerWidth, isLink, verticalGap]);

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.getEditorState().read(() => {
                updateLinkEditor();
            });
        };

        window.addEventListener('resize', update, { passive: true });

        if (scrollerElem) {
            scrollerElem.addEventListener('scroll', update, { passive: true });
        }

        return () => {
            window.removeEventListener('resize', update);

            if (scrollerElem) {
                scrollerElem.removeEventListener('scroll', update);
            }
        };
    }, [anchorElem.parentElement, editor, updateLinkEditor]);

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
            {!isLink ? null : isEditMode ? (
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

    console.log('[FloatingLinkEditorPlugin] useFloatingLinkEditorToolbar initialized');

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            
            // Check if the node itself is a link
            const isNodeLink = $isLinkNode(node) || $isAutoLinkNode(node);
            
            // Check if parent is a link
            const isParentLink = $isLinkNode(parent) || $isAutoLinkNode(parent);
            
            // Check ancestors using $findMatchingParent
            const linkParent = $findMatchingParent(node, $isLinkNode);
            const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);

            // Debug logging
            console.log('[FloatingLinkEditor] Selection update:', {
                isNodeLink,
                isParentLink,
                hasLinkParent: linkParent != null,
                hasAutoLinkParent: autoLinkParent != null,
                nodeType: node.getType(),
                parentType: parent?.getType(),
            });

            // Show for both regular links and auto links
            if (isNodeLink || isParentLink || linkParent != null || autoLinkParent != null) {
                console.log('[FloatingLinkEditor] Setting isLink to TRUE');
                setIsLink(true);
            } else {
                console.log('[FloatingLinkEditor] Setting isLink to FALSE');
                setIsLink(false);
            }
        } else {
            console.log('[FloatingLinkEditor] No RangeSelection, setting isLink to FALSE');
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