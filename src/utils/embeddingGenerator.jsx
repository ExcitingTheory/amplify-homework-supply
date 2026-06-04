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

import { getAmplifyClient } from "./amplifyClient";
import { generateEmbedding as generateEmbeddingAction } from "../../app/actions/embeddings";
import { saveEmbedding } from "./embeddingStorage";
// Note: Type import commented out for .js file
// import type { Schema } from '../../amplify/data/resource';
import {
  extractPlainText,
  extractForEmbedding,
  extractMultiple,
  extractWithSectionMarkers,
} from "./headlessEditorExtractor";

// In-memory cache for query embeddings
const embeddingCache = new Map();
const CACHE_KEY_PREFIX = "qemb_";
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
      console.log("[Embedding Cache] Memory hit:", text.substring(0, 50));
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
        console.log(
          "[Embedding Cache] LocalStorage hit:",
          text.substring(0, 50),
        );
        // Populate memory cache
        embeddingCache.set(key, parsed);
        return parsed.embedding;
      }
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("[Embedding Cache] LocalStorage read error:", error);
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
    text: text.substring(0, 100), // Store truncated text for debugging
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
    if (error.name === "QuotaExceededError") {
      console.warn(
        "[Embedding Cache] LocalStorage quota exceeded, clearing old entries",
      );
      clearExpiredCache();
      try {
        localStorage.setItem(key, JSON.stringify(cached));
      } catch (retryError) {
        console.warn(
          "[Embedding Cache] Failed to cache after cleanup:",
          retryError,
        );
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

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log(
    `[Embedding Cache] Cleared ${keysToRemove.length} expired entries`,
  );
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
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log("[Embedding Cache] Cleared all cached embeddings");
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
    expiryHours: CACHE_EXPIRY_MS / (1000 * 60 * 60),
  };
}

/**
 * Generate embedding from text using backend Lambda with caching
 * @param {string} text - Text to embed
 * @param {object} options - Embedding options
 * @returns {Promise<Array<number>>} Embedding vector
 */
