/**
 * Web Worker for Embedding Operations
 * Handles CPU-intensive embedding calculations off the main thread
 */

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculate similarities for a batch of items
 */
function calculateSimilarities({ queryEmbedding, items, type }) {
  const results = [];
  
  items.forEach(item => {
    try {
      if (item.embedding) {
        const itemEmbedding = typeof item.embedding === 'string' 
          ? JSON.parse(item.embedding) 
          : item.embedding;
        
        const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
        
        // Build result object based on type
        const result = {
          type,
          id: item.id,
          similarity,
          content: item
        };
        
        // Add type-specific fields
        switch (type) {
          case 'file':
            result.name = item.name;
            result.description = item.description;
            result.mimeType = item.mimeType;
            break;
          case 'word':
            result.phrase = item.phrase;
            result.phonetic = item.phonetic;
            result.definition = item.definition;
            break;
          case 'question':
            result.prompt = item.prompt;
            result.answer = item.answer;
            break;
        }
        
        results.push(result);
      }
    } catch (error) {
      console.error(`[Worker] Error processing ${type} item ${item.id}:`, error);
    }
  });
  
  return results;
}

/**
 * Perform keyword search on items
 */
function keywordSearch({ query, items, type }) {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  items.forEach(item => {
    let text = '';
    
    switch (type) {
      case 'word':
        text = `${item.phrase || ''} ${item.phonetic || ''} ${item.definition || ''}`.toLowerCase();
        break;
      case 'question':
        text = `${item.prompt || ''} ${item.answer || ''}`.toLowerCase();
        break;
      case 'file':
        text = `${item.name || ''} ${item.description || ''}`.toLowerCase();
        break;
    }
    
    if (text.includes(lowerQuery)) {
      const result = {
        type,
        id: item.id,
        similarity: 0.7, // Fixed score for keyword matches
        content: item
      };
      
      // Add type-specific fields
      switch (type) {
        case 'file':
          result.name = item.name;
          result.description = item.description;
          result.mimeType = item.mimeType;
          break;
        case 'word':
          result.phrase = item.phrase;
          result.phonetic = item.phonetic;
          result.definition = item.definition;
          break;
        case 'question':
          result.prompt = item.prompt;
          result.answer = item.answer;
          break;
      }
      
      results.push(result);
    }
  });
  
  return results;
}

/**
 * Sort and limit results
 */
function sortAndLimit({ results, limit }) {
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// Message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'calculateSimilarities':
        result = calculateSimilarities(data);
        break;
        
      case 'keywordSearch':
        result = keywordSearch(data);
        break;
        
      case 'sortAndLimit':
        result = sortAndLimit(data);
        break;
        
      case 'cosineSimilarity':
        result = cosineSimilarity(data.vecA, data.vecB);
        break;
        
      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }
    
    self.postMessage({
      id,
      type,
      success: true,
      result
    });
  } catch (error) {
    self.postMessage({
      id,
      type,
      success: false,
      error: error.message
    });
  }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
