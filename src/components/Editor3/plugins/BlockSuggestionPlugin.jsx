/**
 * @fileoverview BlockSuggestionPlugin - Suggests pedagogically sound block types.
 * 
 * This plugin analyzes the current content structure and suggests relevant block types
 * that should come next based on educational best practices. It uses rule-based patterns
 * to determine what exercises or content blocks would naturally follow.
 * 
 * Pedagogical Patterns:
 * - Heading → Explanation paragraph
 * - Explanation → Example, Practice, or Quiz
 * - Example → Practice or Quiz
 * - Practice → Quiz or Summary
 * - Quiz → Summary or new Heading
 * 
 * @module BlockSuggestionPlugin
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isListNode } from '@lexical/list';
import { useCallback, useEffect, useState, useRef, useContext } from 'react';
import * as React from 'react';
import { post } from 'aws-amplify/api';

import BlockSuggestionMenu from '../components/BlockSuggestionMenu';
import { $isQuizNode, INSERT_QUIZ_COMMAND } from './QuizPlugin';
import { $isAnswerNode, INSERT_ANSWER_BLOCK_COMMAND } from './AnswerPlugin';
import { $isCustomAnswerNode, INSERT_CUSTOM_ANSWER_BLOCK_COMMAND } from './CustomAnswerPlugin';
import UnitContext from '../../../context/unitContext';
import { useSuggestions } from '../context/SuggestionContext';

/**
 * Block type categories for pattern matching
 */
const BLOCK_CATEGORIES = {
  HEADING: 'heading',
  EXPLANATION: 'explanation',
  EXAMPLE: 'example',
  PRACTICE: 'practice',
  QUIZ: 'quiz',
  SUMMARY: 'summary',
};

/**
 * Pedagogical patterns: what blocks typically follow each category
 */
const PEDAGOGICAL_PATTERNS = {
  [BLOCK_CATEGORIES.HEADING]: [
    { type: 'paragraph', label: 'Add Explanation', icon: '📝', category: BLOCK_CATEGORIES.EXPLANATION },
  ],
  [BLOCK_CATEGORIES.EXPLANATION]: [
    { type: 'answer', label: 'Add Vocabulary Practice', icon: '✍️', category: BLOCK_CATEGORIES.PRACTICE },
    { type: 'custom-answer', label: 'Add Custom Practice', icon: '📋', category: BLOCK_CATEGORIES.PRACTICE },
    { type: 'quiz', label: 'Add Quiz', icon: '📊', category: BLOCK_CATEGORIES.QUIZ },
  ],
  [BLOCK_CATEGORIES.EXAMPLE]: [
    { type: 'answer', label: 'Add Vocabulary Practice', icon: '✍️', category: BLOCK_CATEGORIES.PRACTICE },
    { type: 'custom-answer', label: 'Add Custom Practice', icon: '📋', category: BLOCK_CATEGORIES.PRACTICE },
    { type: 'quiz', label: 'Add Quiz', icon: '📊', category: BLOCK_CATEGORIES.QUIZ },
  ],
  [BLOCK_CATEGORIES.PRACTICE]: [
    { type: 'quiz', label: 'Add Quiz', icon: '📊', category: BLOCK_CATEGORIES.QUIZ },
    { type: 'paragraph', label: 'Add Summary', icon: '📄', category: BLOCK_CATEGORIES.SUMMARY },
    { type: 'heading', label: 'New Section', icon: '📑', category: BLOCK_CATEGORIES.HEADING },
  ],
  [BLOCK_CATEGORIES.QUIZ]: [
    { type: 'paragraph', label: 'Add Summary', icon: '📄', category: BLOCK_CATEGORIES.SUMMARY },
    { type: 'heading', label: 'New Section', icon: '📑', category: BLOCK_CATEGORIES.HEADING },
  ],
  [BLOCK_CATEGORIES.SUMMARY]: [
    { type: 'heading', label: 'New Section', icon: '📑', category: BLOCK_CATEGORIES.HEADING },
  ],
  default: [
    { type: 'heading', label: 'Add Heading', icon: '📑', category: BLOCK_CATEGORIES.HEADING },
    { type: 'paragraph', label: 'Add Explanation', icon: '📝', category: BLOCK_CATEGORIES.EXPLANATION },
  ],
};

/**
 * Categorizes a Lexical node into a pedagogical block category
 */
