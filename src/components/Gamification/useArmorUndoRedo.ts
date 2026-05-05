/**
 * useArmorUndoRedo — Shared undo/redo hook for the ArmorEditor.
 *
 * Manages a single undo/redo stack encompassing:
 *   - Armor config (shape, colors, division, charges)
 *   - Guild name
 *   - Guild description
 *
 * Supports Ctrl/Cmd+Z (undo) and Ctrl/Cmd+Shift+Z (redo) keyboard shortcuts.
 *
 * @module useArmorUndoRedo
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ArmorEditorConfig } from './ArmorEditor'

export interface ArmorEditorSnapshot {
  config: ArmorEditorConfig
  name: string
  description: string
}

export interface UseArmorUndoRedoReturn {
  snapshot: ArmorEditorSnapshot
  setSnapshot: (next: ArmorEditorSnapshot) => void
  /** Push current state to history, then apply the updater */
  pushAndUpdate: (updater: (prev: ArmorEditorSnapshot) => ArmorEditorSnapshot) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** Reset the entire stack (e.g. when dialog opens) */
  reset: (initial: ArmorEditorSnapshot) => void
}

const MAX_HISTORY = 50

export function useArmorUndoRedo(initial: ArmorEditorSnapshot): UseArmorUndoRedoReturn {
  const [snapshot, setSnapshotRaw] = useState<ArmorEditorSnapshot>(initial)
  const [past, setPast] = useState<ArmorEditorSnapshot[]>([])
  const [future, setFuture] = useState<ArmorEditorSnapshot[]>([])

  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot

  const setSnapshot = useCallback((next: ArmorEditorSnapshot) => {
    setSnapshotRaw(next)
  }, [])

  const pushAndUpdate = useCallback(
    (updater: (prev: ArmorEditorSnapshot) => ArmorEditorSnapshot) => {
      setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), snapshotRef.current])
      setFuture([])
      setSnapshotRaw((prev) => updater(prev))
    },
    [],
  )

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setFuture((f) => [snapshotRef.current, ...f])
      setSnapshotRaw(last)
      return prev.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev
      const next = prev[0]
      setPast((p) => [...p, snapshotRef.current])
      setSnapshotRaw(next)
      return prev.slice(1)
    })
  }, [])

  const reset = useCallback((initial: ArmorEditorSnapshot) => {
    setSnapshotRaw(initial)
    setPast([])
    setFuture([])
  }, [])

  return {
    snapshot,
    setSnapshot,
    pushAndUpdate,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    reset,
  }
}
