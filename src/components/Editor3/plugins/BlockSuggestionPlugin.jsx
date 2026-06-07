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

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
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
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $isHeadingNode, $createHeadingNode } from "@lexical/rich-text";
import { $isListNode } from "@lexical/list";
import { $createTextNode, $createParagraphNode } from "lexical";
import { useCallback, useEffect, useState, useRef, useContext } from "react";
import * as React from "react";

import BlockSuggestionMenu from "../components/BlockSuggestionMenu";
import { $isQuizNode, INSERT_QUIZ_COMMAND } from "./QuizPlugin";
import { $isAnswerNode, INSERT_ANSWER_BLOCK_COMMAND } from "./AnswerPlugin";
import {
  $isCustomAnswerNode,
  INSERT_CUSTOM_ANSWER_BLOCK_COMMAND,
} from "./CustomAnswerPlugin";
import { INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND } from "./MeaningAssociationPlugin";
import UnitContext from "../../../context/unitContext";
import { useSuggestions } from "../context/SuggestionContext";

/**
 * Block type categories for pattern matching
 */
const BLOCK_CATEGORIES = {
  HEADING: "heading",
  EXPLANATION: "explanation",
  EXAMPLE: "example",
  PRACTICE: "practice",
  QUIZ: "quiz",
  SUMMARY: "summary",
};

/**
 * Pedagogical patterns: what blocks typically follow each category
 */
