/**
 * React hooks for collaborative chat rooms.
 *
 * Provides reactive state bindings for topics, threads, messages,
 * and presence from a ChatCollaborationProvider.
 *
 * @module chatHooks
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  ChatCollaborationProvider,
  ChatRoomConfig,
  ChatRoomType,
  ChatTopic,
  ChatMessage,
  ChatUser,
  TopicScope,
} from "./ChatCollaborationProvider";

// ============================================================================
// Types
// ============================================================================

export interface UseChatRoomOptions {
  roomType: ChatRoomType;
  roomId: string;
  user: ChatUser;
  wsUrl?: string;
  connect?: boolean;
  persistence?: boolean;
}

export interface UseChatRoomReturn {
  provider: ChatCollaborationProvider | null;
  isConnected: boolean;
  isSynced: boolean;
}

export interface UseChatTopicsReturn {
  topics: ChatTopic[];
  createTopic: (name: string, scope: TopicScope) => ChatTopic | null;
  pinTopic: (topicId: string, pinned: boolean) => void;
  archiveTopic: (topicId: string) => void;
}

export interface UseChatThreadReturn {
  messages: ChatMessage[];
  topLevelMessages: ChatMessage[];
  sendMessage: (content: string, parentId?: string) => ChatMessage | null;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  getReplies: (parentId: string) => ChatMessage[];
}

export interface UseChatPresenceReturn {
  onlineUsers: ChatUser[];
  typingUsers: ChatUser[];
  usersInTopic: ChatUser[];
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Main hook — manages ChatCollaborationProvider lifecycle.
 *
 * Creates and destroys the provider based on roomId/user changes.
 */
export function useChatRoom(
  options: UseChatRoomOptions | null,
): UseChatRoomReturn {
  const {
    roomType,
    roomId,
    user,
    wsUrl,
    connect = true,
    persistence = true,
  } = options || ({} as UseChatRoomOptions);

  const providerRef = useRef<ChatCollaborationProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!options || !roomId || !user?.username) return;

    const provider = new ChatCollaborationProvider({
      roomType,
      roomId,
      user,
      wsUrl,
      connect,
      persistence,
    });

    providerRef.current = provider;

    // Track connection & sync status
    const wsProvider = (provider as any).wsProvider;
    if (wsProvider) {
      wsProvider.on("status", ({ status }: { status: string }) => {
        setIsConnected(status === "connected");
      });
      wsProvider.on("sync", (synced: boolean) => {
        setIsSynced(synced);
      });
    }

    return () => {
      provider.destroy();
      providerRef.current = null;
      setIsConnected(false);
      setIsSynced(false);
    };
  }, [roomType, roomId, user?.username]);

  return {
    provider: providerRef.current,
    isConnected,
    isSynced,
  };
}

/**
 * Hook for managing and observing topics within a chat room.
 *
 * Optionally filter by scope to show only relevant topics.
 */
export function useChatTopics(
  provider: ChatCollaborationProvider | null,
  scope?: TopicScope,
): UseChatTopicsReturn {
  const [topics, setTopics] = useState<ChatTopic[]>([]);

  useEffect(() => {
    if (!provider) return;

    const topicsMap = provider.getTopicsMap();

    const handleChange = () => {
      const allTopics = provider.getTopics();
      if (scope) {
        // Show section-scoped topics always + context-specific topics
        setTopics(
          allTopics.filter((t) => t.scope === "section" || t.scope === scope),
        );
      } else {
        setTopics(allTopics);
      }
    };

    handleChange();
    topicsMap.observeDeep(handleChange);

    return () => {
      topicsMap.unobserveDeep(handleChange);
    };
  }, [provider, scope]);

  const createTopic = useCallback(
    (name: string, topicScope: TopicScope): ChatTopic | null => {
      if (!provider) return null;
      return provider.createTopic(name, topicScope);
    },
    [provider],
  );

  const pinTopic = useCallback(
    (topicId: string, pinned: boolean) => {
      provider?.pinTopic(topicId, pinned);
    },
    [provider],
  );

  const archiveTopic = useCallback(
    (topicId: string) => {
      provider?.archiveTopic(topicId);
    },
    [provider],
  );

  return { topics, createTopic, pinTopic, archiveTopic };
}

/**
 * Hook for messages within a specific topic thread.
 *
 * Provides reactive message list and CRUD operations.
 */
export function useChatThread(
  provider: ChatCollaborationProvider | null,
  topicId: string | null,
): UseChatThreadReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!provider || !topicId) {
      setMessages([]);
      return;
    }

    const threadArray = provider.getThreadArray(topicId);

    const handleChange = () => {
      setMessages(Array.from(threadArray));
    };

    handleChange();
    threadArray.observe(handleChange);

    // Update awareness — user is viewing this topic
    provider.setActiveTopic(topicId);

    return () => {
      threadArray.unobserve(handleChange);
      provider.setActiveTopic(null);
    };
  }, [provider, topicId]);

  const topLevelMessages = useMemo(
    () => messages.filter((m) => m.parentId === null),
    [messages],
  );

  const sendMessage = useCallback(
    (content: string, parentId?: string): ChatMessage | null => {
      if (!provider || !topicId) return null;
      return provider.sendMessage(topicId, content, parentId);
    },
    [provider, topicId],
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!provider || !topicId) return;
      provider.editMessage(topicId, messageId, content);
    },
    [provider, topicId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!provider || !topicId) return;
      provider.deleteMessage(topicId, messageId);
    },
    [provider, topicId],
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!provider || !topicId) return;
      provider.addReaction(topicId, messageId, emoji);
    },
    [provider, topicId],
  );

  const getReplies = useCallback(
    (parentId: string): ChatMessage[] => {
      return messages.filter((m) => m.parentId === parentId);
    },
    [messages],
  );

  return {
    messages,
    topLevelMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    getReplies,
  };
}

/**
 * Hook for chat room presence — online users, typing indicators, active topics.
 */
export function useChatPresence(
  provider: ChatCollaborationProvider | null,
  topicId?: string | null,
): UseChatPresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([]);
  const [usersInTopic, setUsersInTopic] = useState<ChatUser[]>([]);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.getAwareness();

    const handleChange = () => {
      const online: ChatUser[] = [];
      const typing: ChatUser[] = [];
      const inTopic: ChatUser[] = [];

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return;
        const peerUser = state.user as ChatUser | undefined;
        if (!peerUser) return;

        online.push(peerUser);
        if (state.typing) typing.push(peerUser);
        if (topicId && state.activeTopic === topicId) inTopic.push(peerUser);
      });

      setOnlineUsers(online);
      setTypingUsers(typing);
      setUsersInTopic(inTopic);
    };

    handleChange();
    awareness.on("change", handleChange);

    return () => {
      awareness.off("change", handleChange);
    };
  }, [provider, topicId]);

  return { onlineUsers, typingUsers, usersInTopic };
}
