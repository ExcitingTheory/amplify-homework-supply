/**
 * XPContext — Global context for XP state, toast queue, and level tracking.
 *
 * Subscribes to StudentXPLog via observeQuery, calculates totals using
 * xpCalculation utilities, and queues XP toasts when new entries arrive.
 *
 * @module XPContext
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { XPToast } from '../components/Gamification/XPToast'
import { calculateTotalXP, getLevelInfo, XPReason } from '../utils/xpCalculation'
import type { StudentXPLog, LevelInfo } from '../utils/xpCalculation'

// ============================================================================
// Types
// ============================================================================

interface XPToastItem {
  id: string
  xpAmount: number
  xpReason: string
}

interface XPContextValue {
  totalXP: number
  level: LevelInfo
  xpLogs: StudentXPLog[]
  isLoading: boolean
}

// ============================================================================
// Context
// ============================================================================

const XPContext = createContext<XPContextValue>({
  totalXP: 0,
  level: { level: 1, label: 'Beginner', xpRequired: 0, xpForNextLevel: 100, progress: 0 },
  xpLogs: [],
  isLoading: true,
})

export function useXP(): XPContextValue {
  return useContext(XPContext)
}

// ============================================================================
// Friendly labels
// ============================================================================

const REASON_LABELS: Record<string, string> = {
  [XPReason.HOMEWORK_SUBMITTED]: 'Homework submitted',
  [XPReason.AI_FEEDBACK_REVISED]: 'Revised after AI feedback',
  [XPReason.ALL_BLOCKS_COMPLETED]: 'All blocks complete',
  [XPReason.PEER_REVIEW_GIVEN]: 'Peer review (reviewer)',
  [XPReason.PEER_REVIEW_HOSTED]: 'Peer review (host)',
  [XPReason.NAILED_IT]: 'Nailed It!',
  [XPReason.ON_TIME_SUBMISSION]: 'On-time submission',
  [XPReason.STREAK_3DAY]: '3-day streak',
  [XPReason.STREAK_7DAY]: '7-day streak',
  [XPReason.PERFECT_SCORE]: 'Perfect score',
}

// ============================================================================
// Provider
// ============================================================================

export interface XPProviderProps {
  client: any // Amplify Data Client
  studentId: string
  children: React.ReactNode
}

export function XPProvider({ client, studentId, children }: XPProviderProps) {
  const [xpLogs, setXpLogs] = useState<StudentXPLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toastQueue, setToastQueue] = useState<XPToastItem[]>([])
  const [currentToast, setCurrentToast] = useState<XPToastItem | null>(null)
  const knownIdsRef = useRef<Set<string>>(new Set())
  const initialLoadRef = useRef(true)

  // Subscribe to StudentXPLog
  useEffect(() => {
    if (!client?.models?.StudentXPLog || !studentId) return

    const subscription = client.models.StudentXPLog.observeQuery({
      filter: { studentId: { eq: studentId } },
    }).subscribe({
      next: ({ items }: { items: any[] }) => {
        const validItems = items.filter((item: any) => item != null && item.id != null)
        setXpLogs(validItems)

        // Queue toasts for new entries (skip initial load)
        if (!initialLoadRef.current) {
          const newEntries = validItems.filter((item: any) => !knownIdsRef.current.has(item.id))
          for (const entry of newEntries) {
            setToastQueue((prev) => [
              ...prev,
              {
                id: entry.id,
                xpAmount: entry.xpAmount,
                xpReason: REASON_LABELS[entry.reason] || entry.reason,
              },
            ])
          }
        }

        // Update known IDs
        knownIdsRef.current = new Set(validItems.map((item: any) => item.id))
        initialLoadRef.current = false
        setIsLoading(false)
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || err?.error?.errors?.[0]?.message || String(err)
        if (msg.includes('DuplicatedOperationError')) {
          console.warn('[XPContext] subscription: transient DuplicatedOperationError (safe to ignore)')
          return
        }
        console.error('[XPContext] subscription error:', err)
        setIsLoading(false)
      },
    })

    return () => subscription.unsubscribe()
  }, [client, studentId])

  // Process toast queue — show one at a time
  useEffect(() => {
    if (currentToast || toastQueue.length === 0) return
    const [next, ...rest] = toastQueue
    setCurrentToast(next)
    setToastQueue(rest)
  }, [toastQueue, currentToast])

  const handleToastClose = useCallback(() => {
    setCurrentToast(null)
  }, [])

  const totalXP = useMemo(() => calculateTotalXP(xpLogs), [xpLogs])
  const level = useMemo(() => getLevelInfo(totalXP), [totalXP])

  const contextValue = useMemo<XPContextValue>(
    () => ({ totalXP, level, xpLogs, isLoading }),
    [totalXP, level, xpLogs, isLoading],
  )

  return (
    <XPContext.Provider value={contextValue}>
      {children}
      <XPToast
        open={currentToast != null}
        xpAmount={currentToast?.xpAmount || 0}
        xpReason={currentToast?.xpReason || ''}
        onClose={handleToastClose}
      />
    </XPContext.Provider>
  )
}

export default XPContext
