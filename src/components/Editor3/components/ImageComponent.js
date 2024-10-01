import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
// import { useCollaborationContext } from '@lexical/react/LexicalCollaborationContext';
// import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
// import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    $setSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DRAGSTART_COMMAND,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import * as React from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import LinkPlugin from '../plugins/LinkPlugin';
import AutoLinkPlugin from '../plugins/AutoLinkPlugin';
// import MentionsPlugin from '../plugins/MentionsPlugin';
// import TreeViewPlugin from '../plugins/TreeViewPlugin';
import ContentEditable from './ContentEditable';
import ImageResizer from './ImageResizer';
import Placeholder from './Placeholder';
import { $isImageNode } from './ImageNode';

import getCachedUrl from '../../../utils/getCachedUrl';

function useSuspenseImage(src) {
    new Promise(async (resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            resolve(null);
        };
    });
}

function LazyImage({
    altText,
    className,
    imageRef,
    src,
    width,
    height,
    maxWidth,
}) {


    useSuspenseImage(src);
    return (
        <img
            className={className || undefined}
            src={src}
            alt={altText}
            ref={imageRef}
            style={{
                height,
                maxWidth,
                width,
            }}
            draggable="false"
        />
    );
}

export default function ImageComponent({
    src,
    path,
    altText,
    identityId,
    nodeKey,
    width,
    height,
    maxWidth,
    resizable,
    showCaption,
    caption,
    captionsEnabled,
}) {
    const imageRef = useRef(null);
    const buttonRef = useRef(null);
    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);
    const [isResizing, setIsResizing] = useState(false);
    //   const { isCollabActive } = useCollaborationContext();
    const [editor] = useLexicalComposerContext();
    const [selection, setSelection] = useState(null);
    const activeEditorRef = useRef(null);

    // TODO: Access the FileUnit model from the UnitContext here

    const onDelete = useCallback(
        async (payload) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                    node.remove();

                    // TODO: remove the image from the relation 
                }
            }
            return false;
        },
        [isSelected, nodeKey],
    );

    const onEnter = useCallback(
        (event) => {
            const latestSelection = $getSelection();
            const buttonElem = buttonRef.current;
            if (
                isSelected &&
                $isNodeSelection(latestSelection) &&
                latestSelection.getNodes().length === 1
            ) {
                if (showCaption) {
                    $setSelection(null);
                    event.preventDefault();
                    caption.focus();
                    return true;
                } else if (
                    buttonElem !== null &&
                    buttonElem !== document.activeElement
                ) {
                    event.preventDefault();
                    buttonElem.focus();
                    return true;
                }
            }
            return false;
        },
        [caption, isSelected, showCaption],
    );

    const onEscape = useCallback(
        (event) => {
            if (
                activeEditorRef.current === caption ||
                buttonRef.current === event.target
            ) {
                $setSelection(null);
                editor.update(() => {
                    setSelected(true);
                    const parentRootElement = editor.getRootElement();
                    if (parentRootElement !== null) {
                        parentRootElement.focus();
                    }
                });
                return true;
            }
            return false;
        },
        [caption, editor, setSelected],
    );

    useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                if (isMounted) {
                    setSelection(editorState.read(() => $getSelection()));
                }
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_, activeEditor) => {
                    activeEditorRef.current = activeEditor;
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                CLICK_COMMAND,
                (payload) => {
                    const event = payload;

                    if (isResizing) {
                        return true;
                    }
                    if (event.target === imageRef.current) {
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
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                DRAGSTART_COMMAND,
                (event) => {
                    if (event.target === imageRef.current) {
                        event.preventDefault();
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_DELETE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW,
            ),
            editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
            editor.registerCommand(
                KEY_ESCAPE_COMMAND,
                onEscape,
                COMMAND_PRIORITY_LOW,
            ),
        );
        return () => {
            isMounted = false;
            unregister();
        };
    }, [
        clearSelection,
        editor,
        isResizing,
        isSelected,
        nodeKey,
        onDelete,
        onEnter,
        onEscape,
        setSelected,
    ]);

    const setShowCaption = () => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setShowCaption(true);
            }
        });
    };

    const onResizeEnd = (nextWidth, nextHeight) => {
        setTimeout(() => {
            setIsResizing(false);
        }, 200);

        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.setWidthAndHeight(nextWidth, nextHeight);
            }
        });
    };

    const onResizeStart = () => {
        setIsResizing(true);
    };

    // const { historyState } = useSharedHistoryContext();
    // const {
    //     settings: { showNestedEditorTreeView },
    // } = useSettings();

    React.useEffect(() => {
        if (!path) return
        if (!imageRef.current) return

        const fetchImage = async () => {
            const _href = await getCachedUrl(path, 'protected', identityId)
            imageRef.current.src = _href;
        }
        fetchImage()
    }, [path])


    
    const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
    const isFocused = isSelected || isResizing;
    return (
        <Suspense fallback={null}>
            <>
                <div draggable={draggable}>
                    <LazyImage
                        className={
                            isFocused
                                ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}`
                                : null
                        }
                        src={src}
                        altText={altText}
                        imageRef={imageRef}
                        width={width}
                        height={height}
                        maxWidth={maxWidth}
                    />
                </div>
                {showCaption && (
                    <div className="image-caption-container">
                        <LexicalNestedComposer initialEditor={caption}>
                            {/* <AutoFocusPlugin /> */}
                            <LinkPlugin />
                            <HistoryPlugin />
                            <AutoLinkPlugin />
                            <RichTextPlugin
                                contentEditable={
                                    <ContentEditable className="ImageNode__contentEditable" />
                                }
                                placeholder={
                                    <Placeholder className="ImageNode__placeholder">
                                        Enter a caption...
                                    </Placeholder>
                                }
                                ErrorBoundary={LexicalErrorBoundary}
                            />
                            {/* {showNestedEditorTreeView === true ? <TreeViewPlugin /> : null} */}
                        </LexicalNestedComposer>
                    </div>
                )}
                {resizable && $isNodeSelection(selection) && isFocused && (
                    <ImageResizer
                        showCaption={showCaption}
                        setShowCaption={setShowCaption}
                        editor={editor}
                        buttonRef={buttonRef}
                        imageRef={imageRef}
                        maxWidth={maxWidth}
                        onResizeStart={onResizeStart}
                        onResizeEnd={onResizeEnd}
                        captionsEnabled={captionsEnabled}
                    />
                )}
            </>
        </Suspense>
    );
}