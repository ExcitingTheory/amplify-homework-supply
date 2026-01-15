/**
 * @fileoverview Utility to load and transform chat data from JSON files
 * Converts the JSON chat message data into the format expected by ChatSidebar
 */

import chatBot20 from './ui-data/chat-bot-2.0.json';
import chatBot21 from './ui-data/chat-bot-2.1.json';
import chatBot23 from './ui-data/chat-bot-2.3.json';

// Each import is a single message object, so we create an array
const allChatData = [
  chatBot20,
  chatBot21,
  chatBot23,
];

export { allChatData };