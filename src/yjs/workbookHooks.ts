/**
 * React hooks for collaborative workbook editing
 * 
 * Provides hooks for managing workbook collaboration between students and tutors
 * using YJS for real-time synchronization.
 * 
 * @module workbookHooks
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { WorkbookCollaborationProvider, WorkbookUser, WorkbookBlockData, CommentThread, HistoryEntry } from './WorkbookCollaborationProvider'

export interface UseWorkbookCollaborationOptions {
  gradeId: string
  user: WorkbookUser
  initialData?: string | null // Grade.data JSON string
  onTutorJoin?: (tutor: WorkbookUser) => void
  onTutorLeave?: (tutor: WorkbookUser) => void
  onSyncToGrade?: (data: string, feedback: Record<string, any>) => void
  autoSyncToGrade?: boolean
  syncInterval?: number
  wsUrl?: string
}

export interface UseWorkbookCollaborationReturn {
  provider: WorkbookCollaborationProvider | null
  workbookData: WorkbookBlockData
  activeTutors: WorkbookUser[]
  connectedUsers: WorkbookUser[]
  isSynced: boolean
  isConnected: boolean
  hasTutorPresent: boolean
  updateBlock: <T extends Partial<WorkbookBlockData[string]>>(blockId: string, data: T) => void
  getBlock: (blockId: string) => WorkbookBlockData[string] | undefined
  deleteBlock: (blockId: string) => void
  setFeedback: (blockId: string, feedback: any) => void
  updateCursor: (blockId: string, position?: number) => void
  exportToGradeData: () => string
  getCompletionPercentage: () => number
  getOverallAccuracy: () => number
}

/**
 * Main hook for workbook collaboration
 * 
 * Manages the WorkbookCollaborationProvider lifecycle and provides
 * methods for interacting with the workbook data.
 * 
 * @example
 * ```tsx
 * function StudentWorkbook({ gradeId, currentUser, grade }) {
 *   const {
 *     provider,
 *     workbookData,
 *     updateBlock,
 *     activeTutors,
 *     connectedUsers,
 *     isSynced,
 *   } = useWorkbookCollaboration({
 *     gradeId,
 *     user: {
 *       username: currentUser.username,
 *       role: 'student',
 *       displayName: currentUser.name,
 *       color: '#3b82f6'
 *     },
 *     initialData: grade.data,
 *     onTutorJoin: (tutor) => {
 *       showNotification(`${tutor.displayName} joined to help`)
 *     },
 *     onSyncToGrade: async (data, feedback) => {
 *       await DataStore.save(
 *         Grade.copyOf(grade, updated => {
 *           updated.data = data
 *           updated.feedback = JSON.stringify(feedback)
 *         })
 *       )
 *     }
 *   })
 * 
 *   return (
 *     <div>
 *       {activeTutors.length > 0 && (
 *         <TutorPresenceBanner tutors={activeTutors} />
 *       )}
 *       <WorkbookEditor
 *         data={workbookData}
 *         onBlockUpdate={updateBlock}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function useWorkbookCollaboration(options: UseWorkbookCollaborationOptions | null): UseWorkbookCollaborationReturn {
  const {
    gradeId,
    user,
    initialData,
    onTutorJoin,
    onTutorLeave,
    onSyncToGrade,
    autoSyncToGrade = true,
    syncInterval = 3000,
    wsUrl,
  } = options || {} as UseWorkbookCollaborationOptions

  const providerRef = useRef<WorkbookCollaborationProvider | null>(null)
  const [workbookData, setWorkbookData] = useState<WorkbookBlockData>({})
  const [activeTutors, setActiveTutors] = useState<WorkbookUser[]>([])
  const [connectedUsers, setConnectedUsers] = useState<WorkbookUser[]>([])
  const [isSynced, setIsSynced] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Initialize provider
  useEffect(() => {
    if (!options || !gradeId || !user) return

    console.log(`[useWorkbookCollaboration] Initializing for grade ${gradeId}`)

    const provider = new WorkbookCollaborationProvider({
      gradeId,
      user,
      wsUrl,
      autoSyncToGrade,
      syncInterval,
      onTutorJoin: (tutor) => {
        setActiveTutors(provider.getActiveTutors())
        onTutorJoin?.(tutor)
      },
      onTutorLeave: (tutor) => {
        setActiveTutors(provider.getActiveTutors())
        onTutorLeave?.(tutor)
      },
    })

    providerRef.current = provider

    // Load initial data from Grade.data if provided
    if (initialData) {
      provider.loadFromGradeData(initialData)
    }

    // Set initial workbook data
    setWorkbookData(provider.getWorkbookData())

    // Subscribe to workbook data changes
    const unsubscribe = provider.onUpdate(() => {
      setWorkbookData(provider.getWorkbookData())
      setConnectedUsers(provider.getConnectedUsers())
    })

    // Subscribe to awareness changes
    const unsubscribeAwareness = provider.onAwarenessChange(() => {
      setActiveTutors(provider.getActiveTutors())
      setConnectedUsers(provider.getConnectedUsers())
    })

    // Listen for sync events
    const handleWorkbookSync = (event: CustomEvent) => {
      if (event.detail.gradeId === gradeId) {
        onSyncToGrade?.(event.detail.data, event.detail.feedback)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('workbook-sync', handleWorkbookSync as EventListener)
    }

    // Monitor connection status
    const wsProvider = (provider as any).wsProvider
    if (wsProvider) {
      wsProvider.on('sync', (synced: boolean) => {
        setIsSynced(synced)
      })

      wsProvider.on('status', ({ status }: { status: string }) => {
        setIsConnected(status === 'connected')
      })
    }

    return () => {
      unsubscribe()
      unsubscribeAwareness()
      if (typeof window !== 'undefined') {
        window.removeEventListener('workbook-sync', handleWorkbookSync as EventListener)
      }
      // Don't destroy provider on unmount - keeps connection alive
    }
  }, [gradeId, user?.username]) // Only reinitialize if gradeId or user changes

  const updateBlock = useCallback(
    <T extends Partial<WorkbookBlockData[string]>>(blockId: string, data: T) => {
      if (!providerRef.current) return
      providerRef.current.updateBlock(blockId, data)
    },
    []
  )

  const getBlock = useCallback((blockId: string) => {
    if (!providerRef.current) return undefined
    return providerRef.current.getBlock(blockId)
  }, [])

  const deleteBlock = useCallback((blockId: string) => {
    if (!providerRef.current) return
    providerRef.current.deleteBlock(blockId)
  }, [])

  const setFeedback = useCallback((blockId: string, feedback: any) => {
    if (!providerRef.current) return
    providerRef.current.setFeedback(blockId, feedback)
  }, [])

  const updateCursor = useCallback((blockId: string, position?: number) => {
    if (!providerRef.current) return
    providerRef.current.updateCursor(blockId, position)
  }, [])

  const exportToGradeData = useCallback(() => {
    if (!providerRef.current) return '{}'
    return providerRef.current.exportToGradeData()
  }, [])

  const getCompletionPercentage = useCallback(() => {
    if (!providerRef.current) return 0
    return providerRef.current.getCompletionPercentage()
  }, [])

  const getOverallAccuracy = useCallback(() => {
    if (!providerRef.current) return 0
    return providerRef.current.getOverallAccuracy()
  }, [])

  return {
    provider: providerRef.current,
    workbookData,
    activeTutors,
    connectedUsers,
    isSynced,
    isConnected,
    hasTutorPresent: activeTutors.length > 0,
    updateBlock,
    getBlock,
    deleteBlock,
    setFeedback,
    updateCursor,
    exportToGradeData,
    getCompletionPercentage,
    getOverallAccuracy,
  }
}

/**
 * Hook for tracking specific block data
 * 
 * @example
 * ```tsx
 * function QuizBlock({ blockId }) {
 *   const { blockData, updateData, isComplete } = useWorkbookBlock(
 *     provider,
 *     blockId
 *   )
 * 
 *   return (
 *     <div>
 *       <QuizQuestion
 *         answer={blockData?.userAnswer}
 *         onAnswer={(answer) => {
 *           updateData({
 *             userAnswer: answer,
 *             complete: true,
 *             accuracy: calculateAccuracy(answer)
 *           })
 *         }}
 *       />
 *       {isComplete && <CheckIcon />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useWorkbookBlock(
  provider: WorkbookCollaborationProvider | null,
  blockId: string
) {
  const [blockData, setBlockData] = useState<WorkbookBlockData[string] | undefined>()

  useEffect(() => {
    if (!provider) return

    // Get initial block data
    setBlockData(provider.getBlock(blockId))

    // Subscribe to updates
    const unsubscribe = provider.onUpdate(() => {
      setBlockData(provider.getBlock(blockId))
    })

    return () => {
      unsubscribe()
    }
  }, [provider, blockId])

  const updateData = useCallback(
    <T extends Partial<WorkbookBlockData[string]>>(data: T) => {
      if (!provider) return
      provider.updateBlock(blockId, data)
    },
    [provider, blockId]
  )

  const deleteData = useCallback(() => {
    if (!provider) return
    provider.deleteBlock(blockId)
  }, [provider, blockId])

  return {
    blockData,
    updateData,
    deleteData,
    isComplete: blockData?.complete === true,
    accuracy: blockData?.accuracy,
  }
}

/**
 * Hook for tutor presence indicators
 * 
 * Shows which blocks tutors are currently viewing/editing
 * 
 * @example
 * ```tsx
 * function BlockWithTutorIndicators({ blockId }) {
 *   const tutorsOnBlock = useTutorPresence(provider, blockId)
 * 
 *   return (
 *     <div style={{ position: 'relative' }}>
 *       <WorkbookBlock id={blockId} />
 *       {tutorsOnBlock.map(tutor => (
 *         <TutorCursor
 *           key={tutor.clientId}
 *           name={tutor.displayName}
 *           color={tutor.color}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTutorPresence(
  provider: WorkbookCollaborationProvider | null,
  blockId?: string
) {
  const [tutorsOnBlock, setTutorsOnBlock] = useState<Array<WorkbookUser & { clientId: number }>>([])

  useEffect(() => {
    if (!provider) return

    const updateTutorPresence = () => {
      const awareness = provider.getAwareness()
      const tutors: Array<WorkbookUser & { clientId: number }> = []

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return // Skip self

        const user = state.user as WorkbookUser
        if (!user) return

        // Only track tutors/instructors/admins
        if (!['tutor', 'instructor', 'admin'].includes(user.role)) return

        // If blockId is specified, only show tutors on that block
        if (blockId && user.cursor?.blockId !== blockId) return

        tutors.push({ ...user, clientId })
      })

      setTutorsOnBlock(tutors)
    }

    // Update on awareness changes
    const unsubscribe = provider.onAwarenessChange(updateTutorPresence)

    // Initial update
    updateTutorPresence()

    return () => {
      unsubscribe()
    }
  }, [provider, blockId])

  return tutorsOnBlock
}

/**
 * Hook for real-time feedback notifications
 * 
 * Listens for new feedback from tutors and triggers notifications
 * 
 * @example
 * ```tsx
 * function WorkbookWithFeedback({ gradeId }) {
 *   useWorkbookFeedback(provider, (blockId, feedback) => {
 *     toast.info(`New feedback on ${blockId}: ${feedback.text}`)
 *   })
 * 
 *   return <Workbook />
 * }
 * ```
 */
