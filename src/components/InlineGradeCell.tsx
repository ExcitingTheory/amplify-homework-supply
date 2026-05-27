/**
 * InlineGradeCell — Lexical-powered inline grade cell with click-to-edit.
 *
 * Architecture:
 *   - Click-to-edit: cells show the grade in view mode, click opens Lexical editor
 *   - Grid navigation works in BOTH view and edit modes via GradeCellRegistry
 *   - Tab/Shift+Tab: moves between columns, opens editor if source was editing
 *   - Up/Down arrows: moves between rows, opens editor if source was editing
 *   - Enter: opens editor or navigates to student work (view mode)
 *   - Selected state: ring highlight shows which cell is focused
 *   - Placeholder shows actual computed grade when override field is empty
 *   - Shared HistoryState across all grade cells for unified Cmd+Z / Cmd+Shift+Z
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
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
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
// Grid Navigation Registry — works across view AND edit modes
// ============================================================================

interface CellEntry {
  /** DOM element for focus in view mode */
  element: HTMLElement
  /** Opens the Lexical editor for this cell */
  startEditing: () => void
  /** Whether this cell is currently in edit mode */
  isEditing: () => boolean
  /** Navigates to student work */
  viewWork: () => void
}

/** Registry that tracks all grade cells by (row, col) for keyboard navigation */
export interface GradeCellRegistry {
  register: (row: number, col: number, entry: CellEntry) => void
  unregister: (row: number, col: number) => void
  /** Focus a cell — if openEditor is true, also start editing */
  navigateTo: (row: number, col: number, openEditor: boolean) => boolean
  /** Register a Lexical editor for a cell (used when in edit mode) */
  registerEditor: (row: number, col: number, editor: LexicalEditor) => void
  unregisterEditor: (row: number, col: number) => void
  /** Get the number of columns (max col + 1) */
  getMaxCol: () => number
  /** Get the number of rows (max row + 1) */
  getMaxRow: () => number
}

/** Create a new grid navigation registry */
export function createGradeCellRegistry(): GradeCellRegistry {
  const cells = new Map<string, CellEntry>()
  const editors = new Map<string, LexicalEditor>()

  const key = (row: number, col: number) => `${row},${col}`

  return {
    register(row, col, entry) {
      cells.set(key(row, col), entry)
    },
    unregister(row, col) {
      cells.delete(key(row, col))
    },
    registerEditor(row, col, editor) {
      editors.set(key(row, col), editor)
    },
    unregisterEditor(row, col) {
      editors.delete(key(row, col))
    },
    navigateTo(row, col, openEditor) {
      const cell = cells.get(key(row, col))
      if (!cell) return false
      if (openEditor) {
        cell.startEditing()
      } else {
        cell.element.focus()
      }
      return true
    },
    getMaxCol() {
      let max = -1
      for (const k of cells.keys()) {
        const c = parseInt(k.split(',')[1], 10)
        if (c > max) max = c
      }
      return max + 1
    },
    getMaxRow() {
      let max = -1
      for (const k of cells.keys()) {
        const r = parseInt(k.split(',')[0], 10)
        if (r > max) max = r
      }
      return max + 1
    },
  }
}

/** Context to provide the registry to all InlineGradeCell components in a table */
export const GradeCellRegistryContext = createContext<GradeCellRegistry | null>(null)

// ============================================================================
// GridNavPlugin — handles Up/Down/Tab/Escape navigation inside Lexical editor
// ============================================================================

