/**
 * InlineGradeCell — Lexical-powered inline grade cell with OnChangePlugin autosave.
 *
 * Architecture follows the project's standard Lexical autosave pattern:
 *   - Always-editable Lexical PlainTextPlugin (when isOwner)
 *   - OnChangePlugin fires on every keystroke → debounced autosave
 *   - Shared HistoryState across all grade cells for unified Cmd+Z / Cmd+Shift+Z
 *   - SyncValuePlugin syncs external value changes into the editor
 *   - Validates 0-100 numeric input before saving
 *   - Empty field removes the override
 *   - Grid navigation: Up/Down arrows move between rows, Tab/Shift+Tab between columns
 *
 * @module InlineGradeCell
 */

import React, { useEffect, useRef, useCallback, useContext, createContext } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin, createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  BLUR_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_TAB_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_HIGH,
} from 'lexical'
import type { EditorState, LexicalEditor } from 'lexical'
import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

// ============================================================================
// Debounce delay for autosave (ms)
// ============================================================================
const AUTOSAVE_DEBOUNCE_MS = 800

// ============================================================================
// Grid Navigation Registry
// ============================================================================

/** Registry that tracks all grade cell editors by (row, col) for keyboard navigation */
export interface GradeCellRegistry {
  register: (row: number, col: number, editor: LexicalEditor) => void
  unregister: (row: number, col: number) => void
  focusCell: (row: number, col: number) => boolean
}

/** Create a new grid navigation registry */
export function createGradeCellRegistry(): GradeCellRegistry {
  const cells = new Map<string, LexicalEditor>()

  const key = (row: number, col: number) => `${row},${col}`

  return {
    register(row, col, editor) {
      cells.set(key(row, col), editor)
    },
    unregister(row, col) {
      cells.delete(key(row, col))
    },
    focusCell(row, col) {
      const editor = cells.get(key(row, col))
      if (editor) {
        editor.focus()
        return true
      }
      return false
    },
  }
}

/** Context to provide the registry to all InlineGradeCell components in a table */
export const GradeCellRegistryContext = createContext<GradeCellRegistry | null>(null)

// ============================================================================
// GridNavPlugin — registers cell and handles Up/Down/Tab navigation
// ============================================================================

function GridNavPlugin({ row, col }: { row: number; col: number }) {
  const [editor] = useLexicalComposerContext()
  const registry = useContext(GradeCellRegistryContext)

  // Register this cell's editor with the grid
  useEffect(() => {
    if (!registry) return
    registry.register(row, col, editor)
    return () => registry.unregister(row, col)
  }, [registry, row, col, editor])

  // Key handlers for grid navigation
  useEffect(() => {
    if (!registry) return

    const removeUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        if (registry.focusCell(row - 1, col)) {
          event?.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    const removeDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        if (registry.focusCell(row + 1, col)) {
          event?.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    const removeTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        if (!event) return false
        const nextCol = event.shiftKey ? col - 1 : col + 1
        if (registry.focusCell(row, nextCol)) {
          event.preventDefault()
          return true
        }
        // Wrap: if at end of row, go to next row first column (or prev row last)
        // Let browser handle if no adjacent cell found
        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      removeUp()
      removeDown()
      removeTab()
    }
  }, [editor, registry, row, col])

  return null
}

// ============================================================================
// SyncValuePlugin — syncs external value into editor without polluting undo stack
// ============================================================================

function SyncValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext()
  const lastExternalValue = useRef(value)

  useEffect(() => {
    if (value === lastExternalValue.current) return
    lastExternalValue.current = value

    editor.update(
      () => {
        const root = $getRoot()
        if (root.getTextContent() === value) return
        root.clear()
        const p = $createParagraphNode()
        if (value) p.append($createTextNode(value))
        root.append(p)
      },
      { tag: 'history-merge' },
    )
  }, [value, editor])

  return null
}

// ============================================================================
// BlurPlugin — fires onBlur when editor loses focus (triggers immediate save)
// ============================================================================

function BlurPlugin({ onBlur }: { onBlur: () => void }) {
  const [editor] = useLexicalComposerContext()
  const onBlurRef = useRef(onBlur)
  onBlurRef.current = onBlur

  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        onBlurRef.current()
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return null
}

// ============================================================================
// Props
// ============================================================================

export interface InlineGradeCellProps {
  /** Computed grade string to display (e.g. "85% (78%)") */
  computedGrade: string
  /** Raw highest accuracy for this cell (number or undefined) */
  rawHighest: number | undefined
  /** Existing override score, if any */
  overrideScore: number | undefined
  /** Shared Lexical HistoryState for unified undo/redo */
  sharedHistory: HistoryState
  /** Called when instructor saves a valid override score (debounced) */
  onOverride: (score: number) => void
  /** Called when the override is cleared (field emptied) */
  onRemoveOverride: () => void
  /** Called when instructor clicks the computed grade label (navigate to review) */
  onGradeClick: () => void
  /** Whether the current user is an instructor/owner */
  isOwner: boolean
  /** Row index in the gradebook table (for Up/Down navigation) */
  row?: number
  /** Column index in the gradebook table (for Tab navigation) */
  col?: number
}

// ============================================================================
// Component
// ============================================================================

