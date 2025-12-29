/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { registerCodeHighlighting, $isCodeNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';

export default function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register code highlighting with default configuration
    const removeCodeHighlighting = registerCodeHighlighting(editor);
    
    // Function to ensure code blocks have proper line numbering
    const setupCodeBlockLineNumbers = () => {
      // Collect code node data first
      let codeNodeData = [];
      
      editor.getEditorState().read(() => {
        const root = $getRoot();
        
        // Find all code nodes using a safer traversal
        function findCodeNodes(node) {
          if ($isCodeNode(node)) {
            codeNodeData.push({
              key: node.getKey(),
              textContent: node.getTextContent()
            });
          }
          
          // Only try to get children if the node has the method
          if (typeof node.getChildren === 'function') {
            const children = node.getChildren();
            children.forEach(child => {
              findCodeNodes(child);
            });
          }
        }
        
        findCodeNodes(root);
      });
      
      // Now update DOM elements outside the read context
      setTimeout(() => {
        codeNodeData.forEach(({ key, textContent }) => {
          const domElement = editor.getElementByKey(key);
          
          if (domElement) {
            const lines = textContent.split('\n');
            const gutter = lines.map((_, index) => String(index + 1).padStart(2)).join('\n');
            
            // Set the data-gutter attribute for line numbers
            domElement.setAttribute('data-gutter', gutter);
            
            // Ensure the proper CSS class is applied
            if (!domElement.classList.contains('LanguageEditorTheme__code')) {
              domElement.classList.add('LanguageEditorTheme__code');
            }
          }
        });
      }, 0);
    };

    // Trigger initial setup and on updates
    const triggerCodeHighlighting = () => {
      editor.update(() => {
        const root = $getRoot();
        
        // Find all code nodes and trigger re-highlighting
        const allNodes = root.getAllTextNodes();
        allNodes.forEach(textNode => {
          const parent = textNode.getParent();
          if ($isCodeNode(parent)) {
            // Force re-highlighting by touching the node
            parent.setLanguage(parent.getLanguage() || '');
          }
        });
      });
      
      // Also setup line numbers
      setupCodeBlockLineNumbers();
    };

    // Listen for editor state changes and trigger highlighting
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        triggerCodeHighlighting();
      }, 10);
    });

    // Initial setup
    setTimeout(() => {
      setupCodeBlockLineNumbers();
    }, 100);
    
    return () => {
      removeCodeHighlighting();
      removeUpdateListener();
    };
  }, [editor]);

  return null;
}
