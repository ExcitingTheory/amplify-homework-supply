/**
 * ChatContext - Global chat state management
 * 
 * Manages AI assistant chat functionality across the entire application.
 * Provides chat session persistence, message history, and page-specific context.
 * 
 * @see docs/GLOBAL_CHAT_INTEGRATION_PLAN.md
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getAmplifyClient } from '../utils/amplifyClient';
import AuthContext from './authContext';

const client = getAmplifyClient();

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
});

/**
 * Hook to access chat context
 */
export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        console.warn('[useChatContext] Used outside of ChatContextProvider, returning default values');
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
    
    // Chat session state
    const [assistantChat, setAssistantChat] = useState(null);
    const [chatHistories, setChatHistories] = useState([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatCreationError, setChatCreationError] = useState(null);
    const [subscriptionReady, setSubscriptionReady] = useState(false);
    const chatVersionRef = useRef(null); // Track _version to detect changes and prevent rerenders
    const subscriptionInitializedRef = useRef(false);
    
    // Global chat UI state
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    // Page context - provided by current page via useChatPageContext hook
    const [pageContext, setPageContext] = useState({
        unit: null,
        files: [],
        dictionary: [],
        questions: [],
        sections: [],
        editorRef: null,
        vectorStoreSearch: null,
    });
    
    // Chat messages state (will be synced with useChat hook)
    const [messages, setMessages] = useState([]);
    
    // Observe AssistantChat - single consolidated subscription
    useEffect(() => {
        // Wait for auth to be ready
        if (authLoading || !user) {
            console.log('[ChatContext] Waiting for auth...');
            return;
        }
        
        console.log('[ChatContext] Setting up observeQuery for AssistantChat');
        let isSubscribed = true;
        let chatSubscription;
        
        const setupSubscription = () => {
            if (!isSubscribed) return;
            
            // Observe AssistantChat sorted by createdAt DESC
            chatSubscription = client.models.AssistantChat.observeQuery({
                sortDirection: 'DESC',
                sortField: 'createdAt'
            }).subscribe({
                next: ({ items, isSynced }) => {
                    // Filter out null items that can appear during subscription updates
                    const validItems = items.filter(item => item != null && item.id != null);
                    
                    console.log('[ChatContext] AssistantChat query update:', validItems.length, 'items', isSynced ? '(synced)' : '(not synced)');
                    
                    // Log updatedAt for debugging
                    if (validItems.length > 0) {
                        console.log('[ChatContext] First item details:', {
                            id: validItems[0].id,
                            updatedAt: validItems[0].updatedAt
                        });
                    }
                    
                    if (!isSynced) {
                        console.log('[ChatContext] Waiting for AssistantChat sync...');
                        return;
                    }
                    
                    // Mark subscription as initialized only after first sync
                    if (isSynced && !subscriptionInitializedRef.current) {
                        subscriptionInitializedRef.current = true;
                        setSubscriptionReady(true);
                        console.log('[ChatContext] AssistantChat subscription initialized');
                    }
                    
                    if (isSubscribed) {
                        // Update chat histories list
                        setChatHistories(validItems);
                        console.log('[ChatContext] AssistantChat list updated:', validItems.length, 'chats');
                        
                        // Update current chat
                        setAssistantChat(prevCurrent => {
                            if (validItems.length > 0) {
                                // Find the most recent non-archived chat
                                const nonArchivedChats = validItems.filter(item => !item.archived);
                                const mostRecentChat = nonArchivedChats[0]; // Already sorted by createdAt DESC
                                
                                if (!prevCurrent) {
                                    // No current chat, set to most recent non-archived
                                    if (mostRecentChat) {
                                        chatVersionRef.current = mostRecentChat._version;
                                        console.log('[ChatContext] Setting initial chat:', mostRecentChat.id);
                                        return mostRecentChat;
                                    }
                                    // No non-archived chats available - will be handled by creation effect
                                    console.log('[ChatContext] No non-archived chats available');
                                    return null;
                                }
                                
                                // If current chat is archived, switch to most recent non-archived or null
                                if (prevCurrent.archived) {
                                    if (mostRecentChat) {
                                        chatVersionRef.current = mostRecentChat._version;
                                        console.log('[ChatContext] Current chat archived, switching to:', mostRecentChat.id);
                                        return mostRecentChat;
                                    } else {
                                        // All chats are archived - set to null, creation effect will make a new one
                                        console.log('[ChatContext] All chats archived, clearing current chat - new one will be created');
                                        chatVersionRef.current = null;
                                        return null;
                                    }
                                }
                                
                                // Find updated version of current chat
                                const updatedCurrent = items.find(item => item.id === prevCurrent.id);
                                // Only update if _version has changed
                                if (updatedCurrent && chatVersionRef.current !== updatedCurrent._version) {
                                    chatVersionRef.current = updatedCurrent._version;
                                    console.log('[ChatContext] Chat updated, new _version:', updatedCurrent._version);
                                    return updatedCurrent;
                                }
                            } else {
                                // No chats at all - clear current chat so creation effect triggers
                                console.log('[ChatContext] No chats found, clearing current chat - new one will be created');
                                chatVersionRef.current = null;
                                return null;
                            }
                            return prevCurrent;
                        });
                    }
                },
                error: (error) => {
                    console.error('[ChatContext] AssistantChat subscription error:', error);
                }
            });
        };
        
        setupSubscription();
        
        return () => {
            console.log('[ChatContext] Cleaning up subscription');
            isSubscribed = false;
            if (chatSubscription) chatSubscription.unsubscribe();
        };
    }, [user, authLoading]);
    
    // Create AssistantChat if needed
    useEffect(() => {
        // Don't create anything until subscription has initialized
        if (!subscriptionInitializedRef.current) {
            console.log('[ChatContext] Waiting for subscription to initialize');
            return;
        }
        
        // Wait for auth to be fully ready
        if (!user || authLoading) {
            console.log('[ChatContext] Waiting for auth to be ready before creating chat');
            return;
        }
        
        // Check if we have a non-archived chat
        if (assistantChat?.id && !assistantChat.archived) {
            console.log('[ChatContext] Chat exists and not archived, skipping creation');
            return;
        }
        
        // If there are existing non-archived chats, use them instead of creating
        const nonArchivedChats = chatHistories.filter(chat => !chat.archived);
        if (nonArchivedChats.length > 0) {
            console.log('[ChatContext] Found', nonArchivedChats.length, 'non-archived chats, subscription will handle selection');
            return;
        }
        
        // If current chat is archived or doesn't exist, we need a new one
        if (assistantChat?.archived) {
            console.log('[ChatContext] Current chat is archived, will create new chat');
        } else if (!assistantChat?.id) {
            console.log('[ChatContext] No current chat available, will create one');
        }
        
        // Create new AssistantChat
        async function createChat() {
            console.log('[ChatContext] Creating AssistantChat with user:', user?.username);
            setIsLoadingChat(true);
            
            try {
                // Gen 2 API
                const result = await client.models.AssistantChat.create({
                    model: 'gpt-4',
                    archived: false
                });
                
                console.log('[ChatContext] Create result:', {
                    hasData: !!result.data,
                    hasErrors: !!result.errors,
                    data: result.data,
                    errors: result.errors
                });
                
                // Check for GraphQL errors
                if (result.errors && result.errors.length > 0) {
                    console.error('[ChatContext] GraphQL errors creating chat:', result.errors);
                    setChatCreationError(result.errors[0].message || 'Failed to create chat');
                    setIsLoadingChat(false);
                    return;
                }
                
                if (!result.data) {
                    console.error('[ChatContext] No data returned from create operation. Full result:', result);
                    setChatCreationError('Failed to create chat - no data returned');
                    setIsLoadingChat(false);
                    return;
                }
                
                console.log('[ChatContext] Created AssistantChat:', result.data.id, 'at:', result.data.createdAt);
                setIsLoadingChat(false);
            } catch (error) {
                console.error('[ChatContext] Error creating chat:', error);
                setChatCreationError(error.message || 'Failed to create chat');
                setIsLoadingChat(false);
            }
        }
        
        createChat();
    }, [subscriptionReady, assistantChat?.id, assistantChat?.archived, chatHistories.length, user, authLoading]);
    
    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        // Chat session
        assistantChat,
        chatHistories,
        isLoadingChat,
        chatCreationError,
        setCurrentChat: setAssistantChat,
        
        // Global chat UI
        isChatOpen,
        setIsChatOpen,
        
        // Page context
        pageContext,
        setPageContext,
        
        // Messages
        messages,
        setMessages,
    }), [
        assistantChat?.id,
        assistantChat?._version,
        assistantChat?.archived,
        chatHistories?.length,
        isLoadingChat,
        chatCreationError,
        isChatOpen,
        pageContext,
        messages?.length,
    ]);
    
    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
}

export default ChatContext;
