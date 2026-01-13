/**
 * Consolidated mock exports for backwards compatibility
 * Re-exports everything from the modular mock files
 * 
 * This file is used to replace imports from '../models' in Storybook
 */

// Re-export the initSchema function and all DataStore functionality
export * from './aws-amplify-datastore.js';

// Re-export auth, storage, utils, and api mocks
export * from './aws-amplify-auth.js';
export * from './aws-amplify-storage.js';
export * from './aws-amplify-utils.js';
export * from './aws-amplify-api.js';

// ==================== MOCK DATA EXPORTS ====================

// Media & Files
export * from './mockMediaData.js';
export * from './mockFileData.js';

// Vocabulary & Questions
export * from './mockWordData.js';
export * from './mockQuestionData.js';

// Embeddings & Semantic Search
export * from './mockEmbeddingUtils.js';
export * from './mockSemanticSearchExample.js';

// Chat & AI Streaming
export * from './chatMockData.js';

// Convenience exports
import MOCK_FILES from './mockFileData.js';
import MOCK_WORDS from './mockWordData.js';
import MOCK_QUESTIONS from './mockQuestionData.js';
import MOCK_CHAT_STREAMS from './chatMockData.js';

export const MOCK_DATA = {
  FILES: MOCK_FILES,
  WORDS: MOCK_WORDS,
  QUESTIONS: MOCK_QUESTIONS,
  CHAT: MOCK_CHAT_STREAMS,
};
