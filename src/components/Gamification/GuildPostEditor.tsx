/**
 * GuildPostEditor — Lightweight Lexical editor for creating guild posts.
 *
 * Supports the full Editor3 node set (quizzes, meaning association, vocabulary,
 * media, custom answer blocks, etc.) with a toolbar, but without UnitContext,
 * Yjs collaboration, or the sidebar drawers.
 *
 * Props:
 *  - onPublish: called with { title, data } when the user publishes
 *  - initialTitle / initialData: for editing existing posts
 *  - disabled: prevent editing (e.g. while saving)
 *
 * @module GuildPostEditor
 */

import * as React from 'react'
import { useCallback, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import SendIcon from '@mui/icons-material/Send'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { CLEAR_EDITOR_COMMAND } from 'lexical'

import { AudioPlayerProvider } from '../Editor3/context/AudioPlayerContext'
import { AutocompleteProvider } from '../Editor3/context/SharedAutocompleteContext'
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper'
import LanguageEditorTheme from '../Editor3/config/LanguageEditorTheme'
import Placeholder from '../Editor3/components/Placeholder'

import FloatingToolbarPlugin from '../Editor3/plugins/FloatingToolbarPlugin'
import CodeHighlightPlugin from '../Editor3/plugins/CodeHighlightPlugin'
import LinkPlugin from '../Editor3/plugins/LinkPlugin'
import AutoLinkPlugin from '../Editor3/plugins/AutoLinkPlugin'
import YouTubePlugin from '../Editor3/plugins/YouTubePlugin'
import WordBlockPlugin from '../Editor3/plugins/WordBlockPlugin'
import MeaningAssociationPlugin from '../Editor3/plugins/MeaningAssociationPlugin'
import QuizPlugin from '../Editor3/plugins/QuizPlugin'
import ImagesPlugin from '../Editor3/plugins/ImagesPlugin'
import PlaylistPlugin from '../Editor3/plugins/PlaylistPlugin'
import PdfViewerPlugin from '../Editor3/plugins/PdfViewerPlugin'
import AnswerPlugin from '../Editor3/plugins/AnswerPlugin'
import CustomAnswerPlugin from '../Editor3/plugins/CustomAnswerPlugin'
import ArmorEditorPlugin from '../Editor3/plugins/ArmorEditorPlugin'

import { EditorNodes, ALL_TRANSFORMERS, onError } from '../Editor3/editorConfig'

// ============================================================================
// Types
// ============================================================================

export interface GuildPostEditorProps {
  /** Called when user publishes the post */
  onPublish: (post: { title: string; data: string }) => void
  /** Initial title for editing existing posts */
  initialTitle?: string
  /** Initial Lexical JSON for editing existing posts */
  initialData?: string
  /** Disable the editor while saving */
  disabled?: boolean
}

// ============================================================================
// Internal plugin to load initial content
// ============================================================================

function InitialContentPlugin({ contentJson }: { contentJson?: string }) {
  const [editor] = useLexicalComposerContext()
  const hasLoaded = useRef(false)

  React.useEffect(() => {
    if (hasLoaded.current || !contentJson) return
    try {
      const parsed = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson
      if (parsed) {
        const editorState = editor.parseEditorState(parsed)
        queueMicrotask(() => {
          editor.setEditorState(editorState)
        })
        hasLoaded.current = true
      }
    } catch (err) {
      console.error('[GuildPostEditor] Failed to load initial content:', err)
    }
  }, [contentJson, editor])

  return null
}

// ============================================================================
// Internal plugin to expose editor ref
// ============================================================================

function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<any> }) {
  const [editor] = useLexicalComposerContext()
  React.useEffect(() => {
    editorRef.current = editor
  }, [editor, editorRef])
  return null
}

// ============================================================================
// Component
// ============================================================================

export function GuildPostEditor({
  onPublish,
  initialTitle = '',
  initialData,
  disabled = false,
}: GuildPostEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const editorRef = useRef<any>(null)

  const initialConfig = React.useMemo(
    () => ({
      namespace: 'GuildPostEditor',
      theme: LanguageEditorTheme,
      onError,
      editable: !disabled,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    [disabled],
  )

  const handlePublish = useCallback(() => {
    if (!editorRef.current || !title.trim()) return

    const editorState = editorRef.current.getEditorState()
    const data = JSON.stringify(editorState.toJSON())

    onPublish({ title: title.trim(), data })

    // Reset after publish
    setTitle('')
    editorRef.current.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
  }, [title, onPublish])

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <TextField
          fullWidth
          variant="standard"
          placeholder="Post title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled}
          sx={{ mb: 1, '& .MuiInput-input': { fontSize: '1.25rem', fontWeight: 600 } }}
        />

        <DndWrapper>
          <AutocompleteProvider>
            <AudioPlayerProvider>
              <LexicalComposer initialConfig={initialConfig}>
                <Box
                  sx={{
                    position: 'relative',
                    minHeight: 120,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mt: 1,
                    overflow: 'hidden',
                  }}
                >
                  <FloatingToolbarPlugin />
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        aria-label="Guild post content"
                        style={{
                          width: '100%',
                          minHeight: 120,
                          padding: '0.75rem',
                          outline: 'none',
                        }}
                      />
                    }
                    placeholder={<Placeholder className="Placeholder__root">Write your post…</Placeholder>}
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                </Box>

                {/* Core plugins */}
                <AutoFocusPlugin />
                <CheckListPlugin />
                <ClearEditorPlugin />
                <HashtagPlugin />
                <HistoryPlugin />
                <HorizontalRulePlugin />
                <ListPlugin />
                <TabIndentationPlugin />
                <TablePlugin />
                <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
                <CodeHighlightPlugin />
                <LinkPlugin />
                <AutoLinkPlugin />

                {/* Rich media & custom block plugins */}
                <YouTubePlugin />
                <WordBlockPlugin />
                <MeaningAssociationPlugin />
                <QuizPlugin />
                <ImagesPlugin captionsEnabled={false} />
                <PlaylistPlugin />
                <PdfViewerPlugin />
                <AnswerPlugin />
                <CustomAnswerPlugin />
                <ArmorEditorPlugin />

                {/* Internal plugins */}
                <InitialContentPlugin contentJson={initialData} />
                <EditorRefPlugin editorRef={editorRef} />
              </LexicalComposer>
            </AudioPlayerProvider>
          </AutocompleteProvider>
        </DndWrapper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handlePublish}
            disabled={disabled || !title.trim()}
          >
            Publish
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default GuildPostEditor
