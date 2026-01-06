/**
 * Central export for all mock responses
 * 
 * Import mocks like:
 * import { mockContentCompletion, mockSuggestBlocks, mockChat } from '../../../mocks/responses';
 */

import * as contentCompletionMocks from './contentCompletion';
import * as suggestBlocksMocks from './suggestBlocks';
import * as chatMocks from './chat';

// Re-export with clear namespacing
export const mockContentCompletion = contentCompletionMocks.default;
export const mockSuggestBlocks = suggestBlocksMocks.default;
export const mockChat = chatMocks.default;

// Export individual mocks for direct access
export {
  // Content Completion
  standardJapanese,
  longCompletion,
  shortCompletion,
  technicalContent,
  conversational,
  withKanji,
  empty as emptyCompletion,
  veryLong,
  withSpecialChars,
  slowResponse as slowCompletion,
  error as completionError,
  networkTimeout as completionTimeout,
} from './contentCompletion';

export {
  // Block Suggestions
  afterHeading,
  afterExplanation,
  afterMultipleExplanations,
  afterQuiz,
  afterPractice,
  emptyLesson,
  complexLesson,
  singleSuggestion,
  fourSuggestions,
  noHighPriority,
  allHighPriority,
  longReasoning,
  shortReasoning,
  error as suggestBlocksError,
  malformedJSON,
} from './suggestBlocks';

export {
  // Chat
  standardResponse as chatStandardResponse,
  helpWithUnit,
  vocabularyAssistance,
  questionGeneration,
  contentSuggestion,
  searchToolCall,
  createSectionToolCall,
  generateContentToolCall,
  multipleToolCalls,
  longResponse as chatLongResponse,
  errorResponse as chatError,
  networkTimeout as chatTimeout,
  invalidContext,
  emptyResponse as chatEmpty,
  shortResponse as chatShort,
  withKanjiAndFormatting,
} from './chat';

// Default export with all mocks organized
export default {
  contentCompletion: contentCompletionMocks.default,
  suggestBlocks: suggestBlocksMocks.default,
  chat: chatMocks.default,
};
