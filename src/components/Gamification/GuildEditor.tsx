/**
 * GuildEditor — Inline editor for guild name, description, and coat of arms.
 *
 * Uses the same shared undo/redo stack (useArmorUndoRedo) across:
 *   - Guild name (LexicalPlainTextField)
 *   - Guild description (LexicalPlainTextField)
 *   - Coat of arms config (ArmorEditor, opened via dialog)
 *
 * Autosaves on every change after a debounce delay.
 * Keyboard shortcuts: Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z to redo.
 *
 * @module GuildEditor
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import EditIcon from '@mui/icons-material/Edit'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { EditorState, LexicalEditor as LexicalEditorType } from 'lexical'

import { AudioPlayerProvider } from '../Editor3/context/AudioPlayerContext'
import { AutocompleteProvider } from '../Editor3/context/SharedAutocompleteContext'
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper'
import LanguageEditorTheme from '../Editor3/config/LanguageEditorTheme'
import Placeholder from '../Editor3/components/Placeholder'
import CodeHighlightPlugin from '../Editor3/plugins/CodeHighlightPlugin'
import FloatingToolbarPlugin from '../Editor3/plugins/FloatingToolbarPlugin'
import type { FloatingToolbarConfig } from '../Editor3/plugins/FloatingToolbarPlugin'
import FloatingLinkEditorPlugin from '../Editor3/plugins/FloatingLinkEditorPlugin'
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

const GUILD_DESCRIPTION_TOOLBAR_CONFIG: FloatingToolbarConfig = {
  textFormats: ['bold', 'italic', 'underline', 'strikethrough', 'code'],
  showLink: true,
  advancedFormats: ['fontColor', 'backgroundColor'],
  insertBlocks: ['meaningAssociation', 'wordBlock', 'answerVocabulary', 'answerCustom', 'quiz', 'playlist', 'horizontalRule'],
  layouts: ['1fr 1fr', '1fr 3fr', '1fr 1fr 1fr', '1fr 2fr 1fr', '1fr 1fr 1fr 1fr'],
}

import ArmorEditor, { renderShieldSvg } from './ArmorEditor'
import type { ArmorEditorConfig } from './ArmorEditor'
import { LexicalPlainTextField } from './LexicalPlainTextField'
import { useArmorUndoRedo } from './useArmorUndoRedo'
import type { ArmorEditorSnapshot } from './useArmorUndoRedo'

// ============================================================================
// Types
// ============================================================================

export interface GuildEditorProps {
  /** Current guild name */
  guildName: string
  /** Current guild description */
  guildDescription?: string
  /** Current crest config (null for new guilds) */
  crestConfig?: ArmorEditorConfig | null
  /** Called on autosave and manual save */
  onSave: (data: { name: string; description: string; config: ArmorEditorConfig; svg: string }) => void
  /** Called when the user confirms guild deletion */
  onDelete?: () => void
  /** Debounce delay in ms for autosave. Set 0 to disable. Default: 1500 */
  autoSaveDelay?: number
  /** Whether to show a save status indicator */
  showSaveStatus?: boolean
  /** User level — crest editing requires level >= 2 */
  level?: number
}

const DEFAULT_CONFIG: ArmorEditorConfig = {
  shape: 'classic',
  fieldColor: '#1565c0',
  fieldColor2: '#f9a825',
  division: 'none',
  chargeId: 'none',
  chargeColor: '#f9a825',
  chargePosition: 'center',
  chargeScale: 1,
  charges: [],
}

// ============================================================================
// Description Rich Text Editor (inline)
// ============================================================================

interface GuildDescriptionEditorProps {
  value: string
  onChange: (json: string) => void
}

/** Internal plugin to load initial content and report changes */
function DescriptionStatePlugin({
  value,
  onChange,
}: {
  value: string
  onChange: (json: string) => void
}) {
  const [editor] = useLexicalComposerContext()
  const hasLoaded = useRef(false)
  const isInternalUpdate = useRef(false)

  // Load initial content
  useEffect(() => {
    if (hasLoaded.current || !value) return
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value
      if (parsed?.root && parsed.root.children?.length > 0) {
        const editorState = editor.parseEditorState(parsed)
        isInternalUpdate.current = true
        queueMicrotask(() => {
          editor.setEditorState(editorState)
          isInternalUpdate.current = false
        })
        hasLoaded.current = true
      } else {
        // Empty root — skip loading, let the editor use its default state
        hasLoaded.current = true
      }
    } catch {
      // value is plain text (legacy) — don't load, let placeholder show
      hasLoaded.current = true
    }
  }, [value, editor])

  // Report changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (isInternalUpdate.current) return
      const json = JSON.stringify(editorState.toJSON())
      onChange(json)
    })
  }, [editor, onChange])

  return null
}

