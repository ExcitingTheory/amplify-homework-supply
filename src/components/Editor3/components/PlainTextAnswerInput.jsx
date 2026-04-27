/**
 * PlainTextAnswerInput - Lexical plain text editor for student answer input.
 *
 * Features:
 * - Shared undo/redo stack via external history state
 * - Auto-submit on blur or idle (no typing for idleTimeout ms)
 * - Grace period countdown before submission (like SketchPad)
 * - Cancel button to abort pending submission
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  BLUR_COMMAND,
  FOCUS_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { Box, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SubmissionCountdown from './SubmissionCountdown';

/**
 * Plugin that fires onBlur with current text when the editor loses focus.
 */
function BlurPlugin({ onBlur }) {
  const [editor] = useLexicalComposerContext();
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const text = $getRoot().getTextContent();
          onBlurRef.current?.(text);
        });
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

/**
 * Plugin that fires onFocus when the editor gains focus.
 */
function FocusPlugin({ onFocus }) {
  const [editor] = useLexicalComposerContext();
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  useEffect(() => {
    return editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        onFocusRef.current?.();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

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
      { tag: 'history-merge' },
    );
  }, [value, editor]);

  return null;
}

export default function PlainTextAnswerInput({
  value = '',
  onChange,
  onAutoSubmit,
  historyState,
  placeholder = '',
  ariaLabel = '',
  borderStyle = '1px solid #ccc',
  textColor = 'inherit',
  gracePeriod = 10,
  idleTimeout = 3000,
  style = {},
  testId,
  wordId,
  questionId,
  disabled = false,
}) {
  const [countdown, setCountdown] = useState(null);
  const countdownTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const currentValueRef = useRef(value);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  onAutoSubmitRef.current = onAutoSubmit;

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  }, []);

  const startCountdown = useCallback(() => {
    cancelCountdown();
    const submitValue = currentValueRef.current;
    if (!submitValue || !submitValue.trim()) return;

    setCountdown(gracePeriod);
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          onAutoSubmitRef.current?.(currentValueRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [gracePeriod, cancelCountdown]);

  const handleChange = useCallback(
    (editorState) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();
        currentValueRef.current = text;
        onChange?.(text);
      });

      // Cancel any running countdown when user types
      cancelCountdown();

      // Reset idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        startCountdown();
      }, idleTimeout);
    },
    [onChange, cancelCountdown, startCountdown, idleTimeout],
  );

  const handleBlur = useCallback(
    (text) => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (text && text.trim()) {
        startCountdown();
      }
    },
    [startCountdown],
  );

  const handleFocus = useCallback(() => {
    cancelCountdown();
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, [cancelCountdown]);

  const handleManualSubmit = useCallback(() => {
    cancelCountdown();
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    const text = currentValueRef.current;
    if (text && text.trim()) {
      onAutoSubmitRef.current?.(text);
    }
  }, [cancelCountdown]);

  // Cancel timers when disabled
  useEffect(() => {
    if (disabled) {
      cancelCountdown();
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }
  }, [disabled, cancelCountdown]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const initialConfig = {
    namespace: `PlainTextAnswer-${wordId || questionId || 'field'}`,
    theme: {},
    editable: !disabled,
    onError: (error) => console.error('[PlainTextAnswerInput] Lexical error:', error),
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
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexBasis: '80%', maxWidth: '50rem' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ position: 'relative' }}>
            <PlainTextPlugin
              ErrorBoundary={LexicalErrorBoundary}
              contentEditable={
                <ContentEditable
                  data-testid={testId}
                  data-word-id={wordId}
                  data-question-id={questionId}
                  aria-label={ariaLabel}
                  style={{
                    border: borderStyle,
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    color: textColor,
                    minHeight: '72px',
                    overflow: 'auto',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'transparent',
                    ...style,
                  }}
                />
              }
              placeholder={
                placeholder ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      color: 'inherit',
                      opacity: 0.5,
                      pointerEvents: 'none',
                      fontSize: '16px',
                      lineHeight: '1.5',
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
            <BlurPlugin onBlur={handleBlur} />
            <FocusPlugin onFocus={handleFocus} />
            <SyncValuePlugin value={value} />
            <EditablePlugin editable={!disabled} />
          </div>
        </LexicalComposer>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pt: '8px', minWidth: 'fit-content' }}>
        {countdown === null || countdown === undefined ? (
          <Button
            variant="contained"
            size="small"
            endIcon={<SendIcon />}
            onClick={handleManualSubmit}
            disabled={disabled}
          >
            Submit
          </Button>
        ) : (
          <SubmissionCountdown countdown={countdown} onCancel={cancelCountdown} onSubmitNow={handleManualSubmit} />
        )}
      </Box>
    </Box>
  );
}
