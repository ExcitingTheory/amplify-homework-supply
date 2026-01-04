/**
 * Embedding Generation Utilities
 * Handles generating embeddings for units, sections, words, and questions
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

/**
 * Generate embedding from text using backend Lambda
 * @param {string} text - Text to embed
 * @param {object} options - Embedding options
 * @returns {Promise<Array<number>>} Embedding vector
 */
async function generateEmbedding(text, options = {}) {
  const {
    model = 'text-embedding-3-small',
    dimensions = 512
  } = options;
  
  if (!text || text.trim().length === 0) {
    console.warn('Empty text provided for embedding generation');
    return null;
  }
  
  try {
    const response = await client.graphql({
      query: generateEmbeddingMutation,
      variables: {
        text: text.trim(),
        model,
        dimensions
      }
    });
    
    return response.data.generateEmbedding.embedding;
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
