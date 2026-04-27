/**
 * React hooks for collaborative practice drill sessions.
 *
 * @module practiceCollaborationHooks
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  PracticeCollaborationProvider,
  PracticeCollaborationConfig,
  PracticeUser,
  PracticeMessage,
  BlockAnswer,
  ParticipantProgress,
  GroupStats,
} from './PracticeCollaborationProvider'

// ============================================================================
// Types
// ============================================================================

export interface UsePracticeCollaborationOptions {
  sessionId: string
  user: PracticeUser
  wsUrl?: string
  connect?: boolean
  persistence?: boolean
  onParticipantJoin?: (user: PracticeUser) => void
  onParticipantLeave?: (user: PracticeUser) => void
}

export interface UsePracticeCollaborationReturn {
  provider: PracticeCollaborationProvider | null
  participants: PracticeUser[]
  groupStats: GroupStats
  ownProgress: ParticipantProgress
  messages: PracticeMessage[]
  isConnected: boolean
  // Actions
  submitBlockAnswer: (blockId: string, answer: { userAnswer: any; complete: boolean; accuracy: number }) => void
  getBlockAnswers: (blockId: string) => BlockAnswer[]
  getOwnAnswer: (blockId: string) => BlockAnswer | undefined
  sendMessage: (content: string, referencedBlockId?: string) => void
  setActiveBlock: (blockId: string | null) => void
  setTyping: (typing: boolean) => void
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook for collaborative practice drill sessions.
 *
 * Manages PracticeCollaborationProvider lifecycle and exposes reactive
 * group stats (anonymized), own progress, participants, and chat.
 */
export function usePracticeCollaboration(
  options: UsePracticeCollaborationOptions | null,
): UsePracticeCollaborationReturn {
  const {
    sessionId,
    user,
    wsUrl,
    connect = true,
    persistence = true,
    onParticipantJoin,
    onParticipantLeave,
  } = options || ({} as UsePracticeCollaborationOptions)

  const providerRef = useRef<PracticeCollaborationProvider | null>(null)
  const [participants, setParticipants] = useState<PracticeUser[]>([])
  const [groupStats, setGroupStats] = useState<GroupStats>({
    totalParticipants: 0,
    averageAccuracy: 0,
    blocksCompletedTotal: 0,
    blockAccuracies: {},
    lastUpdated: new Date().toISOString(),
  })
  const [ownProgress, setOwnProgress] = useState<ParticipantProgress>({
    username: user?.username || '',
    blocksCompleted: 0,
    blocksAttempted: 0,
    lastActiveAt: new Date().toISOString(),
  })
  const [messages, setMessages] = useState<PracticeMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!options || !sessionId || !user?.username) return

    const provider = new PracticeCollaborationProvider({
      sessionId,
      user,
      wsUrl,
      connect,
      persistence,
      onParticipantJoin,
      onParticipantLeave,
    })

    providerRef.current = provider

    // Observe answers map → triggers groupStats + ownProgress refresh
    const answersMap = provider.getAnswersMap()
    const handleAnswersChange = () => {
      setGroupStats(provider.getGroupStats())
      setOwnProgress(provider.getOwnProgress())
    }
    answersMap.observe(handleAnswersChange)

    // Observe group stats map
    const groupStatsMap = provider.getGroupStatsMap()
    const handleGroupStatsChange = () => {
      setGroupStats(provider.getGroupStats())
    }
    groupStatsMap.observe(handleGroupStatsChange)

    // Observe messages
    const messagesArray = provider.getMessagesArray()
    const handleMessagesChange = () => {
      setMessages(provider.getMessages())
    }
    messagesArray.observe(handleMessagesChange)
    handleMessagesChange()

    // Observe awareness for participants
    const unsubscribeAwareness = provider.onAwarenessChange(() => {
      setParticipants(provider.getActiveParticipants())
    })

    // Connection status
    const wsProvider = (provider as any).wsProvider
    if (wsProvider) {
      wsProvider.on('status', ({ status }: { status: string }) => {
        setIsConnected(status === 'connected')
      })
    }

    // Initial state
    setGroupStats(provider.getGroupStats())
    setOwnProgress(provider.getOwnProgress())
    setParticipants(provider.getActiveParticipants())

    return () => {
      answersMap.unobserve(handleAnswersChange)
      groupStatsMap.unobserve(handleGroupStatsChange)
      messagesArray.unobserve(handleMessagesChange)
      unsubscribeAwareness()
      provider.destroy()
      providerRef.current = null
    }
  }, [sessionId, user?.username])

  const submitBlockAnswer = useCallback(
    (blockId: string, answer: { userAnswer: any; complete: boolean; accuracy: number }) => {
      providerRef.current?.submitBlockAnswer(blockId, answer)
    },
    [],
  )

  const getBlockAnswers = useCallback(
    (blockId: string): BlockAnswer[] => {
      return providerRef.current?.getBlockAnswers(blockId) || []
    },
    [],
  )

  const getOwnAnswer = useCallback(
    (blockId: string): BlockAnswer | undefined => {
      return providerRef.current?.getOwnAnswer(blockId)
    },
    [],
  )

  const sendMessage = useCallback(
    (content: string, referencedBlockId?: string) => {
      providerRef.current?.sendMessage(content, referencedBlockId)
    },
    [],
  )

  const setActiveBlock = useCallback((blockId: string | null) => {
    providerRef.current?.setActiveBlock(blockId)
  }, [])

  const setTyping = useCallback((typing: boolean) => {
    providerRef.current?.setTyping(typing)
  }, [])

  return {
    provider: providerRef.current,
    participants,
    groupStats,
    ownProgress,
    messages,
    isConnected,
    submitBlockAnswer,
    getBlockAnswers,
    getOwnAnswer,
    sendMessage,
    setActiveBlock,
    setTyping,
  }
}

