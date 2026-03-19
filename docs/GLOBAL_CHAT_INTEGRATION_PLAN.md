# Global ChatSidebar Integration Plan

**Date**: March 10, 2026  
**Status**: 📋 Planning Phase  
**Goal**: Make ChatSidebar accessible from all pages with shared, persistent state

## Executive Summary

Currently, ChatSidebar is only available in the Unit Editor (commented out in [TabsVerticalLeft.jsx](../src/components/Editor3/components/TabsVerticalLeft.jsx)). This plan outlines how to make the AI assistant globally available across the entire application while maintaining shared state and context awareness.

## Current State Analysis

### Existing Implementation

**ChatSidebar Location**: [src/components/ChatSidebar.jsx](../src/components/ChatSidebar.jsx)
- ✅ Fully functional component with streaming AI responses
- ✅ Tool calling system (20 tools including 4 tour controls)
- ✅ Context-aware (Unit, Section, Files, Dictionary, Questions)
- ❌ Only integrated in Unit Editor (currently commented out)
- ❌ No global access from other pages

**State Management**:
1. **TabContext** ([src/context/tabContext.jsx](../src/context/tabContext.jsx))
   - Manages `assistantChat` (current chat session)
   - Manages `chatHistories` (all chat records)
   - Uses DataStore.observeQuery for real-time sync
   - Persists to `AssistantChat` model in DynamoDB

2. **Local ChatSidebar State** (useReducer)
   - UI state (dragging, dialogs, file uploads)
   - Document processing status
   - Tool execution states
   - Input draft and history drawer

3. **useChat Hook** (@ai-sdk/react)
   - Manages messages array
   - Handles streaming responses
   - Executes tools client-side
   - Non-persistent (resets on unmount)

### Dependencies

ChatSidebar currently depends on:
- ✅ **Required** (available everywhere):
  - `AuthContext` - User authentication
  - `TabContext` - Chat history management
  
- ⚠️ **Optional** (page-specific):
  - `UnitContext` - Current unit data (Editor only)
  - `SectionContext` - Class sections (Editor, Sections page)
  - `FilesContext` - File management (Editor only)
  - `VectorStoreContext` - Semantic search (Editor only, unit-specific)

**Challenge**: Make ChatSidebar work across all pages despite varying context availability.

**VectorStoreContext Strategy**: 
- VectorStoreContext provides unit-specific semantic search (comes from FilesContext)
- Cannot be made global without losing unit context
- When unavailable, `search_content` tool will:
  - Fall back to keyword search across all content
  - Offer to navigate to a specific unit for semantic search
  - Search globally across all units' embeddings (future enhancement)

## Architecture Design

### Option 1: Global Chat Context 🏆 **RECOMMENDED**

Create a new `ChatContext` that wraps the entire app and provides chat functionality everywhere.

#### Benefits
- ✅ Single source of truth for chat state
- ✅ State persists across page navigation
- ✅ Can inject page-specific context dynamically
- ✅ Follows existing app patterns (AuthContext, DebugPanelProvider)
- ✅ Easier to maintain and debug

#### Structure

```javascript
// src/context/chatContext.jsx
export function ChatContextProvider({ children }) {
  // Chat UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPosition, setChatPosition] = useState('right'); // 'right', 'left', 'floating'
  
  // Get chat data from TabContext (already managing AssistantChat)
  const { assistantChat, chatHistories, setCurrentChat, isLoadingChat } = useTabContext();
  
  // Page-specific context injection
  const [pageContext, setPageContext] = useState({});
  
  // useChat hook (persisted across renders if chat open)
  const chat = useChat({
    api: '/api/chat',
    // ... existing config
  });
  
  return (
    <ChatContext.Provider value={{
      isChatOpen,
      setIsChatOpen,
      chatPosition,
      setChatPosition,
      assistantChat,
      chatHistories,
      setCurrentChat,
      pageContext,
      setPageContext,
      ...chat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
```

### Option 2: Portal-Based Chat

Use React Portals to render ChatSidebar at app root while keeping state in TabContext.

#### Benefits
- ✅ No new context needed
- ✅ ChatSidebar stays as-is

#### Drawbacks
- ❌ Harder to manage state across pages
- ❌ Complex portal coordination
- ❌ Context availability issues

**Verdict**: Less maintainable than Option 1.

### Option 3: Page-Level Chat Components

Each page imports and renders ChatSidebar independently.

#### Drawbacks
- ❌ State not shared between pages
- ❌ Chat resets on navigation
- ❌ Duplicated code
- ❌ Poor UX

**Verdict**: Not recommended.

## Implementation Plan

### Phase 1: Create ChatContext (2-3 hours)

**Goal**: Centralize all chat state management in a new context that wraps the app.

#### Tasks

