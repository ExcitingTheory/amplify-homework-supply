'use client'

/**
 * MiniEditorReadOnly — Lightweight read-only Lexical renderer.
 *
 * Renders serialized Lexical JSON with all custom block types (quiz, answer,
 * meaning association, etc.) in a compact, non-editable format.
 *
 * Used for:
 * - Chat message content display
 * - Squad descriptions
 * - Campaign briefings
 * - Kai bot response rendering
 *
 * @module MiniEditor/MiniEditorReadOnly
 */

import * as React from 'react'
import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClickableLinkPlugin as LexicalClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import LanguageEditorTheme from '../Editor3/config/LanguageEditorTheme'
import { EditorNodes, ALL_TRANSFORMERS, onError, sanitizeEditorStateJSON } from '../Editor3/editorConfig'

// Lazy-load interactive plugins for custom blocks
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

import type { MiniEditorReadOnlyProps } from './types'

// ─── Content Loader Plugin ────────────────────────────────────────────────────

interface ContentLoaderProps {
  content: string | null
}

function ContentLoaderPlugin({ content }: ContentLoaderProps) {
  const [editor] = useLexicalComposerContext()
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!content || content === loadedRef.current) return

    const sanitized = sanitizeEditorStateJSON(content)
    if (!sanitized) return

    try {
      const parsed = JSON.parse(sanitized)
      const editorState = editor.parseEditorState(parsed)
      queueMicrotask(() => {
        editor.setEditorState(editorState)
      })
      loadedRef.current = content
    } catch (err) {
      console.error('[MiniEditorReadOnly] Failed to load content:', err)
    }
  }, [content, editor])

  return null
}

// ─── MiniEditorReadOnly ───────────────────────────────────────────────────────

export default function MiniEditorReadOnly({
  content,
  namespace = 'MiniEditorReadOnly',
  maxHeight,
  ariaLabel = 'Content',
  className,
  compact = false,
}: Omit<MiniEditorReadOnlyProps, 'mode'>) {
  const initialConfig = React.useMemo(
    () => ({
      namespace,
      theme: LanguageEditorTheme,
      onError,
      editable: false,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    [namespace],
  )

  const padding = compact ? '0.25rem 0.5rem' : '0.75rem 1rem'

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {/* Core plugins */}
      <CheckListPlugin />
      <HashtagPlugin />
      <HorizontalRulePlugin />
      <ListPlugin />
      <TabIndentationPlugin />
      <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
      <TablePlugin />
      <LexicalClickableLinkPlugin />

      {/* Custom block plugins (read-only mode) */}
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

      {/* Content loader */}
      <ContentLoaderPlugin content={content ?? null} />

      {/* Render area */}
      <Box
        className={className}
        sx={{
          maxHeight: maxHeight || undefined,
          overflowY: maxHeight ? 'auto' : undefined,
          '& .ContentEditable__root': {
            padding,
            outline: 'none',
            minHeight: compact ? 'auto' : undefined,
          },
        }}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              style={{
                width: '100%',
                padding,
                outline: 'none',
              }}
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </Box>
    </LexicalComposer>
  )
}
