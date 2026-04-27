/**
 * @fileoverview useDrillCoverage — Calculates content coverage from past
 * PracticeSessions for a given unit/student. Shows which vocabulary words,
 * questions, text blocks, and documents have been practiced.
 */

import { useState, useEffect, useMemo } from 'react'
import type { CoverageSnapshot } from './PracticeDrillConfigPopup'

// ============================================================================
// Types
// ============================================================================

interface PracticeSessionRecord {
  id: string
  unitID: string
  complete: boolean
  sourcesEnabled?: string // JSON string of { vocabulary: boolean, ... }
  coverageSnapshot?: string // JSON string
  generatedContent?: string // JSON string of PracticeDrillBlock[]
}

interface GeneratedBlock {
  sourceItemId?: string
  sourceType?: 'vocabulary' | 'question' | 'text' | 'document'
}

interface UseDrillCoverageOptions {
  unitId: string
  /** Past practice sessions for this unit (from context or query) */
  sessions: PracticeSessionRecord[]
  /** Total counts per source type in the current unit */
  totalCounts: {
    vocabulary: number
    questions: number
    text: number
    documents: number
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Computes a CoverageSnapshot by scanning past PracticeSession records
 * for unique sourceItemIds, grouped by sourceType.
 */
export function useDrillCoverage({
  unitId,
  sessions,
  totalCounts,
}: UseDrillCoverageOptions): CoverageSnapshot {
  const coverage = useMemo<CoverageSnapshot>(() => {
    const coveredSets: Record<string, Set<string>> = {
      vocabulary: new Set(),
      questions: new Set(),
      text: new Set(),
      documents: new Set(),
    }

    for (const session of sessions) {
      if (session.unitID !== unitId) continue
      if (!session.generatedContent) continue

      let blocks: GeneratedBlock[] = []
      try {
        blocks =
          typeof session.generatedContent === 'string'
            ? JSON.parse(session.generatedContent)
            : (session.generatedContent as unknown as GeneratedBlock[])
      } catch {
        continue
      }

      for (const block of blocks) {
        if (!block.sourceItemId || !block.sourceType) continue
        const sourceType = block.sourceType
        if (coveredSets[sourceType]) {
          coveredSets[sourceType].add(block.sourceItemId)
        }
      }
    }

    return {
      vocabulary: {
        total: totalCounts.vocabulary,
        covered: Math.min(coveredSets.vocabulary.size, totalCounts.vocabulary),
      },
      questions: {
        total: totalCounts.questions,
        covered: Math.min(coveredSets.questions.size, totalCounts.questions),
      },
      text: {
        total: totalCounts.text,
        covered: Math.min(coveredSets.text.size, totalCounts.text),
      },
      documents: {
        total: totalCounts.documents,
        covered: Math.min(coveredSets.documents.size, totalCounts.documents),
      },
    }
  }, [unitId, sessions, totalCounts])

  return coverage
}
