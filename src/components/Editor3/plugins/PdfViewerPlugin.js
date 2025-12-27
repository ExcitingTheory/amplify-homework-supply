/**
 * @fileoverview PdfViewerPlugin - Embeds PDF documents in the editor.
 * 
 * This plugin provides PDF viewing functionality with document embedding
 * and viewing capabilities for PDF files.
 * 
 * @module PdfViewerPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { $wrapNodeInElement } from '@lexical/utils';
import { 
    COMMAND_PRIORITY_EDITOR, 
    createCommand,
    $createParagraphNode,
} from 'lexical';
import { useEffect } from 'react';

import { 
    PdfViewerNode, 
    $createPdfViewerNode 
} from '../components/PdfViewerNode';

/**
 * Command to insert a PDF viewer into the editor.
 * 
 * Payload should contain:
 * - path: S3 path to the PDF file
 * - identityId: AWS Cognito identity ID for access
 * - filename: Display name for the PDF
 * 
 * @type {LexicalCommand<{path: string, identityId: string, filename: string}>}
 */
export const INSERT_PDF_COMMAND = createCommand(
    'INSERT_PDF_COMMAND',
);

/**
 * PdfViewerPlugin - Registers PDF viewing functionality in the editor.
 * 
 * Registers the INSERT_PDF_COMMAND which creates a PdfViewerNode and
 * inserts it into the editor, wrapped in a paragraph element.
 * 
 * @returns {null} Plugin returns null
 */
export default function PdfViewerPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([PdfViewerNode])) {
            throw new Error('PdfViewerPlugin: PdfViewerNode not registered on editor');
        }

        return editor.registerCommand(
            INSERT_PDF_COMMAND,
            (payload) => {
                const { path, identityId, filename } = payload;
                const pdfViewerNode = $createPdfViewerNode({
                    path,
                    identityId,
                    filename,
                });
                $insertNodeToNearestRoot(pdfViewerNode);

                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [editor]);

    return null;
}