function GridNavPlugin({ row, col }: { row: number; col: number }) {
  const [editor] = useLexicalComposerContext()
  const registry = useContext(GradeCellRegistryContext)

  // Register this editor with the grid
  useEffect(() => {
    if (!registry) return
    registry.registerEditor(row, col, editor)
    return () => registry.unregisterEditor(row, col)
  }, [registry, row, col, editor])

  // Key handlers for grid navigation while editing
  useEffect(() => {
    if (!registry) return

    const removeUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        if (registry.navigateTo(row - 1, col, true)) {
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
        if (registry.navigateTo(row + 1, col, true)) {
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
        if (registry.navigateTo(row, nextCol, true)) {
          event.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    const removeEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event) => {
        // Escape closes editor and returns to view mode (blur handler does that)
        editor.blur()
        event?.preventDefault()
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      removeUp()
      removeDown()
      removeTab()
      removeEscape()
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
// EditablePlugin — controls editor editable state and focus
// ============================================================================

function EditablePlugin({ active }: { active: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.setEditable(active)
    if (active) {
      // Use rAF to ensure the DOM is ready before focusing
      requestAnimationFrame(() => editor.focus())
    }
  }, [editor, active])

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

  // Click-to-edit state
  const [editing, setEditing] = React.useState(false)
  const [selected, setSelected] = React.useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const registry = useContext(GradeCellRegistryContext)

  // Stable refs for registry callbacks
  const editingRef = useRef(editing)
  editingRef.current = editing

  const startEditing = useCallback(() => {
    setEditing(true)
    setSelected(true)
  }, [])

  const viewWork = useCallback(() => {
    onGradeClick()
  }, [onGradeClick])

  // Register this cell with the grid registry (view + edit mode)
  useEffect(() => {
    if (!registry || row == null || col == null || !wrapperRef.current) return
    const entry: CellEntry = {
      element: wrapperRef.current,
      startEditing,
      isEditing: () => editingRef.current,
      viewWork,
    }
    registry.register(row, col, entry)
    return () => registry.unregister(row, col)
  }, [registry, row, col, startEditing, viewWork])

  // Handle keyboard events in view mode (on the wrapper div)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!registry || row == null || col == null) return
      if (editing) return // Lexical handles keys in edit mode

      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          if (isOwner) {
            startEditing()
          } else {
            onGradeClick()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          registry.navigateTo(row - 1, col, false)
          break
        case 'ArrowDown':
          e.preventDefault()
          registry.navigateTo(row + 1, col, false)
          break
        case 'Tab': {
          const nextCol = e.shiftKey ? col - 1 : col + 1
          if (registry.navigateTo(row, nextCol, false)) {
            e.preventDefault()
          }
          break
        }
      }
    },
    [registry, row, col, editing, isOwner, startEditing, onGradeClick],
  )

  // Track focus/blur for selected state
  const handleFocus = useCallback(() => setSelected(true), [])
  const handleBlurWrapper = useCallback(() => {
    // Delay to check if focus moved to a child (like the editor)
    requestAnimationFrame(() => {
      if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
        setSelected(false)
      }
    })
  }, [])

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
      const trimmed = text.replace(/[%*]/g, '').trim()

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
      setEditing(false)
    },
    [onRemoveOverride],
  )

  const initialConfig = React.useMemo(
    () => ({
      namespace: 'GradeCell',
      onError: (error: Error) => console.error('[InlineGradeCell]', error),
      editable: false, // EditablePlugin controls this based on editing state
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

  // Selected ring style
  const selectedRingSx = selected
    ? { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '1px', borderRadius: 0.5 }
    : {}

  // Read-only display mode for non-owners
  if (!isOwner) {
    const displayValue = hasOverride ? `${Math.round(overrideScore)}%*` : computedGrade
    return (
      <Box
        ref={wrapperRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlurWrapper}
        onClick={onGradeClick}
        sx={{ cursor: 'pointer', display: 'inline-block', px: 0.5, ...selectedRingSx }}
      >
        <span>{displayValue}</span>
      </Box>
    )
  }

  const displayValue = hasOverride ? `${Math.round(overrideScore)}%` : computedGrade

  // Always-mounted editor — toggle between view and edit mode without remounting
  return (
    <Box
      ref={wrapperRef}
      tabIndex={editing ? undefined : 0}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlurWrapper}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.5, ...selectedRingSx }}
    >
      {/* View mode — grade display */}
      {!editing && (
        <>
          <Tooltip title="Click to override grade" arrow>
            <span
              onClick={startEditing}
              style={{
                cursor: 'pointer',
                fontSize: '0.8125rem',
                color: hasOverride ? '#1976d2' : undefined,
                fontWeight: hasOverride ? 600 : undefined,
                whiteSpace: 'nowrap',
                borderBottom: '1px dashed',
                borderBottomColor: hasOverride ? '#1976d2' : '#ccc',
              }}
            >
              {displayValue}
            </span>
          </Tooltip>

          {overrideOverwritesGrade && (
            <Tooltip title={`Overriding computed grade of ${Math.round(rawHighest)}%`} arrow>
              <WarningAmberIcon sx={{ fontSize: 14, color: 'warning.main', opacity: 0.85 }} />
            </Tooltip>
          )}

          <Tooltip title="View student work" arrow>
            <IconButton
              size="small"
              tabIndex={-1}
              onClick={onGradeClick}
              sx={{ p: 0.25, opacity: 0.6, '&:hover': { opacity: 1, color: 'primary.main' } }}
            >
              <VisibilityIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </>
      )}

      {/* Always-mounted Lexical editor — hidden in view mode, visible in edit mode */}
      <LexicalComposer initialConfig={initialConfig}>
        <Box
          sx={{
            border: '1.5px solid',
            borderColor: 'primary.main',
            borderRadius: '3px',
            px: '4px',
            minWidth: 40,
            maxWidth: 56,
            bgcolor: 'background.paper',
            boxShadow: editing ? 1 : 0,
            position: 'relative',
            display: editing ? 'inline-flex' : 'none',
            alignItems: 'center',
          }}
        >
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="Grade override"
                style={{
                  outline: 'none',
                  fontSize: '0.8125rem',
                  lineHeight: '1.2',
                  padding: '1px 0',
                  textAlign: 'right',
                  minWidth: 32,
                }}
              />
            }
            placeholder={
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '4px',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  pointerEvents: 'none',
                  fontSize: '0.8125rem',
                  lineHeight: '1.2',
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
        <BlurFlushPlugin flushSave={(text) => { flushSave(text); setEditing(false); }} />
        <SyncValuePlugin value={externalValue} />
        <EditablePlugin active={editing} />
        {row != null && col != null && <GridNavPlugin row={row} col={col} />}
      </LexicalComposer>

      {/* Remove override button (only when override exists and editing) */}
      {editing && hasOverride && (
        <Tooltip title="Remove override" arrow>
          <IconButton
            size="small"
            tabIndex={-1}
            onClick={handleRemoveClick}
            sx={{ p: 0.125, opacity: 0.6, '&:hover': { opacity: 1, color: 'error.main' } }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      )}
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
