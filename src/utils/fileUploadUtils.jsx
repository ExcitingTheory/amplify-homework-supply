/**
 * @fileoverview Shared utilities for file upload and PDF processing
 * Used by both FileManager and ChatSidebar
 */

import { uploadData } from 'aws-amplify/storage';
import { getAmplifyClient } from './amplifyClient';
// Type import removed - not needed in runtime JS
import { calculateWaveformData } from './calculateWaveformData';
import { isMimeType } from '@lexical/utils';
import { Hub } from 'aws-amplify/utils';
import {
    ACCEPTABLE_AUDIO_TYPES,
    ACCEPTABLE_FILE_TYPES,
    ACCEPTABLE_IMAGE_TYPES,
} from '../components/Editor3/plugins/DragDropPastePlugin';

// Gen 2: Custom mutations/queries are accessed via client.mutations/queries
// No need to define GraphQL strings - schema handles this

/**
 * Trigger embedding generation for a file
 * @param {string} fileID - File ID to generate embeddings for
 * @returns {Promise<Object>} Result object
 */
export async function generateEmbeddings(fileID) {
    try {
        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateEmbeddings({ fileID });

        if (errors || !data?.success) {
            throw new Error(data?.message || 'Embeddings generation failed');
        }
        
        console.log('Embeddings generation started:', data);
        return data;
    } catch (error) {
        console.error('Error in generateEmbeddings:', error);
        throw new Error(error.message || 'Failed to generate embeddings - unknown error');
    }
}

async function triggerEmbeddingGeneration(fileID) {
    try {
        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateEmbeddings({ fileID });
        
        if (errors || !data?.success) {
            console.warn('[Embedding] Failed to start:', data?.message);
        } else {
            console.log('[Embedding] Started background processing for file:', fileID);
        }
    } catch (error) {
        console.error('[Embedding] Error starting generation:', error);
        throw error;
    }
}   


/**
 * Internal helper: Generate embeddings for a file (non-blocking, handled by Lambda async re-invoke)
 * @param {string} fileID - The ID of the file to generate embeddings for
 * @returns {Promise<void>}
 */
async function triggerEmbeddingsGeneration(fileID) {
    try {
        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.generateEmbeddings({ fileID });
        
        if (errors || !data?.success) {
            console.warn('[Embeddings] Failed to start:', data?.message);
        } else {
            console.log('[Embeddings] Started background processing for file:', fileID);
        }
    } catch (error) {
        console.error('[Embeddings] Error starting generation:', error);
        throw error;
    }
}

/**
 * Upload a file to S3 and create database records
 * @param {File} file - The file to upload
 * @param {string} identityId - AWS Cognito identity ID
 * @param {string} unitId - Optional unit ID to associate with the file
 * @param {Function} onProgress - Optional progress callback (loaded, total) => void
 * @returns {Promise<{fileModel: FileModel, documentModel?: Document}>}
 */
export async function uploadFile(file, identityId, unitId = null, onProgress = null) {
    const accessLevel = 'protected';
    let newFilename;

    // Determine the folder based on file type
    if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
        newFilename = `images/${file.name}`;
    } else if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
        newFilename = `audio/${file.name}`;
    } else if (isMimeType(file, ACCEPTABLE_FILE_TYPES)) {
        newFilename = `files/${file.name}`;
    } else {
        throw new Error(`Unsupported file type: ${file.type}`);
    }

    console.log('Uploading file:', newFilename);

    // Upload to S3
    const uploadOperation = uploadData({
        key: newFilename,
        data: file,
        options: {
            contentType: file.type,
            contentLength: file.size,
            accessLevel,
            identityId,
            progressCallback(progress) {
                console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
                if (onProgress) {
                    onProgress(progress.loaded, progress.total);
                }
            }
        }
    });

    console.log('Upload result:', uploadOperation);
    
    // Wait for upload to complete before continuing
    await uploadOperation.result;
    console.log('Upload completed successfully');

    // Calculate waveform data for audio files
    let waveformData = null;
    if (isMimeType(file, ACCEPTABLE_AUDIO_TYPES)) {
        try {
            waveformData = await calculateWaveformData(file, 600);
            console.log('Calculated waveform data:', waveformData);
        } catch (error) {
            console.error('Error calculating waveform:', error);
        }
    }

    // Create File model entry
    const fileData = {
        path: newFilename,
        identityId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        level: 'PROTECTED',
    };

    if (waveformData) {
        fileData.waveformData = JSON.stringify(waveformData);
    }

    // If PDF, create Document record first (so we have an ID for the File)
    let documentModel = null;
    if (file.type === 'application/pdf') {
        const amplifyClient = getAmplifyClient();
        // Create document without unit relationship first
        const documentData = {
            filename: file.name,
            s3Key: newFilename,
            status: 'uploaded',
            identityId,
        };
        
        const { data: newDocument } = await amplifyClient.models.Document.create(documentData);
        documentModel = newDocument;
        console.log('Created Document record:', documentModel);
    }

    // Create File record, linking to Document if PDF
    const amplifyClient = getAmplifyClient();
    if (documentModel) {
        fileData.documentID = documentModel.id;
    }
    const { data: newFile } = await amplifyClient.models.File.create(fileData);
    const fileModel = newFile;
    console.log('Created File record:', fileModel);

    // Generate embedding for the uploaded file (async via Lambda re-invoke pattern)
    const embedding = await triggerEmbeddingGeneration(fileModel.id).catch(error => {
        // Silently fail - embeddings are not critical for upload success
        console.warn('Embedding generation failed to start:', error.message);
    });

    // add metadata to fileModel different for image/audio/pdf
        
    // If unitId provided, link document to unit using many-to-many relationship
    if (documentModel && unitId) {
        try {
            const amplifyClient = getAmplifyClient();
            const { data: unit } = await amplifyClient.models.Unit.get({ id: unitId });
            if (unit && unit.id) {
                // Create the join table entry to link Document and Unit
                await amplifyClient.models.UnitDocument.create({
                    documentID: documentModel.id,
                    unitID: unit.id
                });
                console.log('Linked Document to Unit:', unit.id);
            } else {
                console.warn(`Unit ${unitId} not found, Document created without unit association`);
            }
        } catch (error) {
            console.warn('Error linking Document to Unit:', error);
            // Don't throw - document was created successfully
        }
    }

    return { fileModel, documentModel };
}

