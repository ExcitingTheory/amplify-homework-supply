# Chat Mock Data Guide - Vercel AI SDK Stream Protocol

Comprehensive mock chat message streams following the [Vercel AI SDK Stream Protocol](https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol) for testing ChatSidebar and AI-powered features in Storybook.

## 📋 Overview

The chat mock data provides realistic Server-Sent Events (SSE) streams including:
- Text streaming (token-by-token)
- Tool/function calling
- Multi-tool sequences
- Error handling
- Stream cancellation

All mocks follow the exact Vercel AI SDK protocol used in production.

## 🚀 Quick Start

### Import Mock Streams

```javascript
import MOCK_CHAT_STREAMS from '../../.storybook/__mocks__/chatMockData';

// Use specific stream
const greeting = MOCK_CHAT_STREAMS.SIMPLE.GREETING;

// Use tool calling example
const dictionaryLookup = MOCK_CHAT_STREAMS.TOOLS.DICTIONARY;
```

### Basic Storybook Integration

```javascript
import { MOCK_CHAT_GREETING } from '../../.storybook/__mocks__/chatMockData';

export const ChatSidebarStory = {
  parameters: {
    mockData: [
      {
        url: '/api/chat',
        method: 'POST',
        status: 200,
        response: (req) => {
          // Return SSE stream
          const stream = new ReadableStream({
            start(controller) {
              MOCK_CHAT_GREETING.forEach(event => {
                controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
              });
              controller.close();
            }
          });
          return new Response(stream, {
            headers: { 'Content-Type': 'text/event-stream' }
          });
        }
      }
    ]
  },
  render: () => <ChatSidebar />
};
```

## 📚 Available Stream Types

### Simple Text Streams

**MOCK_CHAT_GREETING** - Basic greeting message
```javascript
// Usage
import { MOCK_CHAT_GREETING } from '../../.storybook/__mocks__/chatMockData';

// Output: "Hello! How can I help you today?"
```

**MOCK_CHAT_EDUCATION_RESPONSE** - Educational content
```javascript
// Explains photosynthesis with proper streaming
```

**MOCK_CHAT_JAPANESE_RESPONSE** - Japanese language content
```javascript
// Output: "こんにちは！\n\n"こんにちは" (konnichiwa) means "Hello"..."
```

### Tool Calling Streams

**MOCK_CHAT_DICTIONARY_LOOKUP** - Dictionary search tool
```javascript
// Flow:
// 1. Text: "Let me look that up..."
// 2. Tool call: search_dictionary({ query: "水" })
// 3. Tool result: { word: "水", phonetic: "mizu", definition: "Water" }
// 4. Text: "I found it! 水 (mizu) means 'water'."
```

**MOCK_CHAT_QUESTION_SEARCH** - Question bank search
```javascript
// Flow:
// 1. Text: "I'll search for biology questions..."
// 2. Tool call: search_questions({ query: "photosynthesis", subject: "biology" })
// 3. Tool result: { questions: [...], count: 2 }
// 4. Text: "I found 2 biology questions about photosynthesis!"
```

**MOCK_CHAT_MULTIPLE_TOOLS** - Sequential tool calls
```javascript
// Flow:
// 1. Text intro
// 2. Tool 1: search_dictionary
// 3. Tool 2: search_questions
// 4. Summary text
```

**MOCK_CHAT_FILE_ANALYSIS** - Image analysis tool
```javascript
// Tool: analyze_image
// Result: Image description, detected text, concepts
```

**MOCK_CHAT_AUDIO_TRANSCRIPTION** - Audio transcription
```javascript
// Tool: transcribe_audio
// Result: Transcribed text, language, confidence
```

### Error Handling

**MOCK_CHAT_TOOL_ERROR** - Tool returns error
```javascript
// Tool result includes error field
// AI responds gracefully to error
```

**MOCK_CHAT_CANCELED** - Stream canceled mid-response
```javascript
// finishReason: 'cancel' instead of 'stop'
```

## 🔧 Stream Protocol Reference

### Event Types

#### Text Delta
```javascript
{
  type: 'text-delta',
  textDelta: 'Hello'
}
```

#### Tool Call Start
```javascript
{
  type: 'tool-call',
  toolCallId: 'call_001',
  toolName: 'search_dictionary',
  args: {}
}
```

#### Tool Arguments (Streaming)
```javascript
{
  toolCallId: 'call_001',
  argsTextDelta: '{"query":'
}
{
  toolCallId: 'call_001',
  argsTextDelta: ' "水"}'
}
```

#### Tool Result
```javascript
{
  type: 'tool-result',
  toolCallId: 'call_001',
  toolName: 'search_dictionary',
  args: { query: '水' },
  result: {
    word: '水',
    phonetic: 'mizu',
    definition: 'Water'
  }
}
```

#### Stream Finish
```javascript
{
  type: 'finish',
  finishReason: 'stop' // or 'cancel', 'length', 'content-filter'
}
```

## 🛠️ Custom Mock Streams

### Create Your Own Stream

