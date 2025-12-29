/**
 * @fileoverview PdfViewerNode - Lexical DecoratorNode for PDF documents.
 * 
 * Embeds PDF documents with viewing capabilities in the Lexical editor.
 * Stores PDF path, identity ID, and filename for S3 access.
 * 
 * @module PdfViewerNode
 */

import {
    $applyNodeReplacement,
    DecoratorNode,
} from 'lexical';
import * as React from 'react';
import { Suspense } from 'react';

const PdfViewerComponent = React.lazy(
    () => import('./PdfViewerComponent'),
);

/**
 * Converts a DOM element into a PdfViewerNode.
 * 
 * @param {HTMLElement} domNode - DOM element with PDF data attributes
 * @returns {{node: PdfViewerNode} | null} Created node or null
 */
function convertPdfElement(domNode) {
    if (domNode instanceof HTMLDivElement) {
        const path = domNode.getAttribute('data-lexical-pdf-path');
        const identityId = domNode.getAttribute('data-lexical-pdf-identity-id');
        const filename = domNode.getAttribute('data-lexical-pdf-filename');
        
        if (path && identityId && filename) {
            const node = $createPdfViewerNode({ path, identityId, filename });
            return { node };
        }
    }
    return null;
}

/**
 * PdfViewerNode - Lexical DecoratorNode for PDF documents.
 * 
 * Embeds PDF viewers with file path, identity ID, and filename tracking.
 * 
 * @class PdfViewerNode
 * @extends {DecoratorNode}
 */
export class PdfViewerNode extends DecoratorNode {
    __path;
    __identityId;
    __filename;

    static getType() {
        return 'pdf-viewer';
    }

    static clone(node) {
        return new PdfViewerNode(
            node.__path,
            node.__identityId,
            node.__filename,
            node.__key,
        );
    }

    static importJSON(serializedNode) {
        const { path, identityId, filename } = serializedNode;
        const node = $createPdfViewerNode({
            path,
            identityId,
            filename,
        });
        return node;
    }

    exportDOM() {
        const element = document.createElement('div');
        element.setAttribute('data-lexical-pdf-path', this.__path);
        element.setAttribute('data-lexical-pdf-identity-id', this.__identityId);
        element.setAttribute('data-lexical-pdf-filename', this.__filename);
        return { element };
    }

    static importDOM() {
        return {
            div: (node) => {
                if (!node.hasAttribute('data-lexical-pdf-path')) {
                    return null;
                }
                return {
                    conversion: convertPdfElement,
                    priority: 1,
                };
            },
        };
    }

    constructor(
        path,
        identityId,
        filename,
        key,
    ) {
        super(key);
        this.__path = path;
        this.__identityId = identityId;
        this.__filename = filename;
    }

    exportJSON() {
        return {
            path: this.__path,
            identityId: this.__identityId,
            filename: this.__filename,
            type: 'pdf-viewer',
            version: 1,
        };
    }

    createDOM(config) {
        const div = document.createElement('div');
        const theme = config.theme;
        const className = theme.pdfViewer;
        if (className !== undefined) {
            div.className = className;
        }
        return div;
    }

    updateDOM() {
        return false;
    }

    isIsolated() {
        return true;
    }

    isTopLevel() {
        return true;
    }

    getPath() {
        return this.__path;
    }

    getIdentityId() {
        return this.__identityId;
    }

    getFilename() {
        return this.__filename;
    }

    decorate() {
        return (
            <Suspense fallback={<div>Loading PDF...</div>}>
                <PdfViewerComponent
                    path={this.__path}
                    identityId={this.__identityId}
                    filename={this.__filename}
                    nodeKey={this.getKey()}
                />
            </Suspense>
        );
    }
}

/**
 * Factory function to create a PdfViewerNode.
 * 
 * @param {Object} options - Node options
 * @param {string} options.path - S3 path to PDF file
 * @param {string} options.identityId - AWS Cognito identity ID
 * @param {string} options.filename - Display filename
 * @param {string} [options.key] - Optional node key
 * @returns {PdfViewerNode} New PDF viewer node instance
 */
export function $createPdfViewerNode({
    path,
    identityId,
    filename,
    key,
}) {
    return $applyNodeReplacement(
        new PdfViewerNode(
            path,
            identityId,
            filename,
            key
        ),
    );
}

/**
 * Type guard for PdfViewerNode.
 * 
 * @param {LexicalNode} node - Node to check
 * @returns {boolean} True if node is a PdfViewerNode
 */
export function $isPdfViewerNode(node) {
    return node instanceof PdfViewerNode;
}
