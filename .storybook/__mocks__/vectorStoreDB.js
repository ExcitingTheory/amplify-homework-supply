/**
 * Mock Vector Store DB for Storybook
 * Provides mock implementations without IndexedDB dependency
 */

import { generateMockEmbedding } from './mockEmbeddingUtils.js';

console.log('[MOCK vectorStoreDB.js] Module loaded - mock IndexedDB operations');

// Mock IndexedDB store
const mockStore = new Map();

/**
 * Load embeddings for a specific document (mock)
 * @param {string} documentId - Document ID
 * @returns {Promise<Array>} Array of embedding items
 */
export async function loadEmbeddingsByDocument(documentId) {
  console.log(`[MOCK vectorStoreDB] Loading embeddings for document ${documentId}`);
  
  const embeddings = mockStore.get(documentId) || [];
  console.log(`[MOCK vectorStoreDB] Loaded ${embeddings.length} embeddings for document ${documentId}`);
  
  return embeddings;
}

/**
 * Load all embeddings (mock)
 * @returns {Promise<Array>} Array of all embedding items
 */
export async function loadAllEmbeddings() {
  console.log('[MOCK vectorStoreDB] Loading all embeddings');
  
  const allEmbeddings = [];
  for (const embeddings of mockStore.values()) {
    allEmbeddings.push(...embeddings);
  }
  
  console.log(`[MOCK vectorStoreDB] Loaded ${allEmbeddings.length} total embeddings`);
  return allEmbeddings;
}

/**
 * Save embeddings to mock store
 * @param {string} documentId - Document ID
 * @param {Array} embeddings - Array of {page, embedding, text} objects
 * @param {Object} metadata - File metadata
 */
export async function saveEmbeddings(documentId, embeddings, metadata) {
  console.log(`[MOCK vectorStoreDB] Saving ${embeddings.length} embeddings for document ${documentId}`);
  
  const formattedEmbeddings = embeddings.map((emb, idx) => ({
    id: `${documentId}-${idx}`,
    documentId,
    page: emb.page || idx + 1,
    text: emb.text || '',
    vector: emb.embedding || emb.vector,
    metadata: {
      ...metadata,
      page: emb.page || idx + 1
    }
  }));
  
  mockStore.set(documentId, formattedEmbeddings);
  console.log(`[MOCK vectorStoreDB] Saved successfully`);
}

/**
 * Delete embeddings for a document (mock)
 * @param {string} documentId - Document ID
 */
export async function deleteEmbeddings(documentId) {
  console.log(`[MOCK vectorStoreDB] Deleting embeddings for document ${documentId}`);
  mockStore.delete(documentId);
}

/**
 * Load embeddings from S3 (mock)
 * Returns mock data instead of actually fetching from S3
 * 
 * @param {string} s3Key - S3 key
 * @param {string} documentId - Document ID
 * @param {Object} metadata - File metadata
 * @returns {Promise<number>} Number of embeddings loaded
 */
export async function loadEmbeddingsFromS3(s3Key, documentId, metadata = {}) {
  console.log(`[MOCK vectorStoreDB] Mock loading embeddings from S3: ${s3Key}`);
  
  // Parse S3 key to extract info
  let accessLevel = 'public';
  let fileName = s3Key.split('/').pop().replace('.embeddings.json', '');
  
  if (s3Key.startsWith('protected/')) {
    accessLevel = 'protected';
  } else if (s3Key.startsWith('private/')) {
    accessLevel = 'private';
  }
  
  console.log(`[MOCK vectorStoreDB] Parsed - accessLevel: ${accessLevel}, fileName: ${fileName}`);
  
  // Generate mock embeddings based on filename
  const mockEmbeddings = [
    {
      page: 1,
      text: `Content from ${fileName} - page 1`,
      embedding: generateMockEmbedding(`${fileName} page 1 content`)
    },
    {
      page: 2,
      text: `Content from ${fileName} - page 2`,
      embedding: generateMockEmbedding(`${fileName} page 2 content`)
    },
    {
      page: 3,
      text: `Content from ${fileName} - page 3`,
      embedding: generateMockEmbedding(`${fileName} page 3 content`)
    }
  ];
  
  // Save to mock store
  await saveEmbeddings(documentId, mockEmbeddings, {
    ...metadata,
    fileName,
    accessLevel,
    s3Key
  });
  
  console.log(`[MOCK vectorStoreDB] Loaded ${mockEmbeddings.length} mock embeddings from S3`);
  return mockEmbeddings.length;
}

/**
 * Initialize mock DB (no-op for Storybook)
 */
export async function initDB() {
  console.log('[MOCK vectorStoreDB] Mock initDB - no IndexedDB needed');
  return Promise.resolve();
}

/**
 * Get database (mock)
 */
export async function getDB() {
  console.log('[MOCK vectorStoreDB] Mock getDB');
  return {
    transaction: () => ({
      objectStore: () => ({
        getAll: () => Promise.resolve([]),
        index: () => ({
          getAll: () => Promise.resolve([])
        })
      }),
      done: Promise.resolve()
    })
  };
}

// Mock other exports that might be needed
export const STORE_NAME = 'mock-embeddings';
export const DB_NAME = 'mock-courseVectorStore';
export const DB_VERSION = 1;