/**
 * Wait for a Document to sync to the backend
 * @param {string} documentId - Document ID to wait for
 * @returns {Promise<void>}
 */
async function waitForDocumentSync(documentId) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            unsubscribe();
            reject(new Error(`Document sync timeout after 10 seconds for document: ${documentId}`));
        }, 10000);
        
        const unsubscribe = Hub.listen('datastore', ({ payload }) => {
            if (payload.event === 'outboxMutationProcessed' && 
                payload.data?.element?.model === 'Document' &&
                payload.data?.element?.id === documentId) {
                console.log('[FileUpload] Document synced to backend:', documentId);
                clearTimeout(timeout);
                unsubscribe();
                resolve();
            }
        });
    });
}

/**
 * Trigger PDF analysis via GraphQL mutation
 * @param {string} fileId - File ID to analyze
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzePDF(fileID) {
    try {
        const client = getAmplifyClient();
        const { data, errors } = await client.mutations.analyzeDocument({ fileID });

        // Check for errors
        if (errors && errors.length > 0) {
            const error = errors[0];
            
            // Handle conflict errors
            if (error.errorType === 'ConflictUnhandled' || error.message?.includes('Conflict resolver rejects')) {
                throw new Error('Document is currently being processed. Please wait a moment and try again.');
            }
            
            // Handle Lambda errors
            if (error.errorType === 'Lambda:Unhandled') {
                throw new Error('Server error while analyzing PDF. Please check the document and try again.');
            }
            
            throw new Error(error.message || 'Analysis request failed');
        }
        
        if (!data || !data.success) {
            throw new Error(data?.message || 'Analysis failed');
        }

        console.log('Document analysis started:', data);
        return data;
    } catch (error) {
        console.error('Error in analyzePDF:', error);
        
        // Re-throw if it's already a user-friendly error
        if (error.message?.includes('currently being processed') || 
            error.message?.includes('Server error') ||
            error.message?.includes('Document is')) {
            throw error;
        }
        
        throw new Error(error.message || 'Failed to analyze PDF - unknown error');
    }
}

/**
 * Cancel an in-progress PDF analysis
 * @param {string} fileId - File ID to cancel analysis for
 * @returns {Promise<Object>} Cancellation result
 */
export async function cancelPDFAnalysis(fileId) {
    const client = getAmplifyClient();
    const { data, errors } = await client.mutations.cancelDocumentAnalysis({ fileID: fileId });

    if (errors || !data?.success) {
        throw new Error(data?.message || 'Cancellation failed');
    }
    
    console.log('Document analysis cancelled:', data);
    return data;
}

/**
 * Upload a PDF and optionally trigger analysis
 * @param {File} file - PDF file to upload
 * @param {string} identityId - AWS Cognito identity ID
 * @param {string} unitId - Unit ID to associate with
 * @param {boolean} autoAnalyze - Whether to automatically analyze the PDF
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<{fileModel: FileModel, documentModel: Document, analysisResult?: Object}>}
 */
export async function uploadAndAnalyzePDF(file, identityId, unitId, autoAnalyze = true, onProgress = null) {
    if (file.type !== 'application/pdf') {
        throw new Error('File must be a PDF');
    }

    // Upload the file
    const { fileModel, documentModel } = await uploadFile(file, identityId, unitId, onProgress);

    // Auto-analyze if requested
    let analysisResult = null;
    if (autoAnalyze && documentModel) {
        try {
            analysisResult = await analyzePDF(fileModel.id);
        } catch (error) {
            console.error('Auto-analysis failed:', error);
            // Don't throw - file is uploaded successfully
        }
    }

    return { fileModel, documentModel, analysisResult };
}
