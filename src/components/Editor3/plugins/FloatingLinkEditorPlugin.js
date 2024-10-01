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

import {
    Button,
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';

const VERTICAL_GAP = -150;
const HORIZONTAL_OFFSET = -400; // TODO: Make this dynamic based on the width of the link editor.

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
        floatingElem.style.transform = 'translate(-10000px, -10000px)';
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElementRect = anchorElem.getBoundingClientRect();
    const editorScrollerRect = scrollerElem.getBoundingClientRect();

    let top = targetRect.top - verticalGap;
    let left = targetRect.left - horizontalOffset;

    if (top < editorScrollerRect.top) {
        top += floatingElemRect.height + targetRect.height + verticalGap * 2;
    }

    if (left + floatingElemRect.width > editorScrollerRect.right) {
        left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
    }

    top -= anchorElementRect.top;
    left -= anchorElementRect.left;

    floatingElem.style.opacity = '1';
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
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
                setLinkUrl(parent.getURL());
            } else if ($isLinkNode(node)) {
                setLinkUrl(node.getURL());
            } else {
                setLinkUrl('');
            }
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
            const domRect =
                nativeSelection.focusNode?.parentElement?.getBoundingClientRect();
            if (domRect) {
                domRect.y += 40;
                setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem, verticalGap, drawerWidth);
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
    }, [anchorElem, editor, drawerWidth]);

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.getEditorState().read(() => {
                updateLinkEditor();
            });
        };

        window.addEventListener('resize', update);

        if (scrollerElem) {
            scrollerElem.addEventListener('scroll', update);
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
                    updateLinkEditor();
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

    return (<>
        <style global jsx>{`
        .link-editor {
            display: flex;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 2010;
            max-width: 400px;
            width: fit-content;
            opacity: 0;
            background-color: #fff;
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
            border-radius: 0 0 9px 9px;
            transition: opacity 0.5s;
            will-change: transform;
            outline: 1px solid #eee;
            outline-offset: -1px;
            border: 1px solid #333;
        }

        .link-editor a,
        .link-editor input {
            display: inline-block;
            margin: 1rem 3rem 1rem 1rem;
        }

        .link-editor [role="button"] {
            min-width: 1rem;
        }
      `}</style>
        <div ref={editorRef} className="link-editor">
            {!isLink ? null : isEditMode ? (
                <>
                    <input
                        ref={inputRef}
                        className="link-input"
                        value={editedLinkUrl}
                        onChange={(event) => {
                            setEditedLinkUrl(event.target.value);
                        }}
                        onKeyDown={(event) => {
                            monitorInputInteraction(event);
                        }}
                    />
                        <Button
                            className="link-cancel"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setEditMode(false);
                            }}
                        >
                            <CancelIcon />
                        </Button>

                        <Button
                            className="link-confirm"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={handleLinkSubmission}
                        >
                            <CheckCircleIcon />
                        </Button>
                </>
            ) : (
                <>
                    <a
                        href={sanitizeUrl(linkUrl)}
                        target="_blank"
                        rel="noopener noreferrer">
                        {linkUrl}
                    </a>
                    <Button
                        className="link-edit"
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
                        className="link-trash"
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

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const linkParent = $findMatchingParent(node, $isLinkNode);
            const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);

            // We don't want this menu to open for auto links.
            // Because auto link text editing is not working?
            // TODO: Fix auto link text editing.
            if (linkParent != null && autoLinkParent == null) {
                // if (linkParent != null) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }
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
                    updateToolbar();
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