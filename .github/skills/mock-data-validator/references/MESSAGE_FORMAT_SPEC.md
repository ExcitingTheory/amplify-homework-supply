# Message Format Specification

Detailed specification for ChatSidebar message.parts format and mock data validation.

## Message Structure

### Core Message Interface
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
  createdAt?: Date;
}
```

---

## MessagePart Types

### Text Part
```typescript
interface TextPart {
  type: 'text';
  text: string;
}
```

**Example**:
```json
{
  "type": "text",
  "text": "Hello, how can I help you?"
}
```

---

### Tool Call Part (Request)
```typescript
interface ToolCallPart {
  type: 'tool-call' | 'tool-search_content' | 'tool-*';
  toolCallId: string;
  state: 'call';
  input: Record<string, any>;
}
```

**Example**:
```json
{
  "type": "tool-search_content",
  "toolCallId": "call_abc123",
  "state": "call",
  "input": {
    "query": "DataStore subscriptions",
    "filePattern": "src/**/*.tsx"
  }
}
```

---

### Tool Result Part (Response)
```typescript
interface ToolResultPart {
  type: 'tool-call' | 'tool-search_content' | 'tool-*';
  toolCallId: string;
  state: 'output-available';
  input: Record<string, any>;
  output: Record<string, any>;
}
```

**Example**:
```json
{
  "type": "tool-search_content",
  "toolCallId": "call_abc123",
  "state": "output-available",
  "input": {
    "query": "DataStore subscriptions"
  },
  "output": {
    "results": [
      {
        "file": "src/context/unitContext.js",
        "line": 45,
        "snippet": "DataStore.observeQuery(Unit)"
      }
    ]
  }
}
```

---

## Message Rendering Logic

### Extract Text from Message
```typescript
function extractText(message: Message): string {
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('');
}
```

### Extract Tools from Message
```typescript
function extractTools(message: Message) {
  return message.parts.filter(part => 
    part.type?.startsWith('tool-')
  );
}
```

### Identify Tool Calls vs Results
```typescript
function getToolCalls(message: Message) {
  return message.parts.filter(part =>
    part.type?.startsWith('tool-') && part.state === 'call'
  );
}