1. **Create `src/context/chatContext.jsx`** (~1 hour)
   ```javascript
   import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
   import { useChat } from '@ai-sdk/react';
   import { useTabContext } from './tabContext';
   import AuthContext from './authContext';
   
   const ChatContext = createContext(null);
   
   export function useChatContext() {
     const context = useContext(ChatContext);
     if (!context) {
       throw new Error('useChatContext must be used within ChatContextProvider');
     }
     return context;
   }
   
   export function useChatContextSafe() {
     return useContext(ChatContext);
   }
   
   export function ChatContextProvider({ children }) {
     // Chat UI state
     const [isChatOpen, setIsChatOpen] = useState(false);
     const [chatPosition, setChatPosition] = useState('right');
     
     // Navigation offer state
     const [navigationOffer, setNavigationOffer] = useState(null);
     const router = useRouter();
     
     // Page context injection
     const [pageContext, setPageContext] = useState({
       unit: null,
       section: null,
       files: {},
       dictionary: {},
       questionBank: {},
       editorRef: null,
       insertWord: null,
       insertQuestion: null,
     });
     
     // Get chat persistence from TabContext
     const { assistantChat, chatHistories, setCurrentChat, isLoadingChat } = useTabContext();
     
     // Auth
     const { user } = useContext(AuthContext);
     
     // Load messages from assistantChat when it changes
     const [initialMessages, setInitialMessages] = useState([]);
     
     useEffect(() => {
       if (!assistantChat || isLoadingChat) return;
       
       let messagesArray = [];
       const rawMessages = assistantChat.messages;
       
       if (Array.isArray(rawMessages)) {
         messagesArray = rawMessages;
       } else if (typeof rawMessages === 'string' && rawMessages) {
         try {
           messagesArray = JSON.parse(rawMessages);
           if (!Array.isArray(messagesArray)) messagesArray = [];
         } catch (e) {
           console.error('[ChatContext] Failed to parse messages:', e);
           messagesArray = [];
         }
       }
       
       setInitialMessages(messagesArray);
     }, [assistantChat?.id, isLoadingChat]);
     
     // useChat hook with persistence
     const chat = useChat({
       api: '/api/chat',
       initialMessages,
       // ... rest of config from ChatSidebar
     });
     
     // Save messages to AssistantChat when they change
     useEffect(() => {
       if (!assistantChat || !chat.messages.length) return;
       
       // Debounced save to avoid excessive writes
       const timeoutId = setTimeout(async () => {
         try {
           await client.models.AssistantChat.update({
             id: assistantChat.id,
             messages: JSON.stringify(chat.messages),
           });
         } catch (error) {
           console.error('[ChatContext] Failed to save messages:', error);
         }
       }, 1000);
       
       return () => clearTimeout(timeoutId);
     }, [chat.messages, assistantChat?.id]);
     
     // Navigation helper
     const navigateToPage = useCallback(async (path) => {
       setNavigationOffer(null);
       await router.push(path);
     }, [router]);
     
     const value = useMemo(() => ({
       // UI state
       isChatOpen,
       setIsChatOpen,
       chatPosition,
       setChatPosition,
       
       // Navigation
       navigationOffer,
       setNavigationOffer,
       navigateToPage,
       
       // Page context
       pageContext,
       setPageContext,
       
       // Chat persistence
       assistantChat,
       chatHistories,
       setCurrentChat,
       isLoadingChat,
       
       // Chat functionality (from useChat hook)
       messages: chat.messages,
       input: chat.input,
       handleInputChange: chat.handleInputChange,
       handleSubmit: chat.handleSubmit,
       isLoading: chat.isLoading,
       error: chat.error,
       reload: chat.reload,
       stop: chat.stop,
       setMessages: chat.setMessages,
       append: chat.append,
       setInput: chat.setInput,
     }), [
       isChatOpen,
       chatPosition,
       pageContext,
       assistantChat?.id,
       chatHistories.length,
       isLoadingChat,
       chat.messages.length,
       chat.input,
       chat.isLoading,
       chat.error,
     ]);
     
     return (
       <ChatContext.Provider value={value}>
         {children}
       </ChatContext.Provider>
     );
   }
   
   export default ChatContext;
   ```

2. **Add ChatContextProvider to app root** (~15 min)
   ```javascript
   // pages/_app.jsx
   import { ChatContextProvider } from '../src/context/chatContext';
   
   function MyApp(props) {
     // ... existing code
     
     return (
       <CacheProvider value={emotionCache}>
         <Head>
           <meta name="viewport" content="initial-scale=1, width=device-width" />
         </Head>
         <ThemeProvider theme={theme}>
           <CssBaseline />
           <DebugPanelProvider>
             <AuthProvider>
               <ChatContextProvider>  {/* NEW */}
                 <Component {...pageProps} />
               </ChatContextProvider>
             </AuthProvider>
           </DebugPanelProvider>
         </ThemeProvider>
       </CacheProvider>
     );
   }
   ```

3. **Add TabProvider to app root** (~10 min)
   
   Currently TabProvider is only used in Editor. Move it to _app.jsx so ChatContext can access it.
   
   ```javascript
   // pages/_app.jsx
   import { TabProvider } from '../src/context/tabContext';
   
   function MyApp(props) {
     return (
       <CacheProvider value={emotionCache}>
         {/* ... */}
         <ThemeProvider theme={theme}>
           <CssBaseline />
           <DebugPanelProvider>
             <AuthProvider>
               <TabProvider>  {/* NEW - provides assistantChat */}
                 <ChatContextProvider>
                   <Component {...pageProps} />
                 </ChatContextProvider>
               </TabProvider>
             </AuthProvider>
           </DebugPanelProvider>
         </ThemeProvider>
       </CacheProvider>
     );
   }
   ```

4. **Create `useChatPageContext` hook** (~30 min)
   
   Helper hook for pages to register their context with ChatContext.
   
   ```javascript
   // src/hooks/useChatPageContext.jsx
   import { useEffect } from 'react';
   import { useChatContextSafe } from '../context/chatContext';
   
   /**
    * Register page-specific context with ChatContext
    * Call this in any page/component that wants to provide context to the chatbot
    */
   export function useChatPageContext(context) {
     const chatContext = useChatContextSafe();
     
     useEffect(() => {
       if (!chatContext) return;
       
       chatContext.setPageContext(prev => ({
         ...prev,
         ...context,
       }));
       
       // Cleanup: remove this context when component unmounts
       return () => {
         chatContext.setPageContext(prev => {
           const next = { ...prev };
           Object.keys(context).forEach(key => {
             if (next[key] === context[key]) {
               delete next[key];
             }
           });
           return next;
         });
       };
     }, [chatContext, ...Object.values(context)]);
   }
   
   // Usage in Unit Editor:
   // useChatPageContext({ unit, files, dictionary, questionBank, editorRef, insertWord, insertQuestion });
   ```

### Phase 2: Refactor ChatSidebar Component (3-4 hours)

**Goal**: Make ChatSidebar consume ChatContext instead of local state, handle missing contexts gracefully, and offer navigation when needed.

#### Tasks

1. **Create ChatSidebar2 component** (~1 hour)
   
   Use component versioning pattern (see [.github/skills/component-versioning](../.github/skills/component-versioning/SKILL.md)).
   
   ```bash
   # Use skill to create versioned component
   @workspace /Use component-versioning to create ChatSidebar2 from ChatSidebar
   ```
   
   **Key changes in ChatSidebar2**:
   - Replace local `useChat` with `useChatContext`
   - Replace `useTabContext` with context from `useChatContext`
   - Get page context from `chatContext.pageContext` instead of direct context imports
   - Add null checks for optional contexts (unit, files, etc.)
   - Keep local reducer for UI-only state (dialogs, file uploads, etc.)

2. **Update context consumption** (~1 hour)
   
   ```javascript
   // src/components/ChatSidebar2.jsx
   import { useChatContext } from '../context/chatContext';
   
   const ChatSidebar2 = () => {
     const chatContext = useChatContext();
     const {
       messages,
       input,
       handleInputChange,
       handleSubmit,
       isLoading,
       pageContext,
       assistantChat,
       chatHistories,
     } = chatContext;
     
     // Use pageContext instead of direct context imports
     const {
       unit = null,
       files = {},
       dictionary = {},
       questionBank = {},
       sections = [],
       editorRef = null,
       insertWord = null,
       insertQuestion = null,
     } = pageContext;
     
     // Build context data with null checks
     const contextData = useMemo(() => ({
       unit: unit ? {
         id: unit.id,
         name: unit.name,
         description: unit.description,
         data: unit.data,
       } : null,
       files: Object.values(files).map(f => ({
         id: f.id,
         name: f.name,
         description: f.description,
         mimeType: f.mimeType,
       })),
       questionBank: Object.values(questionBank).map(q => ({
         id: q.id,
         prompt: q.prompt,
         answer: q.answer,
       })),
       dictionary: Object.values(dictionary).map(d => ({
         id: d.id,
         phrase: d.phrase,
         definition: d.definition,
       })),
       sections: sections.map(s => ({
         id: s.id,
         name: s.name,
         description: s.description,
       })),
     }), [unit, files, questionBank, dictionary, sections]);
     
     // ... rest of component logic
   };
   ```

