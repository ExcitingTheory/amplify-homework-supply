/**
 * @fileoverview Utility to load and transform chat data from JSON files
 * Converts the JSON chat message data into the format expected by AssistantChat model
 */

import chatBot20 from './ui-data/chat-bot-2.0.json';
import chatBot21 from './ui-data/chat-bot-2.1.json';
import chatBot23 from './ui-data/chat-bot-2.3.json';

/**
 * Create a properly formatted AssistantChat model object
 * This wraps the individual message objects into an AssistantChat structure
 * 
 * Note: messages is stored as an array (not JSON string) because Amplify Gen 2
 * automatically parses a.json() fields when reading from the database.
 * chatBot23 IS the messages array (it's a JSON array at the top level).
 */
const allChatData = {
  id: 'mock-assistant-chat-1',
  owner: 'mock-user-sub',
  model: 'gpt-4o',
  threadId: 'mock-thread-id-1',
  threadInstructions: 'You are a helpful Japanese language learning assistant.',
  additionalInstructions: null,
  moderationFlag: false,
  // chatBot23 is the messages array directly (top-level JSON array)
  messages: chatBot23,
  draft: '',
  archived: false,
  inputTokens: '150',
  outputTokens: '350',
  createdAt: new Date('2024-01-26T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-26T10:15:00Z').toISOString(),
  _version: 1,
  _deleted: null,
  _lastChangedAt: Date.now(),
};

export { allChatData };