function getToolResults(message: Message) {
  return message.parts.filter(part =>
    part.type?.startsWith('tool-') && part.state === 'output-available'
  );
}
```

---

## Mock Data Examples

### Simple Text Message
```typescript
// .storybook/__mocks__/ui-data/chatMessages.ts
export const simpleTextMessage: Message = {
  id: '1',
  role: 'user',
  parts: [
    {
      type: 'text',
      text: 'What is DataStore?'
    }
  ]
};
```

---

### Message with Tool Call
```typescript
export const messageWithToolCall: Message = {
  id: '2',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: 'Let me search for information about DataStore.'
    },
    {
      type: 'tool-search_content',
      toolCallId: 'call_search_1',
      state: 'call',
      input: {
        query: 'DataStore observeQuery',
        includePattern: 'src/context/**'
      }
    }
  ]
};
```

---

### Message with Tool Result
```typescript
export const messageWithToolResult: Message = {
  id: '3',
  role: 'assistant',
  parts: [
    {
      type: 'tool-search_content',
      toolCallId: 'call_search_1',
      state: 'output-available',
      input: {
        query: 'DataStore observeQuery'
      },
      output: {
        files: [
          {
            path: 'src/context/unitContext.js',
            matches: 3
          }
        ]
      }
    },
    {
      type: 'text',
      text: 'I found 3 references to DataStore.observeQuery in unitContext.js'
    }
  ]
};
```

---

### Complex Multi-Part Message
```typescript
export const complexMessage: Message = {
  id: '4',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: 'I will search for DataStore patterns and read the file.'
    },
    {
      type: 'tool-search_content',
      toolCallId: 'call_search_2',
      state: 'call',
      input: {
        query: 'DataStore.observeQuery',
        isRegexp: false
      }
    },
    {
      type: 'tool-search_content',
      toolCallId: 'call_search_2',
      state: 'output-available',
      input: {
        query: 'DataStore.observeQuery'
      },
      output: {
        files: ['src/context/unitContext.js']
      }
    },
    {
      type: 'text',
      text: 'Now let me read the file...'
    },
    {
      type: 'tool-read_file',
      toolCallId: 'call_read_1',
      state: 'call',
      input: {
        filePath: 'src/context/unitContext.js',
        offset: 40,
        limit: 20
      }
    },
    {
      type: 'tool-read_file',
      toolCallId: 'call_read_1',
      state: 'output-available',
      input: {
        filePath: 'src/context/unitContext.js'
      },
      output: {
        content: 'const subscription = DataStore.observeQuery(Unit)...'
      }
    },
    {
      type: 'text',
      text: 'Here is the DataStore pattern used in the codebase...'
    }
  ]
};
```

---

## Validation Rules

### Required Fields
- ✅ `parts` array must exist
- ✅ `parts` must not be empty
- ✅ Each part must have `type` field
- ✅ Tool parts must have `toolCallId` and `state`

### Type Validation
```typescript
function validateMessageParts(message: Message): ValidationResult {
  const errors: string[] = [];

  // Check parts exist
  if (!message.parts || !Array.isArray(message.parts)) {
    errors.push('Message must have parts array');
  }

  // Check parts not empty
  if (message.parts.length === 0) {
    errors.push('Message parts array cannot be empty');
  }

  // Validate each part
  message.parts.forEach((part, index) => {
    if (!part.type) {
      errors.push(`Part ${index}: missing type field`);
    }

    if (part.type?.startsWith('tool-')) {
      if (!part.toolCallId) {
        errors.push(`Part ${index}: tool part missing toolCallId`);
      }
      if (!part.state) {
        errors.push(`Part ${index}: tool part missing state`);
      }
      if (!['call', 'output-available'].includes(part.state)) {
        errors.push(`Part ${index}: invalid state "${part.state}"`);
      }
    }

    if (part.type === 'text' && !part.text) {
      errors.push(`Part ${index}: text part missing text field`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Common Validation Errors

### ❌ Incorrect: Using message.content
```typescript
// WRONG - message.content does not exist
const text = message.content;
```

### ✅ Correct: Using message.parts
```typescript
// RIGHT - extract text from parts
const text = message.parts
  .filter(p => p.type === 'text')
  .map(p => p.text)
  .join('');
```

---

### ❌ Incorrect: Assuming single part
```typescript
// WRONG - assumes only one part
const text = message.parts[0].text;
```

### ✅ Correct: Handling multiple parts
```typescript
// RIGHT - handle all text parts
const textParts = message.parts
  .filter(p => p.type === 'text');
```

---

### ❌ Incorrect: Hardcoded tool type
```typescript
// WRONG - only checks one tool type
const hasTool = message.parts.some(p => p.type === 'tool-search_content');
```

### ✅ Correct: Generic tool detection
```typescript
// RIGHT - checks all tool types
const hasTools = message.parts.some(p => p.type?.startsWith('tool-'));
```

---

## TypeScript Type Guards

```typescript
function isTextPart(part: MessagePart): part is TextPart {
  return part.type === 'text';
}

function isToolCallPart(part: MessagePart): part is ToolCallPart {
  return part.type?.startsWith('tool-') && part.state === 'call';
}

function isToolResultPart(part: MessagePart): part is ToolResultPart {
  return part.type?.startsWith('tool-') && part.state === 'output-available';
}

// Usage
message.parts.forEach(part => {
  if (isTextPart(part)) {
    console.log('Text:', part.text);
  } else if (isToolCallPart(part)) {
    console.log('Tool call:', part.toolCallId, part.input);
  } else if (isToolResultPart(part)) {
    console.log('Tool result:', part.toolCallId, part.output);
  }
});
```
