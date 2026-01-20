/**
 * @fileoverview Utility to load and transform chat data from JSON files
 * Converts the JSON chat message data into the format expected by ChatSidebar
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const chatBot20 = JSON.parse(readFileSync(join(__dirname, './ui-data/chat-bot-2.0.json'), 'utf-8'));
const chatBot21 = JSON.parse(readFileSync(join(__dirname, './ui-data/chat-bot-2.1.json'), 'utf-8'));
const chatBot23 = JSON.parse(readFileSync(join(__dirname, './ui-data/chat-bot-2.3.json'), 'utf-8'));

// Each import is a single message object, so we create an array
const allChatData = [
  chatBot20,
  chatBot21,
  chatBot23,
];

export { allChatData };