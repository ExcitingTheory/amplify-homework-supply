// react component that renders the chat session with the user and the bot
import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import {
    Alert,
    TextField,
    Button,
    CircularProgress,
    Box,
    IconButton,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Portal,
    Snackbar,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Chip,
    Tooltip,
} from "@mui/material";
import { getAmplifyClient } from '../utils/amplifyClient';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import UploadFile from '@mui/icons-material/UploadFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CancelIcon from '@mui/icons-material/Cancel';
import RateReviewIcon from '@mui/icons-material/RateReview';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { Section, Document, AssistantChat, File } from "../models";
import UnitContext from "../context/unitContext";
import SectionContext from "../context/sectionContext";
import VectorStoreContext from "../context/vectorStoreContext";
import { useTabContext } from "../context/tabContext";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { fetchAuthSession } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import { uploadAndAnalyzePDF, cancelPDFAnalysis } from '../utils/fileUploadUtils';
import FilesContext from "../context/fileContext";
import VocabularyReview from "./VocabularyReview2";
import { toolDefinitions, executeTool, setVectorStoreSearch } from '../utils/chatTools';
import AIFeedbackWidget from './AIFeedbackWidget';
import SearchResults from './ChatSidebar2/SearchResults';
import { TextStreamChatTransport } from 'ai';
import { VirtualizedMessageList } from './ChatSidebar2/VirtualizedMessageList';
import { LexicalMessageRenderer } from './ChatSidebar2/LexicalMessageRenderer';
import ToolCallPreview from './ChatSidebar2/ToolCallPreview';
import ContentPreview from './ChatSidebar2/ContentPreview';

