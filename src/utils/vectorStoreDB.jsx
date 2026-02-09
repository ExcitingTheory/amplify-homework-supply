/**
 * IndexedDB wrapper for vector embeddings storage
 * Provides persistent caching of document embeddings for semantic search
 */

import { openDB } from 'idb';
import { downloadData } from 'aws-amplify/storage';
import pako from 'pako';

const DB_NAME = 'VectorStoreDB';
const DB_VERSION = 1;
const STORE_NAME = 'embeddings';

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object store for embeddings if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Index by documentId for faster queries
        store.createIndex('documentId', 'metadata.documentId', { unique: false });
        store.createIndex('fileId', 'metadata.fileId', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    },
  });
}

/**
 * Save embeddings for a document to IndexedDB
 * @param {string} documentId - Document ID
 * @param {Array} embeddings - Array of {page, embedding} objects
 * @param {Object} metadata - Additional metadata (fileId, fileName, mimeType)
 * @returns {Promise<number>} Number of embeddings saved
 */
export async function saveEmbeddings(documentId, embeddings, metadata = {}) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  // First, delete existing embeddings for this document
  const index = store.index('documentId');
  const existingKeys = await index.getAllKeys(documentId);
  
  for (const key of existingKeys) {
    await store.delete(key);
  }
  
  // Save new embeddings
  const timestamp = new Date().toISOString();
  let count = 0;
  
  for (const emb of embeddings) {
    const id = `${documentId}-page-${emb.page}`;
    await store.put({
      id,
      documentId,
      page: emb.page,
      vector: emb.embedding,
      text: emb.text || '', // Optional text content
      metadata: {
        ...metadata,
        documentId,
        page: emb.page,
      },
      updatedAt: timestamp,
    });
    count++;
  }
  
  await tx.done;
  console.log(`[VectorStoreDB] Saved ${count} embeddings for document ${documentId}`);
  return count;
}

/**
 * Load embeddings for a specific document from IndexedDB
 * @param {string} documentId - Document ID
 * @returns {Promise<Array>} Array of embedding items
 */
export async function loadEmbeddingsByDocument(documentId) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('documentId');
  
  const embeddings = await index.getAll(documentId);
  await tx.done;
  
  console.log(`[VectorStoreDB] Loaded ${embeddings.length} embeddings for document ${documentId}`);
  return embeddings;
}

/**
 * Load all embeddings from IndexedDB
 * @returns {Promise<Array>} Array of all embedding items
 */
export async function loadAllEmbeddings() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const embeddings = await store.getAll();
  await tx.done;
  
  console.log(`[VectorStoreDB] Loaded ${embeddings.length} total embeddings from IndexedDB`);
  return embeddings;
}

/**
 * Delete embeddings for a specific document
 * @param {string} documentId - Document ID
 * @returns {Promise<number>} Number of embeddings deleted
 */
export async function deleteEmbeddings(documentId) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('documentId');
  
  const keys = await index.getAllKeys(documentId);
  
  for (const key of keys) {
    await store.delete(key);
  }
  
  await tx.done;
  console.log(`[VectorStoreDB] Deleted ${keys.length} embeddings for document ${documentId}`);
  return keys.length;
}

/**
 * Clear all embeddings from IndexedDB
 * @returns {Promise<void>}
 */
export async function clearAllEmbeddings() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  await store.clear();
  await tx.done;
  
  console.log('[VectorStoreDB] Cleared all embeddings');
}

/**
 * Get statistics about stored embeddings
 * @returns {Promise<Object>} Statistics object
 */
export async function getStats() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  
  const allEmbeddings = await store.getAll();
  const documentIds = new Set(allEmbeddings.map(e => e.documentId));
  
  await tx.done;
  
  return {
    totalEmbeddings: allEmbeddings.length,
    totalDocuments: documentIds.size,
    avgEmbeddingsPerDoc: allEmbeddings.length / documentIds.size || 0,
  };
}