function categorizeNode(node) {
  if (!node) return null;
  
  if ($isHeadingNode(node)) {
    return BLOCK_CATEGORIES.HEADING;
  }
  
  if ($isQuizNode(node)) {
    return BLOCK_CATEGORIES.QUIZ;
  }
  
  if ($isAnswerNode(node) || $isCustomAnswerNode(node)) {
    return BLOCK_CATEGORIES.PRACTICE;
  }
  
  if ($isListNode(node)) {
    return BLOCK_CATEGORIES.EXAMPLE;
  }
  
  // Heuristic: short paragraphs (< 100 chars) might be examples
  if (node.getType() === 'paragraph') {
    const text = node.getTextContent();
    if (text.length < 100) {
      return BLOCK_CATEGORIES.EXAMPLE;
    }
    
    // Look for summary keywords
    const summaryKeywords = ['summary', 'conclusion', 'in summary', 'to recap', 'in conclusion'];
    const lowerText = text.toLowerCase();
    if (summaryKeywords.some(kw => lowerText.includes(kw))) {
      return BLOCK_CATEGORIES.SUMMARY;
    }
    
    return BLOCK_CATEGORIES.EXPLANATION;
  }
  
  return null;
}

/**
 * Gets block suggestions based on the previous block's category
 */
function getSuggestions(previousCategory) {
  if (!previousCategory || !PEDAGOGICAL_PATTERNS[previousCategory]) {
    return PEDAGOGICAL_PATTERNS.default;
  }
  
  return PEDAGOGICAL_PATTERNS[previousCategory];
}

/**
 * Analyzes editor content to determine what block should come next
 */
function $analyzePreviousBlocks() {
  const selection = $getSelection();
  
  if (!$isRangeSelection(selection)) {
    return null;
  }
  
  const anchorNode = selection.anchor.getNode();
  let currentBlock = anchorNode.getType() === 'text' 
    ? anchorNode.getParent() 
    : anchorNode;
  
  // Find the previous sibling block
  let previousBlock = currentBlock?.getPreviousSibling();
  
  // Skip empty paragraphs
  while (previousBlock && previousBlock.getType() === 'paragraph' && previousBlock.getTextContent().trim() === '') {
    previousBlock = previousBlock.getPreviousSibling();
  }
  
  if (!previousBlock) {
    // At the start of the document
    return { category: null, suggestions: PEDAGOGICAL_PATTERNS.default };
  }
  
  const category = categorizeNode(previousBlock);
  const suggestions = getSuggestions(category);
  
  return { category, suggestions };
}

/**
 * Main plugin component
 * @param {Object} props
 * @param {boolean} props.useAI - Enable AI-powered suggestions with reasoning
 */
