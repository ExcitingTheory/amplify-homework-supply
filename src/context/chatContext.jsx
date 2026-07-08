/**
 * ChatContext - Global chat state management
 *
 * Manages AI assistant chat functionality across the entire application.
 * Provides chat session persistence, message history, and page-specific context.
 *
 * @see docs/GLOBAL_CHAT_INTEGRATION_PLAN.md
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useReducer,
  useCallback,
  useMemo,
  useState,
} from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import AuthContext from "./authContext";
import { chatReducer, initialState, actionTypes } from "./reducers/chatReducer";
import {
  buildChatSearchIndex,
  createChatIndexCacheKey,
  loadPersistedChatSearchIndex,
  persistChatSearchIndex,
  searchChatIndex,
} from "../utils/chatSearchIndex";
import { createChatSearchWorkerManager } from "../utils/chatSearchWorkerManager";

/**
 * Chat Context interface
 */
const ChatContext = createContext({
  // Current chat session
  assistantChat: null,

  // All chat sessions (sorted by createdAt DESC)
  chatHistories: [],

  // Chat loading states
  isLoadingChat: false,
  chatCreationError: null,

  // Chat selection
  setCurrentChat: () => {},

  // Global chat UI state
  isChatOpen: false,
  setIsChatOpen: () => {},

  // Page context - dynamically provided by current page
  pageContext: {
    unit: null,
    files: [],
    dictionary: [],
    questions: [],
    sections: [],
    editorRef: null,
    vectorStoreSearch: null,
  },

  // Register page context
  setPageContext: () => {},

  // Chat messages (managed by useChat hook, but stored here for persistence)
  messages: [],
  setMessages: () => {},

  // Fast local chat search over indexed messages
  searchChatMessages: () => [],
  searchChatMessagesAsync: async () => [],
  chatSearchStats: {
    indexedMessages: 0,
  },
});

/**
 * Hook to access chat context
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    console.warn(
      "[useChatContext] Used outside of ChatContextProvider, returning default values",
    );
  }
  return context;
}

/**
 * Chat Context Provider
 *
 * Manages global chat state and provides it to all components.
 * Should be placed at app root level in _app.jsx.
 */
