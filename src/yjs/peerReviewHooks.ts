/**
 * React hooks for peer review chat rooms.
 *
 * @module peerReviewHooks
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  PeerReviewRoomProvider,
  PeerReviewRoomConfig,
  PeerReviewUser,
  RoomMessage,
  RoomState,
  MessageType,
} from './PeerReviewRoomProvider'

// ============================================================================
// Types
// ============================================================================

export interface UsePeerReviewRoomOptions {
  roomId: string
  gradeId: string
  user: PeerReviewUser
  wsUrl?: string
  connect?: boolean
  persistence?: boolean
}

export interface UsePeerReviewRoomReturn {
  provider: PeerReviewRoomProvider | null
  messages: RoomMessage[]
  roomState: RoomState | null
  peers: PeerReviewUser[]
  typingPeers: PeerReviewUser[]
  isConnected: boolean
  sendMessage: (content: string, messageType?: MessageType, referencedBlockId?: string) => void
  setTyping: (typing: boolean) => void
  inviteUser: (userId: string) => void
  closeRoom: () => void
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Main hook for peer review room functionality.
 *
 * Manages PeerReviewRoomProvider lifecycle and exposes reactive
 * messages, room state, and peer presence.
 */
export function usePeerReviewRoom(
  options: UsePeerReviewRoomOptions | null,
): UsePeerReviewRoomReturn {
  const {
    roomId,
    gradeId,
    user,
    wsUrl,
    connect = false,
    persistence = false,
  } = options || ({} as UsePeerReviewRoomOptions)

  const providerRef = useRef<PeerReviewRoomProvider | null>(null)
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [peers, setPeers] = useState<PeerReviewUser[]>([])
  const [typingPeers, setTypingPeers] = useState<PeerReviewUser[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!options || !roomId || !user) return

    const provider = new PeerReviewRoomProvider({
      roomId,
      gradeId,
      user,
      wsUrl,
      connect,
      persistence,
    })

    providerRef.current = provider

    // Subscribe to messages
    const messagesArray = provider.getMessagesArray()
    const handleMessagesChange = () => {
      setMessages(provider.getMessages())
    }
    messagesArray.observe(handleMessagesChange)
    handleMessagesChange()

    // Subscribe to room state
    const roomStateMap = provider.getRoomStateMap()
    const handleRoomStateChange = () => {
      setRoomState(provider.getRoomState())
    }
    roomStateMap.observe(handleRoomStateChange)
    handleRoomStateChange()

    // Subscribe to awareness (peers + typing)
    const unsubscribeAwareness = provider.onAwarenessChange(() => {
      const awareness = provider.getAwareness()
      const peerList: PeerReviewUser[] = []
      const typingList: PeerReviewUser[] = []

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return // Skip self
        const peerUser = state.user as PeerReviewUser | undefined
        if (!peerUser) return

        peerList.push(peerUser)
        if (state.typing) {
          typingList.push(peerUser)
        }
      })

      setPeers(peerList)
      setTypingPeers(typingList)
    })

    // Connection status
    const wsProvider = (provider as any).wsProvider
    if (wsProvider) {
      wsProvider.on('status', ({ status }: { status: string }) => {
        setIsConnected(status === 'connected')
      })
    }

    return () => {
      messagesArray.unobserve(handleMessagesChange)
      roomStateMap.unobserve(handleRoomStateChange)
      unsubscribeAwareness()
    }
  }, [roomId, user?.username])

  const sendMessage = useCallback(
    (content: string, messageType?: MessageType, referencedBlockId?: string) => {
      providerRef.current?.sendMessage(content, messageType, referencedBlockId)
    },
    [],
  )

  const setTyping = useCallback((typing: boolean) => {
    providerRef.current?.setTyping(typing)
  }, [])

  const inviteUser = useCallback((userId: string) => {
    providerRef.current?.inviteUser(userId)
  }, [])

  const closeRoom = useCallback(() => {
    providerRef.current?.closeRoom()
  }, [])

  return {
    provider: providerRef.current,
    messages,
    roomState,
    peers,
    typingPeers,
    isConnected,
    sendMessage,
    setTyping,
    inviteUser,
    closeRoom,
  }
}

/**
 * Hook for just the messages in a room — lighter weight than the full hook.
 */
export function useRoomMessages(provider: PeerReviewRoomProvider | null) {
  const [messages, setMessages] = useState<RoomMessage[]>([])

  useEffect(() => {
    if (!provider) return

    const messagesArray = provider.getMessagesArray()
    const handleChange = () => {
      setMessages(provider.getMessages())
    }

    handleChange()
    messagesArray.observe(handleChange)

    return () => {
      messagesArray.unobserve(handleChange)
    }
  }, [provider])

  return messages
}

/**
 * Hook for peer list (excluding self) from awareness.
 */
export function useRoomPeers(provider: PeerReviewRoomProvider | null) {
  const [peers, setPeers] = useState<PeerReviewUser[]>([])

  useEffect(() => {
    if (!provider) return

    const updatePeers = () => {
      const awareness = provider.getAwareness()
      const result: PeerReviewUser[] = []

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return
        const peerUser = state.user as PeerReviewUser | undefined
        if (peerUser) result.push(peerUser)
      })

      setPeers(result)
    }

    const unsubscribe = provider.onAwarenessChange(updatePeers)
    updatePeers()

    return () => {
      unsubscribe()
    }
  }, [provider])

  return peers
}
