/**
 * Embedding Generation Utilities
 * Handles generating embeddings for units, sections, words, and questions
 * 
 * CACHING:
 * - Query embeddings are cached in memory (100 entries LRU) + localStorage (24h TTL)
 * - Cache key: model_dimensions_normalized-text (case-insensitive, trimmed)
 * - Reduces OpenAI API costs for repeated searches
 * - Use clearEmbeddingCache() to manually clear cache
 * - Set skipCache: true in options to bypass cache
 * 
 * USAGE:
 * import { clearEmbeddingCache } from '@/utils/embeddingGenerator';
 * clearEmbeddingCache(); // Clear all cached query embeddings
 */

import { generateClient } from 'aws-amplify/api';
import { DataStore } from 'aws-amplify/datastore';
import { Unit, Section, Word, Question } from '../models';
import { 
  extractPlainText, 
  extractForEmbedding, 
  extractMultiple,
  extractWithSectionMarkers 
} from './headlessEditorExtractor';

const client = generateClient();

// GraphQL mutation for generating embeddings (you'll need to add this to your schema)
const generateEmbeddingMutation = /* GraphQL */ `
  mutation GenerateEmbedding($text: String!, $model: String, $dimensions: Int) {
    generateEmbedding(text: $text, model: $model, dimensions: $dimensions) {
      embedding
      model
      dimensions
      tokenCount
    }
  }
`;

// In-memory cache for query embeddings
const embeddingCache = new Map();
const CACHE_KEY_PREFIX = 'qemb_';
const CACHE_MAX_SIZE = 100; // LRU cache size
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Generate cache key from text and options
 */
function getCacheKey(text, model, dimensions) {
  const normalized = text.toLowerCase().trim();
  return `${CACHE_KEY_PREFIX}${model}_${dimensions}_${normalized}`;
}

/**
 * Get embedding from cache (memory + localStorage)
 */
function getCachedEmbedding(text, model, dimensions) {
  const key = getCacheKey(text, model, dimensions);
  
  // Check memory cache first
  if (embeddingCache.has(key)) {
    const cached = embeddingCache.get(key);
    if (Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
      console.log('[Embedding Cache] Memory hit:', text.substring(0, 50));
      return cached.embedding;
    }
    embeddingCache.delete(key);
  }
  
  // Check localStorage
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        console.log('[Embedding Cache] LocalStorage hit:', text.substring(0, 50));
        // Populate memory cache
        embeddingCache.set(key, parsed);
        return parsed.embedding;
      }
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[Embedding Cache] LocalStorage read error:', error);
  }
  
  return null;
}

/**
 * Save embedding to cache (memory + localStorage)
 */
function setCachedEmbedding(text, model, dimensions, embedding) {
  const key = getCacheKey(text, model, dimensions);
  const cached = {
    embedding,
    timestamp: Date.now(),
    text: text.substring(0, 100) // Store truncated text for debugging
  };
  
  // Memory cache with LRU eviction
  if (embeddingCache.size >= CACHE_MAX_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }
  embeddingCache.set(key, cached);
  
  // LocalStorage cache
  try {
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    // Handle quota exceeded - clear old entries
    if (error.name === 'QuotaExceededError') {
      console.warn('[Embedding Cache] LocalStorage quota exceeded, clearing old entries');
      clearExpiredCache();
      try {
        localStorage.setItem(key, JSON.stringify(cached));
      } catch (retryError) {
        console.warn('[Embedding Cache] Failed to cache after cleanup:', retryError);
      }
    }
  }
}

/**
 * Clear expired cache entries from localStorage
 */
function clearExpiredCache() {
  const now = Date.now();
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_KEY_PREFIX)) {
      try {
        const stored = JSON.parse(localStorage.getItem(key));
        if (now - stored.timestamp >= CACHE_EXPIRY_MS) {
          keysToRemove.push(key);
        }
      } catch (error) {
        keysToRemove.push(key); // Remove corrupted entries
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`[Embedding Cache] Cleared ${keysToRemove.length} expired entries`);
}

/**
 * Clear all cached embeddings
 */
export function clearEmbeddingCache() {
  embeddingCache.clear();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('[Embedding Cache] Cleared all cached embeddings');
}

/**
 * Get cache statistics
 */
