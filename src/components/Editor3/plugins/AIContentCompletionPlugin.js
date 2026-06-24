/**
 * @fileoverview AIContentCompletionPlugin - AI-powered content completion.
 * 
 * Similar to GitHub Copilot, this plugin suggests complete sentences/paragraphs
 * as you type. It uses GPT-4 to intelligently continue your content based on
 * the current context.
 * 
 * Features:
 * - Triggers after typing substantial content (>50 chars)
 * - Debounced to avoid excessive API calls
 * - Streaming responses for better UX
 * - Accept with Tab/Right Arrow
 * - Dismiss with Esc or continue typing
 * 
 * @module AIContentCompletionPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  $createTextNode,
  $getNodeByKey,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { useCallback, useEffect, useState, useRef, useContext } from 'react';
import * as React from 'react';


import { 
  $createAIContentSuggestionNode, 
  AIContentSuggestionNode,
  $createAILoadingNode,
  AILoadingNode,
  AI_SUGGESTION_UUID 
} from '../components/AIContentSuggestionNode';
import UnitContext from '../../../context/unitContext';
import SectionContext from '../../../context/sectionContext';



const DEBOUNCE_DELAY = 800; // ms - wait for user to stop typing
const MIN_CONTENT_LENGTH = 50; // chars - minimum before suggesting
const TRIGGER_CHARS = ['.', '!', '?', '。']; // Sentence-ending punctuation

/**
 * Main plugin component
 */
