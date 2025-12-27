// react component that renders the chat session with the user and the bot
import React, { useState, useEffect, useRef } from "react";
import {
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
import { useChat } from 'ai/react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadAndAnalyzePDF, cancelPDFAnalysis } from '../utils/fileUploadUtils';
import FilesContext from "../context/fileContext";
import VocabularyReview from "./VocabularyReview";

const ChatSidebar = () => {
    const [sections, setSections] = useState([]);
    const chatContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [pdfProcessingStatus, setPdfProcessingStatus] = useState({}); // { fileIndex: { status: 'uploading'|'uploaded'|'analyzing'|'analyzed'|'error', progress: 0-100, message: '', documentId: '' } }
    const [documentStatuses, setDocumentStatuses] = useState({}); // { documentId: { status: 'uploaded'|'extracting'|'analyzing'|'completed'|'failed' } }
    const fileInputRef = useRef(null);
    const [vocabularyReviewDialogOpen, setVocabularyReviewDialogOpen] = useState(false);
    const [reviewDocumentId, setReviewDocumentId] = useState(null);

    const {
        unit,
        files,
        questionBank,
        dictionary,
    } = React.useContext(UnitContext);
    
    const { session } = React.useContext(FilesContext);
    const { identityId } = session || {};

    // Use Vercel AI SDK's useChat hook
    const { messages, input, handleInputChange, handleSubmit, isLoading, reload, stop } = useChat({
        api: '/api/chat',
        body: {
            context: {
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
            },
        },
        onError: (error) => {
            console.error('Chat error:', error);
        },
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Fetch sections
    useEffect(() => {
        fetchSections();
        async function fetchSections() {
            const sectionData = await DataStore.query(Section);
            setSections(sectionData);
        }
        const subscription = DataStore.observe(Section).subscribe(() => fetchSections());

        return function cleanup() {
            subscription.unsubscribe();
        };
    }, []);
    
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
    
    // Update PDF processing status when document status changes
    useEffect(() => {
        setPdfProcessingStatus(prev => {
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
        setPdfProcessingStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[index];
            return newStatus;
        });
    };
    
    // Cancel PDF processing
    const cancelProcessing = async (index) => {
        const status = pdfProcessingStatus[index];
        if (!status || !status.documentId) {
            console.warn('[ChatSidebar] No document ID to cancel');
            return;
        }

        try {
            console.log('[ChatSidebar] Cancelling analysis for document:', status.documentId);
            
            setPdfProcessingStatus(prev => ({
                ...prev,
                [index]: { 
                    ...prev[index],
                    message: 'Cancelling...' 
                }
            }));

            await cancelPDFAnalysis(status.documentId);
            
            setPdfProcessingStatus(prev => ({
                ...prev,
                [index]: { 
                    ...prev[index],
                    status: 'cancelled',
                    message: 'Analysis cancelled' 
                }
            }));
        } catch (error) {
            console.error('[ChatSidebar] Error cancelling analysis:', error);
            setPdfProcessingStatus(prev => ({
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

    // Process PDFs when they're added
    const processPDF = async (file, index) => {
        if (file.type !== 'application/pdf') return;

        try {
            console.log('[ChatSidebar] Processing PDF:', file.name, { index });
            
            // Update status to uploading
            setPdfProcessingStatus(prev => ({
                ...prev,
                [index]: { status: 'uploading', progress: 0, message: 'Uploading PDF...' }
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
                    setPdfProcessingStatus(prev => ({
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
                setPdfProcessingStatus(prev => ({
                    ...prev,
                    [index]: { 
                        status: 'analyzing', 
                        progress: 100, 
                        message: 'PDF uploaded, analysis started...',
                        documentId: result.documentModel?.id,
                    }
                }));
            } else if (result.documentModel) {
                setPdfProcessingStatus(prev => ({
                    ...prev,
                    [index]: { 
                        status: 'uploaded', 
                        progress: 100, 
                        message: 'PDF uploaded successfully',
                        documentId: result.documentModel?.id,
                    }
                }));
            } else {
                setPdfProcessingStatus(prev => ({
                    ...prev,
                    [index]: { 
                        status: 'uploaded', 
                        progress: 100, 
                        message: 'PDF uploaded (no document created)' 
                    }
                }));
            }
        } catch (error) {
            console.error('[ChatSidebar] Error processing PDF:', error);
            setPdfProcessingStatus(prev => ({
                ...prev,
                [index]: { 
                    status: 'error', 
                    progress: 0, 
                    message: `Error: ${error.message}` 
                }
            }));
        }
    };

    // Detect PDFs and offer to process them
    useEffect(() => {
        uploadedFiles.forEach((file, index) => {
            if (file.type === 'application/pdf' && !pdfProcessingStatus[index]) {
                // Ask user if they want to process the PDF
                const shouldProcess = window.confirm(
                    `Would you like to upload and analyze "${file.name}"? This will extract text and generate vocabulary.`
                );
                
                if (shouldProcess) {
                    processPDF(file, index);
                } else {
                    // Mark as declined
                    setPdfProcessingStatus(prev => ({
                        ...prev,
                        [index]: { 
                            status: 'declined', 
                            progress: 0, 
                            message: 'Analysis declined' 
                        }
                    }));
                }
            }
        });
    }, [uploadedFiles]);

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
                }
                .chat-message pre {
                    margin: 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-family: inherit;
                    font-size: 0.9rem;
                    line-height: 1.5;
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
                        onClick={() => reload()}
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
                            <Typography variant="body2">
                                Ask me anything about your curriculum, files, or content!
                            </Typography>
                        </Box>
                    )}
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`chat-message ${message.role}`}
                        >
                            <pre>{message.content}</pre>
                        </div>
                    ))}
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
                    onSubmit={handleSubmit}
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
                                const isPDF = file.type === 'application/pdf';
                                const status = pdfProcessingStatus[index];
                                
                                return (
                                <Paper
                                    key={index}
                                    elevation={1}
                                    sx={{
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        bgcolor: isPDF ? (
                                            status?.status === 'error' ? 'error.light' :
                                            status?.status === 'analyzed' ? 'success.light' :
                                            status?.status === 'analyzing' || status?.status === 'extracting' ? 'warning.light' :
                                            status?.status === 'cancelled' ? 'grey.200' :
                                            'grey.100'
                                        ) : 'grey.100',
                                        border: isPDF ? '1px solid' : 'none',
                                        borderColor: isPDF ? (
                                            status?.status === 'error' ? 'error.main' :
                                            status?.status === 'analyzed' ? 'success.main' :
                                            status?.status === 'analyzing' || status?.status === 'extracting' ? 'warning.main' :
                                            status?.status === 'cancelled' ? 'grey.400' :
                                            'grey.300'
                                        ) : 'transparent',
                                    }}
                                >
                                    {isPDF && <PictureAsPdfIcon sx={{ fontSize: 18, color: 'error.main' }} />}
                                    {!isPDF && <AttachFileIcon sx={{ fontSize: 18 }} />}
                                    
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
                                    
                                    {/* Cancel button for processing PDFs */}
                                    {isPDF && status && ['uploading', 'analyzing', 'extracting'].includes(status.status) && (
                                        <IconButton
                                            size="small"
                                            onClick={() => cancelProcessing(index)}
                                            sx={{ p: 0.5 }}
                                            title="Cancel analysis"
                                        >
                                            <CancelIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                        </IconButton>
                                    )}
                                    
                                    {/* Review Vocabulary button for completed PDFs */}
                                    {isPDF && status && status.status === 'analyzed' && status.documentId && (
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
                                    handleSubmit(e);
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
                            disabled={isLoading || !input.trim()}
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
        </>
    );
}

export default ChatSidebar;
