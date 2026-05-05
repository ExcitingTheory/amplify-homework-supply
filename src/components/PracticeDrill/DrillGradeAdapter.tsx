/**
 * @fileoverview DrillGradeAdapter — Provides a UnitContext override that lets
 * the existing Editor3/Workbook render AI-generated drill content.
 *
 * Supplies:
 *  • A synthetic `unit` whose `data` field contains the drill Lexical JSON
 *    (so WorkbookStatePlugin loads it automatically).
 *  • A local `grade` / `saveGrade` pair backed by React state instead of
 *    DynamoDB, so graded block components function normally.
 *  • Disables unit-level completion / workbook collaboration side effects.
 *
 * Wrap the real `<Workbook />` in this adapter and it "just works".
 */

import React, { useCallback, useRef, useMemo, useContext } from 'react'
import UnitContext from '../../context/unitContext'
import { buildDrillEditorState } from './buildDrillEditorState'
import type { PracticeDrillBlock } from './buildDrillEditorState'
import DictionaryContext from '../../context/dictionaryContext'

// ============================================================================
// Types
// ============================================================================

interface DrillGradeAdapterProps {
  /** Drill session ID */
  sessionId: string
  /** AI-generated drill blocks */
  blocks: PracticeDrillBlock[]
  /** Called when grade data changes */
  onGradeChange?: (gradeData: Record<string, any>, stats: DrillStats) => void
  children: React.ReactNode
}

export interface DrillStats {
  blocksCompleted: number
  accuracy: number
  complete: boolean
}

// ============================================================================
// Component
// ============================================================================

export default function DrillGradeAdapter({
  sessionId,
  blocks,
  onGradeChange,
  children,
}: DrillGradeAdapterProps) {
  const parentContext = useContext(UnitContext)
  const { wordMapId: dictionary } = useContext(DictionaryContext)
  const gradeDataRef = useRef<Record<string, any>>({})
  const [gradeData, setGradeData] = React.useState<Record<string, any>>({})

  // Count graded blocks
  const gradedBlockCount = useMemo(
    () => blocks.filter((b) =>
      ['quiz', 'answer', 'meaning-association', 'custom-answer'].includes(b.type),
    ).length,
    [blocks],
  )

  // Build Lexical editor state JSON from drill blocks.
  // This becomes unit.data so WorkbookStatePlugin loads it.
  const editorStateJSON = useMemo(
    () => (blocks.length > 0 ? JSON.stringify(buildDrillEditorState(blocks, dictionary)) : null),
    [blocks, dictionary],
  )

  // Synthetic unit object — WorkbookStatePlugin reads unit.data
  const syntheticUnit = useMemo(() => ({
    id: `drill-${sessionId}`,
    name: 'Practice Drill',
    data: editorStateJSON,
    _version: 1,
  }), [sessionId, editorStateJSON])

  // Synthetic grade — graded components read grade.data[nodeKey]
  const grade = useMemo(() => ({
    id: `drill-grade-${sessionId}`,
    data: gradeData,
    complete: false,
    accuracy: null,
    _version: 1,
  }), [sessionId, gradeData])

  // Stats computation
  const computeStats = useCallback((data: Record<string, any>): DrillStats => {
    const entries = Object.values(data)
    const completed = entries.filter((e) => e?.complete === true).length
    const accuracies = entries
      .filter((e) => e?.complete === true && typeof e?.accuracy === 'number')
      .map((e) => e.accuracy)
    // Normalize: QuizComponent uses 0-100, MeaningAssociation uses 0-1
    const normalizedAccuracies = accuracies.map((a) => (a <= 1 ? a * 100 : a))
    const avgAccuracy = normalizedAccuracies.length > 0
      ? Math.round(normalizedAccuracies.reduce((s, v) => s + v, 0) / normalizedAccuracies.length)
      : 0

    return {
      blocksCompleted: completed,
      accuracy: avgAccuracy,
      complete: gradedBlockCount > 0 && completed >= gradedBlockCount,
    }
  }, [gradedBlockCount])

  // Local saveGrade — no DynamoDB write
  const saveGrade = useCallback(async (data: Record<string, any>) => {
    gradeDataRef.current = data
    setGradeData({ ...data })

    const stats = computeStats(data)
    onGradeChange?.(data, stats)
  }, [computeStats, onGradeChange])

  // Override UnitContext with drill-specific values
  const contextValue = useMemo(() => ({
    ...parentContext,
    // Synthetic unit with drill content as Lexical JSON
    unit: syntheticUnit,
    // Local grade state
    grade,
    saveGrade,
    rubric: new Array(gradedBlockCount).fill(null),
    // Prevent real unit completion logic
    showUnitComplete: false,
    setShowUnitComplete: () => {},
    // Stub workbook collaboration (drills don't use tutor cursors etc.)
    workbook: { setFeedback: () => {} },
    workbookEnabled: false,
    workbookStats: null,
    // Empty recent grades — no re-take flow for drills
    recentGrades: [],
  }), [parentContext, syntheticUnit, grade, saveGrade, gradedBlockCount])

  return (
    <UnitContext.Provider value={contextValue as any}>
      {children}
    </UnitContext.Provider>
  )
}
