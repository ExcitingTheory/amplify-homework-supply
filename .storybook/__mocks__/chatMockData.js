/**
 * Mock Chat SSE (Server-Sent Events) Data for Storybook
 * 
 * Follows Vercel AI SDK Stream Protocol
 * Reference: https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 * 
 * Provides realistic mock chat messages including:
 * - Regular text streaming
 * - Tool calls (function calling)
 * - Structured data responses
 */

import {allChatData} from './chatDataLoader';


/**
 * Helper to create SSE-formatted data line
 */
export function createSSEDataLine(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Helper to create complete SSE stream
 */
export function createSSEStream(events) {
  return events.map(event => createSSEDataLine(event)).join('');
}

/**
 * Convert message parts to stream events
 * Simulates how the AI SDK streams message content
 */
function messageToStreamEvents(message) {
  const events = [];
  
  if (!message || !message.parts) return events;
  
  for (const part of message.parts) {
    if (part.type === 'text') {
      // Split text into character chunks to simulate streaming
      const text = part.text;
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        events.push({ 
          type: 'text-delta', 
          textDelta: i === 0 ? words[i] : ' ' + words[i]
        });
      }
    } else if (part.type === 'step-start') {
      // Step start indicates beginning of tool use
      events.push({ type: 'step-start' });
    } else if (part.type?.startsWith('tool-')) {
      // Tool call
      const toolName = part.type.replace('tool-', '');
      
      // Tool call initiation
      events.push({
        type: 'tool-call',
        toolCallId: part.toolCallId,
        toolName: toolName,
        args: {}
      });
      
      // Stream tool arguments
      const argsStr = JSON.stringify(part.input || {});
      events.push({
        toolCallId: part.toolCallId,
        argsTextDelta: argsStr
      });
      
      // Tool result (if available)
      if (part.state === 'output-available' && part.output) {
        events.push({
          type: 'tool-result',
          toolCallId: part.toolCallId,
          toolName: toolName,
          args: part.input || {},
          result: part.output
        });
      }
    }
  }
  
  return events;
}

/**
 * Load and convert chat data to stream events
 */
const [chatData1, chatData2, chatData3] = allChatData;

// ==================== STREAMS FROM ACTUAL CHAT DATA ====================

/**
 * Hiragana content search - derived from chat-bot-2.3.json
 */
export const MOCK_CHAT_HIRAGANA_SEARCH = chatData3?.message 
  ? messageToStreamEvents(chatData3.message)
  : [];

/**
 * Simple user message - derived from chat-bot-2.0.json
 */
export const MOCK_CHAT_USER_QUERY = chatData1 
  ? messageToStreamEvents(chatData1)
  : [];

// ==================== SIMPLE TEXT MESSAGES ====================

/**
 * Japanese language response
 */
export const MOCK_CHAT_JAPANESE_RESPONSE = [
  { type: 'text-delta', textDelta: 'こんにちは' },
  { type: 'text-delta', textDelta: '！\n\n' },
  { type: 'text-delta', textDelta: '"' },
  { type: 'text-delta', textDelta: 'こんにちは' },
  { type: 'text-delta', textDelta: '"' },
  { type: 'text-delta', textDelta: ' (konnichiwa)' },
  { type: 'text-delta', textDelta: ' means' },
  { type: 'text-delta', textDelta: ' "Hello"' },
  { type: 'text-delta', textDelta: ' or' },
  { type: 'text-delta', textDelta: ' "Good' },
  { type: 'text-delta', textDelta: ' afternoon"' },
  { type: 'text-delta', textDelta: ' in' },
  { type: 'text-delta', textDelta: ' Japanese' },
  { type: 'text-delta', textDelta: '.' },
  { type: 'finish', finishReason: 'stop' }
];

// ==================== TOOL CALLING EXAMPLES ====================

/**
 * Dictionary lookup tool call
 */
