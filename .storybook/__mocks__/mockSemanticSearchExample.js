/**
 * Mock Semantic Search Example
 * 
 * Demonstrates how to use mock embeddings for semantic search testing
 * in Storybook without requiring OpenAI API calls.
 */

import { 
  generateMockEmbedding, 
  cosineSimilarity, 
  findSimilarItems 
} from './mockEmbeddingUtils';

import {
  MOCK_WORDS_JAPANESE,
  MOCK_WORDS_SPANISH,
  MOCK_WORDS_FRENCH,
  MOCK_WORDS_BIOLOGY,
  MOCK_WORDS_PHILOSOPHY,
  MOCK_WORDS_SCIENCE,
} from './mockWordData';

import {
  MOCK_QUESTIONS_JAPANESE,
  MOCK_QUESTIONS_SPANISH,
  MOCK_QUESTIONS_FRENCH,
  MOCK_QUESTIONS_BIOLOGY,
  MOCK_QUESTIONS_PHILOSOPHY,
  MOCK_QUESTIONS_SCIENCE,
} from './mockQuestionData';

/**
 * Perform semantic search across Words
 * 
 * @param {string} query - Search query text
 * @param {number} [topK=5] - Number of results to return
 * @returns {Array} Top K similar words with scores
 */
export function searchWords(query, topK = 5) {
  const queryEmbedding = generateMockEmbedding(query);
  
  const allWords = [
    ...MOCK_WORDS_JAPANESE,
    ...MOCK_WORDS_SPANISH,
    ...MOCK_WORDS_FRENCH,
    ...MOCK_WORDS_BIOLOGY,
    ...MOCK_WORDS_PHILOSOPHY,
    ...MOCK_WORDS_SCIENCE,
  ];
  
  return findSimilarItems(queryEmbedding, allWords, topK);
}

/**
 * Perform semantic search across Questions
 * 
 * @param {string} query - Search query text
 * @param {number} [topK=5] - Number of results to return
 * @returns {Array} Top K similar questions with scores
 */
export function searchQuestions(query, topK = 5) {
  const queryEmbedding = generateMockEmbedding(query);
  
  const allQuestions = [
    ...MOCK_QUESTIONS_JAPANESE,
    ...MOCK_QUESTIONS_SPANISH,
    ...MOCK_QUESTIONS_FRENCH,
    ...MOCK_QUESTIONS_BIOLOGY,
    ...MOCK_QUESTIONS_PHILOSOPHY,
    ...MOCK_QUESTIONS_SCIENCE,
  ];
  
  return findSimilarItems(queryEmbedding, allQuestions, topK);
}

/**
 * Search both Words and Questions together
 * 
 * @param {string} query - Search query text
 * @param {number} [topK=10] - Number of results to return
 * @returns {object} Results separated by type
 */
export function searchAll(query, topK = 10) {
  const queryEmbedding = generateMockEmbedding(query);
  
  const allWords = [
    ...MOCK_WORDS_JAPANESE,
    ...MOCK_WORDS_SPANISH,
    ...MOCK_WORDS_FRENCH,
    ...MOCK_WORDS_BIOLOGY,
    ...MOCK_WORDS_PHILOSOPHY,
    ...MOCK_WORDS_SCIENCE,
  ];
  
  const allQuestions = [
    ...MOCK_QUESTIONS_JAPANESE,
    ...MOCK_QUESTIONS_SPANISH,
    ...MOCK_QUESTIONS_FRENCH,
    ...MOCK_QUESTIONS_BIOLOGY,
    ...MOCK_QUESTIONS_PHILOSOPHY,
    ...MOCK_QUESTIONS_SCIENCE,
  ];
  
  // Combine and tag items by type
  const allItems = [
    ...allWords.map(w => ({ ...w, itemType: 'word' })),
    ...allQuestions.map(q => ({ ...q, itemType: 'question' }))
  ];
  
  const results = findSimilarItems(queryEmbedding, allItems, topK);
  
  return {
    all: results,
    words: results.filter(r => r.item.itemType === 'word'),
    questions: results.filter(r => r.item.itemType === 'question'),
  };
}

/**
 * Find similar words to a given word
 * 
 * @param {object} word - Word object with embedding
 * @param {number} [topK=5] - Number of results (excludes the input word)
 * @returns {Array} Top K similar words
 */
export function findSimilarWords(word, topK = 5) {
  const allWords = [
    ...MOCK_WORDS_JAPANESE,
    ...MOCK_WORDS_SPANISH,
    ...MOCK_WORDS_FRENCH,
    ...MOCK_WORDS_BIOLOGY,
    ...MOCK_WORDS_PHILOSOPHY,
    ...MOCK_WORDS_SCIENCE,
  ];
  
  // Find similar items, then filter out the input word
  const results = findSimilarItems(word.embedding, allWords, topK + 1);
  return results.filter(r => r.item.id !== word.id).slice(0, topK);
}

/**
 * Find similar questions to a given question
 * 
 * @param {object} question - Question object with embedding
 * @param {number} [topK=5] - Number of results (excludes the input question)
 * @returns {Array} Top K similar questions
 */