// ============================================================================
// Focused Hooks
// ============================================================================

/**
 * Hook for group stats only — lighter weight for display components.
 */
export function usePracticeGroupStats(provider: PracticeCollaborationProvider | null) {
  const [stats, setStats] = useState<GroupStats>({
    totalParticipants: 0,
    averageAccuracy: 0,
    blocksCompletedTotal: 0,
    blockAccuracies: {},
    lastUpdated: new Date().toISOString(),
  })

  useEffect(() => {
    if (!provider) return

    const groupStatsMap = provider.getGroupStatsMap()
    const handleChange = () => {
      setStats(provider.getGroupStats())
    }

    handleChange()
    groupStatsMap.observe(handleChange)

    return () => {
      groupStatsMap.unobserve(handleChange)
    }
  }, [provider])

  return stats
}

/**
 * Hook for practice session participants from awareness.
 */
export function usePracticeParticipants(provider: PracticeCollaborationProvider | null) {
  const [participants, setParticipants] = useState<PracticeUser[]>([])

  useEffect(() => {
    if (!provider) return

    const updateParticipants = () => {
      setParticipants(provider.getActiveParticipants())
    }

    const unsubscribe = provider.onAwarenessChange(updateParticipants)
    updateParticipants()

    return () => {
      unsubscribe()
    }
  }, [provider])

  return participants
}

/**
 * Hook for a single block's collaborative answers.
 */
export function usePracticeBlockAnswers(
  provider: PracticeCollaborationProvider | null,
  blockId: string,
) {
  const [answers, setAnswers] = useState<BlockAnswer[]>([])

  useEffect(() => {
    if (!provider || !blockId) return

    const answersMap = provider.getAnswersMap()
    const handleChange = () => {
      setAnswers(provider.getBlockAnswers(blockId))
    }

    handleChange()
    answersMap.observe(handleChange)

    return () => {
      answersMap.unobserve(handleChange)
    }
  }, [provider, blockId])

  return answers
}