3. **Add graceful degradation with navigation offers** (~1 hour)
   
   ```javascript
   // In ChatSidebar2.jsx
   import { useRouter } from 'next/router';
   
   // Tool execution with context checks and navigation offers
   const handleToolExecution = useCallback(async (toolName, args) => {
     const { setNavigationOffer } = useChatContext();
     
     // Define context requirements and navigation targets
     const contextRequirements = {
       insert_quiz: {
         contexts: ['editorRef', 'unit'],
         page: 'editor',
         message: 'To insert blocks, you need to be in the Unit Editor.',
         getPath: (args, pageContext) => {
           const unitId = pageContext.unit?.id || args.unitId;
           return unitId ? `/unit/${unitId}` : '/units';
         },
       },
       insert_answer_block: {
         contexts: ['editorRef', 'unit'],
         page: 'editor',
         message: 'To insert blocks, you need to be in the Unit Editor.',
         getPath: (args, pageContext) => {
           const unitId = pageContext.unit?.id || args.unitId;
           return unitId ? `/unit/${unitId}` : '/units';
         },
       },
       insert_meaning_association: {
         contexts: ['editorRef', 'unit'],
         page: 'editor',
         message: 'To insert blocks, you need to be in the Unit Editor.',
         getPath: (args, pageContext) => {
           const unitId = pageContext.unit?.id || args.unitId;
           return unitId ? `/unit/${unitId}` : '/units';
         },
       },
       insert_custom_answer: {
         contexts: ['editorRef', 'unit'],
         page: 'editor',
         message: 'To insert blocks, you need to be in the Unit Editor.',
         getPath: (args, pageContext) => {
           const unitId = pageContext.unit?.id || args.unitId;
           return unitId ? `/unit/${unitId}` : '/units';
         },
       },
       create_vocabulary_word: {
         contexts: ['unit'], // Optional - can work without but helpful
         page: 'editor',
         optional: true,
         message: 'To add vocabulary to a specific unit, navigate to the Unit Editor.',
         getPath: (args, pageContext) => {
           const unitId = args.unitId || pageContext.unit?.id;
           return unitId ? `/unit/${unitId}` : '/units';
         },
       },
       create_question: {
         contexts: ['unit'], // Optional - can work without but helpful
         page: 'editor',
         optional: true,
         message: 'To add questions to a specific unit, navigate to the Unit Editor.',
         getPath: (args, pageContext) => {
           const unitId = args.unitId || pageContext.unit?.id;
           return unitId ? `/unit/${unitId}` : '/units';
         },
       },
     };
     
     const requirement = contextRequirements[toolName];
     if (requirement) {
       // Check if required contexts are available
       const missingContexts = requirement.contexts.filter(ctx => !pageContext[ctx]);
       
       if (missingContexts.length > 0 && !requirement.optional) {
         // Required context missing - offer navigation
         const path = requirement.getPath(args, pageContext);
         
         setNavigationOffer({
           message: requirement.message,
           path,
           toolName,
           args,
         });
         
         return {
           success: false,
           requiresNavigation: true,
           message: requirement.message,
           navigationPath: path,
         };
       }
       
       if (missingContexts.length > 0 && requirement.optional) {
         // Optional context missing - suggest but continue
         const path = requirement.getPath(args, pageContext);
         console.log(`[ChatSidebar2] Optional context missing for ${toolName}, suggesting navigation to ${path}`);
       }
     }
     
     // Execute tool as normal
     return await executeTool(toolName, args);
   }, [pageContext]);
   ```

4. **Update system messages based on available context** (~30 min)
   
   ```javascript
   // In customFetch function
   const buildSystemMessage = useCallback(() => {
     let message = `You are an AI assistant for an e-learning platform.`;
     
     if (pageContext.unit) {
       message += `\n\nCurrent Unit: ${pageContext.unit.name}`;
     }
     
     if (pageContext.editorRef) {
       message += `\n\nYou can insert content blocks directly into the editor using tools.`;
     }
     
     if (Object.keys(pageContext.files || {}).length > 0) {
       message += `\n\nFiles available: ${Object.keys(pageContext.files).length}`;
     }
     
     // List available tools based on context
     const availableTools = toolDefinitions.filter(tool => {
       // Filter tools by context availability
       if (tool.name.startsWith('insert_') && !pageContext.editorRef) {
         return false;
       }
       return true;
     });
     
     message += `\n\nAvailable actions: ${availableTools.map(t => t.name).join(', ')}`;
     
     return message;
   }, [pageContext]);
   ```

### Phase 3: Create Global Chat UI (4-5 hours)

**Goal**: Add a floating action button (FAB), drawer, and navigation prompts to access chat from any page.

#### Tasks

1. **Create GlobalChatButton component** (~1 hour)
   
   ```javascript
   // src/components/GlobalChatButton.jsx
   import React from 'react';
   import { Fab, Badge, Tooltip, Zoom } from '@mui/material';
   import ChatIcon from '@mui/icons-material/Chat';
   import CloseIcon from '@mui/icons-material/Close';
   import { useChatContext } from '../context/chatContext';
   import { useTranslation } from 'next-i18next';
   
   /**
    * Floating action button to toggle global chat
    * Shows badge when chat has unread messages or is processing
    */
   export function GlobalChatButton() {
     const { t } = useTranslation('components');
     const { isChatOpen, setIsChatOpen, isLoading, messages } = useChatContext();
     
     // Calculate unread count (simple heuristic: messages since last user message)
     const unreadCount = React.useMemo(() => {
       const lastUserIndex = messages.findLastIndex(m => m.role === 'user');
       if (lastUserIndex === -1) return 0;
       return messages.slice(lastUserIndex + 1).filter(m => m.role === 'assistant').length;
     }, [messages]);
     
     const handleClick = () => {
       setIsChatOpen(!isChatOpen);
     };
     
     return (
       <Zoom in={true}>
         <Tooltip 
           title={isChatOpen ? t('chat.close') : t('chat.open')} 
           placement="left"
         >
           <Fab
             color="primary"
             aria-label={isChatOpen ? 'close chat' : 'open chat'}
             onClick={handleClick}
             sx={{
               position: 'fixed',
               bottom: 24,
               right: 24,
               zIndex: 1300, // Above app bar (1200) but below modals (1400)
               transition: 'transform 0.2s',
               '&:hover': {
                 transform: 'scale(1.1)',
               },
             }}
           >
             <Badge 
               badgeContent={isLoading ? '...' : unreadCount} 
               color="error"
               invisible={!isLoading && unreadCount === 0}
             >
               {isChatOpen ? <CloseIcon /> : <ChatIcon />}
             </Badge>
           </Fab>
         </Tooltip>
       </Zoom>
     );
   }
   ```

