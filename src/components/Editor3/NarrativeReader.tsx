/**
 * NarrativeReader — Standalone read-only Lexical renderer.
 *
 * Renders serialized Lexical JSON with all interactive plugins (quizzes,
 * meaning association, vocab, media, etc.) — the same node set as the
 * Workbook — but without toolbar, drawer, grading, collaboration, or
 * UnitContext dependency.
 *
 * Use this to embed full workbook-style content inside the narrative
 * campaign flow (CampaignBriefing) or anywhere that Lexical content
 * needs to be displayed outside the main Workbook page.
 *
 * @module NarrativeReader
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
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical'

import { AudioPlayerProvider } from './context/AudioPlayerContext'
import { AutocompleteProvider } from './context/SharedAutocompleteContext'
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper'
import LanguageEditorTheme from './config/LanguageEditorTheme'

import YouTubePlugin from './plugins/YouTubePlugin'
import WordBlockPlugin from './plugins/WordBlockPlugin'
import QuizPlugin from './plugins/QuizPlugin'
import MeaningAssociationPlugin from './plugins/MeaningAssociationPlugin'
import PlaylistPlugin from './plugins/PlaylistPlugin'
import PdfViewerPlugin from './plugins/PdfViewerPlugin'
import ImagesPlugin from './plugins/ImagesPlugin'
import AnswerPlugin from './plugins/AnswerPlugin'
import CustomAnswerPlugin from './plugins/CustomAnswerPlugin'
import ArmorEditorPlugin from './plugins/ArmorEditorPlugin'

import { EditorNodes, ALL_TRANSFORMERS, onError } from './editorConfig'

// ============================================================================
// Content loader plugin (replaces WorkbookStatePlugin — no UnitContext)
// ============================================================================

interface NarrativeStatePluginProps {
  contentJson: string
}

function NarrativeStatePlugin({ contentJson }: NarrativeStatePluginProps) {
  const [editor] = useLexicalComposerContext()
  const hasLoaded = useRef(false)

  useEffect(() => {
    if (hasLoaded.current || !contentJson) return

    // Plain text that isn't JSON (e.g. AI-generated text responses)
    // Insert as a plain paragraph so it still renders visibly
    if (typeof contentJson === 'string') {
      const trimmed = contentJson.trimStart()
      if (trimmed.length > 0 && trimmed[0] !== '{' && trimmed[0] !== '[') {
        editor.update(() => {
          const root = $getRoot()
          root.clear()
          const paragraph = $createParagraphNode()
          paragraph.append($createTextNode(contentJson))
          root.append(paragraph)
        })
        hasLoaded.current = true
        return
      }
    }

    try {
      const parsed = typeof contentJson === 'string'
        ? JSON.parse(contentJson)
        : contentJson

      if (parsed) {
        const editorState = editor.parseEditorState(parsed)
        queueMicrotask(() => {
          editor.setEditorState(editorState)
        })
        hasLoaded.current = true
      }
    } catch (err) {
      console.error('[NarrativeStatePlugin] Failed to load content:', err)
    }
  }, [contentJson, editor])

  // Reset when content changes (e.g. navigating between chapters)
  useEffect(() => {
    hasLoaded.current = false
  }, [contentJson])

  return null
}

// ============================================================================
// NarrativeReader component
// ============================================================================

export interface NarrativeReaderProps {
  /** Serialized Lexical JSON (same format as Unit.data) */
  contentJson: string
  /** Optional max-height with scroll (px or CSS value) */
  maxHeight?: string | number
  /** Optional aria-label for the content region */
  ariaLabel?: string
  /** Optional className for the outer wrapper */
  className?: string
  /** Optional padding override */
  padding?: string | number
}

export function NarrativeReader({
  contentJson,
  maxHeight,
  ariaLabel = 'Narrative content',
  className,
  padding = '1rem',
}: NarrativeReaderProps) {
  const initialConfig = React.useMemo(
    () => ({
      namespace: 'NarrativeReader',
      theme: LanguageEditorTheme,
      onError,
      editable: false,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    [],
  )

  return (
    <DndWrapper>
      <AutocompleteProvider>
        <AudioPlayerProvider>
          <LexicalComposer initialConfig={initialConfig}>
            {/* Same read-only plugins as Workbook (minus grading/progress/toolbar) */}
            <CheckListPlugin />
            <HashtagPlugin />
            <HorizontalRulePlugin />
            <ListPlugin />
            <TabIndentationPlugin />
            <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
            <TablePlugin />
            <LexicalClickableLinkPlugin />
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
            <NarrativeStatePlugin contentJson={contentJson} />

            <Box
              className={className}
              sx={{
                maxHeight: maxHeight || undefined,
                overflowY: maxHeight ? 'auto' : undefined,
              }}
            >
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    aria-label={ariaLabel}
                    style={{
                      width: '100%',
                      padding: typeof padding === 'number' ? `${padding}px` : padding,
                      outline: 'none',
                    }}
                  />
                }
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
              />
            </Box>
          </LexicalComposer>
        </AudioPlayerProvider>
      </AutocompleteProvider>
    </DndWrapper>
  )
}

export default NarrativeReader
