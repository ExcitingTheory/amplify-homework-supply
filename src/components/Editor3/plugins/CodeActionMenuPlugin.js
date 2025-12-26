/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isCodeNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

export default function CodeActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        console.log('🔑 ENTER KEY pressed in editor');
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          console.log('❌ Not a collapsed range selection');
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const codeNode = anchorNode.getParent();
        
        if (!$isCodeNode(codeNode)) {
          console.log('❌ Not in a code node');
          return false;
        }

        console.log('✅ In code node');

        // Get cursor position
        const offset = selection.anchor.offset;
        const nodeText = anchorNode.getTextContent();
        
        console.log(`📍 Cursor offset: ${offset}, Node text length: ${nodeText.length}`);
        console.log(`📝 Node text: "${nodeText}"`);
        
        // Check if we're at the end of the current text node
        if (offset < nodeText.length) {
          return false;
        }

        // Check if this is the last child in the code block
        const codeChildren = codeNode.getChildren();
        const lastChild = codeChildren[codeChildren.length - 1];
        
        if (anchorNode !== lastChild) {
          return false;
        }

        // Check if the last two lines are empty
        const textContent = codeNode.getTextContent();
        const lines = textContent.split('\n');
        
        // Need at least 2 empty lines already (we're about to add the 3rd)
        if (lines.length < 2) {
          return false;
        }
        
        const lastTwoLines = lines.slice(-2);
        
        if (lastTwoLines.every(line => line.trim() === '')) {
          // Remove the two empty lines and exit the code block
          editor.update(() => {
            const newText = lines.slice(0, -2).join('\n');
            const textNode = codeNode.getFirstChild();
            if (textNode) {
              textNode.setTextContent(newText);
            }
            
            const paragraph = $createParagraphNode();
            codeNode.insertAfter(paragraph);
            paragraph.select();
          });
          
          event?.preventDefault();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    const unregisterArrowDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        
        // Try to find the code node - it could be the parent or grandparent
        let codeNode = null;
        let currentNode = anchorNode;
        
        // Walk up the tree to find a CodeNode
        while (currentNode && !codeNode) {
          if ($isCodeNode(currentNode)) {
            codeNode = currentNode;
            break;
          }
          currentNode = currentNode.getParent();
        }
        
        if (!codeNode) {
          return false;
        }

        // Simplified exit logic: exit only if on an empty last line
        const codeText = codeNode.getTextContent();
        const lines = codeText.split('\n');
        const lastLine = lines[lines.length - 1];
        
        // Check if last line is empty
        if (lastLine.trim() !== '') {
          return false;
        }
        
        // Get cursor position
        const offset = selection.anchor.offset;
        const anchorText = anchorNode.getTextContent();
        
        // Check if we're at the end of the text
        if (offset < anchorText.length) {
          return false;
        }
        
        // Calculate which line we're on
        const textBeforeCursor = anchorText.substring(0, offset);
        const newlinesInAnchor = (textBeforeCursor.match(/\n/g) || []).length;
        
        const children = codeNode.getChildren();
        let textBeforeThisNode = '';
        for (const child of children) {
          if (child === anchorNode) {
            break;
          }
          textBeforeThisNode += child.getTextContent();
        }
        
        const newlinesBeforeNode = (textBeforeThisNode.match(/\n/g) || []).length;
        const currentLine = newlinesBeforeNode + newlinesInAnchor;
        
        // Check if we're on the last line
        if (currentLine < lines.length - 1) {
          return false;
        }
        
        event?.preventDefault();
        
        // Exit to a new paragraph
        editor.update(() => {
          const paragraph = $createParagraphNode();
          codeNode.insertAfter(paragraph);
          paragraph.selectEnd();
        });
        
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterEnter();
      unregisterArrowDown();
    };
  }, [editor]);

  return null;
}