export const MOCK_CHAT_DICTIONARY_LOOKUP = [
  // Initial text response
  { type: 'text-delta', textDelta: 'Let' },
  { type: 'text-delta', textDelta: ' me' },
  { type: 'text-delta', textDelta: ' look' },
  { type: 'text-delta', textDelta: ' that' },
  { type: 'text-delta', textDelta: ' up' },
  { type: 'text-delta', textDelta: '...' },
  
  // Tool call start
  { 
    type: 'tool-call',
    toolCallId: 'call_dict_001',
    toolName: 'search_dictionary',
    args: {}
  },
  
  // Tool arguments streaming
  { 
    toolCallId: 'call_dict_001',
    argsTextDelta: '{"query":'
  },
  { 
    toolCallId: 'call_dict_001',
    argsTextDelta: ' "水"}'
  },
  
  // Tool call complete (sent after tool execution)
  {
    type: 'tool-result',
    toolCallId: 'call_dict_001',
    toolName: 'search_dictionary',
    args: { query: '水' },
    result: {
      word: '水',
      phonetic: 'mizu',
      definition: 'Water; cold water; fluid',
      partOfSpeech: 'noun',
      example: '水を飲む (drink water)'
    }
  },
  
  // Response after tool use
  { type: 'text-delta', textDelta: '\n\nI' },
  { type: 'text-delta', textDelta: ' found' },
  { type: 'text-delta', textDelta: ' it' },
  { type: 'text-delta', textDelta: '!' },
  { type: 'text-delta', textDelta: ' 水' },
  { type: 'text-delta', textDelta: ' (mizu)' },
  { type: 'text-delta', textDelta: ' means' },
  { type: 'text-delta', textDelta: ' "water"' },
  { type: 'text-delta', textDelta: '.' },
  
  { type: 'finish', finishReason: 'stop' }
];

/**
 * Question bank search tool call
 */
export const MOCK_CHAT_QUESTION_SEARCH = [
  { type: 'text-delta', textDelta: 'I\'ll' },
  { type: 'text-delta', textDelta: ' search' },
  { type: 'text-delta', textDelta: ' for' },
  { type: 'text-delta', textDelta: ' biology' },
  { type: 'text-delta', textDelta: ' questions' },
  { type: 'text-delta', textDelta: '...' },
  
  {
    type: 'tool-call',
    toolCallId: 'call_q_001',
    toolName: 'search_questions',
    args: {}
  },
  
  {
    toolCallId: 'call_q_001',
    argsTextDelta: '{"query":'
  },
  {
    toolCallId: 'call_q_001',
    argsTextDelta: ' "photosynthesis",'
  },
  {
    toolCallId: 'call_q_001',
    argsTextDelta: ' "subject": "biology",'
  },
  {
    toolCallId: 'call_q_001',
    argsTextDelta: ' "limit": 5}'
  },
  
  {
    type: 'tool-result',
    toolCallId: 'call_q_001',
    toolName: 'search_questions',
    args: { 
      query: 'photosynthesis',
      subject: 'biology',
      limit: 5
    },
    result: {
      questions: [
        {
          id: 'q-bio-1',
          prompt: 'What is photosynthesis?',
          answer: 'The process by which plants convert light energy into chemical energy',
          difficulty: 'medium'
        },
        {
          id: 'q-bio-2',
          prompt: 'What are the main products of photosynthesis?',
          answer: 'Glucose and oxygen',
          difficulty: 'easy'
        }
      ],
      count: 2
    }
  },
  
  { type: 'text-delta', textDelta: '\n\nI' },
  { type: 'text-delta', textDelta: ' found' },
  { type: 'text-delta', textDelta: ' 2' },
  { type: 'text-delta', textDelta: ' biology' },
  { type: 'text-delta', textDelta: ' questions' },
  { type: 'text-delta', textDelta: ' about' },
  { type: 'text-delta', textDelta: ' photosynthesis' },
  { type: 'text-delta', textDelta: '!' },
  
  { type: 'finish', finishReason: 'stop' }
];

/**
 * Multiple tool calls in sequence
 */