export function useWorkbookFeedback(
  provider: WorkbookCollaborationProvider | null,
  onNewFeedback?: (blockId: string, feedback: any) => void
) {
  const [allFeedback, setAllFeedback] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!provider) return

    const feedbackMap = (provider as any).feedbackMap
    if (!feedbackMap) return

    // Get initial feedback
    setAllFeedback(provider.getFeedback())

    // Track previous feedback to detect new ones
    let previousFeedback = new Set(Object.keys(provider.getFeedback()))

    // Subscribe to feedback changes
    const handleUpdate = () => {
      const currentFeedback = provider.getFeedback()
      setAllFeedback(currentFeedback)

      // Detect new feedback
      const currentKeys = new Set(Object.keys(currentFeedback))
      currentKeys.forEach((blockId) => {
        if (!previousFeedback.has(blockId)) {
          onNewFeedback?.(blockId, currentFeedback[blockId])
        }
      })

      previousFeedback = currentKeys
    }

    feedbackMap.observe(handleUpdate)

    return () => {
      feedbackMap.unobserve(handleUpdate)
    }
  }, [provider, onNewFeedback])

  return allFeedback
}

/**
 * Hook for workbook statistics
 * 
 * Provides real-time statistics about workbook completion and accuracy
 * 
 * @example
 * ```tsx
 * function WorkbookStats() {
 *   const { completion, accuracy, totalBlocks, completedBlocks } = 
 *     useWorkbookStats(provider)
 * 
 *   return (
 *     <StatsCard
 *       completion={`${completion}%`}
 *       accuracy={`${accuracy}%`}
 *       progress={`${completedBlocks} / ${totalBlocks}`}
 *     />
 *   )
 * }
 * ```
 */
