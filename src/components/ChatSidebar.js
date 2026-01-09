// react component that renders the chat session with the user and the bot
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
} from "@mui/material";
import { DataStore } from '@aws-amplify/datastore';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import UploadFile from '@mui/icons-material/UploadFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CancelIcon from '@mui/icons-material/Cancel';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { Section, Document } from "../models";
import UnitContext from "../context/unitContext";
import SectionContext from "../context/sectionContext";
import VectorStoreContext from "../context/vectorStoreContext";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { fetchAuthSession } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import { uploadAndAnalyzePDF, cancelPDFAnalysis } from '../utils/fileUploadUtils';
import FilesContext from "../context/fileContext";
import VocabularyReview from "./VocabularyReview";
import { toolDefinitions, executeTool, setVectorStoreSearch } from '../utils/chatTools';
import AIFeedbackWidget from './AIFeedbackWidget';
import amplifyConfig from '../amplifyconfiguration.json';
import { TextStreamChatTransport } from 'ai';

const ChatSidebar = () => {
    const chatContainerRef = useRef(null);
    const renderCountRef = useRef(0);
    const updateTimeoutRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [documentProcessingStatus, setDocumentProcessingStatus] = useState({}); // { fileIndex: { status: 'uploading'|'uploaded'|'analyzing'|'analyzed'|'error', progress: 0-100, message: '', documentId: '' } }
    const [documentStatuses, setDocumentStatuses] = useState({}); // { documentId: { status: 'uploaded'|'extracting'|'analyzing'|'completed'|'failed' } }
    const fileInputRef = useRef(null);
    const [vocabularyReviewDialogOpen, setVocabularyReviewDialogOpen] = useState(false);
    const [reviewDocumentId, setReviewDocumentId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null, severity: 'info' });

    const {
        unit,
        files,
        questionBank,
        dictionary,
    } = React.useContext(UnitContext);
    
    // Track renders and throttle logging
    renderCountRef.current += 1;
    
    // Clear any pending update timeout
    if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce excessive renders by batching context updates
    updateTimeoutRef.current = setTimeout(() => {
        if (renderCountRef.current <= 10 || renderCountRef.current % 10 === 0) {
            console.log(`[ChatSidebar] Render #${renderCountRef.current}`);
        }
    }, 100);
    
    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);
    
    // Get sections from SectionContext instead of local query
    const { sections = [] } = React.useContext(SectionContext) || {};
    
    const { session } = React.useContext(FilesContext);
    const { identityId } = session || {};
    
    // Get vector store for semantic search
    const vectorStoreCtx = React.useContext(VectorStoreContext);
    
    // Register vector store search function with chatTools
    React.useEffect(() => {
        if (vectorStoreCtx?.search) {
            setVectorStoreSearch(vectorStoreCtx.search);
            console.log('[ChatSidebar] Registered vector store search, isReady:', vectorStoreCtx.isReady);
        }
        
        return () => {
            setVectorStoreSearch(null);
        };
    }, [vectorStoreCtx]);
    
    // Memoize stringified context keys to detect actual changes
    // Use a custom hook to get stable keys based on content, not object references
    const contextKeys = useMemo(() => {
        const unitKey = unit ? `${unit.id}-${unit._version}` : 'no-unit';
        // Create sorted comma-separated lists of IDs for comparison
        const filesKeys = files ? Object.keys(files).sort().join(',') : 'no-files';
        const questionBankKeys = questionBank ? Object.keys(questionBank).sort().join(',') : 'no-questions';
        const dictionaryKeys = dictionary ? Object.keys(dictionary).sort().join(',') : 'no-dict';
        const sectionsKeys = sections && sections.length > 0 ? sections.map(s => s.id).sort().join(',') : 'no-sections';
        
        const combined = `${unitKey}|${filesKeys}|${questionBankKeys}|${dictionaryKeys}|${sectionsKeys}`;
        return combined;
    }, [
        unit?.id, 
        unit?._version,
        // Use stable primitive values for dependencies
        files ? Object.keys(files).length : 0,
        questionBank ? Object.keys(questionBank).length : 0,
        dictionary ? Object.keys(dictionary).length : 0,
        sections ? sections.length : 0,
    ]);
    
    // Store previous contextKeys in a ref to detect actual changes
    const prevContextKeysRef = useRef(contextKeys);
    const contextKeysActuallyChanged = prevContextKeysRef.current !== contextKeys;
    if (contextKeysActuallyChanged) {
        console.log('[ChatSidebar] Context keys changed:', prevContextKeysRef.current, '→', contextKeys);
        prevContextKeysRef.current = contextKeys;
    }
    
    // Memoize context data to prevent customFetch recreation - only update when keys actually change
    const contextData = useMemo(() => {
        if (contextKeysActuallyChanged) {
            console.log('[ChatSidebar] Recomputing contextData due to key change');
        }
        return {
            unit: unit ? {
                id: unit.id,
                name: unit.name,
                description: unit.description,
                data: unit.data, // use markdown in unit data if available
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
            sections: sections ? sections.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
            })) : [],
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextKeys]); // Only depend on the stable contextKeys string

    // Memoize the fetch function to prevent recreation on every render
    const customFetch = useCallback(async (url, options) => {
        console.log('[ChatSidebar] Custom fetch with Amplify post client, ignoring url:', url);
        
        try {
            // Parse the request body from AI SDK
            const requestBody = options.body ? JSON.parse(options.body) : {};
            
            // Add context to the request body
            const bodyWithContext = {
                ...requestBody,
                context: contextData,
            };
            
            console.log('[ChatSidebar] Sending request with context:', {
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
            
            console.log('[ChatSidebar] Response received:', {
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
            
            console.log('[ChatSidebar] Created Web Response with streaming body:', {
                ok: webResponse.ok,
                status: webResponse.status,
                bodyUsed: webResponse.bodyUsed,
            });
            
            return webResponse;
        } catch (error) {
            console.error('[ChatSidebar] Error in customFetch:', error);
            throw error;
        }
    }, [contextData]);

    // Memoize the transport object to prevent recreation on every render
    // Using 'data' streamProtocol for Server-Sent Events format: "data: {...}\n\n"
    const transport = useMemo(() => new DefaultChatTransport({
      api: '/api/chat',
      fetch: customFetch, // Use our custom fetch that routes through Amplify
    }), [customFetch]);

    // Use Vercel AI SDK's useChat hook with memoized transport
    const chatHookResult = useChat({
        transport,
        
        // Handle client-side tool execution with onToolCall
        async onToolCall({ toolCall, addToolOutput }) {
            console.log('[ChatSidebar] onToolCall invoked:', toolCall);
            
            // Check if it's a dynamic tool first for proper type narrowing
            if (toolCall.dynamic) {
                console.log('[ChatSidebar] Skipping dynamic tool:', toolCall.toolName);
                return;
            }
            
            // Execute client-side tools
            if (toolCall.toolName === 'search_content') {
                console.log('[ChatSidebar] Executing search_content:', toolCall.input);
                try {
                    const result = await executeTool('search_content', toolCall.input);
                    console.log('[ChatSidebar] Search result:', result);
                    
                    // No await - avoids potential deadlocks
                    addToolOutput({
                        tool: 'search_content',
                        toolCallId: toolCall.toolCallId,
                        output: result,
                    });
                } catch (error) {
                    console.error('[ChatSidebar] Search error:', error);
                    addToolOutput({
                        tool: 'search_content',
                        toolCallId: toolCall.toolCallId,
                        state: 'output-error',
                        errorText: error.message || 'Search failed',
                    });
                }
            }
            // Other client-side tools can be added here
        },
        
        // Automatically send when all tool results are available
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        
        onError: (error) => {
            console.error('[ChatSidebar] Chat error:', error);
        },
        
        onFinish: (message) => {
            console.log('[ChatSidebar] Message finished:', message);
        },
    });
    
    // Validate hook result
    if (!chatHookResult) {
        console.error('[ChatSidebar] useChat returned null/undefined!');
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
        setMessages = () => {},
        error: chatError,
        status = 'idle',
        stop,
        toolCalls = [],
        addToolOutput,
    } = chatHookResult || {};

    console.log('[ChatSidebar] useChat status:', status, 'messages:', messages.length, 'toolCalls:', toolCalls.length);
    
    // Manage input state locally (v3 API doesn't provide this)
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    // Update loading state based on status
    React.useEffect(() => {
        const wasLoading = isLoading;
        setIsLoading(status === 'in_progress' || status === 'streaming');
        if (wasLoading !== (status === 'in_progress' || status === 'streaming')) {
            console.log('[ChatSidebar] Loading state changed:', status, 'isLoading:', status === 'in_progress' || status === 'streaming');
        }
    }, [status]);
    
    // Handle input change
    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    // Create a unified submit function
    const submitMessage = React.useCallback(async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        
        console.log('[ChatSidebar] submitMessage called', {
            input,
            inputLength: input?.length,
            inputType: typeof input,
            hasSendMessage: typeof sendMessage === 'function',
            status
        });
        
        // If input is empty, don't submit
        if (!input || input.trim() === '') {
            console.log('[ChatSidebar] Empty input, not submitting');
            return;
        }
        
        // Use sendMessage from useChat
        if (typeof sendMessage === 'function') {
            console.log('[ChatSidebar] Using sendMessage with input:', input);
            try {
                // AI SDK v6: sendMessage expects { text: string }
                sendMessage({ text: input });
                // Clear input after successful send
                setInput('');
            } catch (error) {
                console.error('[ChatSidebar] Error sending message:', error);
            }
        } else {
            console.error('[ChatSidebar] sendMessage function not available:', {
                sendMessage: typeof sendMessage,
                allKeys: Object.keys(chatHookResult)
            });
        }
    }, [input, sendMessage, status, chatHookResult]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Note: Section data is now provided by SectionContext
    // Removed redundant Section observer to reduce subscription overhead
    
    // Subscribe to Document status changes
    useEffect(() => {
        const subscription = DataStore.observeQuery(Document).subscribe(({ items }) => {
            const statusMap = {};
            items.forEach(doc => {
                statusMap[doc.id] = {
                    status: doc.status,
                    pageCount: doc.pageCount,
                    s3Key: doc.s3Key,
                };
            });
            setDocumentStatuses(statusMap);
            console.log('[ChatSidebar] Document statuses updated:', statusMap);
        });
        
        return () => subscription.unsubscribe();
    }, []);
    
    // Update document processing status when document status changes
    useEffect(() => {
        setDocumentProcessingStatus(prev => {
            const updated = { ...prev };
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
            
            return hasChanges ? updated : prev;
        });
    }, [documentStatuses]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        console.log('Files dropped:', files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        console.log('Files selected:', files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setDocumentProcessingStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[index];
            return newStatus;
        });
    };
    
    // Cancel document processing
    const cancelProcessing = async (index) => {
        const status = documentProcessingStatus[index];
        if (!status || !status.documentId) {
            console.warn('[ChatSidebar] No document ID to cancel');
            return;
        }

        try {
            console.log('[ChatSidebar] Cancelling analysis for document:', status.documentId);
            
            setDocumentProcessingStatus(prev => ({
                ...prev,
                [index]: { 
                    ...prev[index],
                    message: 'Cancelling...' 
                }
            }));

            await cancelPDFAnalysis(status.documentId);
            
            setDocumentProcessingStatus(prev => ({
                ...prev,
                [index]: { 
                    ...prev[index],
                    status: 'cancelled',
                    message: 'Analysis cancelled' 
                }
            }));
        } catch (error) {
            console.error('[ChatSidebar] Error cancelling analysis:', error);
            setDocumentProcessingStatus(prev => ({
                ...prev,
                [index]: { 
                    ...prev[index],
                    message: `Cancel failed: ${error.message}` 
                }
            }));
        }
    };
    
    // Open vocabulary review dialog
    const openVocabularyReview = (documentId) => {
        setReviewDocumentId(documentId);
        setVocabularyReviewDialogOpen(true);
    };
    
    // Handle vocabulary import completion
    const handleVocabularyImportComplete = (result) => {
        console.log('[ChatSidebar] Vocabulary import complete:', result);
        // Could show a success message or update UI
        // Optionally close the dialog after a delay
        setTimeout(() => {
            setVocabularyReviewDialogOpen(false);
        }, 2000);
    };

    // Process documents when they're added
    const processDocument = async (file, index) => {
        if ( file.type !== 'application/pdf' &&
            file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
            file.type !== 'application/msword' &&
            file.type !== 'text/plain' &&
            file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
            file.type !== 'application/vnd.ms-excel' &&
            file.type !== 'text/csv'
        ) return;

        try {
            console.log('[ChatSidebar] Processing document:', file.name, { index });
            
            // Update status to uploading
            setDocumentProcessingStatus(prev => ({
                ...prev,
                [index]: { status: 'uploading', progress: 0, message: 'Uploading document...' }
            }));

            // Get identity ID if not already available
            const session = await fetchAuthSession();
            const currentIdentityId = identityId || session.identityId;
            
            console.log('[ChatSidebar] Identity ID:', currentIdentityId);
            console.log('[ChatSidebar] Unit ID:', unit?.id);

            // Upload and analyze
            const result = await uploadAndAnalyzePDF(
                file,
                currentIdentityId,
                unit?.id,
                true, // auto-analyze
                (loaded, total) => {
                    const progress = Math.round((loaded / total) * 100);
                    setDocumentProcessingStatus(prev => ({
                        ...prev,
                        [index]: { 
                            status: 'uploading', 
                            progress, 
                            message: `Uploading... ${progress}%` 
                        }
                    }));
                }
            );
            
            console.log('[ChatSidebar] Upload result:', result);

            // Update status based on result - store documentId for tracking
            if (result.analysisResult && result.analysisResult.success) {
                setDocumentProcessingStatus(prev => ({
                    ...prev,
                    [index]: { 
                        status: 'analyzing', 
                        progress: 100, 
                        message: 'Document uploaded, analysis started...',
                        documentId: result.documentModel?.id,
                    }
                }));
            } else if (result.documentModel) {
                setDocumentProcessingStatus(prev => ({
                    ...prev,
                    [index]: { 
                        status: 'uploaded', 
                        progress: 100, 
                        message: 'Document uploaded successfully',
                        documentId: result.documentModel?.id,
                    }
                }));
            } else {
                setDocumentProcessingStatus(prev => ({
                    ...prev,
                    [index]: { 
                        status: 'uploaded', 
                        progress: 100, 
                        message: 'Document uploaded (no document created)' 
                    }
                }));
            }
        } catch (error) {
            console.error('[ChatSidebar] Error processing document:', error);
            setDocumentProcessingStatus(prev => ({
                ...prev,
                [index]: { 
                    status: 'error', 
                    progress: 0, 
                    message: `Error: ${error.message}` 
                }
            }));
        }
    };

    // Detect documents and offer to process them
    useEffect(() => {
        uploadedFiles.forEach((file, index) => {
            if (file.type === 'application/pdf' && !documentProcessingStatus[index]) {
                // Ask user if they want to process the document
                setConfirmDialog({
                    open: true,
                    message: `Would you like to upload and analyze "${file.name}"? This will extract text and generate vocabulary.`,
                    severity: 'info',
                    onConfirm: () => {
                        processDocument(file, index);
                        setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'info' });
                    },
                    onCancel: () => {
                        // Mark as declined
                        setDocumentProcessingStatus(prev => ({
                            ...prev,
                            [index]: { 
                                status: 'declined', 
                                progress: 0, 
                                message: 'Analysis declined' 
                            }
                        }));
                        setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'info' });
                    }
                });
            }
        });
    }, [uploadedFiles, documentProcessingStatus, unit?.id, identityId]);

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
                        <ChatIcon color="primary" />
                        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            AI Assistant
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setMessages([])}
                        title="Clear chat"
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Paper>

                {/* Messages */}
                <Box
                    ref={chatContainerRef}
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1,
                        bgcolor: 'grey.50',
                    }}
                >
                    {messages.length === 0 && (
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
                    )}
                    {messages.map((message) => {
                        // Only log on first render of this message
                        if (!message._logged) {
                            message._logged = true;
                            console.log('[ChatSidebar] New message:', {
                                id: message.id,
                                role: message.role,
                                partsCount: message.parts?.length || 0,
                            });
                        }
                        
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
                        <Box
                            key={message.id}
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
                                    borderBottomRightRadius: '0.25rem',
                                } : {
                                    bgcolor: '#f3f4f6',
                                    color: '#1f2937',
                                    alignSelf: 'flex-start',
                                    borderBottomLeftRadius: '0.25rem',
                                    border: '1px solid #e5e7eb',
                                    position: 'relative',
                                    pr: 6,
                                })
                            }}
                        >
                            {/* Render text content */}
                            {textContent && (
                                <Box 
                                    component="pre"
                                    sx={{
                                        m: 0,
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word',
                                        fontFamily: 'inherit',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {textContent}
                                </Box>
                            )}
                            
                            {/* Render tool invocations from message.parts */}
                            {toolParts.map((part, toolIdx) => {
                                const callId = part.toolCallId;
                                
                                // Render tool parts based on specific tool types
                                switch (part.type) {
                                    case 'tool-search_content':
                                        return (
                                            <Box
                                                key={callId || toolIdx}
                                                sx={{
                                                    mb: 1,
                                                    p: 1.5,
                                                    bgcolor: part.state === 'output-error' ? 'error.light' : 'info.light',
                                                    borderRadius: 1,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                                    🔍 Searching Content
                                                </Typography>
                                                
                                                {part.state === 'input-streaming' && (
                                                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                                        Preparing search...
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'input-available' && (
                                                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                                        Searching for: "{part.input?.query}"
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'output-available' && (
                                                    <Box>
                                                        <Typography variant="caption" sx={{ display: 'block', color: 'success.main', mb: 0.5 }}>
                                                            ✓ Found {part.output?.results?.length || 0} results
                                                        </Typography>
                                                        {part.output?.results?.slice(0, 3).map((result, idx) => (
                                                            <Typography key={idx} variant="caption" sx={{ display: 'block', ml: 1, fontSize: '0.75rem' }}>
                                                                • {result.type}: {result.phrase || result.name || result.prompt?.substring(0, 50)}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                )}
                                                
                                                {part.state === 'output-error' && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                                                        ✗ Error: {part.errorText}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    
                                    case 'tool-create_section':
                                        return (
                                            <Box
                                                key={callId || toolIdx}
                                                sx={{
                                                    mb: 1,
                                                    p: 1.5,
                                                    bgcolor: part.state === 'output-error' ? 'error.light' : 'success.light',
                                                    borderRadius: 1,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                                    ➕ Creating Section
                                                </Typography>
                                                
                                                {part.state === 'input-streaming' && (
                                                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                                        Preparing to create section...
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'input-available' && (
                                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                                        Section: "{part.input?.name}"
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'output-available' && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'success.dark' }}>
                                                        ✓ {part.output?.message || 'Section created successfully'}
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'output-error' && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                                                        ✗ Error: {part.errorText}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    
                                    case 'tool-generate_unit_content':
                                        return (
                                            <Box
                                                key={callId || toolIdx}
                                                sx={{
                                                    mb: 1,
                                                    p: 1.5,
                                                    bgcolor: part.state === 'output-error' ? 'error.light' : 'warning.light',
                                                    borderRadius: 1,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                                    ✨ Generating Content
                                                </Typography>
                                                
                                                {part.state === 'input-streaming' && (
                                                    <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                                        Preparing content generation...
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'input-available' && (
                                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                                        Generating {part.input?.contentType} about: "{part.input?.topic}"
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'output-available' && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'success.dark' }}>
                                                        ✓ {part.output?.message || 'Content template ready'}
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'output-error' && (
                                                    <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                                                        ✗ Error: {part.errorText}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    
                                    // Handle dynamic or unknown tools
                                    case 'dynamic-tool':
                                    default:
                                        const toolName = part.type?.replace('tool-', '') || 'unknown';
                                        return (
                                            <Box
                                                key={callId || toolIdx}
                                                sx={{
                                                    mb: 1,
                                                    p: 1,
                                                    bgcolor: part.state === 'output-error' ? 'error.light' : 'grey.200',
                                                    borderRadius: 1,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                                    🔧 {toolName}
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
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'success.main' }}>
                                                        ✓ {typeof part.output === 'string' ? part.output : JSON.stringify(part.output).substring(0, 100)}
                                                    </Typography>
                                                )}
                                                
                                                {part.state === 'output-error' && (
                                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'error.main' }}>
                                                        ✗ Error: {part.errorText}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                }
                            })}
                            
                            {/* Add feedback widget for assistant messages with text content */}
                            {message.role === 'assistant' && textContent && (
                                <Box 
                                    sx={{
                                        position: 'absolute',
                                        bottom: '0.5rem',
                                        right: '0.5rem',
                                    }}
                                >
                                    <AIFeedbackWidget
                                        contentType="CHAT_MESSAGE"
                                        messageId={message.id}
                                        generatedContent={textContent}
                                        model="gpt-4"
                                        unitId={unit?.id}
                                        sessionId={session?.sub}
                                        metadata={{
                                            role: message.role,
                                            timestamp: new Date().toISOString(),
                                        }}
                                        size="small"
                                    />
                                </Box>
                            )}
                        </Box>
                        );
                    })}
                    {isLoading && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 2,
                                color: 'text.secondary',
                            }}
                        >
                            <CircularProgress size={16} />
                            <Typography variant="body2">Thinking...</Typography>
                        </Box>
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
                            )})}
                        </Box>
                    )}

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
                            disabled={isLoading}
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
                            placeholder="Ask me anything..."
                            disabled={isLoading}
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
                            disabled={isLoading}
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
                onClose={() => setVocabularyReviewDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Review & Import Vocabulary
                    <IconButton
                        onClick={() => setVocabularyReviewDialogOpen(false)}
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
                                            setConfirmDialog({ open: false, message: '', onConfirm: null, severity: 'info' });
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
export default React.memo(ChatSidebar);