export const MOCK_CHAT_MULTIPLE_TOOLS = [
  { type: 'text-delta', textDelta: 'Let' },
  { type: 'text-delta', textDelta: ' me' },
  { type: 'text-delta', textDelta: ' check' },
  { type: 'text-delta', textDelta: ' the' },
  { type: 'text-delta', textDelta: ' dictionary' },
  { type: 'text-delta', textDelta: ' and' },
  { type: 'text-delta', textDelta: ' find' },
  { type: 'text-delta', textDelta: ' related' },
  { type: 'text-delta', textDelta: ' questions' },
  { type: 'text-delta', textDelta: '...' },
  
  // First tool: Dictionary search
  {
    type: 'tool-call',
    toolCallId: 'call_multi_001',
    toolName: 'search_dictionary',
    args: {}
  },
  {
    toolCallId: 'call_multi_001',
    argsTextDelta: '{"query": "光合成"}'
  },
  {
    type: 'tool-result',
    toolCallId: 'call_multi_001',
    toolName: 'search_dictionary',
    args: { query: '光合成' },
    result: {
      word: '光合成',
      phonetic: 'kōgōsei',
      definition: 'Photosynthesis',
      partOfSpeech: 'noun'
    }
  },
  
  // Second tool: Question search
  {
    type: 'tool-call',
    toolCallId: 'call_multi_002',
    toolName: 'search_questions',
    args: {}
  },
  {
    toolCallId: 'call_multi_002',
    argsTextDelta: '{"query": "photosynthesis", "limit": 3}'
  },
  {
    type: 'tool-result',
    toolCallId: 'call_multi_002',
    toolName: 'search_questions',
    args: { query: 'photosynthesis', limit: 3 },
    result: {
      questions: [
        { id: 'q1', prompt: 'What is photosynthesis?', difficulty: 'medium' }
      ],
      count: 1
    }
  },
  
  { type: 'text-delta', textDelta: '\n\nI' },
  { type: 'text-delta', textDelta: ' found' },
  { type: 'text-delta', textDelta: ' the' },
  { type: 'text-delta', textDelta: ' word' },
  { type: 'text-delta', textDelta: ' 光合成' },
  { type: 'text-delta', textDelta: ' (kōgōsei)' },
  { type: 'text-delta', textDelta: ' which' },
  { type: 'text-delta', textDelta: ' means' },
  { type: 'text-delta', textDelta: ' photosynthesis' },
  { type: 'text-delta', textDelta: ',' },
  { type: 'text-delta', textDelta: ' and' },
  { type: 'text-delta', textDelta: ' 1' },
  { type: 'text-delta', textDelta: ' related' },
  { type: 'text-delta', textDelta: ' question' },
  { type: 'text-delta', textDelta: '.' },
  
  { type: 'finish', finishReason: 'stop' }
];

/**
 * File upload/analysis tool call
 */
export const MOCK_CHAT_FILE_ANALYSIS = [
  { type: 'text-delta', textDelta: 'Analyzing' },
  { type: 'text-delta', textDelta: ' the' },
  { type: 'text-delta', textDelta: ' uploaded' },
  { type: 'text-delta', textDelta: ' image' },
  { type: 'text-delta', textDelta: '...' },
  
  {
    type: 'tool-call',
    toolCallId: 'call_file_001',
    toolName: 'analyze_image',
    args: {}
  },
  {
    toolCallId: 'call_file_001',
    argsTextDelta: '{"fileId":'
  },
  {
    toolCallId: 'call_file_001',
    argsTextDelta: ' "file-image-diagram-1"}'
  },
  {
    type: 'tool-result',
    toolCallId: 'call_file_001',
    toolName: 'analyze_image',
    args: { fileId: 'file-image-diagram-1' },
    result: {
      description: 'Diagram showing the water cycle with labeled stages: evaporation, condensation, precipitation, and collection.',
      detectedText: 'Water Cycle, Evaporation, Condensation, Precipitation',
      concepts: ['water cycle', 'evaporation', 'condensation', 'precipitation', 'earth science']
    }
  },
  
  { type: 'text-delta', textDelta: '\n\nThis' },
  { type: 'text-delta', textDelta: ' image' },
  { type: 'text-delta', textDelta: ' shows' },
  { type: 'text-delta', textDelta: ' a' },
  { type: 'text-delta', textDelta: ' diagram' },
  { type: 'text-delta', textDelta: ' of' },
  { type: 'text-delta', textDelta: ' the' },
  { type: 'text-delta', textDelta: ' water' },
  { type: 'text-delta', textDelta: ' cycle' },
  { type: 'text-delta', textDelta: '.' },
  { type: 'text-delta', textDelta: ' The' },
  { type: 'text-delta', textDelta: ' main' },
  { type: 'text-delta', textDelta: ' stages' },
  { type: 'text-delta', textDelta: ' are' },
  { type: 'text-delta', textDelta: ':' },
  { type: 'text-delta', textDelta: ' evaporation' },
  { type: 'text-delta', textDelta: ',' },
  { type: 'text-delta', textDelta: ' condensation' },
  { type: 'text-delta', textDelta: ',' },
  { type: 'text-delta', textDelta: ' precipitation' },
  { type: 'text-delta', textDelta: ',' },
  { type: 'text-delta', textDelta: ' and' },
  { type: 'text-delta', textDelta: ' collection' },
  { type: 'text-delta', textDelta: '.' },
  
  { type: 'finish', finishReason: 'stop' }
];

/**
 * Audio transcription tool call
 */
