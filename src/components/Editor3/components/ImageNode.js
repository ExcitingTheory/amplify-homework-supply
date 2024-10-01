import {
    $applyNodeReplacement,
    createEditor,
    DecoratorNode,
} from 'lexical';
import * as React from 'react';
import { Suspense } from 'react';

const ImageComponent = React.lazy(
    // @ts-ignore
    () => import('./ImageComponent'),
);

function convertImageElement(domNode) {
    if (domNode instanceof HTMLImageElement) {
        const { alt: altText, path, src, width, height } = domNode;
        const node = $createImageNode({ altText, height, src, path, width, identityId });
        return { node };
    }
    return null;
}

export class ImageNode extends DecoratorNode {
    __path;
    __identityId;
    __src;
    __altText;
    __width;
    __height;
    __maxWidth;
    __showCaption;
    __caption;
    __captionsEnabled;

    static getType() {
        return 'image';
    }

    static clone(node) {
        return new ImageNode(
            node.__path,
            node.__identityId,
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__showCaption,
            node.__caption,
            node.__captionsEnabled,
            node.__key,
        );
    }

    static importJSON(serializedNode) {
        const {
            altText,
            height,
            width,
            maxWidth,
            caption,
            src,
            path,
            showCaption,
            identityId,
        } = serializedNode;
        const node = $createImageNode({
            altText,
            height,
            maxWidth,
            showCaption,
            src,
            path,
            width,
            identityId,
        });
        const nestedEditor = node.__caption;
        const editorState = nestedEditor.parseEditorState(caption.editorState);
        if (!editorState.isEmpty()) {
            nestedEditor.setEditorState(editorState);
        }
        return node;
    }

    exportDOM() {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('x-data-lexical-image', this.__path);
        element.setAttribute('x-data-lexical-identity-id', this.__identityId);
        element.setAttribute('alt', this.__altText);
        element.setAttribute('width', this.__width.toString());
        element.setAttribute('height', this.__height.toString());
        return { element };
    }

    static importDOM() {
        return {
            img: (node) => ({
                conversion: convertImageElement,
                priority: 0,
            }),
        };
    }

    constructor(
        path,
        identityId,
        src,
        altText,
        maxWidth,
        width = '100%',
        height = 'auto',
        showCaption = false,
        caption = createEditor(),
        captionsEnabled,
        key,
    ) {
        super(key);
        this.__path = path;
        this.__identityId = identityId;
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width;
        this.__height = height;
        this.__showCaption = showCaption;
        this.__caption = caption;
        this.__captionsEnabled =
            captionsEnabled || captionsEnabled === undefined;
    }

    exportJSON() {
        return {
            altText: this.getAltText(),
            caption: this.__caption.toJSON(),
            height: this.__height,
            maxWidth: this.__maxWidth,
            showCaption: this.__showCaption,
            src: this.getSrc(),
            path: this.__path,
            identityId: this.__identityId,
            type: 'image',
            version: 1,
            width: this.__width,
        };
    }

    setWidthAndHeight(width, height) {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    setShowCaption(showCaption) {
        const writable = this.getWritable();
        writable.__showCaption = showCaption;
    }

    createDOM(config) {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme.image;
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    updateDOM() {
        return false;
    }

    getSrc() {
        return this.__src;
    }

    getAltText() {
        return this.__altText;
    }

    decorate() {
        return (
            <Suspense fallback={null}>
                
                <style global jsx>{`
                    .ImageNode__contentEditable {
                        min-height: 20px;
                        border: 0px;
                        resize: none;
                        cursor: text;
                        caret-color: rgb(5, 5, 5);
                        display: block;
                        position: relative;
                        outline: 0px;
                        padding: 10px;
                        user-select: text;
                        font-size: 12px;
                        width: calc(100% - 20px);
                        white-space: pre-wrap;
                        word-break: break-word;
                    }
                    
                    .ImageNode__placeholder {
                        font-size: 12px;
                        color: #888;
                        overflow: hidden;
                        position: absolute;
                        text-overflow: ellipsis;
                        top: 10px;
                        left: 10px;
                        user-select: none;
                        white-space: nowrap;
                        display: inline-block;
                        pointer-events: none;
                    }
                    
                    .image-control-wrapper--resizing {
                        touch-action: none;
                    }
                `}</style>
                <ImageComponent
                    src={this.__src}
                    path={this.__path}
                    identityId={this.__identityId}
                    altText={this.__altText}
                    width={this.__width}
                    height={this.__height}
                    maxWidth={this.__maxWidth}
                    nodeKey={this.getKey()}
                    showCaption={this.__showCaption}
                    caption={this.__caption}
                    captionsEnabled={this.__captionsEnabled}
                    resizable={true}
                />
            </Suspense>
        );
    }
}

export function $createImageNode({
    altText,
    height,
    maxWidth = 800,
    captionsEnabled,
    src,
    path,
    width,
    showCaption,
    caption,
    key,
    identityId,
}) {
    return $applyNodeReplacement(
        new ImageNode(
            path,
            identityId,
            src,
            altText,
            maxWidth,
            width,
            height,
            showCaption,
            caption,
            captionsEnabled,
            key
        ),
    );
}

export function $isImageNode(node) {
    return node instanceof ImageNode;
}