const PEDAGOGICAL_PATTERNS = {
  [BLOCK_CATEGORIES.HEADING]: [
    {
      type: "paragraph",
      label: "Add Explanation",
      icon: "📝",
      category: BLOCK_CATEGORIES.EXPLANATION,
    },
  ],
  [BLOCK_CATEGORIES.EXPLANATION]: [
    {
      type: "answer",
      label: "Add Vocabulary Practice",
      icon: "✍️",
      category: BLOCK_CATEGORIES.PRACTICE,
    },
    {
      type: "custom-answer",
      label: "Add Custom Practice",
      icon: "📋",
      category: BLOCK_CATEGORIES.PRACTICE,
    },
    {
      type: "quiz",
      label: "Add Quiz",
      icon: "📊",
      category: BLOCK_CATEGORIES.QUIZ,
    },
  ],
  [BLOCK_CATEGORIES.EXAMPLE]: [
    {
      type: "answer",
      label: "Add Vocabulary Practice",
      icon: "✍️",
      category: BLOCK_CATEGORIES.PRACTICE,
    },
    {
      type: "custom-answer",
      label: "Add Custom Practice",
      icon: "📋",
      category: BLOCK_CATEGORIES.PRACTICE,
    },
    {
      type: "quiz",
      label: "Add Quiz",
      icon: "📊",
      category: BLOCK_CATEGORIES.QUIZ,
    },
  ],
  [BLOCK_CATEGORIES.PRACTICE]: [
    {
      type: "quiz",
      label: "Add Quiz",
      icon: "📊",
      category: BLOCK_CATEGORIES.QUIZ,
    },
    {
      type: "paragraph",
      label: "Add Summary",
      icon: "📄",
      category: BLOCK_CATEGORIES.SUMMARY,
    },
    {
      type: "heading",
      label: "New Section",
      icon: "📑",
      category: BLOCK_CATEGORIES.HEADING,
    },
  ],
  [BLOCK_CATEGORIES.QUIZ]: [
    {
      type: "paragraph",
      label: "Add Summary",
      icon: "📄",
      category: BLOCK_CATEGORIES.SUMMARY,
    },
    {
      type: "heading",
      label: "New Section",
      icon: "📑",
      category: BLOCK_CATEGORIES.HEADING,
    },
  ],
  [BLOCK_CATEGORIES.SUMMARY]: [
    {
      type: "heading",
      label: "New Section",
      icon: "📑",
      category: BLOCK_CATEGORIES.HEADING,
    },
  ],
  default: [
    {
      type: "heading",
      label: "Add Heading",
      icon: "📑",
      category: BLOCK_CATEGORIES.HEADING,
    },
    {
      type: "paragraph",
      label: "Add Explanation",
      icon: "📝",
      category: BLOCK_CATEGORIES.EXPLANATION,
    },
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
  if (node.getType() === "paragraph") {
    const text = node.getTextContent();
    if (text.length < 100) {
      return BLOCK_CATEGORIES.EXAMPLE;
    }

    // Look for summary keywords
    const summaryKeywords = [
      "summary",
      "conclusion",
      "in summary",
      "to recap",
      "in conclusion",
    ];
    const lowerText = text.toLowerCase();
    if (summaryKeywords.some((kw) => lowerText.includes(kw))) {
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
  let currentBlock =
    anchorNode.getType() === "text" ? anchorNode.getParent() : anchorNode;

  // Find the previous sibling block
  let previousBlock = currentBlock?.getPreviousSibling();

  // Skip empty paragraphs
  while (
    previousBlock &&
    previousBlock.getType() === "paragraph" &&
    previousBlock.getTextContent().trim() === ""
  ) {
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
  const {
    suggestions,
    setSuggestions,
    isLoadingAI,
    setIsLoadingAI,
    registerInsertCallback,
  } = useSuggestions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [anchorElement, setAnchorElement] = useState(null);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const aiRequestTimer = useRef(null);
  const abortController = useRef(null);
  const lastAIRequestTime = useRef(0);
  const isDragging = useRef(false);
  const AI_COOLDOWN_MS = 5000; // 5 second cooldown between automatic AI suggestions

  const { currentUnit, dictionary, questionBank } = useContext(UnitContext);

  // Fetch AI-powered suggestions from /suggest-blocks SSE endpoint
  const fetchAISuggestions = useCallback(
    async (forceRequest = false) => {
      if (!useAI) return null;

      // Check cooldown (skip for manual requests)
      const now = Date.now();
      if (!forceRequest && now - lastAIRequestTime.current < AI_COOLDOWN_MS) {
        console.log("AI request throttled, cooldown active");
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

          return children.map((node) => {
            const textContent = node.getTextContent?.() || "";
            return {
              type: categorizeNode(node) || node.getType(),
              content:
                typeof textContent === "string"
                  ? textContent.substring(0, 200)
                  : "",
            };
          });
        });

        const lastBlock = structure[structure.length - 1];

        // Call local /api/suggest-blocks Route Handler (no Lambda cold start)
        const dictArray = dictionary ? Object.values(dictionary) : [];
        const questionsArray = questionBank ? Object.values(questionBank) : [];

        const response = await fetch("/api/suggest-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unitStructure: structure,
            currentContext: {
              position: "End of lesson",
              lastBlockType: lastBlock?.type,
              lastBlockContent: lastBlock?.content,
            },
            dictionary: dictArray.map((w) => ({
              id: w.id,
              phrase: w.phrase || w.word,
              definition: w.definition,
              phonetic: w.phonetic,
            })),
            questionBank: questionsArray.map((q) => ({
              id: q.id,
              question: q.question,
              type: q.type,
            })),
          }),
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          console.error("[SuggestBlocks] Response error:", response.status);
          setIsLoadingAI(false);
          return null;
        }

        // Parse AI SDK data stream protocol from toDataStreamResponse()
        // Format: each line is TYPE_CODE:JSON_PAYLOAD\n
        // 9: = tool result, b: = tool call, 0: = text chunk, d: = finish
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const toolResults = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines (AI SDK data stream uses \n delimiter)
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line) continue;
            // AI SDK data stream: "9:{...}" for tool results
            if (line.startsWith("9:")) {
              try {
                const result = JSON.parse(line.slice(2));
                toolResults.push(result);
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }

        setIsLoadingAI(false);

        if (toolResults.length > 0) {
          // Each tool result is a block suggestion from one of the insert_* tools
          // Format: { toolCallId, toolName, args, result: { success, action, blockType, blockData, preview, reasoning, message } }
          const suggestions = toolResults
            .filter(
              (tr) =>
                tr.result?.success &&
                tr.result?.action === "insert_editor_block",
            )
            .map((tr) => ({
              blockType: tr.result.blockType,
              blockData: tr.result.blockData,
              preview: tr.result.preview,
              reasoning: tr.result.reasoning,
              message: tr.result.message,
            }));

          if (suggestions.length > 0) {
            // Enrich suggestions with resolved preview data from local context
            return suggestions.map((s) => {
              const enriched = {
                ...s,
                confidence: s.confidence || 0.8,
              };

              // Resolve IDs to actual data for preview rendering
              if (s.blockData) {
                const bd = s.blockData;
                if (bd.wordIDs && dictionary) {
                  enriched.resolvedWords = bd.wordIDs
                    .map((id) => dictionary[id])
                    .filter(Boolean);
                }
                if (bd.questionIDs && questionBank) {
                  enriched.resolvedQuestions = bd.questionIDs
                    .map((id) => questionBank[id])
                    .filter(Boolean);
                }
              }

              return enriched;
            });
          }
        }

        return null;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            "[SuggestBlocks] Error fetching AI suggestions:",
            error,
          );
          setIsLoadingAI(false);
        }
        return null;
      }
    },
    [editor, useAI, setIsLoadingAI, dictionary, questionBank],
  );

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
        let currentBlock =
          anchorNode.getType() === "text" ? anchorNode.getParent() : anchorNode;

        // Only show suggestions on empty paragraph blocks at the end
        if (currentBlock && currentBlock.getType() === "paragraph") {
          const text = currentBlock.getTextContent().trim();
          const isAtEnd =
            selection.anchor.offset === currentBlock.getTextContentSize();

          // ONLY show suggestions if we're on a completely empty paragraph
          if (text === "" && isAtEnd) {
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
  const handleKeyCommand = useCallback(
    (event, command) => {
      if (!suggestions || suggestions.length === 0) return false;

      switch (command) {
        case KEY_ARROW_DOWN_COMMAND:
          event.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          return true;

        case KEY_ARROW_UP_COMMAND:
          event.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + suggestions.length) % suggestions.length,
          );
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
    },
    [suggestions, selectedIndex],
  );

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
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => handleKeyCommand(event, KEY_ARROW_DOWN_COMMAND),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => handleKeyCommand(event, KEY_ARROW_UP_COMMAND),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => handleKeyCommand(event, KEY_TAB_COMMAND),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => handleKeyCommand(event, KEY_ENTER_COMMAND),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        (event) => handleKeyCommand(event, KEY_ESCAPE_COMMAND),
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, suggestions, handleKeyCommand]);

  const insertSelectedBlock = useCallback(() => {
    if (!suggestions || selectedIndex >= suggestions.length) return;

    const selected = suggestions[selectedIndex];
    dispatchBlockInsert(selected);
    setSuggestions(null);
  }, [editor, suggestions, selectedIndex, setSuggestions]);

  /**
   * Dispatch the appropriate Lexical command for a suggestion, using blockData when available.
   */
  const dispatchBlockInsert = useCallback(
    (suggestion) => {
      const bd = suggestion.blockData || {};

      editor.update(() => {
        const selection = $getSelection();

        switch (suggestion.type) {
          case "quiz":
            editor.dispatchCommand(INSERT_QUIZ_COMMAND, bd.questionIDs || null);
            break;

          case "answer":
            editor.dispatchCommand(INSERT_ANSWER_BLOCK_COMMAND, {
              wordIDs: bd.wordIDs || [],
              requestDefinition: bd.requestDefinition || "translation",
              allowedInput: bd.allowedInput || ["text"],
              promptMethod: bd.promptMethod || ["phrase"],
            });
            break;

          case "custom-answer":
            editor.dispatchCommand(
              INSERT_CUSTOM_ANSWER_BLOCK_COMMAND,
              bd.questionIDs || null,
            );
            break;

          case "meaning-association":
            editor.dispatchCommand(
              INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND,
              bd.wordIDs || null,
            );
            break;

          case "heading": {
            // Replace current empty paragraph with a heading node containing text
            if ($isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode();
              const block =
                anchorNode.getType() === "text"
                  ? anchorNode.getParent()
                  : anchorNode;
              if (block) {
                const headingNode = $createHeadingNode(bd.level || "h2");
                headingNode.append($createTextNode(bd.text || ""));
                block.replace(headingNode);
                headingNode.selectEnd();
              }
            }
            break;
          }

          case "paragraph": {
            // Insert markdown text into the current paragraph
            if (bd.markdown && $isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode();
              const block =
                anchorNode.getType() === "text"
                  ? anchorNode.getParent()
                  : anchorNode;
              if (block) {
                // Split markdown into paragraphs
                const lines = bd.markdown.split("\n\n").filter(Boolean);
                let target = block;
                lines.forEach((line, i) => {
                  if (i === 0) {
                    target.append($createTextNode(line));
                  } else {
                    const p = $createParagraphNode();
                    p.append($createTextNode(line));
                    target.insertAfter(p);
                    target = p;
                  }
                });
                target.selectEnd();
              }
            }
            break;
          }

          default:
            console.warn("Unknown block type:", suggestion.type);
        }
      });
    },
    [editor],
  );

  // Register the insert callback with the context so the sidebar can use it
  useEffect(() => {
    if (registerInsertCallback) {
      registerInsertCallback(
        // Insert callback — reuse shared dispatch logic
        (suggestion) => {
          dispatchBlockInsert(suggestion);
          setSuggestions(null);
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
        },
      );
    }
  }, [
    registerInsertCallback,
    dispatchBlockInsert,
    setSuggestions,
    useAI,
    fetchAISuggestions,
  ]);

  const handleSuggestionClick = useCallback(
    (index) => {
      setSelectedIndex(index);
      insertSelectedBlock();
    },
    [insertSelectedBlock],
  );

  // Render inline tab-completion hint when suggestions are available
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const topSuggestion = suggestions[selectedIndex] || suggestions[0];
  const bd = topSuggestion.blockData || {};

  /**
   * Render a content-aware preview snippet for the suggested block.
   */
  const renderBlockPreview = () => {
    switch (topSuggestion.type) {
      case "heading":
        return bd.text ? (
          <span
            style={{
              fontWeight: 700,
              fontSize: bd.level === "h1" ? 18 : bd.level === "h3" ? 13 : 15,
            }}
          >
            {bd.text}
          </span>
        ) : null;

      case "paragraph":
        return bd.markdown ? (
          <span
            style={{
              opacity: 0.85,
              maxWidth: 360,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {bd.markdown.length > 80
              ? bd.markdown.slice(0, 80) + "…"
              : bd.markdown}
          </span>
        ) : null;

      case "quiz":
      case "custom-answer": {
        const questions = topSuggestion.resolvedQuestions || [];
        if (questions.length === 0) return null;
        return (
          <span style={{ opacity: 0.85, fontSize: 11 }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""}
            {questions[0]?.question && (
              <>
                {" "}
                —{" "}
                <em>
                  {questions[0].question.slice(0, 50)}
                  {questions[0].question.length > 50 ? "…" : ""}
                </em>
              </>
            )}
          </span>
        );
      }

      case "answer":
      case "meaning-association": {
        const words = topSuggestion.resolvedWords || [];
        if (words.length === 0) return null;
        return (
          <span style={{ opacity: 0.85, fontSize: 11 }}>
            {words.map((w) => w.phrase || w.word).join(", ")}
          </span>
        );
      }

      default:
        return null;
    }
  };

  const preview = renderBlockPreview();

  return (
    <div
      style={{
        position: "relative",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div
        data-testid="block-suggestion-hint"
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "auto",
          zIndex: 1000,
          display: "flex",
          flexDirection: preview ? "column" : "row",
          alignItems: "center",
          gap: preview ? 4 : 8,
          padding: preview ? "8px 16px" : "6px 16px",
          borderRadius: preview ? 12 : 20,
          backgroundColor: "rgba(0, 0, 0, 0.80)",
          color: "#fff",
          fontSize: 13,
          fontFamily: "inherit",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
          maxWidth: 480,
        }}
      >
        {/* Top row: icon + label + keyboard hint */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 18 }}>{topSuggestion.icon}</span>
          <span style={{ fontWeight: 500 }}>{topSuggestion.label}</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "1px 6px",
              borderRadius: 4,
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            Tab
          </span>
          {suggestions.length > 1 && (
            <span style={{ opacity: 0.7, fontSize: 11 }}>
              ↑↓ {suggestions.length - 1} more
            </span>
          )}
        </div>
        {/* Preview row: shows block content */}
        {preview && (
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.15)",
              paddingTop: 4,
              width: "100%",
              textAlign: "center",
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
            }}
          >
            {preview}
          </div>
        )}
      </div>
    </div>
  );
}
