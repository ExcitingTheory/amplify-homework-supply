/**
 * XPContext — Global context for XP state, toast queue, and level tracking.
 *
 * Subscribes to StudentXPLog via observeQuery, calculates totals using
 * xpCalculation utilities, and queues XP toasts when new entries arrive.
 *
 * @module XPContext
 */

import React, { createContext, useContext, useEffect, useReducer, useRef, useCallback, useMemo } from 'react'
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
// Reducer
// ============================================================================

interface XPState {
  xpLogs: StudentXPLog[]
  isLoading: boolean
  toastQueue: XPToastItem[]
  currentToast: XPToastItem | null
}

type XPAction =
  | { type: 'SET_LOGS'; logs: StudentXPLog[] }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'ENQUEUE_TOASTS'; toasts: XPToastItem[] }
  | { type: 'SHOW_NEXT_TOAST' }
  | { type: 'DISMISS_TOAST' }

const initialXPState: XPState = {
  xpLogs: [],
  isLoading: true,
  toastQueue: [],
  currentToast: null,
}

function xpReducer(state: XPState, action: XPAction): XPState {
  switch (action.type) {
    case 'SET_LOGS':
      return { ...state, xpLogs: action.logs, isLoading: false }

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }

    case 'ENQUEUE_TOASTS':
      return { ...state, toastQueue: [...state.toastQueue, ...action.toasts] }

    case 'SHOW_NEXT_TOAST': {
      if (state.currentToast || state.toastQueue.length === 0) return state
      const [next, ...rest] = state.toastQueue
      return { ...state, currentToast: next, toastQueue: rest }
    }

    case 'DISMISS_TOAST':
      return { ...state, currentToast: null }

    default:
      return state
  }
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
  [XPReason.STREAK_14DAY]: '14-day streak',
  [XPReason.STREAK_30DAY]: '30-day streak',
  [XPReason.PERFECT_SCORE]: 'Perfect score',
  [XPReason.COMEBACK]: 'Comeback!',
  [XPReason.PERSONAL_BEST]: 'New personal best!',
  [XPReason.EASTER_EGG]: 'Secret discovered!',
  [XPReason.SQUAD_CHALLENGE_BONUS]: 'Squad challenge bonus',
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
  const [state, dispatch] = useReducer(xpReducer, initialXPState)
  const { xpLogs, isLoading, currentToast } = state
  const knownIdsRef = useRef<Set<string>>(new Set())
  const initialLoadRef = useRef(true)
  const xpVersionMapRef = useRef<Record<string, number>>({})

  // Subscribe to StudentXPLog
  useEffect(() => {
    if (!client?.models?.StudentXPLog || !studentId) return

    const subscription = client.models.StudentXPLog.observeQuery({
      filter: { studentId: { eq: studentId } },
    }).subscribe({
      next: ({ items }: { items: any[] }) => {
        const validItems = items.filter((item: any) => item != null && item.id != null)

        // Version map guard: skip dispatch if no item has a newer _version
        const hasChanges = validItems.some((item: any) => {
          const tracked = xpVersionMapRef.current[item.id]
          return tracked == null || item._version > tracked
        })

        if (!hasChanges && Object.keys(xpVersionMapRef.current).length > 0) {
          return
        }

        // Update version map
        xpVersionMapRef.current = {}
        validItems.forEach((item: any) => {
          xpVersionMapRef.current[item.id] = item._version
        })

        dispatch({ type: 'SET_LOGS', logs: validItems })

        // Queue toasts for new entries (skip initial load)
        if (!initialLoadRef.current) {
          const newEntries = validItems.filter((item: any) => !knownIdsRef.current.has(item.id))
          if (newEntries.length > 0) {
            dispatch({
              type: 'ENQUEUE_TOASTS',
              toasts: newEntries.map((entry: any) => ({
                id: entry.id,
                xpAmount: entry.xpAmount,
                xpReason: REASON_LABELS[entry.reason] || entry.reason,
              })),
            })
          }
        }

        // Update known IDs
        knownIdsRef.current = new Set(validItems.map((item: any) => item.id))
        initialLoadRef.current = false
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || err?.error?.errors?.[0]?.message || String(err)
        if (msg.includes('DuplicatedOperationError')) {
          console.warn('[XPContext] subscription: transient DuplicatedOperationError (safe to ignore)')
          return
        }
        console.error('[XPContext] subscription error:', err)
        dispatch({ type: 'SET_LOADING', isLoading: false })
      },
    })

    return () => subscription.unsubscribe()
  }, [client, studentId])

  // Process toast queue — show one at a time
  useEffect(() => {
    dispatch({ type: 'SHOW_NEXT_TOAST' })
  }, [state.toastQueue, state.currentToast])

  const handleToastClose = useCallback(() => {
    dispatch({ type: 'DISMISS_TOAST' })
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