function GuildDescriptionEditor({ value, onChange }: GuildDescriptionEditorProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: 'GuildDescription',
      theme: LanguageEditorTheme,
      onError,
      editable: true,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    [],
  )

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Description
      </Typography>
      <DndWrapper>
        <AutocompleteProvider>
          <AudioPlayerProvider>
            <LexicalComposer initialConfig={initialConfig}>
              <Box
                sx={{
                  position: 'relative',
                  minHeight: 100,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <FloatingToolbarPlugin config={GUILD_DESCRIPTION_TOOLBAR_CONFIG} />
                <FloatingLinkEditorPlugin anchorElem={typeof document !== 'undefined' ? document.body : undefined} />
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      aria-label="Guild description"
                      style={{
                        width: '100%',
                        minHeight: 100,
                        padding: '0.75rem',
                        outline: 'none',
                      }}
                    />
                  }
                  placeholder={<Placeholder className="Placeholder__root">Guild description — add rich content, media, quizzes…</Placeholder>}
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </Box>

              {/* Core plugins */}
              <CheckListPlugin />
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

              {/* State management */}
              <DescriptionStatePlugin value={value} onChange={onChange} />
              <AutoFocusPlugin />
            </LexicalComposer>
          </AudioPlayerProvider>
        </AutocompleteProvider>
      </DndWrapper>
    </Box>
  )
}

// ============================================================================
// Component
// ============================================================================

export function GuildEditor({
  guildName,
  guildDescription = '',
  crestConfig,
  onSave,
  onDelete,
  autoSaveDelay = 1500,
  showSaveStatus = true,
  level = 1,
}: GuildEditorProps) {
  const [armorDialogOpen, setArmorDialogOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const initialSnapshot: ArmorEditorSnapshot = useMemo(
    () => ({
      config: crestConfig ? { ...DEFAULT_CONFIG, ...crestConfig } : DEFAULT_CONFIG,
      name: guildName,
      description: guildDescription,
    }),
    // Intentionally only compute once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const {
    snapshot,
    pushAndUpdate,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useArmorUndoRedo(initialSnapshot)

  const { config, name, description } = snapshot
  const previewSvg = useMemo(() => renderShieldSvg(config), [config])

  // --- Autosave ---
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  const doSave = useCallback(() => {
    const s = snapshotRef.current
    const svg = renderShieldSvg(s.config)
    onSaveRef.current({ name: s.name, description: s.description, config: s.config, svg })
    setSaveStatus('saved')
    const tid = setTimeout(() => setSaveStatus('idle'), 2000)
    return () => clearTimeout(tid)
  }, [])

  useEffect(() => {
    if (autoSaveDelay <= 0) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    setSaveStatus('saving')
    autoSaveTimerRef.current = setTimeout(doSave, autoSaveDelay)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [snapshot, autoSaveDelay, doSave])

  // --- Keyboard shortcuts (only when NOT inside a contenteditable) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if inside a contenteditable (Lexical handles its own undo there)
      const target = e.target as HTMLElement
      if (target?.isContentEditable) return

      const isMod = e.metaKey || e.ctrlKey
      if (!isMod || e.key !== 'z') return

      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // --- Armor dialog save handler ---
  const handleArmorSave = useCallback(
    (armorConfig: ArmorEditorConfig, _svg: string, armorName: string, armorDescription: string) => {
      pushAndUpdate(() => ({
        config: armorConfig,
        name: armorName,
        description: armorDescription,
      }))
      setArmorDialogOpen(false)
    },
    [pushAndUpdate],
  )

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          {/* Crest preview + edit */}
          <Box
            sx={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                '& svg': { width: 160, height: 160 },
              }}
            >
              <Box dangerouslySetInnerHTML={{ __html: previewSvg }} />
            </Box>
            {level >= 2 ? (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setArmorDialogOpen(true)}
              >
                Edit Crest
              </Button>
            ) : (
              <Chip
                label="Unlock at Level 2"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {/* Name + description fields */}
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            <LexicalPlainTextField
              value={name}
              onChange={(text) => pushAndUpdate((prev) => ({ ...prev, name: text }))}
              label="Guild Name"
              placeholder="Enter guild name…"
              ariaLabel="Guild name"
              maxLength={50}
            />
            <GuildDescriptionEditor
              value={description}
              onChange={(json) => pushAndUpdate((prev) => ({ ...prev, description: json }))}
            />
          </Stack>
        </Stack>
      </CardContent>

      {/* Armor editor dialog */}
      <ArmorEditor
        open={armorDialogOpen}
        guildName={name}
        guildDescription={description}
        initialConfig={config}
        onSave={handleArmorSave}
        onClose={() => setArmorDialogOpen(false)}
        autoSaveDelay={0}
      />
    </Card>
  )
}

export default GuildEditor
