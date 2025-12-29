import React, { useState, useContext } from 'react';
import {
    Box,
    Button,
    Typography,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Alert,
    Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { DataStore } from 'aws-amplify/datastore';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { Document } from '../../../models';
import UnitContext from '../../../context/unitContext';
import FilesContext from '../../../context/fileContext';

const client = generateClient();

const SUPPORTED_DOCUMENT_TYPES = {
    'application/pdf': { ext: '.pdf', label: 'PDF' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', label: 'Word' },
    'application/msword': { ext: '.doc', label: 'Word' },
    'text/plain': { ext: '.txt', label: 'Text' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx', label: 'Excel' },
    'application/vnd.ms-excel': { ext: '.xls', label: 'Excel' },
    'text/csv': { ext: '.csv', label: 'CSV' },
};

const analyzeDocumentMutation = /* GraphQL */ `
  mutation AnalyzeDocument($documentID: ID!) {
    analyzeDocument(documentID: $documentID) {
      success
      documentID
      responseId
      pageCount
      message
    }
  }
`;

/**
 * Component for uploading and processing documents to extract vocabulary or questions
 */
export default function DocumentUploader({ extractionType = 'vocabulary', onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const { unit } = useContext(UnitContext);
    const {
        session: { identityId }
    } = useContext(FilesContext);

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
        await handleFiles(files);
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        await handleFiles(files);
    };

    const handleFiles = async (files) => {
        setError(null);
        
        // Filter for supported document types
        const validFiles = files.filter(file => 
            Object.keys(SUPPORTED_DOCUMENT_TYPES).includes(file.type)
        );

        if (validFiles.length === 0) {
            setError('No supported documents found. Please upload PDF, Word, Text, or Excel files.');
            return;
        }

        if (validFiles.length !== files.length) {
            setError('Some files were skipped (unsupported type)');
        }

        for (const file of validFiles) {
            await uploadDocument(file);
        }
    };

    const uploadDocument = async (file) => {
        setUploading(true);
        setUploadProgress(0);

        try {
            const filename = `documents/${Date.now()}_${file.name}`;

            // Upload to S3
            const result = await uploadData({
                key: filename,
                data: file,
                options: {
                    contentType: file.type,
                    accessLevel: 'protected',
                    identityId,
                    progressCallback(progress) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        setUploadProgress(percent);
                    }
                }
            });

            // Create Document record
            const documentModel = await DataStore.save(new Document({
                filename: file.name,
                s3Key: filename,
                status: 'uploaded',
                identityId,
                unitID: unit?.id,
                fileSize: file.size,
                mimeType: file.type,
                uploadedAt: new Date().toISOString(),
                metadata: JSON.stringify({
                    extractionType,
                    originalName: file.name,
                })
            }));

            // Trigger analysis
            try {
                await client.graphql({
                    query: analyzeDocumentMutation,
                    variables: { documentID: documentModel.id }
                });

                setUploadedDocs(prev => [...prev, {
                    id: documentModel.id,
                    name: file.name,
                    status: 'analyzing',
                    type: SUPPORTED_DOCUMENT_TYPES[file.type]?.label || 'Document'
                }]);

                if (onUploadComplete) {
                    onUploadComplete(documentModel);
                }
            } catch (analysisError) {
                console.error('Analysis failed:', analysisError);
                setUploadedDocs(prev => [...prev, {
                    id: documentModel.id,
                    name: file.name,
                    status: 'error',
                    type: SUPPORTED_DOCUMENT_TYPES[file.type]?.label || 'Document'
                }]);
            }

        } catch (error) {
            console.error('Upload error:', error);
            setError(`Failed to upload ${file.name}: ${error.message}`);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const removeDoc = async (docId) => {
        try {
            const doc = await DataStore.query(Document, docId);
            if (doc) {
                await DataStore.delete(doc);
                setUploadedDocs(prev => prev.filter(d => d.id !== docId));
            }
        } catch (error) {
            console.error('Error removing document:', error);
        }
    };

    return (
        <Box sx={{ p: 2, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Upload Documents for {extractionType === 'vocabulary' ? 'Vocabulary' : 'Question'} Extraction
            </Typography>

            {/* Drop Zone */}
            <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: isDragging ? 'action.hover' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    mb: 2,
                }}
            >
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                    Drag and drop documents here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Supported: PDF, Word (.doc, .docx), Text (.txt), Excel (.xls, .xlsx, .csv)
                </Typography>
                <Button
                    variant="contained"
                    component="label"
                    disabled={uploading}
                >
                    Browse Files
                    <input
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
                        onChange={handleFileSelect}
                    />
                </Button>
            </Box>

            {/* Upload Progress */}
            {uploading && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Uploading... {uploadProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
            )}

            {/* Error Message */}
            {error && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Uploaded Documents List */}
            {uploadedDocs.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Recent Uploads
                    </Typography>
                    <List dense>
                        {uploadedDocs.map((doc) => (
                            <ListItem
                                key={doc.id}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                }}
                            >
                                {doc.status === 'analyzing' && <HourglassEmptyIcon sx={{ mr: 1, color: 'info.main' }} />}
                                {doc.status === 'completed' && <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />}
                                {doc.status === 'error' && <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />}
                                
                                <ListItemText
                                    primary={doc.name}
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                            <Chip label={doc.type} size="small" sx={{ mr: 1 }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {doc.status === 'analyzing' && 'Processing...'}
                                                {doc.status === 'completed' && 'Complete'}
                                                {doc.status === 'error' && 'Failed'}
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{
                                        '& .MuiListItemText-primary': {
                                            fontSize: '0.875rem',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                        }
                                    }}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => removeDoc(doc.id)}
                                        size="small"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {/* Instructions */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>How it works:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                    1. Upload your documents (PDF, Word, Text, or Excel files)<br />
                    2. AI will analyze the content and extract {extractionType}<br />
                    3. Review and approve suggestions in the "Suggestions" tab<br />
                    4. Import selected items to your {extractionType === 'vocabulary' ? 'dictionary' : 'questions'}
                </Typography>
            </Box>
        </Box>
    );
}
