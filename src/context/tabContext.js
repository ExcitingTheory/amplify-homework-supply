import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataStore } from "aws-amplify/datastore";
import { generateClient } from 'aws-amplify/api';
import { AssistantChat } from '../models';

const client = generateClient();

/**
 * Context for managing tab state across the editor
 * Provides tab indices, open states, and setters for left/right sidebars
 */
const TabContext = createContext({
    // Left sidebar state
    leftTab: 4, // files
    leftOpen: false,
    leftWidth: 350,
    setLeftTab: () => {},
    setLeftOpen: () => {},
    setLeftWidth: () => {},
    
    // Right sidebar state
    rightTab: 1, // chat
    rightOpen: false,
    rightWidth: 350,
    setRightTab: () => {},
    setRightOpen: () => {},
    setRightWidth: () => {},
    
    // Batch update
    updateState: () => {},
    
    // Focus management
    focusItem: null, // { type, id, timestamp }
    setFocusItem: () => {},
    
    // Item refs for scrolling - { type: { id: ref } }
    itemRefs: { current: {} },
    registerItemRef: () => {},
    unregisterItemRef: () => {},
    scrollToItem: () => {},
    
    // Chat state
    assistantChat: null,
    chatHistories: [],
    setCurrentChat: () => {},
    isLoadingChat: false,
    chatCreationError: null,
});

/**
 * Hook to access tab context
 * @returns {object} Tab context value
 */
export function useTabContext() {
    const context = useContext(TabContext);
    if (!context) {
        console.warn('[useTabContext] Used outside of TabProvider, returning default values');
    }
    return context;
}

/**
 * Provider component for tab state
 */