const ChatSidebar2 = () => {
    // Utility function to deep clone messages to prevent frozen object errors
    // The AI SDK mutates message objects during streaming, so they must be mutable
    const deepCloneMessages = useCallback((messages) => {
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            console.log('[ChatSidebar2] deepCloneMessages: returning empty array');
            return [];
        }

        // Use structuredClone if available (better performance, handles more types)
        // Otherwise fallback to JSON stringify/parse
        try {
            const cloned = typeof structuredClone !== 'undefined'
                ? structuredClone(messages)
                : JSON.parse(JSON.stringify(messages));
            console.log('[ChatSidebar2] deepCloneMessages: cloned', messages.length, 'messages');
            return cloned;
        } catch (error) {
            console.error('[ChatSidebar2] Error cloning messages:', error);
            // Last resort: return empty array to prevent crashes
            return [];
        }
    }, []);

    // Action types for the reducer
    const ACTIONS = {
        SET_DRAGGING: 'SET_DRAGGING',
        SET_UPLOADED_FILES: 'SET_UPLOADED_FILES',
        ADD_UPLOADED_FILES: 'ADD_UPLOADED_FILES',
        REMOVE_UPLOADED_FILE: 'REMOVE_UPLOADED_FILE',
        SET_DOCUMENT_PROCESSING_STATUS: 'SET_DOCUMENT_PROCESSING_STATUS',
        UPDATE_DOCUMENT_PROCESSING_STATUS: 'UPDATE_DOCUMENT_PROCESSING_STATUS',
        SET_DOCUMENT_STATUSES: 'SET_DOCUMENT_STATUSES',
        SET_VOCABULARY_REVIEW_DIALOG: 'SET_VOCABULARY_REVIEW_DIALOG',
        SET_REVIEW_DOCUMENT_ID: 'SET_REVIEW_DOCUMENT_ID',
        SET_CONFIRM_DIALOG: 'SET_CONFIRM_DIALOG',
        SET_TOOL_EXECUTION_STATES: 'SET_TOOL_EXECUTION_STATES',
        UPDATE_TOOL_EXECUTION_STATES: 'UPDATE_TOOL_EXECUTION_STATES',
        SET_HISTORY_DRAWER_OPEN: 'SET_HISTORY_DRAWER_OPEN',
        SET_INPUT: 'SET_INPUT',
        SET_LAST_CHAT_ID: 'SET_LAST_CHAT_ID',
        RESET_FOR_NEW_CHAT: 'RESET_FOR_NEW_CHAT',
    };

    // Initial state for the reducer
    const initialState = {
        isDragging: false,
        uploadedFiles: [],
        documentProcessingStatus: {},
        documentStatuses: {},
        vocabularyReviewDialogOpen: false,
        reviewDocumentId: null,
        confirmDialog: { open: false, message: '', onConfirm: null, severity: 'info' },
        toolExecutionStates: {},
        historyDrawerOpen: false,
        input: '',
        lastChatId: null,
    };

    // Reducer function
    function chatSidebarReducer(state, action) {
        switch (action.type) {
            case ACTIONS.SET_DRAGGING:
                return { ...state, isDragging: action.payload };
            case ACTIONS.SET_UPLOADED_FILES:
                return { ...state, uploadedFiles: action.payload };
            case ACTIONS.ADD_UPLOADED_FILES:
                return { ...state, uploadedFiles: [...state.uploadedFiles, ...action.payload] };
            case ACTIONS.REMOVE_UPLOADED_FILE:
                return {
                    ...state,
                    uploadedFiles: state.uploadedFiles.filter((_, i) => i !== action.payload),
                    documentProcessingStatus: Object.fromEntries(
                        Object.entries(state.documentProcessingStatus).filter(([index]) => parseInt(index) !== action.payload)
                    )
                };
            case ACTIONS.SET_DOCUMENT_PROCESSING_STATUS:
                return { ...state, documentProcessingStatus: action.payload };
            case ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS:
                return {
                    ...state,
                    documentProcessingStatus: { ...state.documentProcessingStatus, ...action.payload }
                };
            case ACTIONS.SET_DOCUMENT_STATUSES:
                return { ...state, documentStatuses: action.payload };
            case ACTIONS.SET_VOCABULARY_REVIEW_DIALOG:
                return { ...state, vocabularyReviewDialogOpen: action.payload };
            case ACTIONS.SET_REVIEW_DOCUMENT_ID:
                return { ...state, reviewDocumentId: action.payload };
            case ACTIONS.SET_CONFIRM_DIALOG:
                return { ...state, confirmDialog: action.payload };
            case ACTIONS.SET_TOOL_EXECUTION_STATES:
                return { ...state, toolExecutionStates: action.payload };
            case ACTIONS.UPDATE_TOOL_EXECUTION_STATES:
                return {
                    ...state,
                    toolExecutionStates: { ...state.toolExecutionStates, ...action.payload }
                };
            case ACTIONS.SET_HISTORY_DRAWER_OPEN:
                return { ...state, historyDrawerOpen: action.payload };
            case ACTIONS.SET_INPUT:
                return { ...state, input: action.payload };
            case ACTIONS.SET_LAST_CHAT_ID:
                return { ...state, lastChatId: action.payload };
            case ACTIONS.RESET_FOR_NEW_CHAT:
                return {
                    ...state,
                    uploadedFiles: [],
                    input: '',
                    documentProcessingStatus: {},
                    toolExecutionStates: {}
                };
            default:
                return state;
        }
    }

    // UI State - now using reducer
    const [state, dispatch] = useReducer(chatSidebarReducer, initialState);
    const {
        isDragging,
        uploadedFiles,
        documentProcessingStatus,
        documentStatuses,
        vocabularyReviewDialogOpen,
        reviewDocumentId,
        confirmDialog,
        toolExecutionStates,
        historyDrawerOpen,
        input,
        lastChatId,
    } = state;
    // Refs for DOM interaction
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const addToolOutputRef = useRef(null);

    const unitContext = React.useContext(UnitContext);
    const {
        unit,
        files,
        questionBank,
        dictionary,
        editorRef,
        insertWord,
        insertQuestion,
    } = unitContext;

    // Get tab management and chat state from context
    const tabContext = useTabContext();
    const {
        assistantChat,
        chatHistories,
        setCurrentChat,
        isLoadingChat,
    } = tabContext;



    // Get sections from SectionContext instead of local query
    const { sections = [] } = React.useContext(SectionContext) || {};

    // Simple handlers
    const handleInsertWord = (word) => insertWord?.(word);
    const handleInsertQuestion = (question) => insertQuestion?.(question);
    const handleFocusItem = (type, id) => tabContext.setFocusItem?.({ type, id, timestamp: Date.now() });

    // Load chat data when chat changes
    useEffect(() => {
        if (!assistantChat || isLoadingChat) return;
        if (assistantChat._version == null) return;

        const chatChanged = lastChatId !== assistantChat.id;

        if (chatChanged) {
            dispatch({ type: ACTIONS.SET_LAST_CHAT_ID, payload: assistantChat.id });

            // Load messages - ensure it's always an array
            const rawMessages = assistantChat.messages || [];
            const messagesArray = Array.isArray(rawMessages) ? rawMessages : [];
            console.log('[ChatSidebar2] Loading messages for chat:', assistantChat.id, 'count:', messagesArray.length);
            setMessages(deepCloneMessages(messagesArray));

            // Load draft (only on chat change, not version updates)
            dispatch({ type: ACTIONS.SET_INPUT, payload: assistantChat.draft || '' });

            // Load files
            assistantChat.chatFiles?.()
                .then(result => dispatch({ type: ACTIONS.SET_UPLOADED_FILES, payload: result?.data || [] }))
                .catch(err => console.error('[ChatSidebar2] Error loading files:', err));
        }
    }, [assistantChat?.id, assistantChat?._version, isLoadingChat]);

    const vectorStoreCtx = React.useContext(VectorStoreContext);

    // Register vector store search function with chatTools
    React.useEffect(() => {
        if (vectorStoreCtx?.search) {
            setVectorStoreSearch(vectorStoreCtx.search);
            console.log('[ChatSidebar2] Registered vector store search, isReady:', vectorStoreCtx.isReady);
        }

        return () => {
            setVectorStoreSearch(null);
        };
    }, [vectorStoreCtx]);

    // Simple context data for chat API
    const contextData = useMemo(() => ({
        unit: unit ? {
            id: unit.id,
            name: unit.name,
            description: unit.description,
            data: unit.data,
        } : null,
        files: files ? Object.values(files).map(f => ({
            id: f.id,
            name: f.name,
            description: f.description,
            mimeType: f.mimeType,
        })) : [],
        questionBank: questionBank ? Object.values(questionBank).map(q => ({
            id: q.id,
            prompt: q.prompt,
            answer: q.answer,
        })) : [],
        dictionary: dictionary ? Object.values(dictionary).map(d => ({
            id: d.id,
            phrase: d.phrase,
            definition: d.definition,
        })) : [],
        sections: sections?.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
        })) || [],
    }), [unit, files, questionBank, dictionary, sections]);

    // Memoize the fetch function to prevent recreation on every render
    const customFetch = useCallback(async (url, options) => {
        console.log('[ChatSidebar2] Custom fetch with Amplify post client, ignoring url:', url);

        try {
            // Parse the request body from AI SDK
            const requestBody = options.body ? JSON.parse(options.body) : {};

            // Add context to the request body
            const bodyWithContext = {
                ...requestBody,
                context: contextData,
            };

            console.log('[ChatSidebar2] Sending request with context:', {
                hasUnit: !!contextData.unit,
                filesCount: contextData.files?.length || 0,
                questionsCount: contextData.questionBank?.length || 0,
                wordsCount: contextData.dictionary?.length || 0,
            });

            // Use Amplify's post which handles auth automatically
            const restOperation = post({
                apiName: 'completions',
                path: '/chat',
                options: { body: bodyWithContext },
            });

            const response = await restOperation.response;

            console.log('[ChatSidebar2] Response received:', {
                status: response.statusCode,
                headers: response.headers,
                bodyType: typeof response.body,
                hasBody: !!response.body,
            });
            // Convert Amplify headers to Headers object
            const webHeaders = new Headers({
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
            });

            // Amplify response.body is already a ReadableStream - use it directly
            const webResponse = new Response(response.body, {
                status: response.statusCode,
                headers: webHeaders,
            });

            console.log('[ChatSidebar2] Created Web Response with streaming body:', {
                ok: webResponse.ok,
                status: webResponse.status,
                bodyUsed: webResponse.bodyUsed,
            });

            return webResponse;
        } catch (error) {
            console.error('[ChatSidebar2] Error in customFetch:', error);
            throw error;
        }
    }, [contextData]);

    // Memoize the transport object to prevent recreation on every render
    // Using 'data' streamProtocol for Server-Sent Events format: "data: {...}\n\n"
    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        fetch: customFetch, // Use our custom fetch that routes through Amplify
    }), [customFetch]);

    // Simplified save functions
    const saveDraft = useCallback(async (draftText, chat, currentMessages = []) => {
        if (!chat?.id) return;

        try {
            const client = getAmplifyClient();
            await client.models.AssistantChat.update({
                id: chat.id,
                draft: draftText,
                messages: currentMessages
            });
        } catch (error) {
            console.error('[ChatSidebar2] Error saving draft:', error);
        }
    }, []);

    const saveMessages = useCallback(async (msgs, chat, currentDraft) => {
        if (!chat) return;

        try {
            const clonedMessages = deepCloneMessages(msgs);
            const client = getAmplifyClient();
            await client.models.AssistantChat.update({
                id: chat.id,
                messages: clonedMessages,
                draft: currentDraft
            });
        } catch (error) {
            console.error('[ChatSidebar2] Error saving messages:', error);
        }
    }, [deepCloneMessages]);

    const saveFileAssociations = useCallback(async (files, chat) => {
        if (!chat) return;

        try {
            const client = getAmplifyClient();
            // Query existing associations
            const { data: currentAssociations } = await client.models.AssistantChatFile.list({
                filter: { assistantChatId: { eq: chat.id } }
            });
            const currentFileIds = new Set(currentAssociations.map(a => a.fileId));
            const uploadedFileIds = new Set(files.filter(f => f.id).map(f => f.id));

            const filesToAdd = files.filter(f => f.id && !currentFileIds.has(f.id));
            const associationsToRemove = currentAssociations.filter(a => !uploadedFileIds.has(a.fileId));

            if (filesToAdd.length === 0 && associationsToRemove.length === 0) return;

            for (const association of associationsToRemove) {
                await client.models.AssistantChatFile.delete({ id: association.id });
            }

            for (const file of filesToAdd) {
                await client.models.AssistantChatFile.create({
                    assistantChatId: chat.id,
                    fileId: file.id
                });
            }
        } catch (error) {
            console.error('[ChatSidebar2] Error saving file associations:', error);
        }
    }, []);

    // Use Vercel AI SDK's useChat hook with memoized transport
    const chatHookResult = useChat({
        transport,

        // Handle client-side tools
        async onToolCall({ toolCall }) {
            console.log('[ChatSidebar2] onToolCall invoked:', toolCall.toolName, toolCall.toolCallId);

            // Check if it's a dynamic tool first for proper type narrowing
            if (toolCall.dynamic) {
                console.log('[ChatSidebar2] Dynamic tool, skipping');
                return;
            }

            if (toolCall.toolName === 'search_content') {
                console.log('[ChatSidebar2] Executing client-side search_content:', toolCall.input);

                try {
                    const result = await executeTool('search_content', toolCall.input);
                    console.log('[ChatSidebar2] Search result:', result);

                    // Use addToolOutput from ref (no await to avoid deadlocks)
                    if (addToolOutputRef.current) {
                        addToolOutputRef.current({
                            toolCallId: toolCall.toolCallId,
                            output: result
                        });
                    }
                } catch (error) {
                    console.error('[ChatSidebar2] Search error:', error);

                    // Add error output
                    if (addToolOutputRef.current) {
                        addToolOutputRef.current({
                            toolCallId: toolCall.toolCallId,
                            state: 'output-error',
                            errorText: error.message || 'Search failed'
                        });
                    }
                }
            }
        },

        // Automatically send when all tool results are available
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

        onError: (error) => {
            console.error('[ChatSidebar2] Chat error:', error);
        },

        onFinish: (message) => {
            console.log('[ChatSidebar2] Message finished:', message);
            // Save messages when streaming completes
            if (assistantChat) {
                saveMessages(messages, assistantChat, input);
            }
        },
    });

    // Validate hook result
    if (!chatHookResult) {
        console.error('[ChatSidebar2] useChat returned null/undefined!');
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">Chat initialization failed. Please refresh the page.</Alert>
            </Box>
        );
    }

    // Destructure all available functions from useChat API
    const {
        messages = [],
        sendMessage,
        regenerate,
        setMessages = () => { },
        error: chatError,
        status = 'idle',
        stop,
        toolCalls = [],
        addToolOutput,
    } = chatHookResult || {};

    // Only log useChat status on meaningful changes
    if (status !== 'ready' || (messages?.length > 0) || (toolCalls?.length > 0)) {
        console.log('[ChatSidebar2] useChat status:', status, 'messages:', messages.length, 'toolCalls:', toolCalls.length);
    }

    // Derive loading state from useChat status
    const isLoading = status === 'in_progress' || status === 'streaming' || status === 'submitted';

    // Simple input change handler with debounced draft saving
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        dispatch({ type: ACTIONS.SET_INPUT, payload: newValue });

        // Debounce draft saving
        if (assistantChat) {
            clearTimeout(handleInputChange.timeoutId);
            handleInputChange.timeoutId = setTimeout(() => {
                saveDraft(newValue, assistantChat, messages);
            }, 1000);
        }
    };

    // Simple submit function
    const submitMessage = useCallback(async (e) => {
        e?.preventDefault();
        if (!input?.trim() || !sendMessage) return;

        try {
            sendMessage({ text: input });
            dispatch({ type: ACTIONS.SET_INPUT, payload: '' });

            // Clear draft
            if (assistantChat?.draft) {
                const client = getAmplifyClient();
                client.models.AssistantChat.update({
                    id: assistantChat.id,
                    draft: ''
                }).catch(err => console.error('[ChatSidebar2] Error clearing draft:', err));
            }
        } catch (error) {
            console.error('[ChatSidebar2] Error sending message:', error);
        }
    }, [input, sendMessage, assistantChat]);

    // Store addToolOutput in ref for onToolCall access
    useEffect(() => {
        addToolOutputRef.current = addToolOutput;
    }, [addToolOutput]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Save file associations when files change
    useEffect(() => {
        if (assistantChat && uploadedFiles) {
            saveFileAssociations(uploadedFiles, assistantChat);
        }
    }, [uploadedFiles, assistantChat?.id, saveFileAssociations]);

    // Note: Section data is now provided by SectionContext
    // Removed redundant Section observer to reduce subscription overhead

    // Subscribe to Document status changes
    useEffect(() => {
        const client = getAmplifyClient();
        const subscription = client.models.Document.observeQuery().subscribe({
            next: ({ items }) => {
                const statusMap = {};
                items.forEach(doc => {
                    statusMap[doc.id] = {
                        status: doc.status,
                        pageCount: doc.pageCount,
                        s3Key: doc.s3Key,
                    };
                });

                // Only update if versions have actually changed
                const hasChanges = items.some(doc => {
                    const prevDoc = documentStatuses[doc.id];
                    return !prevDoc || (doc._version || 0) > (prevDoc._version || 0);
                });

                if (hasChanges) {
                    // Include version info for future comparisons
                    items.forEach(doc => {
                        statusMap[doc.id]._version = doc._version;
                    });
                    console.log('[ChatSidebar2] Document statuses updated:', statusMap);
                    dispatch({ type: ACTIONS.SET_DOCUMENT_STATUSES, payload: statusMap });
                }
            },
            error: (error) => console.error('[ChatSidebar2] Document subscription error:', error)
        });

        return () => subscription.unsubscribe();
    }, []);

    // Update document processing status when document status changes
    const documentStatusesRef = useRef({});
    useEffect(() => {
        // Only run if documentStatuses actually changed
        const statusesStr = JSON.stringify(documentStatuses);
        if (documentStatusesRef.current.str === statusesStr) return;
        documentStatusesRef.current.str = statusesStr;

        const updated = { ...documentProcessingStatus };
        let hasChanges = false;

        Object.entries(updated).forEach(([index, status]) => {
            if (status.documentId && documentStatuses[status.documentId]) {
                const docStatus = documentStatuses[status.documentId].status;
                const pageCount = documentStatuses[status.documentId].pageCount;

                // Map document status to processing status
                if (docStatus === 'completed' && status.status !== 'analyzed') {
                    updated[index] = {
                        ...status,
                        status: 'analyzed',
                        progress: 100,
                        message: `Analysis complete! ${pageCount ? `${pageCount} pages analyzed.` : ''}`.trim(),
                    };
                    hasChanges = true;
                } else if (docStatus === 'analyzing' && status.status !== 'analyzing') {
                    updated[index] = {
                        ...status,
                        status: 'analyzing',
                        message: 'Analyzing content...',
                    };
                    hasChanges = true;
                } else if (docStatus === 'extracting' && status.status !== 'extracting') {
                    updated[index] = {
                        ...status,
                        status: 'extracting',
                        message: 'Extracting text...',
                    };
                    hasChanges = true;
                } else if (docStatus === 'uploaded' && ['analyzing', 'extracting'].includes(status.status)) {
                    // Document went back to uploaded - likely cancelled
                    updated[index] = {
                        ...status,
                        status: 'cancelled',
                        message: 'Analysis cancelled',
                    };
                    hasChanges = true;
                } else if (docStatus === 'failed') {
                    updated[index] = {
                        ...status,
                        status: 'error',
                        message: 'Analysis failed',
                    };
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            dispatch({ type: ACTIONS.SET_DOCUMENT_PROCESSING_STATUS, payload: updated });
        }
    }, [Object.keys(documentStatuses).length]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: ACTIONS.SET_DRAGGING, payload: true });
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: ACTIONS.SET_DRAGGING, payload: false });
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: ACTIONS.SET_DRAGGING, payload: false });

        const files = Array.from(e.dataTransfer.files);
        console.log('Files dropped:', files);
        dispatch({ type: ACTIONS.ADD_UPLOADED_FILES, payload: files });
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        console.log('Files selected:', files);
        dispatch({ type: ACTIONS.ADD_UPLOADED_FILES, payload: files });
    };

    const removeFile = (index) => {
        dispatch({ type: ACTIONS.REMOVE_UPLOADED_FILE, payload: index });
    };

    // Cancel document processing
    const cancelProcessing = async (index) => {
        const status = documentProcessingStatus[index];
        if (!status || !status.documentId) {
            console.warn('[ChatSidebar2] No document ID to cancel');
            return;
        }

        try {
            console.log('[ChatSidebar2] Cancelling analysis for document:', status.documentId);

            dispatch({
                type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                    [index]: {
                        ...documentProcessingStatus[index],
                        message: 'Cancelling...'
                    }
                }
            });

            await cancelPDFAnalysis(status.documentId);

            dispatch({
                type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                    [index]: {
                        ...documentProcessingStatus[index],
                        status: 'cancelled',
                        message: 'Analysis cancelled'
                    }
                }
            });
        } catch (error) {
            console.error('[ChatSidebar2] Error cancelling analysis:', error);
            dispatch({
                type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                    [index]: {
                        ...documentProcessingStatus[index],
                        message: `Cancel failed: ${error.message}`
                    }
                }
            });
        }
    };

    // Open vocabulary review dialog
    const openVocabularyReview = (documentId) => {
        dispatch({ type: ACTIONS.SET_REVIEW_DOCUMENT_ID, payload: documentId });
        dispatch({ type: ACTIONS.SET_VOCABULARY_REVIEW_DIALOG, payload: true });
    };

    // Handle vocabulary import completion
    const handleVocabularyImportComplete = (result) => {
        console.log('[ChatSidebar2] Vocabulary import complete:', result);
        // Could show a success message or update UI
        // Optionally close the dialog after a delay
        setTimeout(() => {
            dispatch({ type: ACTIONS.SET_VOCABULARY_REVIEW_DIALOG, payload: false });
        }, 2000);
    };

    // Process documents when they're added
    const processDocument = async (file, index) => {
        if (file.type !== 'application/pdf' &&
            file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
            file.type !== 'application/msword' &&
            file.type !== 'text/plain' &&
            file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
            file.type !== 'application/vnd.ms-excel' &&
            file.type !== 'text/csv'
        ) return;

        try {
            console.log('[ChatSidebar2] Processing document:', file.name, { index });

            // Update status to uploading
            dispatch({
                type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                    [index]: { status: 'uploading', progress: 0, message: 'Uploading document...' }
                }
            });

            // Get identity ID if not already available
            const session = await fetchAuthSession();
            const identityId = session.identityId;

            console.log('[ChatSidebar2] Identity ID:', identityId);
            console.log('[ChatSidebar2] Unit ID:', unit?.id);

            // Upload and analyze
            const result = await uploadAndAnalyzePDF(
                file,
                identityId,
                unit?.id,
                true, // auto-analyze
                (loaded, total) => {
                    const progress = Math.round((loaded / total) * 100);
                    dispatch({
                        type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                            [index]: {
                                status: 'uploading',
                                progress,
                                message: `Uploading... ${progress}%`
                            }
                        }
                    });
                }
            );

            console.log('[ChatSidebar2] Upload result:', result);

            // Update status based on result - store documentId for tracking
            if (result.analysisResult && result.analysisResult.success) {
                dispatch({
                    type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                        [index]: {
                            status: 'analyzing',
                            progress: 100,
                            message: 'Document uploaded, analysis started...',
                            documentId: result.documentModel?.id,
                        }
                    }
                });
            } else if (result.documentModel) {
                dispatch({
                    type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                        [index]: {
                            status: 'uploaded',
                            progress: 100,
                            message: 'Document uploaded successfully',
                            documentId: result.documentModel?.id,
                        }
                    }
                });
            } else {
                dispatch({
                    type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                        [index]: {
                            status: 'uploaded',
                            progress: 100,
                            message: 'Document uploaded (no document created)'
                        }
                    }
                });
            }
        } catch (error) {
            console.error('[ChatSidebar2] Error processing document:', error);
            dispatch({
                type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                    [index]: {
                        status: 'error',
                        progress: 0,
                        message: `Error: ${error.message}`
                    }
                }
            });
        }
    };

    // Detect documents and offer to process them
    useEffect(() => {
        uploadedFiles.forEach((file, index) => {
            if (file.type === 'application/pdf' && !documentProcessingStatus[index]) {
                // Ask user if they want to process the document
                dispatch({
                    type: ACTIONS.SET_CONFIRM_DIALOG, payload: {
                        open: true,
                        message: `Would you like to upload and analyze "${file.name}"? This will extract text and generate vocabulary.`,
                        severity: 'info',
                        onConfirm: () => {
                            processDocument(file, index);
                            dispatch({ type: ACTIONS.SET_CONFIRM_DIALOG, payload: { open: false, message: '', onConfirm: null, severity: 'info' } });
                        },
                        onCancel: () => {
                            // Mark as declined
                            dispatch({
                                type: ACTIONS.UPDATE_DOCUMENT_PROCESSING_STATUS, payload: {
                                    [index]: {
                                        status: 'declined',
                                        progress: 0,
                                        message: 'Analysis declined'
                                    }
                                }
                            });
                            dispatch({ type: ACTIONS.SET_CONFIRM_DIALOG, payload: { open: false, message: '', onConfirm: null, severity: 'info' } });
                        }
                    }
                });
            }
        });
    }, [uploadedFiles.length, unit?.id]); // Use length instead of the full objects to prevent infinite loops

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0,
                    position: 'relative'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag overlay */}
                {isDragging && (
                    <Box
                        sx={{
                            position: 'absolute',
                            height: '100%',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'primary.main',
                            opacity: 0.9,
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                        }}
                    >
                        <Box sx={{ textAlign: 'center', color: 'white' }}>
                            <UploadFile sx={{ fontSize: 64, mb: 2 }} />
                            <Typography variant="h6">Drop files here</Typography>
                            <Typography variant="body2">Attach files to your message</Typography>
                        </Box>
                    </Box>
                )}
                {/* Header */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {historyDrawerOpen ? (
                            <>
                                <HistoryIcon color="primary" />
                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                    History
                                </Typography>
                            </>
                        ) : (
                            <>
                                <ChatIcon color="primary" />
                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                    AI Assistant
                                </Typography>
                            </>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {historyDrawerOpen ? (
                            <IconButton
                                size="small"
                                onClick={() => dispatch({ type: ACTIONS.SET_HISTORY_DRAWER_OPEN, payload: false })}
                                title="Back to chat"
                                sx={{ color: 'primary.main' }}
                            >
                                <ChatIcon fontSize="small" />
                            </IconButton>
                        ) : (
                            <>
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        // Save current draft before switching to history
                                        if (input && assistantChat?.id) {
                                            await saveDraft(input, assistantChat, messages);
                                        }
                                        dispatch({ type: ACTIONS.SET_HISTORY_DRAWER_OPEN, payload: true });
                                    }}
                                    title="Chat history"
                                    sx={{ color: 'primary.main' }}
                                >
                                    <HistoryIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        try {
                                            // Step 0: Save current state if there's a current chat
                                            if (assistantChat?.id && (input.trim() || messages.length > 0)) {
                                                console.log('[ChatSidebar2] Saving current chat state before creating new chat');
                                                await saveDraft(input, assistantChat, messages);
                                            }

                                            console.log('[ChatSidebar2] Creating new chat');

                                            // Clear local state
                                            setMessages([]);
                                            dispatch({ type: ACTIONS.RESET_FOR_NEW_CHAT });

                                            // Create new AssistantChat directly
                                            const client = getAmplifyClient();
                                            const { data: newChat } = await client.models.AssistantChat.create({
                                                model: 'gpt-4',
                                                messages: [],
                                                threadInstructions: '',
                                                additionalInstructions: '',
                                            });
                                            console.log('[ChatSidebar2] Created new chat:', newChat.id);
                                            
                                            // TabContext subscription will pick up the new chat automatically
                                        } catch (error) {
                                            console.error('[ChatSidebar2] Error creating new chat:', error);
                                        }
                                    }}
                                    title="New chat"
                                    sx={{ color: 'success.main' }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={async () => {
                                        // Archive current chat by marking it archived
                                        // TabContext will detect this and create a new chat automatically
                                        if (assistantChat?.id && !isLoadingChat) {
                                            try {
                                                // Mark current chat as archived
                                                const client = getAmplifyClient();
                                                await client.models.AssistantChat.update({
                                                    id: assistantChat.id,
                                                    archived: true
                                                });
                                                console.log('[ChatSidebar2] Chat archived - TabContext will create new chat');

                                                // Clear local state
                                                setMessages([]);
                                                dispatch({ type: ACTIONS.RESET_FOR_NEW_CHAT });
                                            } catch (error) {
                                                console.error('[ChatSidebar2] Error archiving chat:', error);
                                            }
                                        }
                                    }}
                                    title="Archive chat"
                                    sx={{ color: 'warning.main' }}
                                >
                                    <ArchiveIcon fontSize="small" />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Paper>

                {/* Messages */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'grey.50',
                        minHeight: 0,
                        overflow: 'hidden',
                    }}
                >

                    {historyDrawerOpen ? (
                        /* Show chat history list */
                        <Box sx={{ p: 2 }}>
                            {isLoadingChat && chatHistories.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : chatHistories.length === 0 ? (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        color: 'text.secondary',
                                        textAlign: 'center',
                                        p: 3,
                                    }}
                                >
                                    <HistoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                                    <Typography variant="body2">
                                        No history available
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    {/* Active Chats */}
                                    {chatHistories.filter(h => !h.archived).length > 0 && (
                                        <>
                                            <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
                                                Active Chats
                                            </Typography>
                                            <List sx={{ p: 0 }}>
                                                {chatHistories.filter(h => !h.archived).map((history, index) => {
                                                    console.log('[ChatSidebar2] Rendering chat history:', history.id, history);
                                                    const isActive = assistantChat?.id === history.id;
                                                    const isArchived = history.archived;
                                                    let historyMessages = [];
                                                    let historyDraft = '';
                                                    try {
                                                        historyMessages = history?.messages?.length ? history.messages : [];
                                                        historyDraft = history?.draft || '';
                                                    } catch (err) {
                                                        console.error('[ChatSidebar2] Error parsing messages:', err);
                                                    }
                                                    const messageCount = historyMessages.length;
                                                    const firstUserMessage = historyMessages.find(m => m.role === 'user');
                                                    console.log('First user message for history', history.id, ':', firstUserMessage, historyMessages);
                                                    const preview = firstUserMessage?.part || historyDraft || 'Empty chat';
                                                    const displayPreview = typeof preview === 'string' ? preview : JSON.stringify(preview);
                                                    const createdAt = history.createdAt ? new Date(history.createdAt).toLocaleDateString() : 'Unknown';

                                                    return (
                                                        <React.Fragment key={history.id}>
                                                            <ListItemButton
                                                                onClick={async () => {
                                                                    if (assistantChat && input.trim()) {
                                                                        try {
                                                                            const client = getAmplifyClient();
                                                                            await client.models.AssistantChat.update({
                                                                                id: assistantChat.id,
                                                                                draft: input
                                                                            });
                                                                        } catch (error) {
                                                                            console.error('[ChatSidebar2] Error saving draft:', error);
                                                                        }
                                                                    }
                                                                    if (tabContext.switchToChat) {
                                                                        tabContext.switchToChat(history.id);
                                                                    } else {
                                                                        setCurrentChat(history);
                                                                        setMessages(JSON.parse(JSON.stringify(historyMessages)));
                                                                        dispatch({ type: ACTIONS.SET_INPUT, payload: historyDraft || '' });
                                                                    }
                                                                    dispatch({ type: ACTIONS.SET_HISTORY_DRAWER_OPEN, payload: false });
                                                                    console.log('[ChatSidebar2] Switching to chat history:', history.id);
                                                                }}
                                                                selected={isActive}
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    mb: 0.5,
                                                                    bgcolor: isActive ? 'primary.light' : 'transparent',
                                                                    '&:hover': {
                                                                        bgcolor: isActive ? 'primary.light' : 'grey.100',
                                                                    },
                                                                }}
                                                            >

                                                                <ListItemText
                                                                    primary={
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontWeight: isActive ? 600 : 400,
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                            }}
                                                                        >
                                                                            {displayPreview.substring(0, 50)}{displayPreview.length > 50 ? '...' : ''}
                                                                        </Typography>
                                                                    }
                                                                    secondary={
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {messageCount} messages • {createdAt}{isArchived ? ' • Archived' : ''}
                                                                        </Typography>
                                                                    }
                                                                />
                                                            </ListItemButton>
                                                            {index < chatHistories.length - 1 && <Divider sx={{ my: 0.5 }} />}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </List>
                                        </>
                                    )}

                                    {/* Archived Chats */}
                                    {chatHistories.filter(h => h.archived).length > 0 && (
                                        <>
                                            <Typography variant="subtitle2" sx={{ px: 2, py: 1, mt: 2, color: 'text.secondary', fontWeight: 600 }}>
                                                Archived Chats
                                            </Typography>
                                            <List sx={{ p: 0 }}>
                                                {chatHistories.filter(h => h.archived).map((history, index) => {
                                                    const isActive = assistantChat?.id === history.id;
                                                    const isLegacy = !history.assistantID;
                                                    let historyMessages = [];
                                                    let historyDraft = '';
                                                    try {
                                                        historyMessages = history?.messages?.length ? history.messages : [];
                                                        historyDraft = history?.draft || '';
                                                    } catch (err) {
                                                        console.error('[ChatSidebar2] Error parsing messages:', err);
                                                    }
                                                    const messageCount = historyMessages.length;
                                                    const firstUserMessage = historyMessages.find(m => m.role === 'user');
                                                    const preview = firstUserMessage?.content || historyDraft || 'Empty chat';
                                                    const displayPreview = typeof preview === 'string' ? preview : JSON.stringify(preview);
                                                    const createdAt = history.createdAt ? new Date(history.createdAt).toLocaleDateString() : 'Unknown';

                                                    return (
                                                        <React.Fragment key={history.id}>
                                                            <ListItemButton
                                                                onClick={async () => {
                                                                    if (tabContext.switchToChat) {
                                                                        tabContext.switchToChat(history.id);
                                                                    } else {
                                                                        setCurrentChat(history);
                                                                        setMessages(JSON.parse(JSON.stringify(historyMessages)));
                                                                        dispatch({ type: ACTIONS.SET_INPUT, payload: historyDraft || '' });
                                                                    }
                                                                    dispatch({ type: ACTIONS.SET_HISTORY_DRAWER_OPEN, payload: false });
                                                                    console.log('[ChatSidebar2] Switching to archived chat:', history.id);
                                                                }}
                                                                selected={isActive}
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    mb: 0.5,
                                                                    bgcolor: isActive ? 'primary.light' : 'transparent',
                                                                    '&:hover': {
                                                                        bgcolor: isActive ? 'primary.light' : 'grey.100',
                                                                    },
                                                                    opacity: 0.7,
                                                                }}
                                                            >
                                                                <ListItemText
                                                                    primary={
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontWeight: isActive ? 600 : 400,
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap',
                                                                            }}
                                                                        >
                                                                            {displayPreview.substring(0, 50)}{displayPreview.length > 50 ? '...' : ''}
                                                                        </Typography>
                                                                    }
                                                                    secondary={
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {messageCount} messages • {createdAt}{isLegacy ? ' • Legacy (read-only)' : ''}
                                                                        </Typography>
                                                                    }
                                                                />
                                                                <Tooltip title={isLegacy ? 'Cannot unarchive legacy chat' : 'Unarchive chat'}>
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                if (history.assistantID) {
                                                                                    try {
                                                                                        const client = getAmplifyClient();
                                                                                        await client.models.AssistantChat.update({
                                                                                            id: history.id,
                                                                                            archived: false
                                                                                        });
                                                                                        console.log('[ChatSidebar2] Unarchived chat:', history.id);
                                                                                    } catch (error) {
                                                                                        console.error('[ChatSidebar2] Error unarchiving chat:', error);
                                                                                    }
                                                                                } else {
                                                                                    console.warn('[ChatSidebar2] Cannot unarchive legacy chat');
                                                                                }
                                                                            }}
                                                                            disabled={isLegacy}
                                                                            sx={{ opacity: isLegacy ? 0.3 : 1 }}
                                                                        >
                                                                            <UnarchiveIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                            </ListItemButton>
                                                            {index < chatHistories.filter(h => h.archived).length - 1 && <Divider sx={{ my: 0.5 }} />}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </List>
                                        </>
                                    )}
                                </>
                            )}
                        </Box>

                    ) : (
                        /* Show normal chat messages with virtualization */
                        <VirtualizedMessageList
                            key={assistantChat ? assistantChat.id : 'no-history'}
                            messages={messages}
                            useLexicalRenderer={true}
                            renderMessage={(message, index) => {
                                // Extract text content from message.parts (AI SDK v6 format)
                                let textContent = '';
                                if (message.parts && Array.isArray(message.parts)) {
                                    textContent = message.parts
                                        .filter(part => part.type === 'text')
                                        .map(part => part.text)
                                        .join('');
                                }

                                // Extract tool invocations from message.parts
                                const toolParts = message.parts?.filter(part =>
                                    part.type?.startsWith('tool-')
                                ) || [];

                                return (
                                    <Box key={message.id || `message-${index}`} sx={{ width: '100%', mb: 1 }}>
                                        {/* Render text content in speech bubble */}
                                        {textContent && (
                                            <Box
                                                sx={{
                                                    m: 0.75,
                                                    p: '0.75rem 1rem',
                                                    borderRadius: '1rem',
                                                    maxWidth: '85%',
                                                    wordWrap: 'break-word',
                                                    ...(message.role === 'user' ? {
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: 'white',
                                                        alignSelf: 'flex-end',
                                                        marginLeft: 'auto',
                                                        borderBottomRightRadius: '0.25rem',
                                                    } : {
                                                        bgcolor: '#f3f4f6',
                                                        color: '#1f2937',
                                                        alignSelf: 'flex-start',
                                                        borderBottomLeftRadius: '0.25rem',
                                                        border: '1px solid #e5e7eb',
                                                        position: 'relative',
                                                        pr: 6,
                                                        pb: 4,
                                                    })
                                                }}
                                            >
                                                <LexicalMessageRenderer
                                                    content={textContent}
                                                    isStreaming={message.isStreaming || false}
                                                />

                                                {/* AI Feedback Widget for assistant messages with text */}
                                                {message.role === 'assistant' && (
                                                    <Box sx={{ position: 'absolute', bottom: 4, right: 4 }}>
                                                        <AIFeedbackWidget
                                                            contentType="CHAT_MESSAGE"
                                                            messageId={message.id}
                                                            generatedContent={textContent}
                                                            model={message.model}
                                                            unitId={unit?.id}
                                                            sessionId={assistantChat?.id}
                                                            metadata={{
                                                                unitName: unit?.name,
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {/* Render tool invocations at full width, outside speech bubbles */}
                                        {toolParts.map((part, toolIdx) => {
                                            const callId = part.toolCallId;
                                            // Extract tool name from type (e.g., 'tool-search_content' -> 'search_content')
                                            const toolName = part.type?.replace('tool-', '') || part.toolName || 'unknown';

                                            // Render tool parts based on specific tool names
                                            if (toolName === 'search_content') {
                                                const executionState = toolExecutionStates[callId];
                                                let parsedOutput = null;

                                                if (part.state === 'output-available' && part.output) {
                                                    try {
                                                        parsedOutput = typeof part.output === 'string'
                                                            ? JSON.parse(part.output)
                                                            : part.output;
                                                    } catch (e) {
                                                        console.error('[ChatSidebar2] Failed to parse search output:', e);
                                                    }
                                                }

                                                return (
                                                    <Box
                                                        key={callId || toolIdx}
                                                        sx={{
                                                            width: '100%',
                                                            mb: 2,
                                                            p: 2,
                                                            bgcolor: 'background.paper',
                                                            borderRadius: 2,
                                                            border: '1px solid',
                                                            borderColor: part.state === 'output-error' ? 'error.main' : 'divider',
                                                            boxShadow: 1,
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                                🔍 Search Results
                                                            </Typography>
                                                            {executionState === 'executing' && (
                                                                <CircularProgress size={16} />
                                                            )}
                                                        </Box>

                                                        {part.state === 'input-streaming' && (
                                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', color: 'text.secondary' }}>
                                                                Preparing search...
                                                            </Typography>
                                                        )}

                                                        {part.state === 'input-available' && (
                                                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontStyle: 'italic' }}>
                                                                Searching for: "{part.input?.query}"
                                                            </Typography>
                                                        )}

                                                        {part.state === 'output-available' && parsedOutput && (
                                                            <Box sx={{ width: '100%' }}>
                                                                {parsedOutput.success ? (
                                                                    <>
                                                                        <Typography variant="body2" sx={{ color: 'success.dark', mb: 2, fontWeight: 500 }}>
                                                                            Found {parsedOutput.results?.length || 0} {parsedOutput.results?.length === 1 ? 'result' : 'results'}
                                                                        </Typography>
                                                                        <SearchResults
                                                                            results={parsedOutput.results || []}
                                                                            unitId={unit?.id}
                                                                            searchQuery={part.input?.query || ''}
                                                                            tabHandlers={tabContext}
                                                                            onInsertWord={handleInsertWord}
                                                                            onInsertQuestion={handleInsertQuestion}
                                                                            onFocusItem={handleFocusItem}
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                                                                        {parsedOutput.error || 'Search failed'}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        )}

                                                        {part.state === 'output-error' && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                                                                ✗ {part.errorText}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            }

                                            // Handle create_section tool
                                            if (toolName === 'create_section') {
                                                return (
                                                    <Box
                                                        key={callId || toolIdx}
                                                        sx={{
                                                            mb: 1,
                                                            p: 1,
                                                            bgcolor: 'transparent',
                                                            borderLeft: '2px solid',
                                                            borderColor: part.state === 'output-error' ? 'error.main' : 'grey.400',
                                                            fontSize: '0.8rem',
                                                            color: 'text.secondary',
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.primary' }}>
                                                            ➕ Create Section
                                                        </Typography>

                                                        {part.state === 'input-streaming' && (
                                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                                                Preparing...
                                                            </Typography>
                                                        )}

                                                        {part.state === 'input-available' && (
                                                            <Typography variant="caption" sx={{ display: 'block' }}>
                                                                "{part.input?.name}"
                                                            </Typography>
                                                        )}

                                                        {part.state === 'output-available' && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'success.dark' }}>
                                                                ✓ {part.output?.message || 'Created'}
                                                            </Typography>
                                                        )}

                                                        {part.state === 'output-error' && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                                                                ✗ {part.errorText}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            }

                                            // Handle generate_unit_content tool
                                            if (toolName === 'generate_unit_content') {
                                                return (
                                                    <Box
                                                        key={callId || toolIdx}
                                                        sx={{
                                                            mb: 1,
                                                            p: 1,
                                                            bgcolor: 'transparent',
                                                            borderLeft: '2px solid',
                                                            borderColor: part.state === 'output-error' ? 'error.main' : 'grey.400',
                                                            fontSize: '0.8rem',
                                                            color: 'text.secondary',
                                                        }}
                                                    >
                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.primary' }}>
                                                            ✨ Generate Content
                                                        </Typography>

                                                        {part.state === 'input-streaming' && (
                                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                                                Preparing...
                                                            </Typography>
                                                        )}

                                                        {part.state === 'input-available' && (
                                                            <Typography variant="caption" sx={{ display: 'block' }}>
                                                                {part.input?.contentType}: "{part.input?.topic}"
                                                            </Typography>
                                                        )}

                                                        {part.state === 'output-available' && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'success.dark' }}>
                                                                ✓ {part.output?.message || 'Ready'}
                                                            </Typography>
                                                        )}

                                                        {part.state === 'output-error' && (
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                                                                ✗ {part.errorText}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            }

                                            // Handle dynamic or unknown tools
                                            return (
                                                <Box
                                                    key={callId || toolIdx}
                                                    sx={{
                                                        mb: 1,
                                                        p: 1,
                                                        bgcolor: 'transparent',
                                                        borderLeft: '2px solid',
                                                        borderColor: part.state === 'output-error' ? 'error.main' : 'grey.400',
                                                        fontSize: '0.8rem',
                                                        color: 'text.secondary',
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.primary' }}>
                                                        🔧 {toolName || 'unknown'}
                                                    </Typography>

                                                    {part.state === 'input-streaming' && (
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                            Preparing...
                                                        </Typography>
                                                    )}

                                                    {part.state === 'input-available' && (
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                            Executing...
                                                        </Typography>
                                                    )}

                                                    {part.state === 'output-available' && (
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'success.dark' }}>
                                                            ✓ Complete
                                                        </Typography>
                                                    )}

                                                    {part.state === 'output-error' && (
                                                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'error.main' }}>
                                                            ✗ {part.errorText}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })}

                                        {/* Loading indicator for last message */}
                                        {index === messages.length - 1 && isLoading && message.role !== 'assistant' && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 2,
                                                    alignSelf: 'flex-start',
                                                    m: 0.75,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 0.5,
                                                        p: '0.75rem 1rem',
                                                        borderRadius: '1rem',
                                                        bgcolor: '#f3f4f6',
                                                        border: '1px solid #e5e7eb',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            bgcolor: '#9ca3af',
                                                            animation: 'typing 1s infinite',
                                                            animationDelay: '0s',
                                                            '@keyframes typing': {
                                                                '0%, 60%, 100%': {
                                                                    transform: 'translateY(0)',
                                                                    opacity: 0.7,
                                                                },
                                                                '30%': {
                                                                    transform: 'translateY(-7px)',
                                                                    opacity: 1,
                                                                },
                                                            },
                                                        }}
                                                    />
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            bgcolor: '#9ca3af',
                                                            animation: 'typing 1s infinite',
                                                            animationDelay: '0.2s',
                                                            '@keyframes typing': {
                                                                '0%, 60%, 100%': {
                                                                    transform: 'translateY(0)',
                                                                    opacity: 0.7,
                                                                },
                                                                '30%': {
                                                                    transform: 'translateY(-7px)',
                                                                    opacity: 1,
                                                                },
                                                            },
                                                        }}
                                                    />
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            bgcolor: '#9ca3af',
                                                            animation: 'typing 1s infinite',
                                                            animationDelay: '0.4s',
                                                            '@keyframes typing': {
                                                                '0%, 60%, 100%': {
                                                                    transform: 'translateY(0)',
                                                                    opacity: 0.7,
                                                                },
                                                                '30%': {
                                                                    transform: 'translateY(-7px)',
                                                                    opacity: 1,
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            }}
                            emptyState={
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        color: 'text.secondary',
                                        textAlign: 'center',
                                        p: 3,
                                    }}
                                >
                                    <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            wordWrap: 'break-word',
                                            textAlign: 'center',
                                            whiteSpace: 'normal'
                                        }}
                                    >
                                        Ask me anything about your curriculum, files, or content!
                                    </Typography>
                                </Box>
                            }
                        />
                    )}
                </Box>

                {/* Input */}
                <Paper
                    component="form"
                    onSubmit={submitMessage}
                    elevation={2}
                    sx={{
                        p: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    {/* File attachments */}
                    {uploadedFiles.length > 0 && (
                        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {uploadedFiles.map((file, index) => {
                                const isDocument = file.type === 'application/pdf';
                                const status = documentProcessingStatus[index];

                                return (
                                    <Paper
                                        key={index}
                                        elevation={1}
                                        sx={{
                                            p: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            bgcolor: isDocument ? (
                                                status?.status === 'error' ? 'error.light' :
                                                    status?.status === 'analyzed' ? 'success.light' :
                                                        status?.status === 'analyzing' || status?.status === 'extracting' ? 'warning.light' :
                                                            status?.status === 'cancelled' ? 'grey.200' :
                                                                'grey.100'
                                            ) : 'grey.100',
                                            border: isDocument ? '1px solid' : 'none',
                                            borderColor: isDocument ? (
                                                status?.status === 'error' ? 'error.main' :
                                                    status?.status === 'analyzed' ? 'success.main' :
                                                        status?.status === 'analyzing' || status?.status === 'extracting' ? 'warning.main' :
                                                            status?.status === 'cancelled' ? 'grey.400' :
                                                                'grey.300'
                                            ) : 'transparent',
                                        }}
                                    >
                                        {isDocument && <PictureAsPdfIcon sx={{ fontSize: 18, color: 'error.main' }} />}
                                        {!isDocument && <AttachFileIcon sx={{ fontSize: 18 }} />}

                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                {file.name}
                                            </Typography>
                                            {status && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontSize: '0.65rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        color: status.status === 'error' ? 'error.main' :
                                                            status.status === 'analyzed' ? 'success.main' :
                                                                'text.secondary'
                                                    }}
                                                >
                                                    {status.status === 'uploading' && (
                                                        <CircularProgress size={10} />
                                                    )}
                                                    {status.status === 'analyzed' && (
                                                        <CheckCircleIcon sx={{ fontSize: 12 }} />
                                                    )}
                                                    {status.message}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Cancel button for processing documents */}
                                        {isDocument && status && ['uploading', 'analyzing', 'extracting'].includes(status.status) && (
                                            <IconButton
                                                size="small"
                                                onClick={() => cancelProcessing(index)}
                                                sx={{ p: 0.5 }}
                                                title="Cancel analysis"
                                            >
                                                <CancelIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                            </IconButton>
                                        )}

                                        {/* Review Vocabulary button for completed documents */}
                                        {isDocument && status && status.status === 'analyzed' && status.documentId && (
                                            <IconButton
                                                size="small"
                                                onClick={() => openVocabularyReview(status.documentId)}
                                                sx={{ p: 0.5 }}
                                                title="Review vocabulary"
                                                color="primary"
                                            >
                                                <RateReviewIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        )}

                                        {/* Remove/Delete button */}
                                        <IconButton
                                            size="small"
                                            onClick={() => removeFile(index)}
                                            sx={{ p: 0.5 }}
                                            title="Remove file"
                                        >
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Paper>
                                )
                            })}
                        </Box>
                    )}

                    {/* Warning for legacy chats without assistantID */}
                    {/* {currentChatHistory && !currentChatHistory.assistantID && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                            <Typography variant="body2" color="warning.dark" sx={{ mb: 1 }}>
                                ⚠️ This chat session is using an outdated format and cannot be saved.
                            </Typography>
                            <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={async () => {
                                    try {
                                        const client = getAmplifyClient();
                                        await client.models.AssistantChat.delete({ id: currentChatHistory.id });
                                        console.log('[ChatSidebar2] Deleted legacy chat record');
                                        // TabContext will create a new one automatically
                                    } catch (error) {
                                        console.error('[ChatSidebar2] Error deleting legacy chat:', error);
                                    }
                                }}
                            >
                                Delete and Create New Chat
                            </Button>
                        </Box>
                    )} */}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            hidden
                            onChange={handleFileSelect}
                        />

                        {/* Attach button */}
                        <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || !assistantChat?.id}
                            sx={{ alignSelf: 'flex-end' }}
                        >
                            <UploadFile />
                        </IconButton>

                        <TextField
                            fullWidth
                            size="small"
                            value={input}
                            onChange={handleInputChange}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    submitMessage(e);
                                }
                            }}
                            placeholder={
                                !assistantChat?._version
                                    ? "Setting up chat..."
                                    : "Ask me anything..."
                            }
                            disabled={isLoading || !assistantChat?._version}
                            multiline
                            maxRows={4}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                },
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading || !assistantChat?.id}
                            sx={{
                                minWidth: 'auto',
                                px: 2,
                                borderRadius: 2,
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                <SendIcon />
                            )}
                        </Button>
                    </Box>
                </Paper>
            </Box>

            {/* Vocabulary Review Dialog */}
            <Dialog
                open={vocabularyReviewDialogOpen}
                onClose={() => dispatch({ type: ACTIONS.SET_VOCABULARY_REVIEW_DIALOG, payload: false })}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Review & Import Vocabulary
                    <IconButton
                        onClick={() => dispatch({ type: ACTIONS.SET_VOCABULARY_REVIEW_DIALOG, payload: false })}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {reviewDocumentId && (
                        <VocabularyReview
                            documentId={reviewDocumentId}
                            unitId={unit?.id}
                            owner={session?.sub}
                            identityId={identityId}
                            onImportComplete={handleVocabularyImportComplete}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Snackbar - Rendered in Portal to escape container overflow */}
            <Portal>
                <Snackbar
                    open={confirmDialog.open}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    onClose={(event, reason) => {
                        if (reason === 'clickaway') {
                            return;
                        }
                    }}
                >
                    <Alert
                        severity={confirmDialog.severity}
                        sx={{
                            width: '100%',
                            minWidth: '300px',
                            boxShadow: 3
                        }}
                        action={
                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirmDialog.onConfirm) {
                                            confirmDialog.onConfirm();
                                        }
                                    }}
                                    variant="outlined"
                                >
                                    Confirm
                                </Button>
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirmDialog.onCancel) {
                                            confirmDialog.onCancel();
                                        } else {
                                            dispatch({ type: ACTIONS.SET_CONFIRM_DIALOG, payload: { open: false, message: '', onConfirm: null, severity: 'info' } });
                                        }
                                    }}
                                    variant="contained"
                                >
                                    Cancel
                                </Button>
                            </Box>
                        }
                    >
                        {confirmDialog.message}
                    </Alert>
                </Snackbar>
            </Portal>
        </>
    );
}

// Memoize the entire component to prevent re-renders from parent context updates
export default React.memo(ChatSidebar2);