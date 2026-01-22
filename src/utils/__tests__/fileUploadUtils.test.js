/**
 * Unit tests for fileUploadUtils.js
 * Tests S3 uploads, PDF analysis, and embedding generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies
vi.mock('aws-amplify/datastore', () => ({
  DataStore: {
    save: vi.fn(),
    query: vi.fn(),
  },
}));

vi.mock('aws-amplify/storage', () => ({
  uploadData: vi.fn(),
}));

vi.mock('aws-amplify/api', () => ({
  generateClient: vi.fn(),
}));

vi.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: vi.fn(),
  },
}));

vi.mock('../calculateWaveformData', () => ({
  calculateWaveformData: vi.fn(),
}));

vi.mock('@lexical/utils', () => ({
  isMimeType: vi.fn(),
}));

// Mock models
const mockFileModel = vi.fn();
const mockDocument = vi.fn();
const mockUnit = vi.fn();
const mockUnitDocument = vi.fn();

vi.mock('../../models', () => ({
  File: class File {
    constructor(data) {
      return mockFileModel(data);
    }
  },
  Document: class Document {
    constructor(data) {
      return mockDocument(data);
    }
  },
  Unit: class Unit {},
  UnitDocument: class UnitDocument {
    constructor(data) {
      return mockUnitDocument(data);
    }
  },
}));

import {
  uploadFile,
  analyzePDF,
  cancelPDFAnalysis,
  uploadAndAnalyzePDF,
  generateEmbeddings,
} from '../fileUploadUtils.js';
import { DataStore } from 'aws-amplify/datastore';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { calculateWaveformData } from '../calculateWaveformData';
import { isMimeType } from '@lexical/utils';
import { Hub } from 'aws-amplify/utils';

describe('fileUploadUtils', () => {
  let mockGraphql;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockGraphql = vi.fn();
    vi.mocked(generateClient).mockReturnValue({
      graphql: mockGraphql,
    });
  });
  
  describe('uploadFile', () => {
    it('should upload image file to S3 and create File record', async () => {
      const mockFile = new Blob(['image data'], { type: 'image/png' });
      mockFile.name = 'test-image.png';
      mockFile.size = 1024;
      
      const identityId = 'us-east-1:user123';
      const uploadResult = { path: 'images/test-image.png' };
      
      vi.mocked(isMimeType).mockReturnValue(true);
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve(uploadResult),
      });
      
      const fileModelData = { id: 'file-123', path: 'images/test-image.png' };
      vi.mocked(DataStore.save).mockResolvedValue(fileModelData);
      mockFileModel.mockReturnValue(fileModelData);
      
      const result = await uploadFile(mockFile, identityId);
      
      // Verify S3 upload
      expect(uploadData).toHaveBeenCalledWith({
        key: 'images/test-image.png',
        data: mockFile,
        options: {
          contentType: 'image/png',
          contentLength: 1024,
          accessLevel: 'protected',
          identityId,
          progressCallback: expect.any(Function),
        },
      });
      
      // Verify File model creation
      expect(DataStore.save).toHaveBeenCalled();
      expect(mockFileModel).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'images/test-image.png',
          identityId,
          name: 'test-image.png',
          size: 1024,
          mimeType: 'image/png',
          level: 'PROTECTED',
        })
      );
      
      expect(result.fileModel).toEqual(fileModelData);
    });
    
    it('should upload audio file with waveform data', async () => {
      const mockAudioFile = new Blob(['audio data'], { type: 'audio/mpeg' });
      mockAudioFile.name = 'recording.mp3';
      mockAudioFile.size = 5000;
      
      const identityId = 'us-east-1:user456';
      const waveformData = [0.1, 0.5, 0.8, 0.3];
      
      // Mock isMimeType to return false for images, true for audio
      vi.mocked(isMimeType).mockImplementation((file, types) => {
        return types.includes('audio/mpeg');
      });
      
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'audio/recording.mp3' }),
      });
      
      vi.mocked(calculateWaveformData).mockResolvedValue(waveformData);
      
      const fileModelData = { id: 'file-audio', path: 'audio/recording.mp3' };
      mockFileModel.mockReturnValue(fileModelData);
      vi.mocked(DataStore.save).mockResolvedValue(fileModelData);
      
      await uploadFile(mockAudioFile, identityId);
      
      // Verify waveform calculation
      expect(calculateWaveformData).toHaveBeenCalledWith(mockAudioFile, 600);
      
      // Verify File model includes waveform
      expect(mockFileModel).toHaveBeenCalledWith(
        expect.objectContaining({
          waveformData: JSON.stringify(waveformData),
        })
      );
    });
    
    it('should create Document record for PDF files', async () => {
      const mockPDF = new Blob(['pdf data'], { type: 'application/pdf' });
      mockPDF.name = 'document.pdf';
      mockPDF.size = 10000;
      
      const identityId = 'us-east-1:user789';
      
      vi.mocked(isMimeType).mockReturnValue(false);
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'files/document.pdf' }),
      });
      
      const documentData = { id: 'doc-123', filename: 'document.pdf' };
      const fileData = { id: 'file-pdf', documentID: 'doc-123' };
      
      mockDocument.mockReturnValue(documentData);
      mockFileModel.mockReturnValue(fileData);
      
      vi.mocked(DataStore.save)
        .mockResolvedValueOnce(documentData)  // First save: Document
        .mockResolvedValueOnce(fileData);     // Second save: File
      
      const result = await uploadFile(mockPDF, identityId);
      
      // Verify Document creation
      expect(mockDocument).toHaveBeenCalledWith({
        filename: 'document.pdf',
        s3Key: 'files/document.pdf',
        status: 'uploaded',
        identityId,
      });
      
      // Verify File links to Document
      expect(mockFileModel).toHaveBeenCalledWith(
        expect.objectContaining({
          documentID: 'doc-123',
        })
      );
      
      expect(result.documentModel).toEqual(documentData);
    });
    
    it('should handle upload progress callbacks', async () => {
      const mockFile = new Blob(['data'], { type: 'image/png' });
      mockFile.name = 'test.png';
      mockFile.size = 1000;
      
      const identityId = 'us-east-1:user';
      const onProgress = vi.fn();
      
      let progressCallback;
      vi.mocked(isMimeType).mockReturnValue(true);
      vi.mocked(uploadData).mockImplementation(({ options }) => {
        progressCallback = options.progressCallback;
        return { result: Promise.resolve({ path: 'images/test.png' }) };
      });
      
      mockFileModel.mockReturnValue({ id: 'file-1' });
      vi.mocked(DataStore.save).mockResolvedValue({ id: 'file-1' });
      
      await uploadFile(mockFile, identityId, null, onProgress);
      
      // Simulate progress
      progressCallback({ loaded: 500, total: 1000 });
      progressCallback({ loaded: 1000, total: 1000 });
      
      expect(onProgress).toHaveBeenCalledWith(500, 1000);
      expect(onProgress).toHaveBeenCalledWith(1000, 1000);
    });
    
    it('should link document to unit when unitId provided', async () => {
      const mockPDF = new Blob(['pdf'], { type: 'application/pdf' });
      mockPDF.name = 'lesson.pdf';
      mockPDF.size = 5000;
      
      const identityId = 'us-east-1:user';
      const unitId = 'unit-123';
      
      vi.mocked(isMimeType).mockReturnValue(false);
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'files/lesson.pdf' }),
      });
      
      const documentData = { id: 'doc-456' };
      const fileData = { id: 'file-456' };
      const unitData = { id: unitId };
      const unitDocData = { id: 'unitdoc-1' };
      
      mockDocument.mockReturnValue(documentData);
      mockFileModel.mockReturnValue(fileData);
      mockUnitDocument.mockReturnValue(unitDocData);
      
      vi.mocked(DataStore.save)
        .mockResolvedValueOnce(documentData)
        .mockResolvedValueOnce(fileData)
        .mockResolvedValueOnce(unitDocData);
      
      vi.mocked(DataStore.query).mockResolvedValue(unitData);
      
      await uploadFile(mockPDF, identityId, unitId);
      
      // Verify unit query
      expect(DataStore.query).toHaveBeenCalled();
      
      // Verify UnitDocument join created
      expect(mockUnitDocument).toHaveBeenCalledWith({
        document: documentData,
        unit: unitData,
      });
    });
    
    it('should handle unsupported file types', async () => {
      const mockFile = new Blob(['data'], { type: 'application/unknown' });
      mockFile.name = 'unknown.xyz';
      
      vi.mocked(isMimeType).mockReturnValue(false);
      
      await expect(uploadFile(mockFile, 'identity')).rejects.toThrow(
        'Unsupported file type: application/unknown'
      );
    });
    
    it('should handle waveform calculation errors gracefully', async () => {
      const mockAudio = new Blob(['audio'], { type: 'audio/mpeg' });
      mockAudio.name = 'broken.mp3';
      mockAudio.size = 1000;
      
      vi.mocked(isMimeType).mockReturnValue(true);
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'audio/broken.mp3' }),
      });
      
      vi.mocked(calculateWaveformData).mockRejectedValue(
        new Error('Invalid audio format')
      );
      
      mockFileModel.mockReturnValue({ id: 'file-1' });
      vi.mocked(DataStore.save).mockResolvedValue({ id: 'file-1' });
      
      // Should not throw - waveform is optional
      const result = await uploadFile(mockAudio, 'identity');
      
      expect(result.fileModel).toBeDefined();
      
      // File should be created without waveform data
      expect(mockFileModel).toHaveBeenCalledWith(
        expect.not.objectContaining({
          waveformData: expect.anything(),
        })
      );
    });
  });
  
  describe('analyzePDF', () => {
    it('should trigger PDF analysis via GraphQL mutation', async () => {
      const fileID = 'file-123';
      
      mockGraphql.mockResolvedValue({
        data: {
          analyzeDocument: {
            success: true,
            fileID,
            documentID: 'doc-456',
            responseId: 'response-789',
            pageCount: 5,
            message: 'Analysis started',
          },
        },
      });
      
      const result = await analyzePDF(fileID);
      
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation AnalyzeDocument'),
        variables: { fileID },
      });
      
      expect(result.success).toBe(true);
      expect(result.documentID).toBe('doc-456');
      expect(result.pageCount).toBe(5);
    });
    
    it('should handle conflict errors with user-friendly message', async () => {
      const fileID = 'file-busy';
      
      mockGraphql.mockResolvedValue({
        data: { analyzeDocument: null },
        errors: [{
          errorType: 'ConflictUnhandled',
          message: 'Conflict resolver rejects mutation',
        }],
      });
      
      await expect(analyzePDF(fileID)).rejects.toThrow(
        'Document is currently being processed'
      );
    });
    
    it('should handle Lambda errors', async () => {
      const fileID = 'file-error';
      
      mockGraphql.mockResolvedValue({
        data: { analyzeDocument: null },
        errors: [{
          errorType: 'Lambda:Unhandled',
          message: 'Internal error',
        }],
      });
      
      await expect(analyzePDF(fileID)).rejects.toThrow(
        'Server error while analyzing PDF'
      );
    });
    
    it('should handle analysis failure from mutation', async () => {
      const fileID = 'file-fail';
      
      mockGraphql.mockResolvedValue({
        data: {
          analyzeDocument: {
            success: false,
            message: 'Invalid PDF format',
          },
        },
      });
      
      await expect(analyzePDF(fileID)).rejects.toThrow('Invalid PDF format');
    });
  });
  
  describe('cancelPDFAnalysis', () => {
    it('should cancel in-progress analysis', async () => {
      const fileId = 'file-cancel';
      
      mockGraphql.mockResolvedValue({
        data: {
          cancelDocumentAnalysis: {
            success: true,
            fileID: fileId,
            documentID: 'doc-123',
            message: 'Analysis cancelled',
          },
        },
      });
      
      const result = await cancelPDFAnalysis(fileId);
      
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation CancelDocumentAnalysis'),
        variables: { fileID: fileId },
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Analysis cancelled');
    });
    
    it('should handle cancellation failure', async () => {
      const fileId = 'file-fail';
      
      mockGraphql.mockResolvedValue({
        data: {
          cancelDocumentAnalysis: {
            success: false,
            message: 'Analysis already completed',
          },
        },
      });
      
      await expect(cancelPDFAnalysis(fileId)).rejects.toThrow(
        'Analysis already completed'
      );
    });
  });
  
  describe('uploadAndAnalyzePDF', () => {
    it('should upload PDF and trigger analysis', async () => {
      const mockPDF = new Blob(['pdf'], { type: 'application/pdf' });
      mockPDF.name = 'test.pdf';
      mockPDF.size = 10000;
      
      const identityId = 'us-east-1:user';
      const unitId = 'unit-123';
      
      vi.mocked(isMimeType).mockReturnValue(false);
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'files/test.pdf' }),
      });
      
      const documentData = { id: 'doc-789' };
      const fileData = { id: 'file-789', documentID: 'doc-789' };
      
      mockDocument.mockReturnValue(documentData);
      mockFileModel.mockReturnValue(fileData);
      
      vi.mocked(DataStore.save)
        .mockResolvedValueOnce(documentData)
        .mockResolvedValueOnce(fileData);
      
      vi.mocked(DataStore.query).mockResolvedValue({ id: unitId });
      
      mockGraphql.mockResolvedValue({
        data: {
          analyzeDocument: {
            success: true,
            fileID: 'file-789',
            documentID: 'doc-789',
          },
        },
      });
      
      const result = await uploadAndAnalyzePDF(
        mockPDF,
        identityId,
        unitId,
        true
      );
      
      expect(result.fileModel).toEqual(fileData);
      expect(result.documentModel).toEqual(documentData);
      expect(result.analysisResult.success).toBe(true);
    });
    
    it('should skip analysis when autoAnalyze is false', async () => {
      const mockPDF = new Blob(['pdf'], { type: 'application/pdf' });
      mockPDF.name = 'test.pdf';
      mockPDF.size = 5000;
      
      vi.mocked(isMimeType).mockReturnValue(false);
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'files/test.pdf' }),
      });
      
      const documentData = { id: 'doc-123' };
      const fileData = { id: 'file-123' };
      
      mockDocument.mockReturnValue(documentData);
      mockFileModel.mockReturnValue(fileData);
      
      vi.mocked(DataStore.save)
        .mockResolvedValueOnce(documentData)
        .mockResolvedValueOnce(fileData);
      
      const result = await uploadAndAnalyzePDF(
        mockPDF,
        'identity',
        'unit-1',
        false  // Don't auto-analyze
      );
      
      expect(result.analysisResult).toBeNull();
      expect(mockGraphql).not.toHaveBeenCalled();
    });
    
    it('should throw error for non-PDF files', async () => {
      const mockImage = new Blob(['image'], { type: 'image/png' });
      mockImage.name = 'not-pdf.png';
      
      await expect(
        uploadAndAnalyzePDF(mockImage, 'identity', 'unit-1')
      ).rejects.toThrow('File must be a PDF');
    });
    
    it('should not fail upload if auto-analysis fails', async () => {
      const mockPDF = new Blob(['pdf'], { type: 'application/pdf' });
      mockPDF.name = 'test.pdf';
      mockPDF.size = 1000;
      
      vi.mocked(isMimeType).mockReturnValue(false);
      vi.mocked(uploadData).mockReturnValue({
        result: Promise.resolve({ path: 'files/test.pdf' }),
      });
      
      const documentData = { id: 'doc-1' };
      const fileData = { id: 'file-1' };
      
      mockDocument.mockReturnValue(documentData);
      mockFileModel.mockReturnValue(fileData);
      
      vi.mocked(DataStore.save)
        .mockResolvedValueOnce(documentData)
        .mockResolvedValueOnce(fileData);
      
      // Analysis fails
      mockGraphql.mockRejectedValue(new Error('Analysis error'));
      
      const result = await uploadAndAnalyzePDF(mockPDF, 'identity', null, true);
      
      // Upload should succeed despite analysis failure
      expect(result.fileModel).toEqual(fileData);
      expect(result.documentModel).toEqual(documentData);
      expect(result.analysisResult).toBeNull();
    });
  });
  
  describe('generateEmbeddings', () => {
    it('should trigger embedding generation for a file', async () => {
      const fileID = 'file-embed-123';
      
      mockGraphql.mockResolvedValue({
        data: {
          generateEmbeddings: {
            success: true,
            fileID,
            documentID: 'doc-456',
            embeddingCount: 10,
            message: 'Embeddings generated',
          },
        },
      });
      
      const result = await generateEmbeddings(fileID);
      
      expect(mockGraphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation GenerateEmbeddings'),
        variables: { fileID },
      });
      
      expect(result.success).toBe(true);
      expect(result.embeddingCount).toBe(10);
    });
    
    it('should handle generation failure', async () => {
      const fileID = 'file-fail';
      
      mockGraphql.mockResolvedValue({
        data: {
          generateEmbeddings: {
            success: false,
            message: 'Document not found',
          },
        },
      });
      
      await expect(generateEmbeddings(fileID)).rejects.toThrow(
        'Document not found'
      );
    });
    
    it('should handle GraphQL errors', async () => {
      const fileID = 'file-error';
      
      mockGraphql.mockRejectedValue({
        errors: [{
          message: 'Network error',
        }],
      });
      
      await expect(generateEmbeddings(fileID)).rejects.toThrow('Network error');
    });
  });
});
