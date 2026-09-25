/**
 * PlainTextAnswerInput - Lexical plain text editor for student answer input.
 *
 * Features:
 * - Shared undo/redo stack via external history state
 * - Explicit submission without a grace-period countdown
 */
import React, { useRef, useEffect, useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { Box } from "@mui/material";
import ExerciseResponsePanel from "./ExerciseResponsePanel";

/**
 * Plugin to dynamically toggle editor editability without remounting.
 */
function EditablePlugin({ editable }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(editable);
  }, [editor, editable]);
  return null;
}

/**
 * Plugin to sync external value into the editor without polluting undo stack.
 */
function SyncValuePlugin({ value }) {
  const [editor] = useLexicalComposerContext();
  const lastExternalValue = useRef(value);

  useEffect(() => {
    if (value === lastExternalValue.current) return;
    lastExternalValue.current = value;

    editor.update(
      () => {
        const root = $getRoot();
        const currentText = root.getTextContent();
        if (currentText === value) return;

        root.clear();
        const paragraph = $createParagraphNode();
        if (value) {
          paragraph.append($createTextNode(value));
        }
        root.append(paragraph);
      },
      { tag: "history-merge" },
    );
  }, [value, editor]);

  return null;
}

export default function PlainTextAnswerInput({
  value = "",
  onChange,
  onAutoSubmit,
  historyState,
  placeholder = "",
  ariaLabel = "",
  borderStyle = "1px solid var(--mui-palette-divider)",
  textColor = "inherit",
  style = {},
  testId,
  wordId,
  questionId,
  disabled = false,
}) {
  const currentValueRef = useRef(value);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  onAutoSubmitRef.current = onAutoSubmit;

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  const handleChange = useCallback(
    (editorState) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();
        currentValueRef.current = text;
        onChange?.(text);
      });
    },
    [onChange],
  );

  const handleManualSubmit = useCallback(() => {
    const text = currentValueRef.current;
    if (text && text.trim()) {
      onAutoSubmitRef.current?.(text);
    }
  }, []);

  const initialConfig = {
    namespace: `PlainTextAnswer-${wordId || questionId || "field"}`,
    theme: {},
    editable: !disabled,
    onError: (error) =>
      console.error("[PlainTextAnswerInput] Lexical error:", error),
    editorState: () => {
      const root = $getRoot();
      root.clear();
      if (value) {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(value));
        root.append(paragraph);
      }
    },
  };

  return (
    <ExerciseResponsePanel
      onSubmit={handleManualSubmit}
      showCancel={false}
      submitDisabled={disabled}
      sx={{ border: borderStyle }}
    >
      <Box sx={{ minWidth: 0 }}>
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ position: "relative" }}>
            <PlainTextPlugin
              ErrorBoundary={LexicalErrorBoundary}
              contentEditable={
                <ContentEditable
                  data-testid={testId}
                  data-word-id={wordId}
                  data-question-id={questionId}
                  aria-label={ariaLabel}
                  style={{
                    border: "none",
                    borderRadius: 0,
                    padding: "12px 14px",
                    fontSize: "16px",
                    lineHeight: "1.5",
                    fontFamily: "inherit",
                    resize: "vertical",
                    color: textColor,
                    minHeight: "56px",
                    overflow: "auto",
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "transparent",
                    ...style,
                    outline: "none",
                  }}
                />
              }
              placeholder={
                placeholder ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "16px",
                      color: "inherit",
                      opacity: 0.5,
                      pointerEvents: "none",
                      fontSize: "16px",
                      lineHeight: "1.5",
                    }}
                  >
                    {placeholder}
                  </div>
                ) : null
              }
            />
            {historyState ? (
              <HistoryPlugin externalHistoryState={historyState} />
            ) : (
              <HistoryPlugin />
            )}
            <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
            <SyncValuePlugin value={value} />
            <EditablePlugin editable={!disabled} />
          </div>
        </LexicalComposer>
      </Box>
    </ExerciseResponsePanel>
  );
}