export function getEmbeddingCacheStats() {
  let localStorageCount = 0;
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_KEY_PREFIX)) {
      localStorageCount++;
      try {
        const value = localStorage.getItem(key);
        totalSize += new Blob([value]).size;
      } catch (error) {
        // Ignore
      }
    }
  }
  
  return {
    memoryCount: embeddingCache.size,
    localStorageCount,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    maxSize: CACHE_MAX_SIZE,
    expiryHours: CACHE_EXPIRY_MS / (1000 * 60 * 60)
  };
}

/**
 * Generate embedding from text using backend Lambda with caching
 * @param {string} text - Text to embed
 * @param {object} options - Embedding options
 * @returns {Promise<Array<number>>} Embedding vector
 */
async function generateEmbedding(text, options = {}) {
  const {
    model = 'text-embedding-3-small',
    dimensions = 512,
    skipCache = false // Add option to bypass cache
  } = options;
  
  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided for embedding generation');
    return null;
  }
  
  // Check cache first (unless skipCache is true)
  if (!skipCache) {
    const cached = getCachedEmbedding(text, model, dimensions);
    if (cached) {
      return cached;
    }
  }
  
  try {
    console.log('[Embedding] Generating new embedding for:', text.substring(0, 50));
    const response = await client.graphql({
      query: generateEmbeddingMutation,
      variables: {
        text: text.trim(),
        model,
        dimensions
      }
    });
    
    const embedding = response.data.generateEmbedding.embedding;
    
    // Cache the result
    setCachedEmbedding(text, model, dimensions, embedding);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embedding for a Unit from all its sections
 * @param {string} unitId - Unit ID
 * @param {object} options - Generation options
 * @returns {Promise<object>} Result with embedding and metadata
 */
export async function generateUnitEmbedding(unitId, options = {}) {
  const { force = false } = options;
  
  try {
    // Get unit
    const unit = await DataStore.query(Unit, unitId);
    if (!unit) {
      throw new Error(`Unit not found: ${unitId}`);
    }
    
    // Skip if already has embedding and not forcing
    if (unit.embedding && !force) {
      console.log(`Unit ${unitId} already has embedding, skipping`);
      return { success: true, cached: true };
    }
    
    // Get all sections for this unit
    const sections = await DataStore.query(Section, s => s.unitID.eq(unitId));
    
    if (sections.length === 0) {
      console.warn(`Unit ${unitId} has no sections`);
      return { success: false, reason: 'no_sections' };
    }
    
    // Extract text from all sections
    const extracted = extractWithSectionMarkers(
      sections.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content
      }))
    );
    
    if (extracted.text.length === 0) {
      console.warn(`Unit ${unitId} has no extractable text`);
      return { success: false, reason: 'no_text' };
    }
    
    // Generate embedding
    const embedding = await generateEmbedding(extracted.text);
    
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    
    // Save to unit
    await DataStore.save(Unit.copyOf(unit, updated => {
      updated.embedding = JSON.stringify(embedding);
      updated.embeddingVersion = Date.now();
      updated.embeddingWordCount = extracted.totalWordCount;
      updated.embeddingSectionCount = extracted.sections.length;
    }));
    
    console.log(`Generated embedding for unit ${unitId}: ${extracted.totalWordCount} words, ${extracted.sections.length} sections`);
    
    return {
      success: true,
      wordCount: extracted.totalWordCount,
      sectionCount: extracted.sections.length,
      cached: false
    };
  } catch (error) {
    console.error(`Error generating unit embedding for ${unitId}:`, error);
    throw error;
  }
}

/**
 * Generate embedding for a Section
 * @param {string} sectionId - Section ID
 * @param {object} options - Generation options
 * @returns {Promise<object>} Result with embedding and metadata
 */
export async function generateSectionEmbedding(sectionId, options = {}) {
  const { force = false } = options;
  
  try {
    const section = await DataStore.query(Section, sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }
    
    // Skip if already has embedding and not forcing
    if (section.embedding && !force) {
      console.log(`Section ${sectionId} already has embedding, skipping`);
      return { success: true, cached: true };
    }
    
    // Extract text
    const extracted = extractForEmbedding(section.content);
    
    if (extracted.isEmpty) {
      console.warn(`Section ${sectionId} has no extractable text`);
      return { success: false, reason: 'no_text' };
    }
    
    // Generate embedding
    const embedding = await generateEmbedding(extracted.text);
    
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    
    // Save to section
    await DataStore.save(Section.copyOf(section, updated => {
      updated.embedding = JSON.stringify(embedding);
      updated.textContent = extracted.text;
      updated.wordCount = extracted.wordCount;
      updated.embeddingVersion = Date.now();
    }));
    
    console.log(`Generated embedding for section ${sectionId}: ${extracted.wordCount} words`);
    
    return {
      success: true,
      wordCount: extracted.wordCount,
      cached: false
    };
  } catch (error) {
    console.error(`Error generating section embedding for ${sectionId}:`, error);
    throw error;
  }
}