export function InlineGradeCell({
  computedGrade,
  rawHighest,
  overrideScore,
  sharedHistory,
  onOverride,
  onRemoveOverride,
  onGradeClick,
  isOwner,
  row,
  col,
}: InlineGradeCellProps) {
  const hasOverride = overrideScore != null
  const overrideOverwritesGrade = hasOverride && rawHighest != null
  const externalValue = hasOverride ? String(Math.round(overrideScore)) : ''
  const placeholderText = rawHighest != null ? String(Math.round(rawHighest)) : '—'

  // Debounced autosave timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>(externalValue)

  // Flush any pending save immediately (called on blur)
  const flushSave = useCallback(
    (text: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const trimmed = text.replace('%', '').replace('*', '').trim()

      // Empty → remove override
      if (!trimmed) {
        if (lastSavedRef.current !== '') {
          lastSavedRef.current = ''
          onRemoveOverride()
        }
        return
      }

      const num = parseFloat(trimmed)
      if (!isNaN(num) && num >= 0 && num <= 100) {
        const rounded = Math.round(num * 100) / 100
        const roundedStr = String(rounded)
        if (lastSavedRef.current !== roundedStr) {
          lastSavedRef.current = roundedStr
          onOverride(rounded)
        }
      }
    },
    [onOverride, onRemoveOverride],
  )

  // OnChangePlugin handler — debounced autosave
  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent()

        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
        }
        saveTimerRef.current = setTimeout(() => {
          flushSave(text)
        }, AUTOSAVE_DEBOUNCE_MS)
      })
    },
    [flushSave],
  )

  // Flush on blur (immediate save of pending changes)
  const handleBlur = useCallback(() => {
    // Read current text synchronously isn't possible outside editor,
    // so we just flush whatever is pending
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    // The OnChangePlugin already captured the latest text and scheduled a save.
    // We need to read the editor to get the current value.
    // This is handled by the BlurFlushPlugin below.
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Keep lastSavedRef in sync when external value changes
  useEffect(() => {
    lastSavedRef.current = externalValue
  }, [externalValue])

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemoveOverride()
    },
    [onRemoveOverride],
  )

  const initialConfig = React.useMemo(
    () => ({
      namespace: 'GradeCell',
      onError: (error: Error) => console.error('[InlineGradeCell]', error),
      editable: true,
      editorState: () => {
        const root = $getRoot()
        const p = $createParagraphNode()
        if (externalValue) p.append($createTextNode(externalValue))
        root.append(p)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // Stable — SyncValuePlugin handles external updates
  )

  // Read-only display mode for non-owners
  if (!isOwner) {
    const displayValue = hasOverride ? `${Math.round(overrideScore)}%*` : computedGrade
    return <span>{displayValue}</span>
  }

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {/* Computed grade display */}
      <span
        style={{
          fontSize: '0.8125rem',
          color: hasOverride ? '#1976d2' : undefined,
          fontWeight: hasOverride ? 600 : undefined,
          whiteSpace: 'nowrap',
        }}
      >
        {computedGrade}
      </span>

      {/* Inline editable override field */}
      <LexicalComposer initialConfig={initialConfig}>
        <Box
          sx={{
            border: '1.5px solid',
            borderColor: hasOverride ? 'primary.main' : 'divider',
            borderRadius: 0.5,
            px: 0.5,
            py: 0.125,
            minWidth: 32,
            maxWidth: 48,
            bgcolor: 'background.paper',
            transition: 'border-color 0.15s ease',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: 1,
            },
          }}
        >
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="Grade override"
                style={{
                  outline: 'none',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                  textAlign: 'right',
                  minWidth: 24,
                }}
              />
            }
            placeholder={
              <div
                style={{
                  position: 'absolute',
                  top: '1px',
                  right: '4px',
                  color: '#999',
                  pointerEvents: 'none',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                }}
              >
                {placeholderText}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </Box>
        <HistoryPlugin externalHistoryState={sharedHistory} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <BlurFlushPlugin flushSave={flushSave} />
        <SyncValuePlugin value={externalValue} />
        {row != null && col != null && <GridNavPlugin row={row} col={col} />}
      </LexicalComposer>

      {/* Warning icon when override overwrites an actual grade */}
      {overrideOverwritesGrade && (
        <Tooltip title={`Overriding computed grade of ${Math.round(rawHighest)}%`} arrow>
          <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main', opacity: 0.85 }} />
        </Tooltip>
      )}

      {/* Remove override button (only when override exists) */}
      {hasOverride && (
        <Tooltip title="Remove override" arrow>
          <IconButton
            size="small"
            onClick={handleRemoveClick}
            sx={{ p: 0.125, opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* View student work button */}
      <Tooltip title="View student work" arrow>
        <IconButton
          size="small"
          onClick={onGradeClick}
          sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1, color: 'primary.main' } }}
        >
          <VisibilityIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

// ============================================================================
// BlurFlushPlugin — reads editor text on blur and flushes save immediately
// ============================================================================

function BlurFlushPlugin({ flushSave }: { flushSave: (text: string) => void }) {
  const [editor] = useLexicalComposerContext()
  const flushRef = useRef(flushSave)
  flushRef.current = flushSave

  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        const text = editor.getEditorState().read(() => $getRoot().getTextContent())
        flushRef.current(text)
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return null
}

export { createEmptyHistoryState }
export type { HistoryState }
export default InlineGradeCell