export default function BlockSuggestionPlugin({ useAI = false }) {
  const [editor] = useLexicalComposerContext();
  // Use suggestion context instead of local state
  const { suggestions, setSuggestions, isLoadingAI, setIsLoadingAI, registerInsertCallback } = useSuggestions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [anchorElement, setAnchorElement] = useState(null);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const aiRequestTimer = useRef(null);
  const abortController = useRef(null);
  const lastAIRequestTime = useRef(0);
  const isDragging = useRef(false);
  const AI_COOLDOWN_MS = 5000; // 5 second cooldown between automatic AI suggestions
  
  const { currentUnit } = useContext(UnitContext);
  
  // Fetch AI-powered suggestions
  const fetchAISuggestions = useCallback(async (forceRequest = false) => {
    if (!useAI) return null;
    
    // Check cooldown (skip for manual requests)
    const now = Date.now();
    if (!forceRequest && (now - lastAIRequestTime.current < AI_COOLDOWN_MS)) {
      console.log('AI request throttled, cooldown active');
      return null;
    }
    
    // Cancel any in-flight requests
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    setIsLoadingAI(true);
    lastAIRequestTime.current = now;
    
    try {
      // Extract unit structure
      const structure = editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        return children.map(node => {
          const textContent = node.getTextContent?.() || '';
          return {
            type: categorizeNode(node) || node.getType(),
            content: typeof textContent === 'string' ? textContent.substring(0, 200) : '',
          };
        });
      });
      
      const lastBlock = structure[structure.length - 1];
      
      // Call REST API
      const restOperation = post({
        apiName: 'completions',
        path: '/suggest-block',
        options: {
          body: {
            unitStructure: structure,
            currentContext: {
              position: 'End of lesson',
              lastBlockType: lastBlock?.type,
              lastBlockContent: lastBlock?.content,
            },
            userHistory: [], // TODO: Track user's preferred patterns
            forceNew: forceRequest, // Tell backend to generate fresh suggestions
          },
        },
      });
      
      const { body } = await restOperation.response;
      const text = await body.text();
      const data = JSON.parse(text);
      setIsLoadingAI(false);
      
      // Add confidence scores if not present (mock for demo)
      const enrichedSuggestions = (data.suggestions || []).map(s => ({
        ...s,
        confidence: s.confidence || Math.random() * 0.4 + 0.6, // 0.6-1.0 range
      }));
      
      return enrichedSuggestions;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching AI suggestions:', error);
        setIsLoadingAI(false);
      }
      return null;
    }
  }, [editor, useAI, setIsLoadingAI]);
  
  // Update suggestions when selection changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      // Don't show suggestions if user hasn't typed yet or is dragging
      if (!userHasTyped || isDragging.current) {
        return;
      }
      
      editorState.read(() => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection)) {
          setSuggestions(null);
          return;
        }
        
        const anchorNode = selection.anchor.getNode();
        let currentBlock = anchorNode.getType() === 'text' 
          ? anchorNode.getParent() 
          : anchorNode;
        
        // Only show suggestions on empty paragraph blocks at the end
        if (currentBlock && currentBlock.getType() === 'paragraph') {
          const text = currentBlock.getTextContent().trim();
          const isAtEnd = selection.anchor.offset === currentBlock.getTextContentSize();
          
          // ONLY show suggestions if we're on a completely empty paragraph
          if (text === '' && isAtEnd) {
            // Get rule-based analysis synchronously (inside read block)
            const analysis = $analyzePreviousBlocks();
            
            // Try AI suggestions first if enabled
            if (useAI) {
              // Debounce AI requests
              if (aiRequestTimer.current) {
                clearTimeout(aiRequestTimer.current);
              }
              
              aiRequestTimer.current = setTimeout(async () => {
                const aiSuggestions = await fetchAISuggestions(false); // false = respect cooldown
                
                if (aiSuggestions && aiSuggestions.length > 0) {
                  setSuggestions(aiSuggestions);
                  setSelectedIndex(0);
                  return;
                }
                
                // Fallback to rule-based if AI fails
                if (analysis) {
                  setSuggestions(analysis.suggestions);
                  setSelectedIndex(0);
                }
              }, 1000); // 1 second debounce for AI (longer than before)
              
              return;
            }
            
            // Use rule-based suggestions immediately
            if (analysis) {
              setSuggestions(analysis.suggestions);
              setSelectedIndex(0);
              return;
            }
          }
        }
        
        setSuggestions(null);
      });
    });
  }, [editor, useAI, fetchAISuggestions]);
  
  // // Get anchor element for menu positioning
  // useEffect(() => {
  //   return editor.registerUpdateListener(() => {
  //     editor.getEditorState().read(() => {
  //       const selection = $getSelection();
        
  //       if ($isRangeSelection(selection)) {
  //         const nativeSelection = window.getSelection();
  //         if (nativeSelection && nativeSelection.rangeCount > 0) {
  //           const range = nativeSelection.getRangeAt(0);
  //           setAnchorElement(range);
  //         }
  //       }
  //     });
  //   });
  // }, [editor]);
  
  // Handle keyboard navigation
  const handleKeyCommand = useCallback((event, command) => {
    if (!suggestions || suggestions.length === 0) return false;
    
    switch (command) {
      case KEY_ARROW_DOWN_COMMAND:
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return true;
        
      case KEY_ARROW_UP_COMMAND:
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return true;
        
      case KEY_TAB_COMMAND:
      case KEY_ENTER_COMMAND:
        event.preventDefault();
        insertSelectedBlock();
        return true;
        
      case KEY_ESCAPE_COMMAND:
        event.preventDefault();
        setSuggestions(null);
        return true;
        
      default:
        return false;
    }
  }, [suggestions, selectedIndex]);
  
  // Track drag operations and user typing
  useEffect(() => {
    return mergeRegister(
      // Track drag operations
      editor.registerCommand(
        DRAGOVER_COMMAND,
        () => {
          isDragging.current = true;
          setSuggestions(null);
          return false; // Don't prevent default
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        () => {
          isDragging.current = false;
          return false; // Don't prevent default
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Track when user types to enable suggestions
      editor.registerTextContentListener(() => {
        if (!isDragging.current) {
          setUserHasTyped(true);
        }
      }),
    );
  }, [editor, setSuggestions]);
  
  useEffect(() => {
    if (!suggestions) return;
    
    return mergeRegister(
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, (event) => handleKeyCommand(event, KEY_ARROW_DOWN_COMMAND), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, (event) => handleKeyCommand(event, KEY_ARROW_UP_COMMAND), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_TAB_COMMAND, (event) => handleKeyCommand(event, KEY_TAB_COMMAND), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ENTER_COMMAND, (event) => handleKeyCommand(event, KEY_ENTER_COMMAND), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, (event) => handleKeyCommand(event, KEY_ESCAPE_COMMAND), COMMAND_PRIORITY_LOW),
    );
  }, [editor, suggestions, handleKeyCommand]);
  
  const insertSelectedBlock = useCallback(() => {
    if (!suggestions || selectedIndex >= suggestions.length) return;
    
    const selected = suggestions[selectedIndex];
    
    editor.update(() => {
      switch (selected.type) {
        case 'quiz':
          editor.dispatchCommand(INSERT_QUIZ_COMMAND, null);
          break;
          
        case 'answer':
          editor.dispatchCommand(INSERT_ANSWER_BLOCK_COMMAND, {
            wordIDs: [],
            requestDefinition: 'translation',
            allowedInput: ['text'],
            promptMethod: ['phrase'],
          });
          break;
          
        case 'custom-answer':
          editor.dispatchCommand(INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, null);
          break;
          
        case 'heading':
          // Insert a heading node
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode();
              const parent = anchorNode.getParent();
              if (parent) {
                parent.selectEnd();
              }
            }
          });
          break;
          
        case 'paragraph':
          // Just let the user type
          break;
          
        default:
          console.warn('Unknown block type:', selected.type);
      }
      
      setSuggestions(null);
    });
  }, [editor, suggestions, selectedIndex, setSuggestions]);
  
  // Register the insert callback with the context so the sidebar can use it
  useEffect(() => {
    if (registerInsertCallback) {
      // Provide both insert and manual AI request functions
      registerInsertCallback(
        // Insert callback
        (suggestion) => {
          editor.update(() => {
            switch (suggestion.type) {
              case 'quiz':
                editor.dispatchCommand(INSERT_QUIZ_COMMAND, null);
                break;
                
              case 'answer':
                editor.dispatchCommand(INSERT_ANSWER_BLOCK_COMMAND, {
                  wordIDs: [],
                  requestDefinition: 'translation',
                  allowedInput: ['text'],
                  promptMethod: ['phrase'],
                });
                break;
                
              case 'custom-answer':
                editor.dispatchCommand(INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, null);
                break;
                
              case 'heading':
                editor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    const anchorNode = selection.anchor.getNode();
                    const parent = anchorNode.getParent();
                    if (parent) {
                      parent.selectEnd();
                    }
                  }
                });
                break;
                
              case 'paragraph':
                // Just let the user type
                break;
                
              default:
                console.warn('Unknown block type:', suggestion.type);
            }
            
            setSuggestions(null);
          });
        },
        // Manual AI request callback
        async () => {
          if (useAI) {
            const aiSuggestions = await fetchAISuggestions(true); // true = force, ignore cooldown
            if (aiSuggestions && aiSuggestions.length > 0) {
              setSuggestions(aiSuggestions);
              setSelectedIndex(0);
            }
          }
        }
      );
    }
  }, [registerInsertCallback, editor, setSuggestions, useAI, fetchAISuggestions]);
  
  const handleSuggestionClick = useCallback((index) => {
    setSelectedIndex(index);
    insertSelectedBlock();
  }, [insertSelectedBlock]);
  
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
return null;  
  // return (
  //   <BlockSuggestionMenu
  //     suggestions={suggestions}
  //     selectedIndex={selectedIndex}
  //     onSelect={handleSuggestionClick}
  //     anchorElement={anchorElement}
  //     isLoadingAI={isLoadingAI}
  //     useAI={useAI}
  //   />
  // );
}