2. **Create NavigationPrompt component** (~30 min)
   
   ```javascript
   // src/components/ChatSidebar/NavigationPrompt.jsx
   import React from 'react';
   import { Alert, Button, Box } from '@mui/material';
   import { useChatContext } from '../../context/chatContext';
   import { useTranslation } from 'next-i18next';
   import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
   
   /**
    * Displays navigation offer when tool requires different page context
    */
   export function NavigationPrompt() {
     const { t } = useTranslation('components');
     const { navigationOffer, setNavigationOffer, navigateToPage } = useChatContext();
     
     if (!navigationOffer) return null;
     
     const handleNavigate = () => {
       navigateToPage(navigationOffer.path);
     };
     
     const handleDismiss = () => {
       setNavigationOffer(null);
     };
     
     return (
       <Alert 
         severity="info"
         action={
           <Box sx={{ display: 'flex', gap: 1 }}>
             <Button 
               color="inherit" 
               size="small" 
               onClick={handleDismiss}
             >
               {t('chat.navigationPrompt.dismiss', 'Not now')}
             </Button>
             <Button 
               color="inherit" 
               size="small"
               variant="outlined"
               endIcon={<ArrowForwardIcon />}
               onClick={handleNavigate}
             >
               {t('chat.navigationPrompt.navigate', 'Go there')}
             </Button>
           </Box>
         }
         sx={{ mb: 2 }}
       >
         {navigationOffer.message}
       </Alert>
     );
   }
   ```

3. **Create GlobalChatDrawer component** (~1.5 hours)
   
   ```javascript
   // src/components/GlobalChatDrawer.jsx
   import React from 'react';
   import { Drawer, Box, IconButton, Typography, Divider } from '@mui/material';
   import CloseIcon from '@mui/icons-material/Close';
   import SettingsIcon from '@mui/icons-material/Settings';
   import { useChatContext } from '../context/chatContext';
   import { useTranslation } from 'next-i18next';
   import ChatSidebar2 from './ChatSidebar2';
   
   /**
    * Global chat drawer that slides in from the right
    * Contains the ChatSidebar2 component
    */
   export function GlobalChatDrawer() {
     const { t } = useTranslation('components');
     const { isChatOpen, setIsChatOpen, chatPosition, setChatPosition } = useChatContext();
     
     const handleClose = () => {
       setIsChatOpen(false);
     };
     
     return (
       <Drawer
         anchor={chatPosition}
         open={isChatOpen}
         onClose={handleClose}
         variant="persistent"
         sx={{
           width: 400,
           flexShrink: 0,
           '& .MuiDrawer-paper': {
             width: 400,
             boxSizing: 'border-box',
             top: 'var(--app-bar-height, 64px)', // Below app bar
             height: 'calc(100vh - var(--app-bar-height, 64px))',
           },
         }}
       >
         <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
           {/* Header */}
           <Box sx={{ 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'space-between',
             p: 2,
             borderBottom: 1,
             borderColor: 'divider',
           }}>
             <Typography variant="h6">
               {t('chat.title', 'AI Assistant')}
             </Typography>
             <Box>
               <IconButton size="small" onClick={() => {/* open settings */}}>
                 <SettingsIcon />
               </IconButton>
               <IconButton size="small" onClick={handleClose}>
                 <CloseIcon />
               </IconButton>
             </Box>
           </Box>
           
           {/* Navigation prompt (if context missing) */}
           <Box sx={{ p: 2, pb: 0 }}>
             <NavigationPrompt />
           </Box>
           
           {/* Chat content */}
           <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
             <ChatSidebar2 />
           </Box>
         </Box>
       </Drawer>
     );
   }
   ```

3. **Add GlobalChat to _app.jsx** (~30 min)
   
   ```javascript
   // pages/_app.jsx
   import { GlobalChatButton } from '../src/components/GlobalChatButton';
   import { GlobalChatDrawer } from '../src/components/GlobalChatDrawer';
   
   function MyApp(props) {
     const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
     
     return (
       <CacheProvider value={emotionCache}>
         {/* ... existing providers ... */}
         <ThemeProvider theme={theme}>
           <CssBaseline />
           <DebugPanelProvider>
             <AuthProvider>
               <TabProvider>
                 <ChatContextProvider>
                   <Component {...pageProps} />
                   
                   {/* Global chat UI - only shows when user is authenticated */}
                   <AuthContextConsumer>
                     {({ user }) => user && (
                       <>
                         <GlobalChatButton />
                         <GlobalChatDrawer />
                       </>
                     )}
                   </AuthContextConsumer>
                 </ChatContextProvider>
               </TabProvider>
             </AuthProvider>
           </DebugPanelProvider>
         </ThemeProvider>
       </CacheProvider>
     );
   }
   ```

4. **Add keyboard shortcut** (~30 min)
   
   ```javascript
   // src/hooks/useGlobalChatShortcut.js
   import { useEffect } from 'react';
   import { useChatContext } from '../context/chatContext';
   
   /**
    * Registers global keyboard shortcut to toggle chat
    * Default: Cmd/Ctrl + K
    */
   export function useGlobalChatShortcut(key = 'k') {
     const { setIsChatOpen } = useChatContext();
     
     useEffect(() => {
       const handleKeyDown = (event) => {
         if ((event.metaKey || event.ctrlKey) && event.key === key) {
           event.preventDefault();
           setIsChatOpen(prev => !prev);
         }
       };
       
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [key, setIsChatOpen]);
   }
   
   // Use in _app.jsx
   function MyApp(props) {
     useGlobalChatShortcut(); // Cmd/Ctrl + K to toggle chat
     // ... rest of component
   }
   ```

### Phase 4: Update Existing Pages (1-2 hours)

**Goal**: Update Editor and other pages to register their context with ChatContext.

#### Tasks