export function useWorkbookStats(provider: WorkbookCollaborationProvider | null) {
  const [stats, setStats] = useState({
    completion: 0,
    accuracy: 0,
    totalBlocks: 0,
    completedBlocks: 0,
    averageAttempts: 0,
  })

  useEffect(() => {
    if (!provider) return

    const updateStats = () => {
      const data = provider.getWorkbookData()
      const blockIds = Object.keys(data)
      const completedBlocks = blockIds.filter((id) => data[id].complete === true)
      
      const attempts = blockIds
        .map((id) => data[id].attempts || 0)
        .filter((a) => a > 0)
      
      const avgAttempts = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a, 0) / attempts.length)
        : 0

      setStats({
        completion: provider.getCompletionPercentage(),
        accuracy: provider.getOverallAccuracy(),
        totalBlocks: blockIds.length,
        completedBlocks: completedBlocks.length,
        averageAttempts: avgAttempts,
      })
    }

    // Update on any changes
    const unsubscribe = provider.onUpdate(updateStats)

    // Initial update
    updateStats()

    return () => {
      unsubscribe()
    }
  }, [provider])

  return stats
}

// ============================================================================
// Presence Hooks
// ============================================================================

const IDLE_TIMEOUT_MS = 60000 // 60 seconds

export interface PresenceUser extends WorkbookUser {
  clientId: number
  lastInteraction?: number
  isIdle: boolean
}