export const MOCK_CHAT_AUDIO_TRANSCRIPTION = [
  { type: 'text-delta', textDelta: 'Transcribing' },
  { type: 'text-delta', textDelta: ' the' },
  { type: 'text-delta', textDelta: ' audio' },
  { type: 'text-delta', textDelta: '...' },
  
  {
    type: 'tool-call',
    toolCallId: 'call_audio_001',
    toolName: 'transcribe_audio',
    args: {}
  },
  {
    toolCallId: 'call_audio_001',
    argsTextDelta: '{"fileId": "file-audio-japanese-1"}'
  },
  {
    type: 'tool-result',
    toolCallId: 'call_audio_001',
    toolName: 'transcribe_audio',
    args: { fileId: 'file-audio-japanese-1' },
    result: {
      text: 'こんにちは',
      language: 'ja',
      confidence: 0.95
    }
  },
  
  { type: 'text-delta', textDelta: '\n\nThe' },
  { type: 'text-delta', textDelta: ' audio' },
  { type: 'text-delta', textDelta: ' says' },
  { type: 'text-delta', textDelta: ':' },
  { type: 'text-delta', textDelta: ' "こんにちは"' },
  { type: 'text-delta', textDelta: ' (Hello)' },
  
  { type: 'finish', finishReason: 'stop' }
];

// ==================== ERROR HANDLING ====================

/**
 * Tool call with error
 */
export const MOCK_CHAT_TOOL_ERROR = [
  { type: 'text-delta', textDelta: 'Searching' },
  { type: 'text-delta', textDelta: '...' },
  
  {
    type: 'tool-call',
    toolCallId: 'call_error_001',
    toolName: 'search_dictionary',
    args: {}
  },
  {
    toolCallId: 'call_error_001',
    argsTextDelta: '{"query": "xyz123"}'
  },
  {
    type: 'tool-result',
    toolCallId: 'call_error_001',
    toolName: 'search_dictionary',
    args: { query: 'xyz123' },
    result: {
      error: 'No results found for query: xyz123'
    }
  },
  
  { type: 'text-delta', textDelta: '\n\nI' },
  { type: 'text-delta', textDelta: ' couldn\'t' },
  { type: 'text-delta', textDelta: ' find' },
  { type: 'text-delta', textDelta: ' that' },
  { type: 'text-delta', textDelta: ' word' },
  { type: 'text-delta', textDelta: ' in' },
  { type: 'text-delta', textDelta: ' the' },
  { type: 'text-delta', textDelta: ' dictionary' },
  { type: 'text-delta', textDelta: '.' },
  
  { type: 'finish', finishReason: 'stop' }
];

/**
 * Stream interrupted/canceled
 */
export const MOCK_CHAT_CANCELED = [
  { type: 'text-delta', textDelta: 'Let' },
  { type: 'text-delta', textDelta: ' me' },
  { type: 'text-delta', textDelta: ' explain' },
  { type: 'text-delta', textDelta: ' this' },
  { type: 'text-delta', textDelta: ' in' },
  { type: 'text-delta', textDelta: ' detail' },
  
  { type: 'finish', finishReason: 'cancel' }
];

// ==================== COLLECTIONS ====================

export const MOCK_CHAT_STREAMS = {
  // Streams derived from actual chat data
  FROM_CHAT_DATA: {
    HIRAGANA_SEARCH: MOCK_CHAT_HIRAGANA_SEARCH,
    USER_QUERY: MOCK_CHAT_USER_QUERY,
  },
  // Hand-crafted example streams
  SIMPLE: {
    JAPANESE: MOCK_CHAT_JAPANESE_RESPONSE,
  },
  TOOLS: {
    DICTIONARY: MOCK_CHAT_DICTIONARY_LOOKUP,
    QUESTIONS: MOCK_CHAT_QUESTION_SEARCH,
    MULTIPLE: MOCK_CHAT_MULTIPLE_TOOLS,
    FILE_ANALYSIS: MOCK_CHAT_FILE_ANALYSIS,
    AUDIO: MOCK_CHAT_AUDIO_TRANSCRIPTION,
  },
  ERRORS: {
    TOOL_ERROR: MOCK_CHAT_TOOL_ERROR,
    CANCELED: MOCK_CHAT_CANCELED,
  },
  ALL: [
    ...MOCK_CHAT_HIRAGANA_SEARCH,
    ...MOCK_CHAT_JAPANESE_RESPONSE,
    ...MOCK_CHAT_DICTIONARY_LOOKUP,
    ...MOCK_CHAT_QUESTION_SEARCH,
    ...MOCK_CHAT_MULTIPLE_TOOLS,
    ...MOCK_CHAT_FILE_ANALYSIS,
    ...MOCK_CHAT_AUDIO_TRANSCRIPTION,
    ...MOCK_CHAT_TOOL_ERROR,
    ...MOCK_CHAT_CANCELED,
  ]
};

// Export helper function for custom stream generation
export { messageToStreamEvents };

export default MOCK_CHAT_STREAMS;