export function findSimilarQuestions(question, topK = 5) {
  const allQuestions = [
    ...MOCK_QUESTIONS_JAPANESE,
    ...MOCK_QUESTIONS_SPANISH,
    ...MOCK_QUESTIONS_FRENCH,
    ...MOCK_QUESTIONS_BIOLOGY,
    ...MOCK_QUESTIONS_PHILOSOPHY,
    ...MOCK_QUESTIONS_SCIENCE,
  ];
  
  // Find similar items, then filter out the input question
  const results = findSimilarItems(question.embedding, allQuestions, topK + 1);
  return results.filter(r => r.item.id !== question.id).slice(0, topK);
}

// ==================== EXAMPLE USAGE ====================

/**
 * Example: Search for water-related vocabulary
 */
export function exampleWaterSearch() {
  console.log('=== Searching for "water" ===\n');
  
  const results = searchWords('water', 3);
  
  results.forEach(({ item, similarity }, index) => {
    console.log(`${index + 1}. ${item.word} (${item.phonetic})`);
    console.log(`   Definition: ${item.definition}`);
    console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
    console.log('');
  });
  
  return results;
}

/**
 * Example: Search for biology questions
 */
export function exampleBiologySearch() {
  console.log('=== Searching for biology questions ===\n');
  
  const results = searchQuestions('What is photosynthesis?', 3);
  
  results.forEach(({ item, similarity }, index) => {
    console.log(`${index + 1}. ${item.prompt}`);
    console.log(`   Answer: ${item.answer}`);
    console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
    console.log('');
  });
  
  return results;
}

/**
 * Example: Find similar words to a Japanese word
 */
export function exampleFindSimilar() {
  console.log('=== Finding words similar to "水 (mizu - water)" ===\n');
  
  const waterWord = MOCK_WORDS_JAPANESE.find(w => w.word === '水');
  if (!waterWord) {
    console.log('Word not found');
    return [];
  }
  
  const results = findSimilarWords(waterWord, 3);
  
  results.forEach(({ item, similarity }, index) => {
    console.log(`${index + 1}. ${item.word} (${item.phonetic})`);
    console.log(`   Definition: ${item.definition}`);
    console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
    console.log('');
  });
  
  return results;
}

/**
 * Example: Multi-language search
 */
export function exampleMultiLanguageSearch() {
  console.log('=== Searching for greetings across languages ===\n');
  
  const results = searchWords('hello greeting', 5);
  
  results.forEach(({ item, similarity }, index) => {
    console.log(`${index + 1}. ${item.word} (${item.phonetic})`);
    console.log(`   Definition: ${item.definition}`);
    console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
    console.log('');
  });
  
  return results;
}

/**
 * Example: Combined search across words and questions
 */
export function exampleCombinedSearch() {
  console.log('=== Combined search for "philosophy ancient greece" ===\n');
  
  const results = searchAll('philosophy ancient greece', 5);
  
  console.log('Words found:');
  results.words.forEach(({ item, similarity }, index) => {
    console.log(`  ${index + 1}. ${item.word} - ${item.definition}`);
    console.log(`     Similarity: ${(similarity * 100).toFixed(1)}%`);
  });
  
  console.log('\nQuestions found:');
  results.questions.forEach(({ item, similarity }, index) => {
    console.log(`  ${index + 1}. ${item.prompt}`);
    console.log(`     Similarity: ${(similarity * 100).toFixed(1)}%`);
  });
  
  return results;
}

// ==================== STORYBOOK INTEGRATION ====================

/**
 * Mock DataStore semantic search for Storybook
 * 
 * This function can be used in Storybook mocks to replace real DataStore queries
 * with semantic search using embeddings.
 * 
 * @param {string} modelName - 'Word' or 'Question'
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Array} Search results
 */
export async function mockDataStoreSemanticSearch(modelName, query, limit = 10) {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (modelName === 'Word') {
    const results = searchWords(query, limit);
    return results.map(r => r.item);
  }
  
  if (modelName === 'Question') {
    const results = searchQuestions(query, limit);
    return results.map(r => r.item);
  }
  
  throw new Error(`Unknown model: ${modelName}`);
}

/**
 * Mock GraphQL semantic search mutation
 * 
 * Can be used to mock the semanticSearch GraphQL mutation in Storybook
 * 
 * @param {object} variables - { query, modelName, limit }
 * @returns {object} GraphQL response format
 */
export async function mockGraphQLSemanticSearch({ query, modelName, limit = 10 }) {
  const items = await mockDataStoreSemanticSearch(modelName, query, limit);
  
  return {
    data: {
      semanticSearch: {
        items,
        nextToken: null,
      }
    }
  };
}

// Run examples if in Node.js environment
if (typeof window === 'undefined' && require.main === module) {
  console.log('\n📚 Mock Semantic Search Examples\n');
  console.log('='.repeat(50));
  console.log('\n');
  
  exampleWaterSearch();
  console.log('-'.repeat(50) + '\n');
  
  exampleBiologySearch();
  console.log('-'.repeat(50) + '\n');
  
  exampleMultiLanguageSearch();
  console.log('-'.repeat(50) + '\n');
  
  exampleCombinedSearch();
}

export default {
  searchWords,
  searchQuestions,
  searchAll,
  findSimilarWords,
  findSimilarQuestions,
  mockDataStoreSemanticSearch,
  mockGraphQLSemanticSearch,
  examples: {
    exampleWaterSearch,
    exampleBiologySearch,
    exampleFindSimilar,
    exampleMultiLanguageSearch,
    exampleCombinedSearch,
  }
};
