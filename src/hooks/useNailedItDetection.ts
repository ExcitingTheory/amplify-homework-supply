/**
 * useNailedItDetection — Hook that watches AI feedback messages for Nailed It
 * JSON envelopes, triggers celebrations, and awards XP.
 *
 * Wraps nailedItParser to integrate with the React component tree.
 *
 * @module useNailedItDetection
 */

import { useCallback, useRef, useState } from 'react'
import { parseNailedItResponse } from '../utils/nailedItParser'
import type { NailedItResult } from '../utils/nailedItParser'

export interface UseNailedItDetectionOptions {
  onNailedIt?: (result: NailedItResult) => void
  onAwardXP?: (xp: number, reason: string) => void
}

export interface UseNailedItDetectionReturn {
  processResponse: (response: string) => NailedItResult
  lastResult: NailedItResult | null
  showCelebration: boolean
  dismissCelebration: () => void
}

export function useNailedItDetection(
  options: UseNailedItDetectionOptions = {},
): UseNailedItDetectionReturn {
  const { onNailedIt, onAwardXP } = options
  const [lastResult, setLastResult] = useState<NailedItResult | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const processedRef = useRef<Set<string>>(new Set())

  const processResponse = useCallback(
    (response: string): NailedItResult => {
      const result = parseNailedItResponse(response)

      // Deduplicate — don't re-trigger for same response
      const hash = response.slice(0, 100)
      if (processedRef.current.has(hash)) {
        return result
      }
      processedRef.current.add(hash)

      setLastResult(result)

      if (result.nailedIt) {
        setShowCelebration(true)
        onNailedIt?.(result)
        if (result.xpToAward > 0) {
          onAwardXP?.(result.xpToAward, result.nailedItReason || 'Nailed It!')
        }
      }

      return result
    },
    [onNailedIt, onAwardXP],
  )

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  return {
    processResponse,
    lastResult,
    showCelebration,
    dismissCelebration,
  }
}

export default useNailedItDetection
