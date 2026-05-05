/**
 * LexicalPlainTextField — A Lexical-powered plain text input that looks like a MUI TextField.
 *
 * Features:
 *   - Built-in undo/redo via Lexical HistoryPlugin (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
 *   - onChange fires with current text content
 *   - Optional shared historyState for external undo/redo coordination
 *   - Visually matches MUI outlined input style
 *
 * @module LexicalPlainTextField
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { HistoryPlugin, createEmptyHistoryState, type HistoryState } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  type EditorState,
} from 'lexical'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// ============================================================================
// Internal Plugins
// ============================================================================

/** Syncs an external value into the editor without polluting the undo stack */
function SyncValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext()
  const lastExternalValue = useRef(value)

  useEffect(() => {
    if (value === lastExternalValue.current) return
    lastExternalValue.current = value

    editor.update(
      () => {
        const root = $getRoot()
        const currentText = root.getTextContent()
        if (currentText === value) return

        root.clear()
        const paragraph = $createParagraphNode()
        if (value) {
          paragraph.append($createTextNode(value))
        }
        root.append(paragraph)
      },
      { tag: 'history-merge' },
    )
  }, [value, editor])

  return null
}

// ============================================================================
// Component
// ============================================================================

export interface LexicalPlainTextFieldProps {
  value: string
  onChange: (text: string) => void
  label?: string
  placeholder?: string
  ariaLabel?: string
  historyState?: HistoryState
  /** Set to false to disable Lexical's built-in undo/redo (when using shared external stack) */
  enableHistory?: boolean
  multiline?: boolean
  maxLength?: number
  disabled?: boolean
}

export function LexicalPlainTextField({
  value,
  onChange,
  label,
  placeholder = '',
  ariaLabel,
  historyState,
  enableHistory = true,
  multiline = false,
  maxLength,
  disabled = false,
}: LexicalPlainTextFieldProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const sharedHistory = useRef(historyState || createEmptyHistoryState())

  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const text = $getRoot().getTextContent()
      onChangeRef.current(maxLength ? text.slice(0, maxLength) : text)
    })
  }, [maxLength])

  const initialConfig = {
    namespace: `PlainTextField-${label || 'field'}`,
    onError: (error: Error) => console.error('[LexicalPlainTextField]', error),
    editable: !disabled,
    editorState: () => {
      const root = $getRoot()
      const paragraph = $createParagraphNode()
      if (value) {
        paragraph.append($createTextNode(value))
      }
      root.append(paragraph)
    },
  }

  return (
    <Box>
      {label && (
        <Typography
          variant="caption"
          color="text.secondary"
          component="label"
          sx={{ mb: 0.5, display: 'block' }}
        >
          {label}
        </Typography>
      )}
      <LexicalComposer initialConfig={initialConfig}>
        <Box
          sx={{
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            px: 1.5,
            py: multiline ? 1 : 0.75,
            minHeight: multiline ? 60 : 'auto',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
            },
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
          }}
        >
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                aria-label={ariaLabel || label || placeholder}
                style={{
                  outline: 'none',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  minHeight: multiline ? '40px' : 'auto',
                }}
              />
            }
            placeholder={
              <Box
                sx={{
                  position: 'absolute',
                  top: multiline ? 8 : 6,
                  left: 12,
                  color: 'text.disabled',
                  fontSize: '0.875rem',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {placeholder}
              </Box>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </Box>
        {enableHistory && <HistoryPlugin externalHistoryState={sharedHistory.current} />}
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <SyncValuePlugin value={value} />
        <AutoFocusPlugin />
      </LexicalComposer>
    </Box>
  )
}

export { createEmptyHistoryState }
export type { HistoryState }
export default LexicalPlainTextField
