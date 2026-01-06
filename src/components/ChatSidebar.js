// react component that renders the chat session with the user and the bot
import React, { useState, useEffect, useRef } from "react";
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
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadAndAnalyzePDF, cancelPDFAnalysis } from '../utils/fileUploadUtils';
import FilesContext from "../context/fileContext";
import VocabularyReview from "./VocabularyReview";
import { toolDefinitions, executeTool, setVectorStoreSearch } from '../utils/chatTools';
import AIFeedbackWidget from './AIFeedbackWidget';
import amplifyConfig from '../amplifyconfiguration.json';
import { TextStreamChatTransport } from 'ai';

const ChatSidebar = () => {
    const chatContainerRef = useRef(null);
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

    // Use Vercel AI SDK's useChat hook with TextStreamChatTransport
    const chatHookResult = useChat({
        transport: new TextStreamChatTransport({
            api: '/chat',
            fetch: async (url, options) => {
                console.log('[ChatSidebar] Custom fetch called');
                
                // Parse the request body
                const body = options.body ? JSON.parse(options.body) : {};
                
                // Add context to the request
                body.context = {
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
                    sections: sections.map(s => ({
                        id: s.id,
                        name: s.name,
                        description: s.description,
                    })),
                };
                
                console.log('[ChatSidebar] Sending to Amplify:', JSON.stringify(body, null, 2));
                
                // Use Amplify's post which handles auth automatically
                const restOperation = post({
                    apiName: 'completions',
                    path: '/chat',
                    options: { body },
                });
                
                const response = await restOperation.response;

                console.log('[ChatSidebar] Received response from Amplify:', response);
                
                // Return response directly
                return new Response(response.body, {
                    status: response.statusCode,
                    headers: response.headers,
                });
            },
        }),
        async onToolCall({ toolCall }) {
            console.log('[ChatSidebar] Tool call:', toolCall);
            
            // Execute the tool on the client side (where we have DataStore access)
            const result = await executeTool(toolCall.toolName, toolCall.args);
            
            console.log('[ChatSidebar] Tool result:', result);
            
            // Return result to the AI
            return result;
        },
        onError: (error) => {
            console.error('[ChatSidebar] Chat error:', error);
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

    // Debug: Log what useChat returns
    console.log('[ChatSidebar] useChat hook result:', {
        hasMessages: !!chatHookResult.messages,
        hasSendMessage: typeof chatHookResult.sendMessage === 'function',
        hasRegenerate: typeof chatHookResult.regenerate === 'function',
        hasError: !!chatHookResult.error,
        status: chatHookResult.status,
        allKeys: Object.keys(chatHookResult),
    });

    // Destructure all available functions from useChat API
    const { 
        messages = [], 
        sendMessage,
        regenerate,
        setMessages = () => {},
        error: chatError,
        status = 'idle',
        stop,
        addToolResult,
    } = chatHookResult || {};
    
    // Manage input state locally (v3 API doesn't provide this)
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    // Update loading state based on status
    React.useEffect(() => {
        setIsLoading(status === 'in_progress' || status === 'streaming');
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
                // AI SDK v3: sendMessage expects an object with a text property
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
            <style global jsx>{`
                .chat-message {
                    margin: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 1rem;
                    max-width: 85%;
                    word-wrap: break-word;
                }
                .chat-message.user {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    align-self: flex-end;
                    border-bottom-right-radius: 0.25rem;
                }
                .chat-message.assistant {
                    background-color: #f3f4f6;
                    color: #1f2937;
                    align-self: flex-start;
                    border-bottom-left-radius: 0.25rem;
                    border: 1px solid #e5e7eb;
                    position: relative;
                    padding-right: 3rem;
                }
                .chat-message pre {
                    margin: 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-family: inherit;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                .chat-feedback {
                    position: absolute;
                    bottom: 0.5rem;
                    right: 0.5rem;
                }
            `}</style>
            
            <Box 
                sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag overlay */}
                {isDragging && (
                    <Box
                        sx={{
                            position: 'absolute',
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
                        // Extract text content from parts array
                        const textContent = message.parts
                            ?.filter(part => part.type === 'text')
                            ?.map(part => part.text)
                            ?.join('') || message.content || '';
                        
                        console.log('[ChatSidebar] Rendering message:', {
                            id: message.id,
                            role: message.role,
                            content: message.content,
                            textContent,
                            contentLength: textContent?.length,
                            hasToolInvocations: !!message.toolInvocations,
                            allKeys: Object.keys(message),
                        });
                        
                        return (
                        <div
                            key={message.id}
                            className={`chat-message ${message.role}`}
                        >
                            {message.toolInvocations ? (
                                // Display tool calls
                                <Box>
                                    {message.toolInvocations.map((toolInvocation, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                mb: 1,
                                                p: 1,
                                                bgcolor: 'info.light',
                                                borderRadius: 1,
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                                🔧 {toolInvocation.toolName}
                                            </Typography>
                                            {toolInvocation.state === 'result' && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    {toolInvocation.result.success ? '✓ Success' : '✗ Failed'}
                                                    {toolInvocation.result.error && `: ${toolInvocation.result.error}`}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <pre>{textContent}</pre>
                            )}
                            {/* Add feedback widget for assistant messages */}
                            {message.role === 'assistant' && textContent && (
                                <Box className="chat-feedback">
                                    <AIFeedbackWidget
                                        contentType="CHAT_MESSAGE"
                                        messageId={message.id}
                                        generatedContent={textContent}
                                        model="gpt-4" // Update this if you track the actual model used
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
                        </div>
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

export default ChatSidebar;
