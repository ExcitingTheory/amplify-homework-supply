'use client'

/**
 * MiniEditorEditable — Compact Lexical editor with Notion-style block inserter.
 *
 * Full-featured editor with:
 * - All custom block types (quiz, answer, meaning association, etc.)
 * - Hover-reveal "+" block inserter on empty lines
 * - @mention autocomplete
 * - Chat mode (Enter = submit, Shift+Enter = newline)
 * - Debounced onChange callback
 *
 * Used for:
 * - Chat message input (with chatMode=true)
 * - Squad post editing
 * - Campaign description editing
 * - Any inline editing context
 *
 * @module MiniEditor/MiniEditorEditable
 */

import * as React from 'react'
import { useEffect, useRef, useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  CLEAR_EDITOR_COMMAND,
  type EditorState,
  type SerializedEditorState,
} from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'

import LanguageEditorTheme from '../Editor3/config/LanguageEditorTheme'
import { EditorNodes, ALL_TRANSFORMERS, onError, sanitizeEditorStateJSON } from '../Editor3/editorConfig'

// Custom block plugins
import YouTubePlugin from '../Editor3/plugins/YouTubePlugin'
import WordBlockPlugin from '../Editor3/plugins/WordBlockPlugin'
import QuizPlugin from '../Editor3/plugins/QuizPlugin'
import MeaningAssociationPlugin from '../Editor3/plugins/MeaningAssociationPlugin'
import PlaylistPlugin from '../Editor3/plugins/PlaylistPlugin'
import PdfViewerPlugin from '../Editor3/plugins/PdfViewerPlugin'
import ImagesPlugin from '../Editor3/plugins/ImagesPlugin'
import AnswerPlugin from '../Editor3/plugins/AnswerPlugin'
import CustomAnswerPlugin from '../Editor3/plugins/CustomAnswerPlugin'
import ArmorEditorPlugin from '../Editor3/plugins/ArmorEditorPlugin'

import FloatingToolbarPlugin from '../Editor3/plugins/FloatingToolbarPlugin'
import FloatingLinkEditorPlugin from '../Editor3/plugins/FloatingLinkEditorPlugin'
import BlockInserterPlugin from './BlockInserterPlugin'
import type { MiniEditorEditableProps, MentionSuggestion } from './types'

// ─── Chat Submit Plugin ───────────────────────────────────────────────────────

interface ChatSubmitPluginProps {
  onSubmit: (json: SerializedEditorState, plainText: string) => void
  enabled: boolean
}

/**
 * In chat mode, Enter submits the message and Shift+Enter inserts a newline.
 */
function ChatSubmitPlugin({ onSubmit, enabled }: ChatSubmitPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!enabled) return

    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (!event) return false

        // Shift+Enter = newline (default behavior)
        if (event.shiftKey) return false

        // Plain Enter = submit
        event.preventDefault()

        const editorState = editor.getEditorState()
        let plainText = ''
        editorState.read(() => {
          plainText = $getRoot().getTextContent()
        })

        // Don't submit empty content
        if (!plainText.trim()) return true

        const json = editorState.toJSON()
        onSubmit(json, plainText)

        // Clear the editor
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor, onSubmit, enabled])

  return null
}

// ─── Initial Content Plugin ───────────────────────────────────────────────────

interface InitialContentPluginProps {
  content: string | null
}

function InitialContentPlugin({ content }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext()
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (hasLoaded.current || !content) return

    const sanitized = sanitizeEditorStateJSON(content)
    if (!sanitized) return

    try {
      const parsed = JSON.parse(sanitized)
      const editorState = editor.parseEditorState(parsed)
      queueMicrotask(() => {
        editor.setEditorState(editorState)
      })
      hasLoaded.current = true
    } catch (err) {
      console.error('[MiniEditorEditable] Failed to load initial content:', err)
    }
  }, [content, editor])

  return null
}

// ─── MiniEditorEditable ───────────────────────────────────────────────────────

export default function MiniEditorEditable({
  content,
  namespace = 'MiniEditorEditable',
  maxHeight,
  ariaLabel = 'Editor',
  className,
  compact = false,
  onChange,
  onSubmit,
  placeholder = 'Type something...',
  showBlockInserter = true,
  autoFocus = false,
  chatMode = false,
  mentionSuggestions = [],
}: Omit<MiniEditorEditableProps, 'mode'>) {
  const [anchorElem, setAnchorElem] = useState<HTMLDivElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initialConfig = React.useMemo(
    () => ({
      namespace,
      theme: LanguageEditorTheme,
      onError,
      editable: true,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    [namespace],
  )

  const padding = compact ? '0.25rem 0.5rem' : '0.75rem 1rem'

  // Debounced onChange handler
  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (!onChange) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(editorState.toJSON())
      }, 500)
    },
    [onChange],
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Submit handler for chat mode
  const handleSubmit = useCallback(
    (json: SerializedEditorState, plainText: string) => {
      onSubmit?.(json, plainText)
    },
    [onSubmit],
  )

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {/* Core editing plugins */}
      <HistoryPlugin />
      <CheckListPlugin />
      <HashtagPlugin />
      <HorizontalRulePlugin />
      <ListPlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
      <TablePlugin />
      <ClearEditorPlugin />

      {/* Custom block plugins */}
      <YouTubePlugin />
      <WordBlockPlugin />
      <QuizPlugin />
      <MeaningAssociationPlugin />
      <PlaylistPlugin />
      <PdfViewerPlugin />
      <ImagesPlugin captionsEnabled={false} />
      <AnswerPlugin />
      <CustomAnswerPlugin />
      <ArmorEditorPlugin />

      {/* Floating toolbar and link editor */}
      <FloatingToolbarPlugin />
      <FloatingLinkEditorPlugin anchorElem={typeof document !== 'undefined' ? document.body : undefined} />

      {/* Auto-focus */}
      {autoFocus && <AutoFocusPlugin />}

      {/* Content change tracking */}
      <OnChangePlugin onChange={handleChange} ignoreSelectionChange />

      {/* Initial content (for edit mode with pre-existing content) */}
      <InitialContentPlugin content={content ?? null} />

      {/* Chat mode submit (Enter to send) */}
      <ChatSubmitPlugin onSubmit={handleSubmit} enabled={chatMode} />

      {/* Editor area with block inserter anchor */}
      <Box
        className={className}
        ref={setAnchorElem}
        sx={{
          position: 'relative',
          maxHeight: maxHeight || undefined,
          overflowX: 'visible',
          overflowY: maxHeight ? 'auto' : 'visible',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
          },
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              style={{
                width: '100%',
                padding: typeof padding === 'string' ? padding : `${padding}px`,
                outline: 'none',
                minHeight: compact ? '36px' : '80px',
              }}
            />
          }
          placeholder={
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                padding,
                color: 'text.disabled',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {placeholder}
            </Box>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Notion-style block inserter */}
        {showBlockInserter && anchorElem && (
          <BlockInserterPlugin anchorElem={anchorElem} />
        )}
      </Box>
    </LexicalComposer>
  )
}