/**
 * Hook for tracking all users editing a specific block.
 *
 * Returns all non-self users whose awareness cursor.blockId matches the given blockId.
 * Includes all roles (not just tutors). Each user includes an `isIdle` flag based on
 * whether `lastInteraction` is older than 60 seconds.
 *
 * @example
 * ```tsx
 * function BlockWithEditors({ blockId }) {
 *   const editors = useBlockEditors(provider, blockId)
 *
 *   return (
 *     <div>
 *       {editors.map(editor => (
 *         <Chip
 *           key={editor.clientId}
 *           label={`Being edited by ${editor.displayName}`}
 *           sx={{ opacity: editor.isIdle ? 0.5 : 1 }}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useBlockEditors(
  provider: WorkbookCollaborationProvider | null,
  blockId: string,
): PresenceUser[] {
  const [editors, setEditors] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!provider) return

    const updateEditors = () => {
      const awareness = provider.getAwareness()
      const now = Date.now()
      const result: PresenceUser[] = []

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return // Skip self

        const user = state.user as WorkbookUser | undefined
        if (!user) return

        // Only include users whose cursor is on this block
        if (user.cursor?.blockId !== blockId) return

        const lastInteraction = (state as any).lastInteraction as number | undefined
        const isIdle = lastInteraction != null
          ? (now - lastInteraction) > IDLE_TIMEOUT_MS
          : false

        result.push({
          ...user,
          clientId,
          lastInteraction,
          isIdle,
        })
      })

      setEditors(result)
    }

    const unsubscribe = provider.onAwarenessChange(updateEditors)
    updateEditors()

    return () => {
      unsubscribe()
    }
  }, [provider, blockId])

  return editors
}

/**
 * Hook that returns all connected users with presence metadata.
 * Used by WorkbookPresenceBar for the full avatar row.
 *
 * @example
 * ```tsx
 * function WorkbookPresenceBar() {
 *   const users = usePresenceUsers(provider)
 *   return (
 *     <AvatarGroup>
 *       {users.map(u => (
 *         <Avatar key={u.clientId} sx={{ opacity: u.isIdle ? 0.4 : 1 }}>
 *           {u.displayName?.[0]}
 *         </Avatar>
 *       ))}
 *     </AvatarGroup>
 *   )
 * }
 * ```
 */
