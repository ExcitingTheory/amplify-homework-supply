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
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { useCallback, useEffect, useState, useRef, useContext } from 'react';
import * as React from 'react';
import { post } from 'aws-amplify/api';

import AIContentSuggestion from '../components/AIContentSuggestion';
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
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [anchorElement, setAnchorElement] = useState(null);
  const [lastAcceptedSuggestion, setLastAcceptedSuggestion] = useState(null); // Track for feedback
  const debounceTimer = useRef(null);
  const abortController = useRef(null);
  
  const { currentUnit } = useContext(UnitContext);
  
  // Fetch AI suggestion
  const fetchSuggestion = useCallback(async (prompt, context) => {
    // Cancel any in-flight requests
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    setIsLoading(true);
    setSuggestion(null);
    
    try {
      const contextData = {
        unit: currentUnit ? {
          name: currentUnit.name,
          description: currentUnit.description,
        } : null,
        ...context,
      };

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

      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        completion += chunk;
        
        // Update suggestion in real-time as we stream
        setSuggestion(completion);
      }
      
      if (!completion) {
        throw new Error('No completion returned');
      }
      
      setSuggestion(completion.trim());
      setIsLoading(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestion:', error);
        setIsLoading(false);
      }
    }
  }, [currentUnit]);
  
  // Detect when to trigger suggestions
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection)) {
          setSuggestion(null);
          return;
        }
        
        const anchorNode = selection.anchor.getNode();
        const text = anchorNode.getTextContent();
        const offset = selection.anchor.offset;
        
        // Only trigger if we're at the end of a text node
        if (offset !== text.length) {
          setSuggestion(null);
          return;
        }
        
        // Check if text is long enough and ends with punctuation
        const lastChar = text[text.length - 1];
        const shouldTrigger = 
          text.length >= MIN_CONTENT_LENGTH &&
          TRIGGER_CHARS.includes(lastChar);
        
        if (!shouldTrigger) {
          setSuggestion(null);
          return;
        }
        
        // Get parent block context
        const parent = anchorNode.getParent();
        if (!parent || $isHeadingNode(parent)) {
          // Don't suggest in headings
          setSuggestion(null);
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
  }, [editor, fetchSuggestion]);
  
  // Get anchor element for positioning
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
          const nativeSelection = window.getSelection();
          if (nativeSelection && nativeSelection.rangeCount > 0) {
            const range = nativeSelection.getRangeAt(0);
            setAnchorElement(range);
          }
        }
      });
    });
  }, [editor]);
  
  // Accept suggestion
  const acceptSuggestion = useCallback(() => {
    if (!suggestion) return;
    
    editor.update(() => {
      const selection = $getSelection();
      
      if ($isRangeSelection(selection)) {
        // Insert a space before the suggestion
        const textNode = $createTextNode(' ' + suggestion);
        selection.insertNodes([textNode]);
      }
      
      setSuggestion(null);
    });
  }, [editor, suggestion]);
  
  // Dismiss suggestion
  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
    if (abortController.current) {
      abortController.current.abort();
    }
  }, []);
  
  // Keyboard handlers
  useEffect(() => {
    if (!suggestion) return;
    
    const removeTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        event.preventDefault();
        acceptSuggestion();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
    
    const removeArrowRight = editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        // Only accept on arrow right if at end of text
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const text = anchorNode.getTextContent();
          const offset = selection.anchor.offset;
          
          if (offset === text.length) {
            event.preventDefault();
            acceptSuggestion();
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    
    const removeEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event) => {
        event.preventDefault();
        dismissSuggestion();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
    
    return () => {
      removeTab();
      removeArrowRight();
      removeEscape();
    };
  }, [editor, suggestion, acceptSuggestion, dismissSuggestion]);
  
  // Dismiss on typing
  useEffect(() => {
    if (!suggestion) return;
    
    const handleKeyDown = (event) => {
      // Dismiss if user types anything other than acceptance keys
      if (event.key !== 'Tab' && event.key !== 'ArrowRight' && event.key !== 'Escape') {
        dismissSuggestion();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestion, dismissSuggestion]);
  
  if (!suggestion && !isLoading) {
    return null;
  }
  
  return (
    <AIContentSuggestion
      suggestion={suggestion}
      isLoading={isLoading}
      anchorElement={anchorElement}
      onAccept={acceptSuggestion}
      onDismiss={dismissSuggestion}
    />
  );
}
