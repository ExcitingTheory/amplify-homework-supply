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
import {
    ACCEPTABLE_AUDIO_TYPES,
    ACCEPTABLE_FILE_TYPES,
    ACCEPTABLE_IMAGE_TYPES,
} from '../components/Editor3/plugins/DragDropPastePlugin';

const client = generateClient();

const analyzePDFMutation = /* GraphQL */ `
  mutation AnalyzePDF($documentID: ID!) {
    analyzePDF(documentID: $documentID) {
      success
      documentID
      responseId
      pageCount
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
    const result = await uploadData({
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

    console.log('Upload result:', result);

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

    const fileModel = await DataStore.save(new FileModel(fileData));
    console.log('Created File record:', fileModel);

    // If PDF, create Document record
    let documentModel = null;
    if (file.type === 'application/pdf') {
        documentModel = await DataStore.save(new Document({
            filename: file.name,
            s3Key: newFilename,
            status: 'uploaded',
            identityId,
            unitID: unitId,
        }));
        console.log('Created Document record:', documentModel);
    }

    return { fileModel, documentModel };
}

/**
 * Trigger PDF analysis via GraphQL mutation
 * @param {string} documentId - Document ID to analyze
 * @returns {Promise<Object>} Analysis result
 */
export async function analyzePDF(documentId) {
    const result = await client.graphql({
        query: analyzePDFMutation,
        variables: { documentID: documentId }
    });

    if (result.data.analyzePDF.success) {
        console.log('PDF analysis started:', result.data.analyzePDF);
        return result.data.analyzePDF;
    } else {
        throw new Error(result.data.analyzePDF.message || 'Analysis failed');
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
            analysisResult = await analyzePDF(documentModel.id);
        } catch (error) {
            console.error('Auto-analysis failed:', error);
            // Don't throw - file is uploaded successfully
        }
    }

    return { fileModel, documentModel, analysisResult };
}