export function usePresenceUsers(
  provider: WorkbookCollaborationProvider | null,
): PresenceUser[] {
  const [users, setUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!provider) return

    const updateUsers = () => {
      const awareness = provider.getAwareness()
      const now = Date.now()
      const result: PresenceUser[] = []

      awareness.getStates().forEach((state, clientId) => {
        const user = state.user as WorkbookUser | undefined
        if (!user) return

        const lastInteraction = (state as any).lastInteraction as number | undefined
        const isIdle = lastInteraction != null
          ? (now - lastInteraction) > IDLE_TIMEOUT_MS
          : false

        result.push({
          ...user,
          clientId,
          lastInteraction,
          isIdle,
        })
      })

      setUsers(result)
    }

    const unsubscribe = provider.onAwarenessChange(updateUsers)
    updateUsers()

    return () => {
      unsubscribe()
    }
  }, [provider])

  return users
}

// ============================================================================
// Comment Hooks
// ============================================================================

/**
 * Hook for real-time workbook comments on a specific block.
 *
 * Subscribes to the comments Y.Map and filters by blockId.
 * Returns live comment threads and mutation functions.
 *
 * @example
 * ```tsx
 * function CommentSection({ blockId }) {
 *   const { threads, addComment, replyToComment, resolveThread } =
 *     useWorkbookComments(provider, blockId)
 *
 *   return (
 *     <div>
 *       {threads.map(thread => (
 *         <CommentThread key={thread.id} thread={thread} />
 *       ))}
 *       <button onClick={() => addComment('Great work!')}>Add Comment</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWorkbookComments(
  provider: WorkbookCollaborationProvider | null,
  blockId?: string,
) {
  const [threads, setThreads] = useState<CommentThread[]>([])

  useEffect(() => {
    if (!provider) return

    const commentsMap = provider.getCommentsMap()

    const updateThreads = () => {
      setThreads(provider.getComments(blockId))
    }

    updateThreads()
    commentsMap.observe(updateThreads)

    return () => {
      commentsMap.unobserve(updateThreads)
    }
  }, [provider, blockId])

  const addComment = useCallback(
    (text: string) => {
      if (!provider || !blockId) return null
      return provider.addComment(blockId, text)
    },
    [provider, blockId],
  )

  const replyToComment = useCallback(
    (threadKey: string, text: string) => {
      if (!provider) return
      provider.replyToComment(threadKey, text)
    },
    [provider],
  )

  const resolveThread = useCallback(
    (threadKey: string, resolved: boolean = true) => {
      if (!provider) return
      provider.resolveThread(threadKey, resolved)
    },
    [provider],
  )

  return { threads, addComment, replyToComment, resolveThread }
}

// ============================================================================
// History Hooks
// ============================================================================

/**
 * Hook for block-level change history.
 *
 * Subscribes to the history Y.Array for a specific block and returns
 * entries in chronological order.
 *
 * @example
 * ```tsx
 * function BlockHistory({ blockId }) {
 *   const { entries } = useBlockHistory(provider, blockId)
 *   return (
 *     <ul>
 *       {entries.map((e, i) => (
 *         <li key={i}>{e.displayName} changed {e.fieldChanged}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useBlockHistory(
  provider: WorkbookCollaborationProvider | null,
  blockId: string,
) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  useEffect(() => {
    if (!provider) return

    const historyArray = provider.getDoc().getArray<HistoryEntry>(`history-${blockId}`)

    const updateEntries = () => {
      setEntries(Array.from(historyArray))
    }

    updateEntries()
    historyArray.observe(updateEntries)

    return () => {
      historyArray.unobserve(updateEntries)
    }
  }, [provider, blockId])

  return { entries }
}
