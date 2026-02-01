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
  $setSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { useCallback, useEffect, useState, useRef, useContext } from 'react';
import * as React from 'react';
import { post } from 'aws-amplify/api';

import { 
  $createAIContentSuggestionNode, 
  AIContentSuggestionNode,
  $createAILoadingNode,
  AILoadingNode,
  AI_SUGGESTION_UUID 
} from '../components/AIContentSuggestionNode';
import UnitContext from '../../../context/unitContext';
import { AIFeedback, AiFeedbackType, AiContentType } from '../../../models';

import { fetchAuthSession } from 'aws-amplify/auth';

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
        // Update existing node
        console.log('Updating existing node with key:', suggestionNodeKey.current);
        const node = $getNodeByKey(suggestionNodeKey.current);
        if (node instanceof AIContentSuggestionNode) {
          // Remove old node and create new one to force re-render
          const selectionCopy = selection.clone();
          node.remove();
          const newNode = $createAIContentSuggestionNode(AI_SUGGESTION_UUID, text);
          suggestionNodeKey.current = newNode.getKey();
          selection.insertNodes([newNode]);
          $setSelection(selectionCopy);
        }
      } else {
        // Create new node
        console.log('Creating new suggestion node');
        const selectionCopy = selection.clone();
        const node = $createAIContentSuggestionNode(AI_SUGGESTION_UUID, text);
        suggestionNodeKey.current = node.getKey();
        selection.insertNodes([node]);
        $setSelection(selectionCopy);
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
      
      const selectionCopy = selection.clone();
      const loadingNode = $createAILoadingNode(AI_SUGGESTION_UUID);
      suggestionNodeKey.current = loadingNode.getKey();
      selection.insertNodes([loadingNode]);
      $setSelection(selectionCopy);
    }, { tag: 'skip-collab' });
    
    try {
      const contextData = {
        unit: currentUnit ? {
          name: currentUnit.name,
          description: currentUnit.description,
        } : null,
        ...context,
      };

      console.log('Making API call to completions...');
      
      // Call REST API with streaming support
      const restOperation = post({
        apiName: 'completions',
        path: '/complete',
        options: {
          body: {
            prompt,
            context: contextData,
          },
        },
      });

      const { body } = await restOperation.response;
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let completion = '';

      console.log('Starting to stream response...');
      
      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        completion += chunk;
        
        console.log('Streaming chunk, total length:', completion.length);
        
        // Update suggestion in real-time as we stream
        updateSuggestion(completion);
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
  }, [currentUnit, updateSuggestion, clearSuggestion, editor]);
  
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
