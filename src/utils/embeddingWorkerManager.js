/**
 * Embedding Worker Manager
 * Manages web worker for embedding calculations
 */

let worker = null;
let messageId = 0;
let pendingMessages = new Map();
let isReady = false;
let readyCallbacks = [];

/**
 * Initialize the worker
 */
export function initWorker() {
  if (worker) return worker;
  
  try {
    worker = new Worker(new URL('../workers/embeddingWorker.js', import.meta.url));
    
    worker.onmessage = (e) => {
      const { id, type, success, result, error } = e.data;
      
      // Handle ready message
      if (type === 'ready') {
        isReady = true;
        readyCallbacks.forEach(cb => cb());
        readyCallbacks = [];
        return;
      }
      
      // Handle response messages
      const pending = pendingMessages.get(id);
      if (pending) {
        pendingMessages.delete(id);
        if (success) {
          pending.resolve(result);
        } else {
          pending.reject(new Error(error));
        }
      }
    };
    
    worker.onerror = (error) => {
      console.error('[EmbeddingWorker] Error:', error);
      // Reject all pending messages
      pendingMessages.forEach(({ reject }) => {
        reject(new Error('Worker error'));
      });
      pendingMessages.clear();
    };
    
    return worker;
  } catch (error) {
    console.error('[EmbeddingWorker] Failed to initialize:', error);
    return null;
  }
}

/**
 * Wait for worker to be ready
 */
function waitForReady() {
  return new Promise((resolve) => {
    if (isReady) {
      resolve();
    } else {
      readyCallbacks.push(resolve);
    }
  });
}

/**
 * Send message to worker and await response
 */
function sendMessage(type, data) {
  if (!worker) {
    initWorker();
  }
  
  return new Promise(async (resolve, reject) => {
    await waitForReady();
    
    const id = messageId++;
    pendingMessages.set(id, { resolve, reject });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingMessages.has(id)) {
        pendingMessages.delete(id);
        reject(new Error('Worker timeout'));
      }
    }, 30000);
    
    worker.postMessage({ id, type, data });
  });
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
  return sendMessage('cosineSimilarity', { vecA, vecB });
}

/**
 * Calculate similarities for a batch of items
 */
export function calculateSimilarities(queryEmbedding, items, type) {
  return sendMessage('calculateSimilarities', { queryEmbedding, items, type });
}

/**
 * Perform keyword search
 */
export function keywordSearch(query, items, type) {
  return sendMessage('keywordSearch', { query, items, type });
}

/**
 * Sort and limit results
 */
export function sortAndLimit(results, limit) {
  return sendMessage('sortAndLimit', { results, limit });
}

/**
 * Terminate the worker
 */
export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
    isReady = false;
    messageId = 0;
    pendingMessages.clear();
    readyCallbacks = [];
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initWorker();
}