export default function AIContentCompletionPlugin() {
  const [editor] = useLexicalComposerContext();
  const suggestionNodeKey = useRef(null);
  const currentSuggestion = useRef(null);
  const [lastAcceptedSuggestion, setLastAcceptedSuggestion] = useState(null); // Track for feedback
  const debounceTimer = useRef(null);
  const abortController = useRef(null);
  
  const { currentUnit } = useContext(UnitContext);
  const { sections, assignments } = useContext(SectionContext);

  // Derive course outline for the current unit's section(s)
  const courseOutline = React.useMemo(() => {
    if (!currentUnit?.id || !assignments?.length || !sections?.length) return null;

    // Find sections that this unit is assigned to
    const sectionIds = assignments
      .filter(a => a.unitID === currentUnit.id)
      .map(a => a.sectionID);

    // Get course outline from the first section that has one
    for (const sectionId of sectionIds) {
      const section = sections.find(s => s.id === sectionId);
      if (section?.courseOutline) {
        try {
          return typeof section.courseOutline === 'string'
            ? JSON.parse(section.courseOutline)
            : section.courseOutline;
        } catch {
          // Skip malformed outlines
        }
      }
    }
    return null;
  }, [currentUnit?.id, assignments, sections]);
  
  // Clear suggestion node
  const clearSuggestion = useCallback(() => {
    editor.update(() => {
      if (suggestionNodeKey.current !== null) {
        const node = $getNodeByKey(suggestionNodeKey.current);
        if (node !== null && node.isAttached()) {
          node.remove();
        }
        suggestionNodeKey.current = null;
      }
      currentSuggestion.current = null;
    }, { tag: 'skip-collab' });
  }, [editor]);

  // Update or create suggestion node
  const updateSuggestion = useCallback((text) => {
    console.log('updateSuggestion called with text:', text);
    
    editor.update(() => {
      const selection = $getSelection();
      
      if (!$isRangeSelection(selection)) {
        console.log('No range selection, skipping');
        return;
      }
      
      if (suggestionNodeKey.current !== null) {
        const node = $getNodeByKey(suggestionNodeKey.current);
        if (node instanceof AIContentSuggestionNode) {
          // Update existing suggestion in place (no selection change needed)
          console.log('Updating existing suggestion node in place');
          node.setSuggestion(text);
        } else if (node !== null && node.isAttached()) {
          // Replace loading node (or other node type) with suggestion node
          console.log('Replacing existing node with suggestion');
          const newNode = $createAIContentSuggestionNode(AI_SUGGESTION_UUID, text);
          node.replace(newNode);
          suggestionNodeKey.current = newNode.getKey();
        }
      } else {
        // Create new node after the anchor (does not affect selection)
        console.log('Creating new suggestion node');
        const anchorNode = selection.anchor.getNode();
        const node = $createAIContentSuggestionNode(AI_SUGGESTION_UUID, text);
        suggestionNodeKey.current = node.getKey();
        anchorNode.insertAfter(node);
      }
      
      currentSuggestion.current = text;
    }, { tag: 'skip-collab' });
  }, [editor]);

  // Fetch AI suggestion
  const fetchSuggestion = useCallback(async (prompt, context) => {
    console.log('fetchSuggestion called with prompt:', prompt);
    
    // Cancel any in-flight requests
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    
    // Show loading indicator
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      
      // Clear any existing suggestion/loading node first
      if (suggestionNodeKey.current !== null) {
        const existingNode = $getNodeByKey(suggestionNodeKey.current);
        if (existingNode !== null && existingNode.isAttached()) {
          existingNode.remove();
        }
        suggestionNodeKey.current = null;
      }
      
      const anchorNode = selection.anchor.getNode();
      const loadingNode = $createAILoadingNode(AI_SUGGESTION_UUID);
      suggestionNodeKey.current = loadingNode.getKey();
      anchorNode.insertAfter(loadingNode);
    }, { tag: 'skip-collab' });
    
    try {
      // Derive a draft summary from current editor headings
      let draftHeadings = [];
      editor.getEditorState().read(() => {
        const root = editor.getEditorState()._nodeMap;
        if (root) {
          root.forEach((node) => {
            if (node.getType?.() === 'heading' && node.getTextContent?.()) {
              draftHeadings.push(node.getTextContent().trim());
            }
          });
        }
      });

      const contextData = {
        unit: currentUnit ? {
          id: currentUnit.id,
          name: currentUnit.name,
          description: currentUnit.description,
        } : null,
        // Draft headings from current editor state (not persisted)
        draftHeadings: draftHeadings.length > 0 ? draftHeadings : undefined,
        // Course outline from section (published unit summaries)
        courseOutline: courseOutline || undefined,
        ...context,
      };

      console.log('Making API call to /api/content-completion...');
      
      // Call local Route Handler (no Lambda cold start)
      const response = await fetch('/api/content-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: contextData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Content completion failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completion = '';
      let buffer = '';

      console.log('Starting to stream response...');
      
      // Stream the AI SDK data stream protocol response
      // Format: each line is TYPE_CODE:JSON_PAYLOAD\n
      // 0: = text chunk (JSON-encoded string)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line) continue;
          // AI SDK data stream: "0:..." for text chunks
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              completion += text;
            } catch {
              // Skip unparseable lines
            }
          }
        }
        
        if (completion) {
          console.log('Streaming chunk, total length:', completion.length);
          // Update suggestion in real-time as we stream
          updateSuggestion(completion);
        }
      }
      
      if (!completion) {
        throw new Error('No completion returned');
      }
      
      console.log('Final completion:', completion);
      updateSuggestion(completion.trim());
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestion:', error);
        clearSuggestion();
      }
    }
  }, [currentUnit, courseOutline, updateSuggestion, clearSuggestion, editor]);
  
  // Detect when to trigger suggestions
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      // Ignore updates from our own operations and history
      if (tags && (tags.has('skip-collab') || tags.has('historic') || tags.has('history-push'))) {
        return;
      }

      editorState.read(() => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection)) {
          clearSuggestion();
          return;
        }
        
        const anchorNode = selection.anchor.getNode();
        const text = anchorNode.getTextContent();
        const offset = selection.anchor.offset;
        
        // Only trigger if we're at the end of a text node
        if (offset !== text.length) {
          clearSuggestion();
          return;
        }
        
        // Check if text is long enough and ends with punctuation
        const lastChar = text[text.length - 1];
        const shouldTrigger = 
          text.length >= MIN_CONTENT_LENGTH &&
          TRIGGER_CHARS.includes(lastChar);
        
        if (!shouldTrigger) {
          clearSuggestion();
          return;
        }
        
        // Get parent block context
        const parent = anchorNode.getParent();
        if (!parent || $isHeadingNode(parent)) {
          // Don't suggest in headings
          clearSuggestion();
          return;
        }
        
        // Get preceding text for context (last 200 chars)
        const fullText = parent.getTextContent();
        const contextLength = Math.min(200, fullText.length);
        const contextText = fullText.slice(-contextLength);
        
        // Debounce the API call
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        
        debounceTimer.current = setTimeout(() => {
          fetchSuggestion(contextText, {
            subject: 'Japanese language learning',
            level: 'intermediate',
          });
        }, DEBOUNCE_DELAY);
      });
    });
  }, [editor, fetchSuggestion, clearSuggestion]);
  
  // Accept suggestion
  const acceptSuggestion = useCallback(() => {
    if (!currentSuggestion.current || suggestionNodeKey.current === null) {
      return false;
    }
    
    editor.update(() => {
      const node = $getNodeByKey(suggestionNodeKey.current);
      if (node === null) {
        return;
      }
      
      // Replace suggestion node with actual text
      const textNode = $createTextNode(' ' + currentSuggestion.current);
      node.replace(textNode);
      textNode.selectNext();
      
      // Clear refs
      suggestionNodeKey.current = null;
      currentSuggestion.current = null;
    });
    
    return true;
  }, [editor]);
  
  // Dismiss suggestion
  const dismissSuggestion = useCallback(() => {
    clearSuggestion();
    if (abortController.current) {
      abortController.current.abort();
    }
  }, [clearSuggestion]);
  
  // Keyboard handlers
  useEffect(() => {
    const removeTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        if (acceptSuggestion()) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    
    const removeArrowRight = editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        // Only accept on arrow right if we have a suggestion and at end of text
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection) && currentSuggestion.current) {
            const anchorNode = selection.anchor.getNode();
            const text = anchorNode.getTextContent();
            const offset = selection.anchor.offset;
            
            if (offset === text.length) {
              event.preventDefault();
              acceptSuggestion();
            }
          }
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    
    const removeEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event) => {
        if (currentSuggestion.current) {
          event.preventDefault();
          dismissSuggestion();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    
    const unregisterSuggestion = editor.registerNodeTransform(AIContentSuggestionNode, (node) => {
      const key = node.getKey();
      if (node.__uuid === AI_SUGGESTION_UUID && key !== suggestionNodeKey.current) {
        clearSuggestion();
      }
    });
    
    const unregisterLoading = editor.registerNodeTransform(AILoadingNode, (node) => {
      const key = node.getKey();
      if (node.__uuid === AI_SUGGESTION_UUID && key !== suggestionNodeKey.current) {
        clearSuggestion();
      }
    });
    
    return () => {
      unregisterSuggestion();
      unregisterLoading();
      removeEscape();
    };
  }, [editor, acceptSuggestion, dismissSuggestion]);
  
  // Auto-dismiss on typing
  useEffect(() => {
    return editor.registerNodeTransform(AIContentSuggestionNode, (node) => {
      const key = node.getKey();
      // If different instance of the node exists, clear our reference
      if (node.__uuid === AI_SUGGESTION_UUID && key !== suggestionNodeKey.current) {
        clearSuggestion();
      }
    });
  }, [editor, clearSuggestion]);
  
  return null;
}
