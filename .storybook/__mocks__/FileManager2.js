/**
 * Mock CourseVectorStore for Storybook
 * Provides working vector store functionality without IndexedDB dependency
 */

import { generateMockEmbedding } from './mockEmbeddingUtils.js';

// Mock document embeddings for testing
const MOCK_DOCUMENT_EMBEDDINGS = [
  {
    id: 'embed-1',
    documentId: 'doc-japanese-basics',
    page: 1,
    text: 'Introduction to Japanese language fundamentals, covering hiragana, katakana, and basic grammar.',
    vector: generateMockEmbedding('Introduction to Japanese language fundamentals'),
    metadata: {
      fileId: 'file-1',
      fileName: 'japanese-basics.pdf',
      mimeType: 'application/pdf',
      page: 1
    }
  },
  {
    id: 'embed-2',
    documentId: 'doc-japanese-basics',
    page: 2,
    text: 'Common Japanese greetings: こんにちは (konnichiwa) means hello, ありがとう (arigatou) means thank you.',
    vector: generateMockEmbedding('Common Japanese greetings konnichiwa arigatou'),
    metadata: {
      fileId: 'file-1',
      fileName: 'japanese-basics.pdf',
      mimeType: 'application/pdf',
      page: 2
    }
  },
  {
    id: 'embed-3',
    documentId: 'doc-japanese-grammar',
    page: 1,
    text: 'Japanese sentence structure follows Subject-Object-Verb order.',
    vector: generateMockEmbedding('Japanese sentence structure Subject-Object-Verb'),
    metadata: {
      fileId: 'file-2',
      fileName: 'japanese-grammar.pdf',
      mimeType: 'application/pdf',
      page: 1
    }
  }
];

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export class CourseVectorStore {
  constructor() {
    console.log('[MOCK CourseVectorStore] Initialized with mock data');
    this.items = [...MOCK_DOCUMENT_EMBEDDINGS]; // Start with mock data
    this.loaded = true; // Always loaded in Storybook
    this.loadPromise = null;
  }

  async clear() {
    console.log('[MOCK CourseVectorStore] Clearing store');
    this.items = [];
    this.loaded = false;
  }

  add(item) {
    console.log('[MOCK CourseVectorStore.add] Adding embedding:', {
      id: item.id,
      documentId: item.documentId,
      page: item.page,
      hasVector: !!item.vector,
      vectorLength: item.vector?.length,
      fileName: item.metadata?.fileName,
      totalItemsAfter: this.items.length + 1
    });
    this.items.push(item);
  }

  /**
   * Mock IndexedDB load - returns immediately with mock data
   */
  async loadFromIndexedDB() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = Promise.resolve().then(() => {
      console.log(`[MOCK CourseVectorStore] Loaded ${this.items.length} mock embeddings`);
      this.loaded = true;
      return this.items.length;
    });

    return this.loadPromise;
  }

  /**
   * Mock save to IndexedDB - just logs
   */
  async saveToIndexedDB(documentId, embeddings, metadata) {
    console.log(`[MOCK CourseVectorStore] Mock save to IndexedDB: ${documentId}`, {
      count: embeddings.length,
      metadata
    });
    
    // Add to in-memory store for testing
    embeddings.forEach((emb, idx) => {
      this.add({
        id: `${documentId}-${idx}`,
        documentId,
        page: emb.page || idx + 1,
        text: emb.text || '',
        vector: emb.embedding || emb.vector,
        metadata: {
          ...metadata,
          page: emb.page || idx + 1
        }
      });
    });
  }

  /**
   * Mock delete from IndexedDB
   */
  async deleteFromIndexedDB(documentId) {
    console.log(`[MOCK CourseVectorStore] Mock delete from IndexedDB: ${documentId}`);
    this.items = this.items.filter(item => item.documentId !== documentId);
  }

  /**
   * Search for similar embeddings
   * Implements real vector similarity search with mock data
   */
  async search(queryVector, filters = {}, topK = 50, queryText = '') {
    console.log(`[MOCK CourseVectorStore.search] Searching`, {
      hasQueryVector: !!queryVector,
      queryText,
      filters,
      topK,
      totalItems: this.items.length
    });

    let results = this.items;

    // Apply metadata filters
    if (filters.fileId) {
      results = results.filter(item => item.metadata?.fileId === filters.fileId);
    }
    if (filters.documentId) {
      results = results.filter(item => 
        item.metadata?.documentId === filters.documentId || item.documentId === filters.documentId
      );
    }
    if (filters.mimeType) {
      results = results.filter(item => item.metadata?.mimeType === filters.mimeType);
    }

    console.log(`[MOCK CourseVectorStore.search] After filtering: ${results.length} items`);

    // If no query vector, return filtered results with default score
    if (!queryVector) {
      return results.slice(0, topK).map((item, idx) => ({
        ...item,
        score: 1 - (idx * 0.01) // Descending scores
      }));
    }

    // Calculate similarity scores
    const withScores = results
      .filter(item => item.vector && item.vector.length > 0)
      .map(item => ({
        ...item,
        score: cosineSimilarity(queryVector, item.vector)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[MOCK CourseVectorStore.search] Returning ${withScores.length} results with scores`);
    
    return withScores;
  }

  /**
   * Get items by document ID
   */
  getByDocumentId(documentId) {
    return this.items.filter(item => item.documentId === documentId);
  }

  /**
   * Get total number of items
   */
  size() {
    return this.items.length;
  }
}

// Export other components that might be needed (as no-ops or mocks)
export const FileManager2 = {
  // Add any other exports from the real FileManager2 if needed
};