1. **Update Unit Editor** (~30 min)
   
   ```javascript
   // pages/unit/[id].jsx
   import { useChatPageContext } from '../../src/hooks/useChatPageContext';
   
   function UnitPage() {
     const unitContext = React.useContext(UnitContext);
     const { 
       unit, 
       files, 
       dictionary, 
       questionBank, 
       editorRef,
       insertWord,
       insertQuestion,
     } = unitContext;
     
     // Register with ChatContext
     useChatPageContext({
       unit,
       files,
       dictionary,
       questionBank,
       editorRef,
       insertWord,
       insertQuestion,
     });
     
     // ... rest of component
   }
   ```

2. **Update Sections page** (~15 min)
   
   ```javascript
   // pages/sections.jsx
   import { useChatPageContext } from '../src/hooks/useChatPageContext';
   
   function Sections() {
     const { sections } = React.useContext(SectionContext);
     
     // Register with ChatContext
     useChatPageContext({ sections });
     
     // ... rest of component
   }
   ```

3. **Update Workbook page** (~15 min)
   
   ```javascript
   // pages/workbook/[id].jsx
   import { useChatPageContext } from '../../src/hooks/useChatPageContext';
   
   function WorkbookPage() {
     const unitContext = React.useContext(UnitContext);
     const { unit, currentGrade } = unitContext;
     
     // Register with ChatContext
     useChatPageContext({ unit, currentGrade });
     
     // ... rest of component
   }
   ```

4. **Update Home page** (~15 min)
   
   ```javascript
   // pages/index.jsx
   import { useChatPageContext } from '../src/hooks/useChatPageContext';
   
   function Index() {
     const { sections } = React.useContext(SectionContext);
     const [assignments, setAssignments] = useState([]);
     
     // Register with ChatContext
     useChatPageContext({ sections, assignments });
     
     // ... rest of component
   }
   ```

### Phase 5: Testing & Polish (2-3 hours)

#### Tasks

1. **E2E Tests** (~1 hour)
   
   ```typescript
   // cypress/e2e/global-chat.cy.ts
   describe('Global Chat', () => {
     beforeEach(() => {
       cy.login(); // Custom command
     });
     
     it('should open chat from FAB button', () => {
       cy.visit('/');
       cy.get('[aria-label="open chat"]').click();
       cy.get('[role="dialog"]').should('be.visible');
       cy.contains('AI Assistant').should('be.visible');
     });
     
     it('should persist chat across pages', () => {
       cy.visit('/');
       cy.get('[aria-label="open chat"]').click();
       cy.get('[data-testid="chat-input"]').type('Hello');
       cy.get('[data-testid="chat-submit"]').click();
       
       // Navigate to different page
       cy.visit('/units');
       
       // Chat should still be open with same messages
       cy.get('[role="dialog"]').should('be.visible');
       cy.contains('Hello').should('be.visible');
     });
     
     it('should provide context-aware responses in Editor', () => {
       cy.visit('/unit/test-unit-id');
       cy.get('[aria-label="open chat"]').click();
       cy.get('[data-testid="chat-input"]').type('Insert a quiz block');
       cy.get('[data-testid="chat-submit"]').click();
       
       // Should execute insert_quiz tool
       cy.contains('Inserting quiz').should('be.visible');
     });
     
     it('should gracefully handle missing context', () => {
       cy.visit('/profile'); // No unit context
       cy.get('[aria-label="open chat"]').click();
       cy.get('[data-testid="chat-input"]').type('Insert a quiz block');
       cy.get('[data-testid="chat-submit"]').click();
       
       // Should explain context is missing
       cy.contains('requires the editorRef context').should('be.visible');
     });
     
     it('should toggle with keyboard shortcut', () => {
       cy.visit('/');
       cy.get('body').type('{meta}k'); // Cmd+K
       cy.get('[role="dialog"]').should('be.visible');
       
       cy.get('body').type('{meta}k'); // Cmd+K again
       cy.get('[role="dialog"]').should('not.be.visible');
     });
   });
   ```

2. **Unit Tests** (~1 hour)
   
   ```javascript
   // src/context/__tests__/chatContext.test.jsx
   import { renderHook, act } from '@testing-library/react';
   import { ChatContextProvider, useChatContext } from '../chatContext';
   
   describe('ChatContext', () => {
     it('should provide chat state', () => {
       const { result } = renderHook(() => useChatContext(), {
         wrapper: ChatContextProvider,
       });
       
       expect(result.current.isChatOpen).toBe(false);
       expect(result.current.messages).toEqual([]);
     });
     
     it('should toggle chat open state', () => {
       const { result } = renderHook(() => useChatContext(), {
         wrapper: ChatContextProvider,
       });
       
       act(() => {
         result.current.setIsChatOpen(true);
       });
       
       expect(result.current.isChatOpen).toBe(true);
     });
     
     it('should update page context', () => {
       const { result } = renderHook(() => useChatContext(), {
         wrapper: ChatContextProvider,
       });
       
       const mockUnit = { id: '1', name: 'Test Unit' };
       
       act(() => {
         result.current.setPageContext({ unit: mockUnit });
       });
       
       expect(result.current.pageContext.unit).toEqual(mockUnit);
     });
   });
   ```

3. **Accessibility Audit** (~30 min)
   
   - [ ] Chat drawer has proper ARIA labels
   - [ ] Keyboard navigation works (Tab, Escape)
   - [ ] Focus management (trapped in drawer when open)
   - [ ] Screen reader announcements for new messages
   - [ ] Color contrast meets WCAG AA standards

4. **Performance Optimization** (~30 min)
   
   - [ ] Memoize context values to prevent unnecessary re-renders
   - [ ] Lazy load ChatSidebar2 component
   - [ ] Debounce message saves to AssistantChat
   - [ ] Virtualize long message lists (already implemented in VirtualizedMessageList)
   - [ ] Monitor bundle size impact

## File Structure

