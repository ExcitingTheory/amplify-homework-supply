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
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { getAmplifyClient } from '../../../utils/amplifyClient';
// Note: Type import commented out for .js file
// import type { Schema } from '../../../../amplify/data/resource';
import UnitContext from '../../../context/unitContext';
import FilesContext from '../../../context/fileContext';
import { useTranslation } from 'next-i18next';

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
    const { t } = useTranslation('editor');
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
            setError(t('documentUploader.errorMessages.noSupportedFiles'));
            return;
        }

        if (validFiles.length !== files.length) {
            setError(t('documentUploader.errorMessages.skippedFiles'));
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
            const amplifyClient = getAmplifyClient();
            const { data: documentModel } = await amplifyClient.models.Document.create({
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
            });

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
            setError(t('documentUploader.errorMessages.uploadFailed', { fileName: file.name, error: error.message }));
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const removeDoc = async (docId) => {
        try {
            const client = getAmplifyClient();
            const { data: doc } = await client.models.Document.get({ id: docId });
            if (doc) {
                await client.models.Document.delete({ id: docId });
                setUploadedDocs(prev => prev.filter(d => d.id !== docId));
            }
        } catch (error) {
            console.error('Error removing document:', error);
        }
    };

    return (
        <Box sx={{ p: 2, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                {t('documentUploader.title', { 
                    extractionType: extractionType === 'vocabulary' 
                        ? t('documentUploader.extractionTypes.vocabulary') 
                        : t('documentUploader.extractionTypes.question')
                })}
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
                    {t('documentUploader.dragDropPrompt')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('documentUploader.supportedFormats')}
                </Typography>
                <Button
                    variant="contained"
                    component="label"
                    disabled={uploading}
                >
                    {t('documentUploader.browseFiles')}
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
                        {t('documentUploader.uploadingProgress', { progress: uploadProgress })}
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
                        {t('documentUploader.recentUploads')}
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
                                                {doc.status === 'analyzing' && t('documentUploader.statusLabels.processing')}
                                                {doc.status === 'completed' && t('documentUploader.statusLabels.complete')}
                                                {doc.status === 'error' && t('documentUploader.statusLabels.failed')}
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
                    <strong>{t('documentUploader.howItWorks.title')}</strong>
                </Typography>
                <Typography variant="body2" component="div">
                    {t('documentUploader.howItWorks.step1')}<br />
                    {t('documentUploader.howItWorks.step2', { extractionType })}<br />
                    {t('documentUploader.howItWorks.step3')}<br />
                    {t('documentUploader.howItWorks.step4', { 
                        target: extractionType === 'vocabulary' 
                            ? t('documentUploader.extractionTypes.dictionary') 
                            : t('documentUploader.extractionTypes.questions')
                    })}
                </Typography>
            </Box>
        </Box>
    );
}
