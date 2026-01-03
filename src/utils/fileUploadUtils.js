/**
 * @fileoverview Shared utilities for file upload and PDF processing
 * Used by both FileManager and ChatSidebar
 */

import { DataStore } from 'aws-amplify/datastore';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { File as FileModel, Document } from '../models';
import { calculateWaveformData } from './calculateWaveformData';
import { isMimeType } from '@lexical/utils';
import { Hub } from 'aws-amplify/utils';
import {
    ACCEPTABLE_AUDIO_TYPES,
    ACCEPTABLE_FILE_TYPES,
    ACCEPTABLE_IMAGE_TYPES,
} from '../components/Editor3/plugins/DragDropPastePlugin';

const client = generateClient();

const analyzeDocumentMutation = /* GraphQL */ `
  mutation AnalyzeDocument($fileID: ID!) {
    analyzeDocument(fileID: $fileID) {
      success
      fileID
      documentID
      responseId
      pageCount
      message
    }
  }
`;

const cancelDocumentAnalysisMutation = /* GraphQL */ `
  mutation CancelDocumentAnalysis($fileID: ID!) {
    cancelDocumentAnalysis(fileID: $fileID) {
      success
      fileID
      documentID
      message
    }
  }
`;

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
        // Create document without unit relationship first
        const documentData = {
            filename: file.name,
            s3Key: newFilename,
            status: 'uploaded',
            identityId,
        };
        
        documentModel = await DataStore.save(new Document(documentData));
        console.log('Created Document record:', documentModel);
    }

    // Create File record, linking to Document if PDF
    if (documentModel) {
        fileData.documentID = documentModel.id;
    }
    const fileModel = await DataStore.save(new FileModel(fileData));
    console.log('Created File record:', fileModel);
        
    // If unitId provided, link document to unit using many-to-many relationship
    if (documentModel && unitId) {
        try {
            const { Unit, UnitDocument } = await import('../models');
            const unit = await DataStore.query(Unit, unitId);
            if (unit && unit.id) {
                // Create the join table entry to link Document and Unit
                await DataStore.save(new UnitDocument({
                    document: documentModel,
                    unit: unit
                }));
                console.log('Linked Document to Unit:', unit.id);
            } else {
                console.warn(`Unit ${unitId} not found in DataStore, Document created without unit association`);
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
export async function analyzePDF(fileId) {
    try {
        const result = await client.graphql({
            query: analyzeDocumentMutation,
            variables: { fileID: fileId }
        });

        // Check if the mutation returned null (Lambda error or conflict)
        if (!result.data.analyzeDocument) {
            // Check for specific error types in errors array
            if (result.errors && result.errors.length > 0) {
                const error = result.errors[0];
                
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
            throw new Error('Analysis request returned no data');
        }

        if (result.data.analyzeDocument.success) {
            console.log('Document analysis started:', result.data.analyzeDocument);
            return result.data.analyzeDocument;
        } else {
            throw new Error(result.data.analyzeDocument.message || 'Analysis failed');
        }
    } catch (error) {
        console.error('Error in analyzePDF:', error);
        
        // Re-throw if it's already a user-friendly error
        if (error.message?.includes('currently being processed') || 
            error.message?.includes('Server error') ||
            error.message?.includes('Document is')) {
            throw error;
        }
        
        // Handle GraphQL errors
        if (error.errors && error.errors.length > 0) {
            const graphQLError = error.errors[0];
            if (graphQLError.errorType === 'ConflictUnhandled' || graphQLError.message?.includes('Conflict resolver')) {
                throw new Error('Document is currently being processed. Please wait and try again.');
            }
            throw new Error(graphQLError.message || 'Failed to analyze PDF');
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
    const result = await client.graphql({
        query: cancelDocumentAnalysisMutation,
        variables: { fileID: fileId }
    });

    if (result.data.cancelDocumentAnalysis.success) {
        console.log('Document analysis cancelled:', result.data.cancelDocumentAnalysis);
        return result.data.cancelDocumentAnalysis;
    } else {
        throw new Error(result.data.cancelDocumentAnalysis.message || 'Cancellation failed');
    }
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