export function ChatContextProvider({ children }) {
  // Get auth state
  const { user, isLoading: authLoading } = useContext(AuthContext);

  // Lazy client initialization - must be inside component to ensure Amplify.configure() has run
  const client = useMemo(() => getAmplifyClient(), []);

  // All chat state managed by reducer
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const chatVersionRef = useRef(null); // Track _version to detect changes and prevent rerenders
  const subscriptionInitializedRef = useRef(false);

  // Show deleted toggle state
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedChats, setDeletedChats] = useState([]);
  const chatSearchIndexRef = useRef(buildChatSearchIndex(state.messages || []));
  const chatSearchKeyRef = useRef(null);
  const chatSearchWorkerRef = useRef(null);
  // Use a ref to access current assistantChat inside subscription without causing re-subscribe
  const assistantChatRef = useRef(state.assistantChat);
  useEffect(() => {
    assistantChatRef.current = state.assistantChat;
  }, [state.assistantChat]);

  // Observe AssistantChat - single observeQuery replaces list() + 3 manual subscriptions
  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading || !user) {
      console.log("[ChatContext] Waiting for auth...");
      return;
    }

    console.log("[ChatContext] Setting up AssistantChat observeQuery");

    let cancelled = false;

    function processChats(validItems) {
      // Sort by createdAt descending (most recent first)
      validItems.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      // Update chat histories list
      dispatch({ type: actionTypes.SET_CHAT_HISTORIES, payload: validItems });

      // Read current chat from ref (not from closure) to avoid stale state
      const prevCurrent = assistantChatRef.current;
      let newChat = prevCurrent;

      if (validItems.length > 0) {
        const nonArchivedChats = validItems.filter((item) => !item.archived);
        const mostRecentChat = nonArchivedChats[0];

        if (!prevCurrent) {
          if (mostRecentChat) {
            chatVersionRef.current = mostRecentChat._version;
            console.log(
              "[ChatContext] Setting initial chat:",
              mostRecentChat.id,
            );
            newChat = mostRecentChat;
          } else {
            newChat = null;
          }
        } else if (prevCurrent.archived) {
          if (mostRecentChat) {
            chatVersionRef.current = mostRecentChat._version;
            console.log(
              "[ChatContext] Current chat archived, switching to:",
              mostRecentChat.id,
            );
            newChat = mostRecentChat;
          } else {
            chatVersionRef.current = null;
            newChat = null;
          }
        } else {
          const updatedCurrent = validItems.find(
            (item) => item.id === prevCurrent.id,
          );
          if (
            !updatedCurrent ||
            updatedCurrent._version == null ||
            !(updatedCurrent._version > chatVersionRef.current)
          ) {
            // Echo, stale, or missing — skip
            return;
          }
          chatVersionRef.current = updatedCurrent._version;
          newChat = updatedCurrent;
        }
      } else {
        chatVersionRef.current = null;
        newChat = null;
      }

      if (newChat !== prevCurrent) {
        dispatch({ type: actionTypes.SET_ASSISTANT_CHAT, payload: newChat });
      }
    }

    function handleError(label, error) {
      const msg =
        error?.message || error?.errors?.[0]?.message || JSON.stringify(error);
      if (
        msg.includes("DuplicatedOperationError") ||
        msg.includes("Not Authorized") ||
        msg === "{}" ||
        msg === "undefined"
      ) {
        console.warn(
          `[ChatContext] ${label}: transient subscription error (safe to ignore)`,
        );
        return;
      }
      console.error(`[ChatContext] ${label} error:`, error);
    }

    const subscription = client.models.AssistantChat.observeQuery().subscribe({
      next: ({ items }) => {
        if (cancelled) return;
        const allValid = (items || []).filter(
          (item) => item != null && item.id != null,
        );
        const validItems = allValid.filter((item) => item.deletedAt == null);
        const deleted = allValid.filter((item) => item.deletedAt != null);

        setDeletedChats(deleted);

        // Mark subscription as initialized on first emission
        if (!subscriptionInitializedRef.current) {
          subscriptionInitializedRef.current = true;
          dispatch({ type: actionTypes.SET_SUBSCRIPTION_READY, payload: true });
          console.log(
            "[ChatContext] AssistantChat initialized with",
            validItems.length,
            "chats",
          );
        }

        processChats(validItems);
      },
      error: (error) => handleError("AssistantChat observeQuery", error),
    });

    return () => {
      console.log("[ChatContext] Cleaning up subscriptions");
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [user, authLoading]);

  // Create AssistantChat if needed
  useEffect(() => {
    // Don't create anything until subscription has initialized
    if (!subscriptionInitializedRef.current) {
      console.log("[ChatContext] Waiting for subscription to initialize");
      return;
    }

    // Wait for auth to be fully ready
    if (!user || authLoading) {
      console.log(
        "[ChatContext] Waiting for auth to be ready before creating chat",
      );
      return;
    }

    // Check if we have a non-archived chat
    if (state.assistantChat?.id && !state.assistantChat.archived) {
      console.log(
        "[ChatContext] Chat exists and not archived, skipping creation",
      );
      return;
    }

    // If there are existing non-archived chats, use them instead of creating
    const nonArchivedChats = state.chatHistories.filter(
      (chat) => !chat.archived,
    );
    if (nonArchivedChats.length > 0) {
      console.log(
        "[ChatContext] Found",
        nonArchivedChats.length,
        "non-archived chats, subscription will handle selection",
      );
      return;
    }

    // If current chat is archived or doesn't exist, we need a new one
    if (state.assistantChat?.archived) {
      console.log(
        "[ChatContext] Current chat is archived, will create new chat",
      );
    } else if (!state.assistantChat?.id) {
      console.log("[ChatContext] No current chat available, will create one");
    }

    // Create new AssistantChat
    async function createChat() {
      console.log(
        "[ChatContext] Creating AssistantChat with user:",
        user?.username,
      );
      dispatch({ type: actionTypes.CHAT_CREATION_STARTED });

      try {
        // Gen 2 API
        const result = await client.models.AssistantChat.create({
          model: "gpt-4",
          archived: false,
        });

        console.log("[ChatContext] Create result:", {
          hasData: !!result.data,
          hasErrors: !!result.errors,
          data: result.data,
          errors: result.errors,
        });

        // Check for GraphQL errors
        if (result.errors && result.errors.length > 0) {
          console.error(
            "[ChatContext] GraphQL errors creating chat:",
            result.errors,
          );
          dispatch({
            type: actionTypes.CHAT_CREATION_FAILED,
            payload: result.errors[0].message || "Failed to create chat",
          });
          return;
        }

        if (!result.data) {
          console.error(
            "[ChatContext] No data returned from create operation. Full result:",
            result,
          );
          dispatch({
            type: actionTypes.CHAT_CREATION_FAILED,
            payload: "Failed to create chat - no data returned",
          });
          return;
        }

        console.log(
          "[ChatContext] Created AssistantChat:",
          result.data.id,
          "at:",
          result.data.createdAt,
        );
        // Optimistic version bump — subscription echo will have _version 1
        chatVersionRef.current = (result.data._version || 0) + 1;
        dispatch({ type: actionTypes.CHAT_CREATION_SUCCEEDED });
      } catch (error) {
        console.error("[ChatContext] Error creating chat:", error);
        dispatch({
          type: actionTypes.CHAT_CREATION_FAILED,
          payload: error.message || "Failed to create chat",
        });
      }
    }

    createChat();
  }, [
    state.subscriptionReady,
    state.assistantChat?.id,
    state.assistantChat?.archived,
    state.chatHistories.length,
    user,
    authLoading,
  ]);

  // Stable dispatch-based setters for consumers
  const setCurrentChat = useCallback(
    (chat) => dispatch({ type: actionTypes.SET_ASSISTANT_CHAT, payload: chat }),
    [],
  );
  const setIsChatOpen = useCallback(
    (open) => dispatch({ type: actionTypes.SET_CHAT_OPEN, payload: open }),
    [],
  );
  const setPageContext = useCallback(
    (ctx) => dispatch({ type: actionTypes.SET_PAGE_CONTEXT, payload: ctx }),
    [],
  );
  const setMessages = useCallback(
    (msgs) => dispatch({ type: actionTypes.SET_MESSAGES, payload: msgs }),
    [],
  );

  // Initialize worker manager once.
  useEffect(() => {
    chatSearchWorkerRef.current =
      createChatSearchWorkerManager(chatSearchIndexRef);

    return () => {
      chatSearchWorkerRef.current?.dispose();
      chatSearchWorkerRef.current = null;
    };
  }, []);

  // Rebuild/persist chat search index when chat or messages change.
  useEffect(() => {
    let cancelled = false;

    async function syncIndex() {
      const cacheKey = createChatIndexCacheKey(
        state.assistantChat?.id,
        state.messages || [],
      );

      if (chatSearchKeyRef.current === cacheKey) return;

      const persisted = await loadPersistedChatSearchIndex(cacheKey);
      if (cancelled) return;

      if (persisted) {
        chatSearchIndexRef.current = persisted;
      } else {
        const rebuilt = buildChatSearchIndex(state.messages || []);
        chatSearchIndexRef.current = rebuilt;
        void persistChatSearchIndex(cacheKey, rebuilt);
      }

      chatSearchKeyRef.current = cacheKey;
      void chatSearchWorkerRef.current?.build(state.messages || []);
    }

    syncIndex();
    return () => {
      cancelled = true;
    };
  }, [state.assistantChat?.id, state.messages]);

  const searchChatMessages = useCallback((query, options = {}) => {
    return searchChatIndex(chatSearchIndexRef.current, query, options);
  }, []);

  const searchChatMessagesAsync = useCallback(async (query, options = {}) => {
    return (
      (await chatSearchWorkerRef.current?.search(query, options)) ||
      searchChatIndex(chatSearchIndexRef.current, query, options)
    );
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // Chat session
      assistantChat: state.assistantChat,
      chatHistories: state.chatHistories,
      isLoadingChat: state.isLoadingChat,
      chatCreationError: state.chatCreationError,
      setCurrentChat,
      chatVersionRef,

      // Global chat UI
      isChatOpen: state.isChatOpen,
      setIsChatOpen,

      // Page context
      pageContext: state.pageContext,
      setPageContext,

      // Messages
      messages: state.messages,
      setMessages,
      searchChatMessages,
      searchChatMessagesAsync,
      chatSearchStats: {
        indexedMessages: chatSearchIndexRef.current.docs.size,
      },

      // Show deleted
      showDeleted,
      setShowDeleted,
      deletedChats,
    }),
    [
      state.assistantChat?.id,
      state.assistantChat?._version,
      state.assistantChat?.archived,
      state.chatHistories?.length,
      state.isLoadingChat,
      state.chatCreationError,
      state.isChatOpen,
      state.pageContext,
      state.messages?.length,
      setCurrentChat,
      setIsChatOpen,
      setPageContext,
      setMessages,
      searchChatMessages,
      searchChatMessagesAsync,
      showDeleted,
      deletedChats,
    ],
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export default ChatContext;