```
src/
├── context/
│   ├── chatContext.jsx                 # NEW - Global chat state
│   ├── tabContext.jsx                  # EXISTING - AssistantChat persistence
│   └── tourContext.tsx                 # EXISTING - Tour integration
├── components/
│   ├── ChatSidebar.jsx                 # EXISTING - Original component
│   ├── ChatSidebar2.jsx                # NEW - Context-aware version
│   ├── GlobalChatButton.jsx            # NEW - FAB to open chat
│   ├── GlobalChatDrawer.jsx            # NEW - Drawer wrapper
│   └── ChatSidebar/
│       ├── VirtualizedMessageList.jsx  # EXISTING
│       ├── ToolCallPreview.jsx         # EXISTING
│       ├── NavigationPrompt.jsx        # NEW - Navigation offers
│       └── ...                         # EXISTING subcomponents
├── hooks/
│   ├── useChatPageContext.jsx          # NEW - Register page context
│   └── useGlobalChatShortcut.js        # NEW - Keyboard shortcut
└── utils/
    ├── chatTools.js                    # EXISTING - Tool definitions
    └── ...

pages/
├── _app.jsx                            # UPDATED - Add providers + UI
├── index.jsx                           # UPDATED - Register context
├── units.jsx                           # UPDATED - Register context
├── sections.jsx                        # UPDATED - Register context
├── unit/[id].jsx                       # UPDATED - Register context
├── workbook/[id].jsx                   # UPDATED - Register context
└── section/[id].jsx                    # UPDATED - Register context

cypress/
└── e2e/
    └── global-chat.cy.ts               # NEW - E2E tests

docs/
└── GLOBAL_CHAT_INTEGRATION_PLAN.md     # THIS FILE
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
└───────────────────┬──────────────────────┬──────────────────┘
                    │                      │
        ┌───────────▼──────────┐  ┌────────▼─────────┐
        │  GlobalChatButton    │  │   Keyboard       │
        │  (FAB)               │  │   (Cmd/Ctrl+K)   │
        └───────────┬──────────┘  └────────┬─────────┘
                    │                      │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼──────────┐
                    │  ChatContext        │
                    │  (Global State)     │
                    │                     │
                    │  - isChatOpen       │
                    │  - messages         │
                    │  - pageContext      │
                    └──┬────────┬─────────┘
                       │        │
         ┌─────────────┘        └──────────────┐
         │                                     │
┌────────▼─────────┐                 ┌────────▼──────────┐
│  TabContext      │                 │  Page Components  │
│  (Persistence)   │                 │                   │
│                  │                 │  - useChatPage    │
│  - assistantChat │                 │    Context()      │
│  - chatHistories │                 │  - Register:      │
│  - DataStore     │                 │    * unit         │
│    observeQuery  │                 │    * files        │
└────────┬─────────┘                 │    * sections     │
         │                           │    * editorRef    │
         │                           └───────────────────┘
         │
┌────────▼──────────┐
│  AssistantChat    │
│  (DynamoDB)       │
│                   │
│  - id             │
│  - messages: JSON │
│  - model          │
│  - archived       │
└───────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Message Flow                              │
└─────────────────────────────────────────────────────────────┘

User Input
    │
    ▼
ChatContext.handleSubmit
    │
    ├─> useChat hook (AI SDK)
    │       │
    │       ├─> POST /api/chat
    │       │       │
    │       │       ├─> OpenAI GPT-4
    │       │       │       │
    │       │       │       ├─> Tool Call?
    │       │       │       │       │
    │       │       │       │       ├─> Yes: Return tool call
    │       │       │       │       │
    │       │       │       │       └─> No: Return text response
    │       │       │       │
    │       │       │       └─> Streaming response
    │       │       │
    │       │       └─> 回 SSE stream to client
    │       │
    │       └─> Update messages state
    │
    └─> Save to AssistantChat (debounced)

Tool Execution (Client-Side)
    │
    ├─> experimental_tools in useChat
    │
    ├─> Check pageContext for required context
    │       │
    │       ├─> Context available?
    │       │       │
    │       │       ├─> Yes: Execute tool
    │       │       │       │
    │       │       │       └─> Return result
    │       │       │
    │       │       └─> No: Return error message
    │       │
    │       └─> Send result back to GPT-4
    │
    └─> GPT-4 formulates response
```

## Context Availability Matrix

| Page             | Unit | Files | Dictionary | Questions | Sections | EditorRef |
|------------------|------|-------|------------|-----------|----------|-----------|
| Home (/)         | ❌   | ❌    | ❌         | ❌        | ✅       | ❌        |
| Units            | ❌   | ❌    | ❌         | ❌        | ❌       | ❌        |
| Sections         | ❌   | ❌    | ❌         | ❌        | ✅       | ❌        |
| Unit Editor      | ✅   | ✅    | ✅         | ✅        | ✅       | ✅        |
| Workbook         | ✅   | ✅    | ✅         | ✅        | ❌       | ❌        |
| Section Detail   | ❌   | ❌    | ❌         | ❌        | ✅       | ❌        |
| Profile          | ❌   | ❌    | ❌         | ❌        | ❌       | ❌        |

**Tool Availability by Context**:

| Tool                          | Required Context | Fallback Behavior                            |
|-------------------------------|------------------|----------------------------------------------|
| `search_content`              | None             | Always available                             |
| `list_sections`               | None             | Always available                             |
| `create_section`              | None             | Always available                             |
| `list_units`                  | None             | Always available                             |
| `get_unit_details`            | None             | Always available                             |
| `create_unit`                 | None             | Always available                             |
| `update_unit`                 | None             | Always available                             |
| `add_timer_to_unit`           | None             | Always available                             |
| `create_assignment`           | None             | Always available                             |
| `delete_assignment`           | None             | Always available                             |
| `create_vocabulary_word`      | unit (optional)  | Works without unit, can't auto-associate     |
| `create_question`             | unit (optional)  | Works without unit, can't auto-associate     |
| `insert_quiz`                 | editorRef        | Error: "Navigate to Editor to insert blocks" |
| `insert_answer_block`         | editorRef        | Error: "Navigate to Editor to insert blocks" |
| `insert_meaning_association`  | editorRef        | Error: "Navigate to Editor to insert blocks" |
| `insert_custom_answer`        | editorRef        | Error: "Navigate to Editor to insert blocks" |
| `list_tours`                  | None             | Always available                             |
| `start_tour`                  | None             | Always available                             |
| `get_tour_info`               | None             | Always available                             |
| `stop_tour`                   | None             | Always available                             |

## Migration Strategy

### Backward Compatibility

To ensure a smooth transition:

1. **Keep ChatSidebar.jsx untouched**
   - Editor still uses ChatSidebar in TabsVerticalLeft
   - No breaking changes to existing implementation

2. **ChatSidebar2 is opt-in**
   - Only used in GlobalChatDrawer
   - Pages can still use ChatSidebar directly if needed

3. **Gradual rollout**
   - Phase 1: Add global chat, keep Editor chat as-is
   - Phase 2: Test both implementations in parallel
   - Phase 3: Potentially deprecate ChatSidebar after stabilization

### Feature Flags

Use experimental features system (see [docs/EXPERIMENTAL_FEATURES_CATALOG.md](./EXPERIMENTAL_FEATURES_CATALOG.md)):