/**
 * Check if embeddings exist for a document and return their timestamp
 * @param {string} documentId - Document ID
 * @returns {Promise<string|null>} Timestamp of embeddings or null if not cached
 */
export async function getEmbeddingsTimestamp(documentId) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('documentId');
  
  const embeddings = await index.getAll(documentId);
  await tx.done;
  
  if (embeddings.length === 0) return null;
  
  // Return the most recent timestamp
  return embeddings[0].updatedAt;
}

/**
 * Load embeddings from S3 and save to IndexedDB
 * Handles both regular JSON and Brotli-compressed formats
 * @param {string} s3Key - S3 key for embeddings file
 * @param {string} documentId - Document ID
 * @param {Object} metadata - File metadata
 * @returns {Promise<number>} Number of embeddings loaded
 */
export async function loadEmbeddingsFromS3(s3Key, documentId, metadata = {}) {
  try {
    console.log(`[VectorStoreDB] Loading embeddings from S3: ${s3Key}`);
    
    // Parse S3 key to extract access level and actual key
    // Format: "protected/us-east-1:identity-id/files/filename.embeddings.json"
    // or "public/files/filename.embeddings.json"
    let accessLevel = 'public';
    let key = s3Key;
    let targetIdentityId;
    
    if (s3Key.startsWith('protected/')) {
      accessLevel = 'protected';
      // Extract identity ID and key: "protected/us-east-1:xxxx/files/..."
      const parts = s3Key.substring('protected/'.length).split('/');
      targetIdentityId = parts[0]; // "us-east-1:xxxx"
      key = parts.slice(1).join('/'); // "files/filename.embeddings.json"
    } else if (s3Key.startsWith('private/')) {
      accessLevel = 'private';
      const parts = s3Key.substring('private/'.length).split('/');
      targetIdentityId = parts[0];
      key = parts.slice(1).join('/');
    } else if (s3Key.startsWith('public/')) {
      accessLevel = 'public';
      key = s3Key.substring('public/'.length); // Remove "public/" prefix
    }
    
    console.log(`[VectorStoreDB] Parsed S3 key: accessLevel=${accessLevel}, key=${key}, targetIdentityId=${targetIdentityId}`);
    
    // Download from S3
    const downloadOptions = { 
      key,
      options: { 
        accessLevel 
      } 
    };
    
    // Add targetIdentityId for protected/private files
    if (targetIdentityId) {
      downloadOptions.options.targetIdentityId = targetIdentityId;
    }
    
    const downloadResult = await downloadData(downloadOptions).result;
    
    // Get the blob and convert to ArrayBuffer
    const blob = await downloadResult.body.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    let embeddingsData;
    
    // Try to detect if it's Brotli compressed by attempting decompression
    // Brotli files typically start with specific magic bytes
    try {
      // Attempt Brotli decompression
      const decompressed = pako.inflate(buffer, { to: 'string' });
      embeddingsData = JSON.parse(decompressed);
      console.log('[VectorStoreDB] Successfully decompressed Brotli data');
    } catch (decompressError) {
      // Not compressed or not Brotli, try parsing as JSON directly
      const textDecoder = new TextDecoder('utf-8');
      const jsonString = textDecoder.decode(buffer);
      embeddingsData = JSON.parse(jsonString);
      console.log('[VectorStoreDB] Loaded uncompressed JSON data');
    }
    
    // Validate embeddings format
    if (!Array.isArray(embeddingsData)) {
      throw new Error('Invalid embeddings format: expected array');
    }
    
    // Save to IndexedDB
    const count = await saveEmbeddings(documentId, embeddingsData, metadata);
    
    console.log(`[VectorStoreDB] Loaded ${count} embeddings from S3 and saved to IndexedDB`);
    return count;
    
  } catch (error) {
    console.error('[VectorStoreDB] Failed to load embeddings from S3:', error);
    throw error;
  }
}
