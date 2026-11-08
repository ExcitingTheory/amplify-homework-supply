/**
 * @fileoverview AIContentCompletionPlugin - AI-powered content completion.
 * 
 * Similar to GitHub Copilot, this plugin suggests complete sentences/paragraphs
 * as you type. It uses GPT-4 to intelligently continue your content based on
 * the current context.
 * 
 * Features:
 * - Triggers once the current block has a few words (no punctuation required)
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
import { $replaceWithMarkdown } from '../utils/insertMarkdown';
import {
  buildSuggestionReferenceCatalog,
  placeMeaningAfterWordBlocks,
  resolveSuggestionReferences,
} from './suggestionReferences';
import UnitContext from '../../../context/unitContext';
import SectionContext from '../../../context/sectionContext';
import SettingsContext from '../../../context/settingsContext';



const DEBOUNCE_DELAY = 800; // ms - wait for user to stop typing
const MIN_WORDS = 3; // words in the current block before suggesting
const ACCEPT_TAG = 'ai-completion-accept';

const wordSegmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'word' })
    : null;

/**
 * Counts words in a block. Uses Intl.Segmenter so unspaced scripts
 * (e.g. Japanese) are counted correctly; falls back to whitespace splitting.
 */
function countWords(text) {
  if (!text) return 0;
  if (wordSegmenter) {
    let count = 0;
    for (const { isWordLike } of wordSegmenter.segment(text)) {
      if (isWordLike) count++;
    }
    return count;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Main plugin component
 */
export default function AIContentCompletionPlugin() {
  const { settings, isLoading } = useContext(SettingsContext) || {};
  const enabled = React.useMemo(() => {
    try {
      const metadata = typeof settings?.metadata === 'string'
        ? JSON.parse(settings.metadata) : settings?.metadata;
      return metadata?.aiAutocompleteEnabled !== false;
    } catch (error) {
      console.error('[AIContentCompletionPlugin] Invalid settings metadata:', error);
      return true;
    }
  }, [settings?.metadata]);
  return enabled && !isLoading ? React.createElement(AIContentCompletion) : null;
}

function AIContentCompletion() {
  const [editor] = useLexicalComposerContext();
  const suggestionNodeKey = useRef(null);
  const currentSuggestion = useRef(null);
  const suggestionReferences = useRef({});
  const suggestionFiles = useRef({});
  const suggestionQuestions = useRef({});
  const suggestionPreviewContext = useRef(null);
  const [lastAcceptedSuggestion, setLastAcceptedSuggestion] = useState(null); // Track for feedback
  const debounceTimer = useRef(null);
  const abortController = useRef(null);
  
  const {
    unit: currentUnit,
    dictionary,
    questionBank,
    files,
  } = useContext(UnitContext);
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
          const outline = typeof section.courseOutline === 'string'
            ? JSON.parse(section.courseOutline)
            : section.courseOutline;
          if (!Array.isArray(outline)) return null;
          return outline.map((entry) => ({
            number: entry.number,
            name: entry.name,
            summary: entry.summary,
            isCurrent: entry.unitId === currentUnit.id,
          }));
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
      suggestionReferences.current = {};
      suggestionFiles.current = {};
      suggestionQuestions.current = {};
      suggestionPreviewContext.current = null;
    }, { tag: 'skip-collab' });
  }, [editor]);

  useEffect(() => () => {
    clearTimeout(debounceTimer.current);
    abortController.current?.abort();
    clearSuggestion();
  }, [clearSuggestion]);

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
          node.setSuggestion(text, suggestionPreviewContext.current);
        } else if (node !== null && node.isAttached()) {
          // Replace loading node (or other node type) with suggestion node
          console.log('Replacing existing node with suggestion');
          const newNode = $createAIContentSuggestionNode(AI_SUGGESTION_UUID, text, suggestionPreviewContext.current);
          node.replace(newNode);
          suggestionNodeKey.current = newNode.getKey();
        }
      } else {
        // Create new node after the anchor (does not affect selection)
        console.log('Creating new suggestion node');
        const anchorNode = selection.anchor.getNode();
        const node = $createAIContentSuggestionNode(AI_SUGGESTION_UUID, text, suggestionPreviewContext.current);
        suggestionNodeKey.current = node.getKey();
        anchorNode.insertAfter(node);
      }
      
      currentSuggestion.current = text;
    }, { tag: 'skip-collab' });
  }, [editor]);

  // Fetch AI suggestion
  const fetchSuggestion = useCallback(async (prompt, context) => {
    console.log('fetchSuggestion called with prompt:', prompt);
    const catalog = buildSuggestionReferenceCatalog(
      dictionary,
      questionBank,
      files,
      prompt,
    );
    suggestionReferences.current = catalog.idByReference;
    suggestionFiles.current = catalog.fileById;
    suggestionQuestions.current = catalog.questionById;
    suggestionPreviewContext.current = {
      idByReference: catalog.idByReference,
      fileById: catalog.fileById,
      questionById: catalog.questionById,
    };
    
    // Cancel any in-flight requests
    if (abortController.current) {
      abortController.current.abort();
    }
    
    const controller = new AbortController();
    abortController.current = controller;
    
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
          name: currentUnit.name,
          description: currentUnit.description,
        } : null,
        // Draft headings from current editor state (not persisted)
        draftHeadings: draftHeadings.length > 0 ? draftHeadings : undefined,
        // Course outline from section (published unit summaries)
        courseOutline: courseOutline || undefined,
        ...context,
        resources: catalog.resources,
      };

      console.log('Making API call to /api/content-completion...');
      
      // Call local Route Handler (no Lambda cold start)
      const response = await fetch('/api/content-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt,
          context: contextData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Content completion failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Content completion response has no body');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completion = '';

      console.log('Starting to stream response...');
      
      // The route returns toTextStreamResponse(): raw UTF-8 text deltas.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) return;
        
        completion += decoder.decode(value, { stream: true });
        
        if (completion) {
          console.log('Streaming chunk, total length:', completion.length);
          // Update suggestion in real-time as we stream
          updateSuggestion(completion);
        }
      }
      completion += decoder.decode();
      if (controller.signal.aborted) return;
      
      if (!completion.trim()) {
        throw new Error('No completion returned');
      }
      
      console.log('Final completion:', completion);
      updateSuggestion(placeMeaningAfterWordBlocks(completion.trim()));
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestion:', error);
        clearSuggestion();
      }
    }
  }, [
    currentUnit,
    courseOutline,
    dictionary,
    questionBank,
    files,
    updateSuggestion,
    clearSuggestion,
    editor,
  ]);
  
  // Detect when to trigger suggestions
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      // Ignore updates from our own operations and history
      if (tags && (tags.has('skip-collab') || tags.has('historic') || tags.has('history-push') || tags.has(ACCEPT_TAG))) {
        return;
      }

      // Any user edit invalidates a pending request or visible suggestion
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      clearSuggestion();

      editorState.read(() => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return;
        }
        
        const anchorNode = selection.anchor.getNode();
        const text = anchorNode.getTextContent();
        const offset = selection.anchor.offset;
        
        // Only trigger if we're at the end of a text node
        if (offset !== text.length) {
          return;
        }
        
        // Get parent block context
        const parent = anchorNode.getParent();
        if (!parent || $isHeadingNode(parent)) {
          // Don't suggest in headings
          return;
        }
        
        // Trigger once the block has a couple of words, regardless of punctuation
        const fullText = parent.getTextContent();
        if (countWords(fullText) < MIN_WORDS) {
          return;
        }
        
        // Get preceding text for context (last 200 chars)
        const contextLength = Math.min(200, fullText.length);
        const contextText = fullText.slice(-contextLength);
        
        debounceTimer.current = setTimeout(() => {
          debounceTimer.current = null;
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
      
      // Suggestions can continue mid-sentence, so only add a separating space when needed
      const suggestion = currentSuggestion.current;
      const previousText = node.getPreviousSibling()?.getTextContent() ?? '';
      const needsSpace =
        previousText.length > 0 &&
        !/[\s\u3000-\u303f\u3040-\u30ff\u4e00-\u9fff]$/.test(previousText) &&
        !/^[\s.,!?;:)\]。、！？]/.test(suggestion);

      // Render the markdown into real nodes; surrounding whitespace is kept
      // outside the parser because markdown parsing would trim it.
      const leadingWhitespace = suggestion.match(/^\s*/)[0];
      let resolvedMarkdown;
      try {
        resolvedMarkdown = resolveSuggestionReferences(
          suggestion.slice(leadingWhitespace.length),
          suggestionReferences.current,
          suggestionFiles.current,
          suggestionQuestions.current,
        );
      } catch (error) {
        console.error("[AIContentCompletionPlugin] Rejected invalid block reference:", error);
        node.remove();
        suggestionNodeKey.current = null;
        currentSuggestion.current = null;
        suggestionReferences.current = {};
        suggestionFiles.current = {};
        suggestionQuestions.current = {};
        return;
      }
      $replaceWithMarkdown(
        node,
        resolvedMarkdown,
        leadingWhitespace || (needsSpace ? ' ' : ''),
        {
          fileById: suggestionFiles.current,
          questionById: suggestionQuestions.current,
        },
      );
      
      // Clear refs
      suggestionNodeKey.current = null;
      currentSuggestion.current = null;
      suggestionReferences.current = {};
      suggestionFiles.current = {};
      suggestionQuestions.current = {};
    }, { tag: ACCEPT_TAG });
    
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
      removeTab();
      removeArrowRight();
      removeEscape();
    };
  }, [editor, acceptSuggestion, dismissSuggestion, clearSuggestion]);
  
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