```javascript
// src/utils/featureFlags.js
export const FEATURES = {
  GLOBAL_CHAT: 'global_chat',
};

// In _app.jsx
import { useFeatureFlag } from '../src/hooks/useFeatureFlag';

function MyApp(props) {
  const globalChatEnabled = useFeatureFlag(FEATURES.GLOBAL_CHAT);
  
  return (
    // ... providers ...
    {globalChatEnabled && (
      <>
        <GlobalChatButton />
        <GlobalChatDrawer />
      </>
    )}
  );
}
```

## Performance Considerations

### Bundle Size

- **Before**: ~150KB (ChatSidebar + dependencies)
- **After**: ~180KB (+ ChatContext, GlobalChatButton, GlobalChatDrawer)
- **Impact**: +30KB (~20% increase)
- **Mitigation**: Lazy load ChatSidebar2 component

```javascript
// src/components/GlobalChatDrawer.jsx
const ChatSidebar2 = React.lazy(() => import('./ChatSidebar2'));

export function GlobalChatDrawer() {
  return (
    <Drawer {...props}>
      <React.Suspense fallback={<CircularProgress />}>
        <ChatSidebar2 />
      </React.Suspense>
    </Drawer>
  );
}
```

### Render Performance

**Potential Issues**:
- ChatContext rerenders on every message
- pageContext updates trigger ChatSidebar2 rerender

**Solutions**:
1. **Memoize context values**
   ```javascript
   const value = useMemo(() => ({
     // ... all values
   }), [
     // Only primitive dependencies
     isChatOpen,
     assistantChat?.id,
     messages.length, // Not messages array itself
   ]);
   ```

2. **Split ChatContext into multiple contexts**
   ```javascript
   // ChatStateContext - UI state (changes frequently)
   // ChatDataContext - Messages, history (changes less)
   // ChatPageContext - Page-specific (changes on navigation)
   ```

3. **Use React.memo for ChatSidebar2**
   ```javascript
   export default React.memo(ChatSidebar2);
   ```

### DataStore Optimization

**Concern**: AssistantChat saves on every message change (debounced to 1s)

**Current Pattern** (from TabContext):
```javascript
useEffect(() => {
  if (!assistantChat || !messages.length) return;
  
  const timeoutId = setTimeout(async () => {
    await client.models.AssistantChat.update({
      id: assistantChat.id,
      messages: JSON.stringify(messages),
    });
  }, 1000);
  
  return () => clearTimeout(timeoutId);
}, [messages, assistantChat?.id]);
```

**Optimization**: Save only when chat closes or navigates away
```javascript
// Save on unmount
useEffect(() => {
  return () => {
    if (assistantChat && messages.length) {
      client.models.AssistantChat.update({
        id: assistantChat.id,
        messages: JSON.stringify(messages),
      });
    }
  };
}, [assistantChat, messages]);

// Save when closing chat
const handleClose = async () => {
  if (assistantChat && messages.length) {
    await client.models.AssistantChat.update({
      id: assistantChat.id,
      messages: JSON.stringify(messages),
    });
  }
  setIsChatOpen(false);
};
```

## Security Considerations

### Authentication

ChatContext must check auth before rendering:

```javascript
export function ChatContextProvider({ children }) {
  const { user, isLoading } = useContext(AuthContext);
  
  // Don't provide chat functionality to unauthenticated users
  if (isLoading) {
    return (
      <ChatContext.Provider value={null}>
        {children}
      </ChatContext.Provider>
    );
  }
  
  if (!user) {
    return (
      <ChatContext.Provider value={null}>
        {children}
      </ChatContext.Provider>
    );
  }
  
  // ... normal provider logic
}
```

### Authorization

Tool execution must respect model auth rules:

```javascript
// chatTools.js
export async function executeCreateSection(args) {
  try {
    // DataStore automatically enforces @auth rules from schema
    const result = await client.models.Section.create({
      name: args.name,
      description: args.description,
    });
    
    // If user doesn't have permission, this will throw
    return { success: true, section: result.data };
  } catch (error) {
    // Handle auth errors
    if (error.errors?.[0]?.errorType === 'Unauthorized') {
      return {
        success: false,
        error: 'You do not have permission to create sections.',
      };
    }
    return { success: false, error: error.message };
  }
}
```

### Data Privacy

- **Page context**: Only include necessary data, not sensitive fields
- **Message storage**: AssistantChat.messages may contain user data - ensure proper @auth rules
- **Logging**: Avoid logging user messages or context data in production

```javascript
// Good: Log aggregates only
console.log('[ChatContext] Chat opened, messages:', messages.length);

// Bad: Logs user content
console.log('[ChatContext] Messages:', messages);
```

## Success Metrics

### User Engagement

- **Chat open rate**: % of sessions where chat is opened
- **Messages per session**: Average messages sent per active chat session
- **Tool usage rate**: % of conversations that use tools
- **Cross-page usage**: % of chat sessions spanning multiple pages

### Technical Metrics

- **Load time**: Time from FAB click to drawer visible (<300ms)
- **Render performance**: No janky frames when opening (60fps)
- **Message latency**: Time from submit to first token (<1s)
- **Error rate**: % of tool executions that fail (<5%)

### UX Metrics

- **Keyboard shortcut adoption**: % of chat opens via Cmd+K
- **Context awareness**: % of conversations using page context
- **Feature discovery**: % of users finding new tools via chat

## Future Enhancements

### Phase 6: Advanced Features (Post-MVP)

1. **Multi-window chat** (~4 hours)
   - Pop out chat to separate window
   - Sync state via BroadcastChannel API
   - Useful for multi-monitor setups

2. **Voice input** (~6 hours)
   - Speech-to-text for chat input
   - Use existing Whisper integration
   - Push-to-talk button

3. **Chat history search** (~3 hours)
   - Full-text search across all chats
   - Filter by date, tools used, context
   - Embedding-based semantic search

4. **Smart suggestions** (~4 hours)
   - Context-aware prompt suggestions
   - "You might want to..." based on page
   - Quick action buttons

5. **Collaborative chat** (~8 hours)
   - Share chat sessions with other users
   - Real-time updates via observeQuery
   - Useful for instructor-student help

6. **Chat templates** (~3 hours)
   - Pre-defined workflows (e.g., "Create a complete lesson")
   - Multi-step guided flows
   - Save custom templates

7. **Chat analytics dashboard** (~6 hours)
   - Usage statistics
   - Popular tools
   - Common queries
   - Error tracking

## Dependencies

### New Dependencies

- None! All using existing packages:
  - `@ai-sdk/react` (already installed)
  - `@mui/material` (already installed)
  - `next-i18next` (already installed)

### Version Compatibility