export async function generateEmbedding(text, options = {}) {
  const {
    model = "text-embedding-3-small",
    dimensions = 512,
    skipCache = false, // Add option to bypass cache
  } = options;

  if (!text || text.trim().length === 0) {
    console.warn("Empty text provided for embedding generation");
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
    console.log(
      "[Embedding] Generating new embedding for:",
      text.substring(0, 50),
    );
    const result = await generateEmbeddingAction({
      content: text.trim(),
      model,
      dimensions,
    });
    const embedding = result.embedding;

    // Cache the result
    setCachedEmbedding(text, model, dimensions, embedding);

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Generate embedding for a Unit from all its sections.
 *
 * @deprecated Manual/force-only path. The primary embedding generation path is
 * now the `rebuildSearchBundle` Lambda, triggered automatically on unit publish.
 * Use this only for admin "regenerate all embeddings" workflows or development.
 *
 * @param {string} unitId - Unit ID
 * @param {object} options - Generation options
 * @returns {Promise<object>} Result with embedding and metadata
 */
export async function generateUnitEmbedding(unitId, options = {}) {
  const { force = false } = options;
  const amplifyClient = getAmplifyClient();

  try {
    // Get unit
    const { data: unit } = await amplifyClient.models.Unit.get({ id: unitId });
    if (!unit) {
      throw new Error(`Unit not found: ${unitId}`);
    }

    // Skip if already has embedding and not forcing
    if (unit.embedding && !force) {
      console.log(`Unit ${unitId} already has embedding, skipping`);
      return { success: true, cached: true };
    }

    // Get all sections for this unit
    const { data: sections } = await amplifyClient.models.Section.list({
      filter: { unitID: { eq: unitId } },
    });

    // Filter out null sections
    const validSections = sections.filter((s) => s != null && s.id != null);

    if (validSections.length === 0) {
      console.warn(`Unit ${unitId} has no valid sections`);
      return { success: false, reason: "no_sections" };
    }

    // Extract text from all sections
    const extracted = extractWithSectionMarkers(
      validSections.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
      })),
    );

    if (extracted.text.length === 0) {
      console.warn(`Unit ${unitId} has no extractable text`);
      return { success: false, reason: "no_text" };
    }

    // Generate embedding
    const embedding = await generateEmbedding(extracted.text);

    if (!embedding) {
      throw new Error("Failed to generate embedding");
    }

    // Save vector to S3 (private — owner only)
    await saveEmbedding(unit.identityId, "unit", unit.id, {
      model: "text-embedding-3-small",
      dimensions: 512,
      generatedAt: Date.now(),
      wordCount: extracted.totalWordCount,
      pages: [{ page: 0, embedding, text: extracted.text.substring(0, 200) }],
    });

    // Update metadata only in DynamoDB (no vector payload)
    await amplifyClient.models.Unit.update({
      id: unit.id,
      embedding: {
        model: "text-embedding-3-small",
        dimensions: 512,
        version: Date.now(),
        wordCount: extracted.totalWordCount,
        pageCount: 1,
      },
      _version: unit._version,
    });

    console.log(
      `Generated embedding for unit ${unitId}: ${extracted.totalWordCount} words, ${extracted.sections.length} sections`,
    );

    return {
      success: true,
      wordCount: extracted.totalWordCount,
      sectionCount: extracted.sections.length,
      cached: false,
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
  const amplifyClient = getAmplifyClient();

  try {
    const { data: section } = await amplifyClient.models.Section.get({
      id: sectionId,
    });
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
      return { success: false, reason: "no_text" };
    }

    // Generate embedding
    const embedding = await generateEmbedding(extracted.text);

    if (!embedding) {
      throw new Error("Failed to generate embedding");
    }

    // Save vector to S3 (private — owner only)
    await saveEmbedding(
      section.identityId || section.owner,
      "section",
      section.id,
      {
        model: "text-embedding-3-small",
        dimensions: 512,
        generatedAt: Date.now(),
        wordCount: extracted.wordCount,
        pages: [{ page: 0, embedding, text: extracted.text.substring(0, 200) }],
      },
    );

    // Update metadata only in DynamoDB (no vector payload)
    await amplifyClient.models.Section.update({
      id: section.id,
      embedding: {
        model: "text-embedding-3-small",
        dimensions: 512,
        version: Date.now(),
        wordCount: extracted.wordCount,
        pageCount: 1,
      },
      _version: section._version,
    });

    console.log(
      `Generated embedding for section ${sectionId}: ${extracted.wordCount} words`,
    );

    return {
      success: true,
      wordCount: extracted.wordCount,
      cached: false,
    };
  } catch (error) {
    console.error(
      `Error generating section embedding for ${sectionId}:`,
      error,
    );
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
  const amplifyClient = getAmplifyClient();

  try {
    const { data: word } = await amplifyClient.models.Word.get({ id: wordId });
    if (!word) {
      throw new Error(`Word not found: ${wordId}`);
    }

    if (word.embedding && !force) {
      return { success: true, cached: true };
    }

    // Combine term and definition for embedding
    const text = `${word.phrase || ""} ${word.definition || ""}`.trim();

    if (!text) {
      return { success: false, reason: "no_text" };
    }

    const embedding = await generateEmbedding(text);

    // Save vector to S3
    await saveEmbedding(word.identityId || word.owner, "word", word.id, {
      model: "text-embedding-3-small",
      dimensions: 512,
      generatedAt: Date.now(),
      wordCount: text.split(/\s+/).length,
      pages: [{ page: 0, embedding, text: text.substring(0, 200) }],
    });

    // Update metadata only in DynamoDB
    await amplifyClient.models.Word.update({
      id: word.id,
      embedding: {
        model: "text-embedding-3-small",
        dimensions: 512,
        version: Date.now(),
        wordCount: text.split(/\s+/).length,
        pageCount: 1,
      },
      _version: word._version,
    });

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
  const amplifyClient = getAmplifyClient();

  try {
    const { data: question } = await amplifyClient.models.Question.get({
      id: questionId,
    });
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    if (question.embedding && !force) {
      return { success: true, cached: true };
    }

    // Combine prompt and answer for embedding
    const text = `${question.prompt || ""} ${question.answer || ""}`.trim();

    if (!text) {
      return { success: false, reason: "no_text" };
    }

    const embedding = await generateEmbedding(text);

    // Save vector to S3
    await saveEmbedding(
      question.identityId || question.owner,
      "question",
      question.id,
      {
        model: "text-embedding-3-small",
        dimensions: 512,
        generatedAt: Date.now(),
        wordCount: text.split(/\s+/).length,
        pages: [{ page: 0, embedding, text: text.substring(0, 200) }],
      },
    );

    // Update metadata only in DynamoDB
    await amplifyClient.models.Question.update({
      id: question.id,
      embedding: {
        model: "text-embedding-3-small",
        dimensions: 512,
        version: Date.now(),
        wordCount: text.split(/\s+/).length,
        pageCount: 1,
      },
      _version: question._version,
    });

    return { success: true, cached: false };
  } catch (error) {
    console.error(
      `Error generating question embedding for ${questionId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Generate embeddings for all sections in a unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<object>} Results summary
 */
export async function generateAllSectionEmbeddings(unitId) {
  const amplifyClient = getAmplifyClient();
  try {
    const { data: sections } = await amplifyClient.models.Section.list({
      filter: { unitID: { eq: unitId } },
    });

    // Filter out null items that can occur in subscription updates
    const validSections = sections.filter((s) => s != null && s.id != null);

    const results = await Promise.allSettled(
      validSections.map((section) => generateSectionEmbedding(section.id)),
    );

    const summary = {
      total: validSections.length,
      success: results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      ).length,
      cached: results.filter((r) => r.status === "fulfilled" && r.value.cached)
        .length,
      failed: results.filter((r) => r.status === "rejected").length,
    };

    console.log(
      `Section embedding generation complete for unit ${unitId}:`,
      summary,
    );

    return summary;
  } catch (error) {
    console.error(
      `Error generating section embeddings for unit ${unitId}:`,
      error,
    );
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
export async function getOrGenerateUnitEmbedding(
  unitId,
  maxAge = 7 * 24 * 60 * 60 * 1000,
) {
  const amplifyClient = getAmplifyClient();
  const { loadEmbedding } = await import("./embeddingStorage");
  try {
    const { data: unit } = await amplifyClient.models.Unit.get({ id: unitId });
    if (!unit) {
      throw new Error(`Unit not found: ${unitId}`);
    }

    // Check if embedding metadata exists and is fresh
    if (unit.embedding?.version) {
      const age = Date.now() - unit.embedding.version;
      if (age < maxAge) {
        // Load vector from S3
        const embeddingFile = await loadEmbedding(
          unit.identityId,
          "unit",
          unit.id,
        );
        return {
          success: true,
          cached: true,
          age: age,
          embedding: embeddingFile?.pages?.[0]?.embedding || null,
        };
      }
    }

    // Generate new embedding
    const result = await generateUnitEmbedding(unitId, { force: true });

    // Load newly saved embedding from S3
    const embeddingFile = await loadEmbedding(unit.identityId, "unit", unit.id);

    return {
      ...result,
      embedding: embeddingFile?.pages?.[0]?.embedding || null,
    };
  } catch (error) {
    console.error(
      `Error getting/generating unit embedding for ${unitId}:`,
      error,
    );
    throw error;
  }
}
