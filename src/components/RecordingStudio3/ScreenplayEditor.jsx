/**
 * @fileoverview ScreenplayEditor — editable Fountain editor + AI prompt input.
 *
 * Two-zone layout:
 *  1. **Fountain editor** — Editable Lexical plain-text editor with monospace
 *     Fountain styling. Manual edits re-parse into RS3 `scriptData` on every
 *     change (debounced 500ms) via the parent's `onFountainChange` callback.
 *  2. **Prompt input** — Text field for AI-assisted screenplay generation.
 *
 * The component is controlled: it receives `fountainText` and calls
 * `onFountainChange(newText)` whenever the editor or AI updates the script.
 * The parent (RecordingStudio3) calls `parseFountainToScriptData()` and
 * merges the result into its state.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

// ── Debounce helper ──

function useDebouncedCallback(callback, delay) {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );
}

// ── Plugin: Set editor content from outside ──

function SetContentPlugin({ text }) {
  const [editor] = useLexicalComposerContext();
  const lastSetRef = useRef('');

  useEffect(() => {
    // Only set content when the external source (AI / parent) pushes new text
    // that differs from what we last set. Avoids fighting the user's cursor.
    if (text === lastSetRef.current) return;
    lastSetRef.current = text;

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const lines = text.split('\n');
      for (const line of lines) {
        const p = $createParagraphNode();
        p.append($createTextNode(line));
        root.append(p);
      }
    });
  }, [editor, text]);

  return null;
}

// ── Fountain syntax highlighting theme ──

const fountainTheme = {
  paragraph: 'screenplay-line',
  root: 'screenplay-root',
};

// ── Main component ──

/**
 * @param {Object} props
 * @param {string}  props.fountainText - Current Fountain plain text
 * @param {Function} props.onFountainChange - Called with updated Fountain text (debounced)
 * @param {Function} [props.onPromptSubmit] - Called with prompt string for AI generation
 * @param {boolean} [props.isGenerating] - Shows spinner on prompt input while AI works
 * @param {boolean} [props.readOnly] - Disable editing
 */
export default function ScreenplayEditor({
  fountainText = '',
  onFountainChange,
  onPromptSubmit,
  isGenerating = false,
  readOnly = false,
}) {
  const { t } = useTranslation('components');
  const [promptValue, setPromptValue] = useState('');

  // Track the text that the editor itself produced so we can distinguish
  // "editor changed locally" from "parent pushed new text".
  const localTextRef = useRef(fountainText);

  // Debounced callback that fires onFountainChange
  const debouncedChange = useDebouncedCallback((newText) => {
    localTextRef.current = newText;
    onFountainChange?.(newText);
  }, 500);

  // Lexical onChange handler — extract plain text from editor state
  // NOTE: We join paragraph text with single '\n' (not getTextContent which uses
  // '\n\n' between block nodes) so Fountain format stays intact — character names
  // must be on the line immediately before their dialogue.
  const handleEditorChange = useCallback(
    (editorState) => {
      editorState.read(() => {
        const root = $getRoot();
        const paragraphs = root.getChildren();
        const text = paragraphs.map(p => p.getTextContent()).join('\n');
        debouncedChange(text);
      });
    },
    [debouncedChange],
  );

  // We want SetContentPlugin to react only when the *parent* pushes new text
  // (e.g., AI generation result), not when the user types. We detect this by
  // comparing against localTextRef.
  const externalText = useMemo(() => {
    if (fountainText !== localTextRef.current) {
      localTextRef.current = fountainText;
      return fountainText;
    }
    return localTextRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fountainText]);

  const handlePromptSubmit = useCallback(() => {
    const trimmed = promptValue.trim();
    if (!trimmed || isGenerating) return;
    onPromptSubmit?.(trimmed);
    setPromptValue('');
  }, [promptValue, isGenerating, onPromptSubmit]);

  const handlePromptKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handlePromptSubmit();
      }
    },
    [handlePromptSubmit],
  );

  const initialConfig = useMemo(
    () => ({
      namespace: 'ScreenplayEditor',
      theme: fountainTheme,
      onError: (error) => console.error('ScreenplayEditor Lexical error:', error),
      editable: !readOnly,
    }),
    [readOnly],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Fountain editor ── */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          '& .screenplay-root': {
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '12pt',
            lineHeight: 1.6,
            padding: '16px 24px',
            outline: 'none',
            minHeight: '100%',
            whiteSpace: 'pre-wrap',
          },
          '& .screenplay-line': {
            margin: 0,
          },
        }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className="screenplay-root"
                aria-label={t('screenplayEditor.editorLabel', 'Fountain screenplay editor')}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <SetContentPlugin text={externalText} />
        </LexicalComposer>
      </Box>

      {/* ── AI prompt input ── */}
      {onPromptSubmit && !readOnly && (
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              size="small"
              multiline
              maxRows={3}
              placeholder={t(
                'screenplayEditor.promptPlaceholder',
                'Describe what you want\u2026 e.g. "Add a scene where the student practices ordering coffee"',
              )}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={handlePromptKeyDown}
              disabled={isGenerating}
              slotProps={{
                input: {
                  sx: { fontFamily: 'inherit', fontSize: '0.875rem' },
                },
              }}
            />
            <IconButton
              onClick={handlePromptSubmit}
              disabled={isGenerating || !promptValue.trim()}
              color="primary"
              aria-label={t('screenplayEditor.send', 'Send prompt')}
            >
              {isGenerating ? (
                <Skeleton variant="circular" width={20} height={20} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            {t(
              'screenplayEditor.examples',
              'Examples: "Add a scene where they practice at a train station" \u00b7 "Make Akiko speak more casually" \u00b7 "Add direction notes for pauses"',
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