- **Next.js**: 20+ (already satisfied)
- **React**: 18+ (already satisfied)
- **Amplify**: Gen 2 (already satisfied)
- **Material UI**: 5+ (already satisfied)

## Risks & Mitigation

| Risk                                  | Impact | Likelihood | Mitigation                                      |
|---------------------------------------|--------|------------|-------------------------------------------------|
| Context provider nesting too deep    | Medium | Low        | Use composition, max 3 levels                   |
| Chat state conflicts with page state | High   | Medium     | Careful context isolation, clear boundaries     |
| Performance degradation              | High   | Medium     | Profiling, memoization, lazy loading            |
| Breaking existing Editor chat        | High   | Low        | Keep ChatSidebar.jsx unchanged, new component   |
| User confusion (two chat interfaces) | Medium | High       | Remove Editor chat after global chat stable     |
| Bundle size increase                 | Low    | High       | Lazy loading, code splitting                    |

## Navigation Flow

```
User: "Insert a quiz block"
    ↓
ChatContext checks pageContext
    ↓
   Has editorRef? ────YES──→ Execute tool
    ↓
    NO
    ↓
Show NavigationPrompt:
"To insert blocks, you need to be in the Unit Editor."
[Not now] [Go there →]
    ↓
User clicks "Go there"
    ↓
router.push('/unit/123')
    ↓
Editor page loads with Unit context
    ↓
Chat remains open, maintains history
    ↓
User can now insert quiz block
```

## VectorStoreContext Global Strategy

**Current Architecture**:
- VectorStoreContext is provided by FileManager2
- It wraps the vectorStore from FilesContext
- FilesContext is unit-specific (only has files for current unit)
- Semantic search is scoped to current unit's files

**Options for Global Availability**:

### Option 1: Keep Unit-Scoped (RECOMMENDED)
- **Pro**: Maintains semantic relevance (searches current unit only)
- **Pro**: No changes needed to FilesContext
- **Pro**: Aligns with educational context (students work on one unit at a time)
- **Con**: Search limited to current unit
- **Implementation**: When VectorStoreContext unavailable, fall back to keyword search or offer navigation

### Option 2: Create Global Vector Store
- **Pro**: Can search across all units
- **Pro**: Better for cross-unit discovery
- **Con**: Requires new data structure and indexing
- **Con**: Search results less contextually relevant
- **Con**: Higher memory usage (all embeddings loaded)
- **Implementation**: Create GlobalVectorStoreContext that aggregates all embeddings

### Option 3: Dynamic Vector Store Loading
- **Pro**: Best of both worlds
- **Con**: Complex implementation
- **Con**: Slower (needs to load embeddings for each unit)
- **Implementation**: Load unit's vector store on demand based on search query

**Decision**: Go with **Option 1** for MVP, consider Option 2 for future enhancement.

**Tool Behavior Without VectorStoreContext**:
```javascript
// In executeTool for search_content
if (!vectorStoreContext?.isReady) {
  // Fall back to keyword search across all models
  const keywordResults = await searchByKeyword(query, type);
  
  return {
    success: true,
    results: keywordResults,
    message: 'Semantic search unavailable. Using keyword search. For better results, navigate to a unit.',
    suggestNavigation: true,
  };
}
```

## Timeline

**Total Estimated Time**: 18-23 hours

| Phase                    | Time Estimate | Priority |
|--------------------------|---------------|----------|
| Phase 1: ChatContext     | 2-3 hours     | P0       |
| Phase 2: ChatSidebar2    | 3-4 hours     | P0       |
| Phase 3: Global UI       | 4-5 hours     | P0       |
| Phase 4: Update Pages    | 1-2 hours     | P1       |
| Phase 5: Testing         | 2-3 hours     | P1       |
| Phase 6: Advanced        | Future        | P2       |

**Recommended Approach**: Implement in 3 work sessions
- **Session 1** (Day 1): Phase 1 + Phase 2 (5-6 hours)
  - Foundation complete, can test locally
- **Session 2** (Day 2): Phase 3 + Phase 4 (4-6 hours)
  - UI complete, visible in app
- **Session 3** (Day 3): Phase 5 (2-3 hours)
  - Production-ready

**Total**: 3 days at 4-6 hours/day

## Documentation Updates

After implementation, update:

1. **README.md**
   - Add section on global chat
   - Keyboard shortcuts documentation

2. **docs/AI_FEATURES_GUIDE.md**
   - Global chat usage
   - Context-aware features

3. **docs/CHATBOT_TOOLS.md**
   - Update with context availability matrix
   - Add migration guide from Editor chat

4. **docs/ONBOARDING.md**
   - Quick start tutorial with chat
   - Chat as primary help system

5. **Storybook Stories**
   - GlobalChatButton.stories.jsx
   - GlobalChatDrawer.stories.jsx
   - ChatSidebar2.stories.jsx (copy from ChatSidebar.stories.jsx)

## Questions for Review

Before proceeding, please confirm:

1. **Architecture**: Is Option 1 (Global Chat Context) the preferred approach?
2. **Backward Compatibility**: Keep ChatSidebar.jsx in Editor during transition?
3. **Keyboard Shortcut**: Is Cmd/Ctrl+K acceptable, or use different key?
4. **Chat Position**: Default to right drawer, or make configurable?
5. **Feature Flag**: Enable globally or behind experimental flag initially?
6. **Bundle Size**: Is +30KB acceptable, or prioritize lazy loading?
7. **Tour Integration**: Integrate tour controls in global chat (already implemented)?
8. **Timeline**: 3-day timeline acceptable, or adjust priorities?

## Next Steps

1. **Review this plan** - Confirm architecture and approach
2. **Create feature branch** - `feature/global-chat-integration`
3. **Start Phase 1** - Implement ChatContext
4. **Daily check-ins** - Review progress, adjust as needed
5. **QA testing** - Test across all pages before merge
6. **Documentation** - Update all relevant docs
7. **Deploy to staging** - Test in production-like environment
8. **Gradual rollout** - Enable for subset of users first (if feature flagged)

## Conclusion

This plan provides a comprehensive roadmap for making the ChatSidebar globally available across the application. The recommended approach (Option 1: Global Chat Context) follows existing architectural patterns, ensures backward compatibility, and provides a clear path to production.

The implementation is broken into manageable phases with clear deliverables and success criteria. By following this plan, we can deliver a high-quality, performant global chat feature that enhances the user experience across the entire platform.

**Estimated completion**: 3 work days (16-20 hours)  
**Risk level**: Low-Medium (well-scoped, follows existing patterns)  
**User impact**: High (AI assistant available everywhere)  

---

**Author**: GitHub Copilot  
**Reviewers**: [To be assigned]  
**Status**: Awaiting approval to proceed