export function TabProvider({ children, value }) {
    const [assistantChat, setAssistantChat] = useState(null);
    const [chatHistories, setChatHistories] = useState([]);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [chatCreationError, setChatCreationError] = useState(null);
    const [subscriptionReady, setSubscriptionReady] = useState(false);
    const chatVersionRef = React.useRef(null);
    const subscriptionInitializedRef = React.useRef(false);

    // Observe AssistantChat - single consolidated model
    useEffect(() => {
        console.log('[TabContext] Setting up observeQuery for AssistantChat');
        let isSubscribed = true;
        let chatSubscription;
        
        const setupSubscription = async () => {
            if (!isSubscribed) return;
            
            try {
                // Observe AssistantChat sorted by createdAt
                chatSubscription = DataStore.observeQuery(
                    AssistantChat,
                    undefined,
                    { sort: (s) => s.createdAt('DESCENDING') }
                ).subscribe(({ items, isSynced }) => {
                    console.log('[TabContext] AssistantChat query update:', items.length, 'items', isSynced ? '(synced)' : '(not synced)');

                    if (!isSynced) {
                        console.log('[TabContext] Waiting for AssistantChat sync...');
                        return;
                    }
                    
                    // Mark subscription as initialized only after first sync
                    if (isSynced && !subscriptionInitializedRef.current) {
                        subscriptionInitializedRef.current = true;
                        setSubscriptionReady(true);
                        console.log('[TabContext] AssistantChat subscription initialized');
                    }
                    
                    if (isSubscribed) {
                        // Update chat histories list
                        setChatHistories(items);
                        console.log('[TabContext] AssistantChat list updated:', items.length, 'chats', items);
                        
                        // Update current chat
                        setAssistantChat(prevCurrent => {
                            if (items.length > 0) {
                                // Find the most recent non-archived chat
                                const nonArchivedChats = items.filter(item => !item.archived);
                                const mostRecentChat = nonArchivedChats[0]; // Already sorted by createdAt DESC
                                
                                if (!prevCurrent) {
                                    // No current chat, set to most recent non-archived
                                    if (mostRecentChat) {
                                        chatVersionRef.current = mostRecentChat._version;
                                        console.log('[TabContext] Setting initial chat:', mostRecentChat.id, 'version:', mostRecentChat._version);
                                        return mostRecentChat;
                                    }
                                    // No non-archived chats available - will be handled by creation effect
                                    console.log('[TabContext] No non-archived chats available');
                                    return null;
                                }
                                
                                // If current chat is archived, switch to most recent non-archived or null
                                if (prevCurrent.archived) {
                                    if (mostRecentChat) {
                                        chatVersionRef.current = mostRecentChat._version;
                                        console.log('[TabContext] Current chat archived, switching to:', mostRecentChat.id, 'version:', mostRecentChat._version);
                                        return mostRecentChat;
                                    } else {
                                        // All chats are archived - set to null, creation effect will make a new one
                                        console.log('[TabContext] All chats archived, clearing current chat - new one will be created');
                                        chatVersionRef.current = undefined;
                                        return null;
                                    }
                                }
                                
                                // Find updated version of current chat
                                const updatedCurrent = items.find(item => item.id === prevCurrent.id);
                                // Only update if version has actually changed (like Grade pattern)
                                if (updatedCurrent && chatVersionRef.current !== updatedCurrent._version) {
                                    const prevVersion = chatVersionRef.current;
                                    chatVersionRef.current = updatedCurrent._version;
                                    console.log('[TabContext] Updating current chat version:', updatedCurrent.id, prevVersion, '→', updatedCurrent._version);
                                    return updatedCurrent;
                                }
                            } else {
                                // No chats at all - clear current chat so creation effect triggers
                                console.log('[TabContext] No chats found, clearing current chat - new one will be created');
                                chatVersionRef.current = undefined;
                                return null;
                            }
                            return prevCurrent;
                        });
                    }
                });
            } catch (error) {
                console.error('[TabContext] Error setting up DataStore subscription:', error);
            }
        };
        
        setupSubscription();

        return () => {
            console.log('[TabContext] Cleaning up subscription');
            isSubscribed = false;
            if (chatSubscription) chatSubscription.unsubscribe();
        };
    }, []);

    // Create AssistantChat if needed
    useEffect(() => {
        // Don't create anything until subscription has initialized
        if (!subscriptionInitializedRef.current) {
            console.log('[TabContext] Waiting for subscription to initialize');
            return;
        }
        
        // Check if we have a non-archived chat
        if (assistantChat?.id && !assistantChat.archived) {
            console.log('[TabContext] Chat exists and not archived, skipping creation');
            return;
        }
        
        // If there are existing non-archived chats, use them instead of creating
        const nonArchivedChats = chatHistories.filter(chat => !chat.archived);
        if (nonArchivedChats.length > 0) {
            console.log('[TabContext] Found', nonArchivedChats.length, 'non-archived chats, subscription will handle selection');
            return;
        }
        
        // If current chat is archived or doesn't exist, we need a new one
        if (assistantChat?.archived) {
            console.log('[TabContext] Current chat is archived, will create new chat');
        } else if (!assistantChat?.id) {
            console.log('[TabContext] No current chat available, will create one');
        }

        // Create new AssistantChat
        async function createChat() {
            console.log('[TabContext] Creating AssistantChat');
            
            try {
                await DataStore.save(new AssistantChat({
                    model: 'gpt-4',
                    messages: JSON.stringify([]),
                    threadInstructions: '',
                    additionalInstructions: '',
                }));
                console.log('[TabContext] Created AssistantChat, waiting for subscription');
            } catch (error) {
                console.error('[TabContext] Error creating chat:', error);
                setChatCreationError(error.message || 'Failed to create chat');
            }
        }

        createChat();
    }, [subscriptionReady, assistantChat?.id, assistantChat?.archived, chatHistories.length]);

    // Memoize context value using primitive dependencies to prevent unnecessary re-renders
    const contextValue = React.useMemo(() => ({
        ...value,
        assistantChat,
        chatHistories,
        setCurrentChat: setAssistantChat,
        isLoadingChat,
        chatCreationError,
    }), [
        value,
        assistantChat?.id,
        assistantChat?._version,
        chatHistories?.length,
        isLoadingChat,
        chatCreationError,
    ]);

    return (
        <TabContext.Provider value={contextValue}>
            {children}
        </TabContext.Provider>
    );
}

export default TabContext;
