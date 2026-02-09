/**
 * Unit tests for vectorStoreDB.jsx
 * Tests IndexedDB wrapper for vector embeddings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock idb library
const mockDB = {
  transaction: vi.fn(),
  objectStoreNames: { contains: vi.fn() },
};

const mockStore = {
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  getAllKeys: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
  createIndex: vi.fn(),
  index: vi.fn(),
};

const mockIndex = {
  getAll: vi.fn(),
  getAllKeys: vi.fn(),
};

const mockTx = {
  objectStore: vi.fn(() => mockStore),
  done: Promise.resolve(),
};

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve(mockDB)),
}));

vi.mock('aws-amplify/storage', () => ({
  downloadData: vi.fn(),
}));

vi.mock('pako', () => ({
  default: {
    inflate: vi.fn(),
  },
}));

import {
  saveEmbeddings,
  loadEmbeddingsByDocument,
  loadAllEmbeddings,
  deleteEmbeddings,
  clearAllEmbeddings,
  getStats,
  getEmbeddingsTimestamp,
  loadEmbeddingsFromS3,
} from '../vectorStoreDB.jsx';
import { openDB } from 'idb';
import { downloadData } from 'aws-amplify/storage';
import pako from 'pako';

describe('vectorStoreDB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockDB.transaction).mockReturnValue(mockTx);
    vi.mocked(mockStore.index).mockReturnValue(mockIndex);
  });
  
  describe('saveEmbeddings', () => {
    it('should save embeddings to IndexedDB', async () => {
      const documentId = 'doc-123';
      const embeddings = [
        { page: 1, embedding: [0.1, 0.2, 0.3], text: 'Page 1 content' },
        { page: 2, embedding: [0.4, 0.5, 0.6], text: 'Page 2 content' },
      ];
      const metadata = {
        fileId: 'file-456',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
      };
      
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue([]);
      vi.mocked(mockStore.put).mockResolvedValue(undefined);
      
      const count = await saveEmbeddings(documentId, embeddings, metadata);
      
      expect(count).toBe(2);
      expect(mockStore.put).toHaveBeenCalledTimes(2);
      expect(mockStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'doc-123-page-1',
          documentId: 'doc-123',
          page: 1,
          vector: [0.1, 0.2, 0.3],
          text: 'Page 1 content',
          metadata: expect.objectContaining({
            documentId: 'doc-123',
            page: 1,
            fileId: 'file-456',
          }),
          updatedAt: expect.any(String),
        })
      );
    });
    
    it('should delete existing embeddings before saving new ones', async () => {
      const documentId = 'doc-789';
      const embeddings = [
        { page: 1, embedding: [0.1, 0.2] },
      ];
      
      const existingKeys = ['doc-789-page-1', 'doc-789-page-2', 'doc-789-page-3'];
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue(existingKeys);
      vi.mocked(mockStore.delete).mockResolvedValue(undefined);
      vi.mocked(mockStore.put).mockResolvedValue(undefined);
      
      await saveEmbeddings(documentId, embeddings);
      
      // Should delete all existing embeddings first
      expect(mockStore.delete).toHaveBeenCalledTimes(3);
      expect(mockStore.delete).toHaveBeenCalledWith('doc-789-page-1');
      expect(mockStore.delete).toHaveBeenCalledWith('doc-789-page-2');
      expect(mockStore.delete).toHaveBeenCalledWith('doc-789-page-3');
    });
    
    it('should handle embeddings without text content', async () => {
      const documentId = 'doc-456';
      const embeddings = [
        { page: 1, embedding: [0.1, 0.2, 0.3] }, // No text field
      ];
      
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue([]);
      vi.mocked(mockStore.put).mockResolvedValue(undefined);
      
      await saveEmbeddings(documentId, embeddings);
      
      expect(mockStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '', // Should default to empty string
        })
      );
    });
  });
  
  describe('loadEmbeddingsByDocument', () => {
    it('should load embeddings for a specific document', async () => {
      const documentId = 'doc-123';
      const mockEmbeddings = [
        { id: 'doc-123-page-1', documentId: 'doc-123', page: 1, vector: [0.1, 0.2] },
        { id: 'doc-123-page-2', documentId: 'doc-123', page: 2, vector: [0.3, 0.4] },
      ];
      
      vi.mocked(mockIndex.getAll).mockResolvedValue(mockEmbeddings);
      
      const result = await loadEmbeddingsByDocument(documentId);
      
      expect(mockStore.index).toHaveBeenCalledWith('documentId');
      expect(mockIndex.getAll).toHaveBeenCalledWith(documentId);
      expect(result).toEqual(mockEmbeddings);
    });
    
    it('should return empty array if no embeddings found', async () => {
      vi.mocked(mockIndex.getAll).mockResolvedValue([]);
      
      const result = await loadEmbeddingsByDocument('nonexistent-doc');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('loadAllEmbeddings', () => {
    it('should load all embeddings from IndexedDB', async () => {
      const mockAllEmbeddings = [
        { id: 'doc-1-page-1', documentId: 'doc-1', vector: [0.1] },
        { id: 'doc-1-page-2', documentId: 'doc-1', vector: [0.2] },
        { id: 'doc-2-page-1', documentId: 'doc-2', vector: [0.3] },
      ];
      
      vi.mocked(mockStore.getAll).mockResolvedValue(mockAllEmbeddings);
      
      const result = await loadAllEmbeddings();
      
      expect(result).toEqual(mockAllEmbeddings);
      expect(result.length).toBe(3);
    });
  });
  
  describe('deleteEmbeddings', () => {
    it('should delete all embeddings for a document', async () => {
      const documentId = 'doc-to-delete';
      const existingKeys = ['doc-to-delete-page-1', 'doc-to-delete-page-2'];
      
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue(existingKeys);
      vi.mocked(mockStore.delete).mockResolvedValue(undefined);
      
      const count = await deleteEmbeddings(documentId);
      
      expect(count).toBe(2);
      expect(mockStore.delete).toHaveBeenCalledTimes(2);
      expect(mockStore.delete).toHaveBeenCalledWith('doc-to-delete-page-1');
      expect(mockStore.delete).toHaveBeenCalledWith('doc-to-delete-page-2');
    });
    
    it('should return 0 if no embeddings to delete', async () => {
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue([]);
      
      const count = await deleteEmbeddings('nonexistent');
      
      expect(count).toBe(0);
      expect(mockStore.delete).not.toHaveBeenCalled();
    });
  });
  
  describe('clearAllEmbeddings', () => {
    it('should clear all embeddings from IndexedDB', async () => {
      vi.mocked(mockStore.clear).mockResolvedValue(undefined);
      
      await clearAllEmbeddings();
      
      expect(mockStore.clear).toHaveBeenCalled();
    });
  });
  
  describe('getStats', () => {
    it('should return statistics about stored embeddings', async () => {
      const mockEmbeddings = [
        { id: '1', documentId: 'doc-1' },
        { id: '2', documentId: 'doc-1' },
        { id: '3', documentId: 'doc-1' },
        { id: '4', documentId: 'doc-2' },
        { id: '5', documentId: 'doc-2' },
      ];
      
      vi.mocked(mockStore.getAll).mockResolvedValue(mockEmbeddings);
      
      const stats = await getStats();
      
      expect(stats.totalEmbeddings).toBe(5);
      expect(stats.totalDocuments).toBe(2);
      expect(stats.avgEmbeddingsPerDoc).toBe(2.5);
    });
    
    it('should handle empty database', async () => {
      vi.mocked(mockStore.getAll).mockResolvedValue([]);
      
      const stats = await getStats();
      
      expect(stats.totalEmbeddings).toBe(0);
      expect(stats.totalDocuments).toBe(0);
      expect(stats.avgEmbeddingsPerDoc).toBe(0);
    });
  });
  
  describe('getEmbeddingsTimestamp', () => {
    it('should return timestamp of cached embeddings', async () => {
      const timestamp = '2026-01-21T12:00:00.000Z';
      const mockEmbeddings = [
        { id: '1', updatedAt: timestamp },
        { id: '2', updatedAt: timestamp },
      ];
      
      vi.mocked(mockIndex.getAll).mockResolvedValue(mockEmbeddings);
      
      const result = await getEmbeddingsTimestamp('doc-123');
      
      expect(result).toBe(timestamp);
    });
    
    it('should return null if no embeddings cached', async () => {
      vi.mocked(mockIndex.getAll).mockResolvedValue([]);
      
      const result = await getEmbeddingsTimestamp('doc-empty');
      
      expect(result).toBeNull();
    });
  });
  
  describe('loadEmbeddingsFromS3', () => {
    it('should load and parse uncompressed JSON from S3', async () => {
      const s3Key = 'public/files/test.embeddings.json';
      const documentId = 'doc-123';
      const embeddingsData = [
        { page: 1, embedding: [0.1, 0.2, 0.3] },
        { page: 2, embedding: [0.4, 0.5, 0.6] },
      ];
      
      const jsonString = JSON.stringify(embeddingsData);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      vi.mocked(downloadData).mockReturnValue({
        result: Promise.resolve({
          body: {
            blob: () => Promise.resolve(blob),
          },
        }),
      });
      
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue([]);
      vi.mocked(mockStore.put).mockResolvedValue(undefined);
      
      const count = await loadEmbeddingsFromS3(s3Key, documentId);
      
      expect(downloadData).toHaveBeenCalledWith({
        key: 'files/test.embeddings.json',
        options: {
          accessLevel: 'public',
        },
      });
      expect(count).toBe(2);
    });
    
    it('should handle Brotli-compressed data from S3', async () => {
      const s3Key = 'protected/us-east-1:abc123/files/compressed.embeddings.br';
      const documentId = 'doc-456';
      const embeddingsData = [
        { page: 1, embedding: [0.1, 0.2] },
      ];
      
      const jsonString = JSON.stringify(embeddingsData);
      const compressedData = new Uint8Array([1, 2, 3, 4]); // Mock compressed data
      const blob = new Blob([compressedData]);
      
      vi.mocked(downloadData).mockReturnValue({
        result: Promise.resolve({
          body: {
            blob: () => Promise.resolve(blob),
          },
        }),
      });
      
      vi.mocked(pako.inflate).mockReturnValue(jsonString);
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue([]);
      vi.mocked(mockStore.put).mockResolvedValue(undefined);
      
      const count = await loadEmbeddingsFromS3(s3Key, documentId);
      
      expect(downloadData).toHaveBeenCalledWith({
        key: 'files/compressed.embeddings.br',
        options: {
          accessLevel: 'protected',
          targetIdentityId: 'us-east-1:abc123',
        },
      });
      expect(pako.inflate).toHaveBeenCalledWith(compressedData, { to: 'string' });
      expect(count).toBe(1);
    });
    
    it('should parse protected S3 keys correctly', async () => {
      const s3Key = 'protected/us-east-1:identity123/files/doc.embeddings.json';
      const embeddingsData = [{ page: 1, embedding: [0.1] }];
      const blob = new Blob([JSON.stringify(embeddingsData)]);
      
      vi.mocked(downloadData).mockReturnValue({
        result: Promise.resolve({
          body: { blob: () => Promise.resolve(blob) },
        }),
      });
      
      vi.mocked(mockIndex.getAllKeys).mockResolvedValue([]);
      vi.mocked(mockStore.put).mockResolvedValue(undefined);
      
      await loadEmbeddingsFromS3(s3Key, 'doc-123');
      
      expect(downloadData).toHaveBeenCalledWith({
        key: 'files/doc.embeddings.json',
        options: {
          accessLevel: 'protected',
          targetIdentityId: 'us-east-1:identity123',
        },
      });
    });
    
    it('should throw error for invalid embeddings format', async () => {
      const s3Key = 'public/files/invalid.json';
      const invalidData = { not: 'an array' }; // Should be array
      const blob = new Blob([JSON.stringify(invalidData)]);
      
      vi.mocked(downloadData).mockReturnValue({
        result: Promise.resolve({
          body: { blob: () => Promise.resolve(blob) },
        }),
      });
      
      await expect(loadEmbeddingsFromS3(s3Key, 'doc-123')).rejects.toThrow(
        'Invalid embeddings format: expected array'
      );
    });
    
    it('should handle S3 download errors', async () => {
      const s3Key = 'public/files/missing.json';
      
      vi.mocked(downloadData).mockReturnValue({
        result: Promise.reject(new Error('File not found')),
      });
      
      await expect(loadEmbeddingsFromS3(s3Key, 'doc-123')).rejects.toThrow();
    });
  });
});
