import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createMarkNode, $isMarkNode, MarkNode } from '@lexical/mark';
import { $getRoot, $isTextNode, $createTextNode } from 'lexical';
import { useEffect } from 'react';

/**
 * SearchHighlightPlugin - Highlights search terms in Lexical editor content
 * 
 * This plugin uses MarkNode from @lexical/mark to highlight text matching
 * the search term. The highlights are styled with a yellow background.
 * 
 * @param {Object} props
 * @param {string} props.searchTerm - The term to search for and highlight
 * 
 * @example
 * <LexicalComposer initialConfig={config}>
 *   <SearchHighlightPlugin searchTerm="hello" />
 *   <RichTextPlugin ... />
 * </LexicalComposer>
 */
export default function SearchHighlightPlugin({ searchTerm = '' }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Only update when searchTerm changes (not on every editor update)
    editor.update(() => {
      const root = $getRoot();
      const allTextNodes = root.getAllTextNodes();
      
      // First, remove all existing search highlights
      allTextNodes.forEach((textNode) => {
        const parent = textNode.getParent();
        if ($isMarkNode(parent) && parent.getIDs().includes('search-highlight')) {
          const textContent = textNode.getTextContent();
          const newTextNode = $createTextNode(textContent);
          newTextNode.setFormat(textNode.getFormat());
          newTextNode.setStyle(textNode.getStyle());
          parent.replace(newTextNode);
        }
      });
      
      // If no search term, just clear and return
      if (!searchTerm || searchTerm.length < 2) {
        return;
      }
      
      // Apply new highlights
      const regex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'gi'
      );
      
      // Get fresh list of text nodes after removing marks
      const textNodes = root.getAllTextNodes();
      
      // Process each text node
      const nodesToProcess = [];
      textNodes.forEach((textNode) => {
        // Skip if already in a mark node
        if ($isMarkNode(textNode.getParent()) && 
            textNode.getParent().getIDs().includes('search-highlight')) {
          return;
        }
        
        const text = textNode.getTextContent();
        const matches = [...text.matchAll(regex)];
        
        if (matches.length > 0) {
          nodesToProcess.push({ textNode, matches });
        }
      });
      
      // Apply highlights to matching nodes
      nodesToProcess.forEach(({ textNode, matches }) => {
        if (!textNode.isAttached()) return;
        
        // Sort matches by index in reverse order
        matches.sort((a, b) => b.index - a.index);
        
        let currentNode = textNode;
        
        for (const match of matches) {
          if (!currentNode.isAttached()) break;
          
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;
          const nodeText = currentNode.getTextContent();
          
          if (matchStart >= nodeText.length) continue;
          
          // Split the text node at match boundaries
          if (matchEnd < nodeText.length) {
            const splits = currentNode.splitText(matchEnd);
            currentNode = splits[0];
          }
          
          if (matchStart > 0) {
            const splits = currentNode.splitText(matchStart);
            currentNode = splits[1];
          }
          
          // Wrap the matched text in a MarkNode
          if (currentNode && $isTextNode(currentNode) && currentNode.isAttached()) {
            const markNode = $createMarkNode(['search-highlight']);
            currentNode.replace(markNode);
            markNode.append(currentNode);
          }
          
          // Reset for next iteration
          currentNode = textNode;
        }
      });
    });
  }, [editor, searchTerm]);

  return null;
}

/**
 * CSS to add to your theme or global styles:
 * 
 * mark[data-lexical-mark-id*="search-highlight"] {
 *   background-color: #ffeb3b;
 *   padding: 0 2px;
 *   border-radius: 2px;
 * }
 */