```javascript
export const MOCK_CHAT_CUSTOM = [
  // Start with text
  { type: 'text-delta', textDelta: 'Let' },
  { type: 'text-delta', textDelta: ' me' },
  { type: 'text-delta', textDelta: ' help' },
  
  // Optional: Call a tool
  {
    type: 'tool-call',
    toolCallId: 'call_custom_001',
    toolName: 'my_custom_tool',
    args: {}
  },
  {
    toolCallId: 'call_custom_001',
    argsTextDelta: '{"param": "value"}'
  },
  {
    type: 'tool-result',
    toolCallId: 'call_custom_001',
    toolName: 'my_custom_tool',
    args: { param: 'value' },
    result: { data: 'some result' }
  },
  
  // Continue with text
  { type: 'text-delta', textDelta: ' Got' },
  { type: 'text-delta', textDelta: ' it!' },
  
  // Finish
  { type: 'finish', finishReason: 'stop' }
];
```

### Helper Functions

```javascript
import { createSSEDataLine, createSSEStream } from '../../.storybook/__mocks__/chatMockData';

// Create single SSE line
const line = createSSEDataLine({ type: 'text-delta', textDelta: 'Hello' });
// Returns: "data: {...}\n\n"

// Create full stream
const stream = createSSEStream([
  { type: 'text-delta', textDelta: 'Hello' },
  { type: 'finish', finishReason: 'stop' }
]);
// Returns complete SSE format string
```

## 📝 Testing Patterns

### Test Text Streaming

```javascript
import { MOCK_CHAT_GREETING } from '../../.storybook/__mocks__/chatMockData';

// Verify each text-delta event
MOCK_CHAT_GREETING
  .filter(e => e.type === 'text-delta')
  .forEach(event => {
    expect(event.textDelta).toBeDefined();
  });

// Verify completion
const lastEvent = MOCK_CHAT_GREETING[MOCK_CHAT_GREETING.length - 1];
expect(lastEvent.type).toBe('finish');
expect(lastEvent.finishReason).toBe('stop');
```

### Test Tool Calling

```javascript
import { MOCK_CHAT_DICTIONARY_LOOKUP } from '../../.storybook/__mocks__/chatMockData';

// Find tool call
const toolCall = MOCK_CHAT_DICTIONARY_LOOKUP.find(e => e.type === 'tool-call');
expect(toolCall.toolName).toBe('search_dictionary');

// Find tool result
const toolResult = MOCK_CHAT_DICTIONARY_LOOKUP.find(e => e.type === 'tool-result');
expect(toolResult.result.word).toBe('水');
```

### Simulate Streaming Delay

```javascript
async function* streamWithDelay(events, delayMs = 50) {
  for (const event of events) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield event;
  }
}

// Usage in story
export const SlowStreamStory = {
  render: () => {
    const stream = streamWithDelay(MOCK_CHAT_GREETING, 100);
    return <ChatSidebar stream={stream} />;
  }
};
```

## 🎯 Tool Definitions for Mocking

When mocking the useChat hook, provide these tool definitions:

```javascript
const tools = {
  search_dictionary: {
    description: 'Search for words in the dictionary',
    parameters: z.object({
      query: z.string().describe('Word to search for')
    })
  },
  search_questions: {
    description: 'Search for practice questions',
    parameters: z.object({
      query: z.string().describe('Search query'),
      subject: z.string().optional().describe('Subject filter'),
      limit: z.number().optional().describe('Max results')
    })
  },
  analyze_image: {
    description: 'Analyze an uploaded image',
    parameters: z.object({
      fileId: z.string().describe('File ID to analyze')
    })
  },
  transcribe_audio: {
    description: 'Transcribe audio file',
    parameters: z.object({
      fileId: z.string().describe('Audio file ID')
    })
  }
};
```

## 🔗 Integration with Other Mocks

### Combine with Dictionary/Question Mocks

```javascript
import MOCK_CHAT_STREAMS from '../../.storybook/__mocks__/chatMockData';
import { MOCK_WORDS_ALL } from '../../.storybook/__mocks__/mockWordData';
import { MOCK_QUESTIONS_ALL } from '../../.storybook/__mocks__/mockQuestionData';

export const ChatWithDataStory = {
  loaders: [
    async () => {
      // Seed dictionary and questions
      seedMockWords(MOCK_WORDS_ALL);
      seedMockQuestions(MOCK_QUESTIONS_ALL);
    }
  ],
  decorators: [
    (Story) => {
      // Mock chat API to return tool-enabled streams
      return <Story />;
    }
  ],
  render: () => <ChatSidebar />
};
```

## 📖 Examples

### Complete ChatSidebar Story

See [ChatSidebar.stories.tsx](../components/ChatSidebar.stories.tsx) for a full implementation example with:
- Mock SSE streaming
- Tool call handling
- Error states
- Loading states
- Message history

### Testing Tool Execution

```javascript
// Mock tool executor
function executeTool(toolName, args) {
  if (toolName === 'search_dictionary') {
    const word = MOCK_WORDS_ALL.find(w => w.word === args.query);
    return { word: word.word, phonetic: word.phonetic, definition: word.definition };
  }
  
  if (toolName === 'search_questions') {
    const questions = MOCK_QUESTIONS_ALL
      .filter(q => q.prompt.includes(args.query))
      .slice(0, args.limit || 5);
    return { questions, count: questions.length };
  }
}
```

## 🎉 Summary

- ✅ Complete SSE stream protocol support
- ✅ Text streaming with token-by-token delivery
- ✅ Tool/function calling examples
- ✅ Multi-tool sequences
- ✅ Error handling patterns
- ✅ Stream cancellation
- ✅ All streams are production-ready and follow Vercel AI SDK spec
- ✅ Easy integration with existing mock data (Words, Questions, Files)

Use these mocks to test AI-powered features without OpenAI API calls!