/**
 * Generate embedding for a Word
 * @param {string} wordId - Word ID
 * @param {object} options - Generation options
 * @returns {Promise<object>} Result with embedding and metadata
 */
export async function generateWordEmbedding(wordId, options = {}) {
  const { force = false } = options;
  
  try {
    const word = await DataStore.query(Word, wordId);
    if (!word) {
      throw new Error(`Word not found: ${wordId}`);
    }
    
    if (word.embedding && !force) {
      return { success: true, cached: true };
    }
    
    // Combine term and definition for embedding
    const text = `${word.phrase || ''} ${word.definition || ''}`.trim();
    
    if (!text) {
      return { success: false, reason: 'no_text' };
    }
    
    const embedding = await generateEmbedding(text);
    
    await DataStore.save(Word.copyOf(word, updated => {
      updated.embedding = JSON.stringify(embedding);
      updated.embeddingVersion = Date.now();
    }));
    
    return { success: true, cached: false };
  } catch (error) {
    console.error(`Error generating word embedding for ${wordId}:`, error);
    throw error;
  }
}

/**
 * Generate embedding for a Question
 * @param {string} questionId - Question ID
 * @param {object} options - Generation options
 * @returns {Promise<object>} Result with embedding and metadata
 */
export async function generateQuestionEmbedding(questionId, options = {}) {
  const { force = false } = options;
  
  try {
    const question = await DataStore.query(Question, questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }
    
    if (question.embedding && !force) {
      return { success: true, cached: true };
    }
    
    // Combine prompt and answer for embedding
    const text = `${question.prompt || ''} ${question.answer || ''}`.trim();
    
    if (!text) {
      return { success: false, reason: 'no_text' };
    }
    
    const embedding = await generateEmbedding(text);
    
    await DataStore.save(Question.copyOf(question, updated => {
      updated.embedding = JSON.stringify(embedding);
      updated.embeddingVersion = Date.now();
    }));
    
    return { success: true, cached: false };
  } catch (error) {
    console.error(`Error generating question embedding for ${questionId}:`, error);
    throw error;
  }
}

/**
 * Generate embeddings for all sections in a unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<object>} Results summary
 */
export async function generateAllSectionEmbeddings(unitId) {
  try {
    const sections = await DataStore.query(Section, s => s.unitID.eq(unitId));
    
    const results = await Promise.allSettled(
      sections.map(section => generateSectionEmbedding(section.id))
    );
    
    const summary = {
      total: sections.length,
      success: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      cached: results.filter(r => r.status === 'fulfilled' && r.value.cached).length,
      failed: results.filter(r => r.status === 'rejected').length
    };
    
    console.log(`Section embedding generation complete for unit ${unitId}:`, summary);
    
    return summary;
  } catch (error) {
    console.error(`Error generating section embeddings for unit ${unitId}:`, error);
    throw error;
  }
}

/**
 * On-demand unit embedding with caching
 * Only generates if missing or stale
 * @param {string} unitId - Unit ID
 * @param {number} maxAge - Max age in milliseconds before regenerating
 * @returns {Promise<object>} Result with embedding status
 */
export async function getOrGenerateUnitEmbedding(unitId, maxAge = 7 * 24 * 60 * 60 * 1000) {
  try {
    const unit = await DataStore.query(Unit, unitId);
    if (!unit) {
      throw new Error(`Unit not found: ${unitId}`);
    }
    
    // Check if embedding exists and is fresh
    if (unit.embedding && unit.embeddingVersion) {
      const age = Date.now() - unit.embeddingVersion;
      if (age < maxAge) {
        return {
          success: true,
          cached: true,
          age: age,
          embedding: JSON.parse(unit.embedding)
        };
      }
    }
    
    // Generate new embedding
    const result = await generateUnitEmbedding(unitId, { force: true });
    
    // Fetch updated unit to get embedding
    const updatedUnit = await DataStore.query(Unit, unitId);
    
    return {
      ...result,
      embedding: updatedUnit.embedding ? JSON.parse(updatedUnit.embedding) : null
    };
  } catch (error) {
    console.error(`Error getting/generating unit embedding for ${unitId}:`, error);
    throw error;
  }
}
