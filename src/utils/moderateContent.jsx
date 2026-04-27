/**
 * Content Moderation Utility
 * 
 * Provides automatic content moderation using OpenAI's Moderation API.
 * All user-generated content is flagged but NOT blocked - instructors
 * handle flagged content according to their school policies.
 */

import { getAmplifyClient } from './amplifyClient';

/**
 * Extract text content from various data structures for moderation
 * @param {Object} data - Data to extract text from (Unit.data, Grade.data, etc.)
 * @returns {string} - Combined text content
 */
function extractTextContent(data) {
  const texts = [];
  
  if (!data) return '';
  
  // Handle JSON string
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      return data; // Return as-is if not JSON
    }
  }
  
  // Handle Lexical editor state
  if (data.root && data.root.children) {
    const extractFromNode = (node) => {
      if (node.text) {
        texts.push(node.text);
      }
      if (node.children) {
        node.children.forEach(extractFromNode);
      }
      // Extract from custom block types
      if (node.prompt) texts.push(node.prompt);
      if (node.answer) texts.push(node.answer);
      if (node.phrase) texts.push(node.phrase);
      if (node.definition) texts.push(node.definition);
    };
    
    data.root.children.forEach(extractFromNode);
  }
  
  // Handle Grade data (question responses)
  if (typeof data === 'object') {
    Object.values(data).forEach(item => {
      if (item.userAnswer) texts.push(item.userAnswer);
      if (item.response) texts.push(item.response);
    });
  }
  
  return texts.join(' ').trim();
}

/**
 * Moderate content using OpenAI Moderation API
 * @param {string|Object} content - Text or object containing text to moderate
 * @returns {Promise<Object>} - Moderation result
 */
export async function moderateContent(content) {
  try {
    // Extract text if content is an object
    const textToModerate = typeof content === 'string' 
      ? content 
      : extractTextContent(content);
    
    if (!textToModerate || textToModerate.length === 0 || textToModerate === 'null' || textToModerate === 'undefined') {
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
        model: 'text-moderation-latest',
        error: null
      };
    }
    
    // Call the moderation mutation
    const client = getAmplifyClient();
    const response = await client.mutations.moderateContent({
      content: textToModerate
    });
    
    const result = response?.data?.moderateContent ?? response?.data;
    return typeof result === 'string' ? JSON.parse(result) : result;
  } catch (error) {
    console.error('Error moderating content:', error);
    // Return non-flagged result on error - don't block saves
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      model: 'text-moderation-latest',
      error: error.message
    };
  }
}

/**
 * Build moderation fields for DataStore save
 * @param {Object} moderationResult - Result from moderateContent()
 * @returns {Object} - Fields to update on the model
 */
export function buildModerationFields(moderationResult) {
  if (!moderationResult) return {};
  
  return {
    moderationStatus: moderationResult.flagged ? 'flagged' : 'approved',
    moderationFlags: moderationResult.flagged 
      ? JSON.stringify({
          categories: moderationResult.categories,
          categoryScores: moderationResult.categoryScores,
          model: moderationResult.model
        })
      : null,
    moderationCheckedAt: new Date().toISOString()
  };
}

/**
 * Moderate and save content in one operation
 * @param {Object} model - DataStore model class (Unit, Grade, Question, Word)
 * @param {Object} item - Item to save
 * @param {string|Object} content - Content to moderate
 * @returns {Promise<Object>} - Saved item with moderation fields
 */
export async function moderateAndSave(model, item, content) {
  // Run moderation
  const moderationResult = await moderateContent(content);
  
  // Build moderation fields
  const moderationFields = buildModerationFields(moderationResult);
  
  // Log if flagged
  if (moderationResult.flagged) {
    console.warn('Content flagged by moderation:', {
      categories: moderationResult.categories,
      itemId: item.id,
      modelName: model.name
    });
  }
  
  // Return combined fields (caller should use with DataStore.save)
  return {
    ...item,
    ...moderationFields
  };
}

/**
 * Get human-readable moderation status
 * @param {Object} item - Model instance with moderation fields
 * @returns {string} - Status message
 */
export function getModerationStatus(item) {
  if (!item.moderationCheckedAt) {
    return 'Not checked';
  }
  
  if (item.moderationStatus === 'flagged') {
    try {
      const flags = JSON.parse(item.moderationFlags || '{}');
      const flaggedCategories = Object.entries(flags.categories || {})
        .filter(([_, value]) => value === true)
        .map(([key]) => key);
      
      if (flaggedCategories.length > 0) {
        return `Flagged: ${flaggedCategories.join(', ')}`;
      }
    } catch (e) {
      console.error('Error parsing moderation flags:', e);
    }
    return 'Flagged for review';
  }
  
  return 'Approved';
}

/**
 * Check if content should display a warning
 * @param {Object} item - Model instance with moderation fields
 * @returns {boolean}
 */
export function shouldShowModerationWarning(item) {
  return item.moderationStatus === 'flagged';
}
