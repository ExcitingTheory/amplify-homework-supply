# Client-Side Tool Handling Implementation Guide

## Overview

This document explains how to implement proper client-side tool handling with the Vercel AI SDK v6 for the ChatSidebar component. Tool calling allows the AI assistant to execute functions on the client side where DataStore access is available.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  ChatSidebar│  HTTP   │  Lambda      │  API    │   OpenAI    │
│  (Client)   │ ──────> │  /chat       │ ──────> │   GPT-4o    │
│             │         │              │         │             │
│  useChat()  │ <────── │  SSE Stream  │ <────── │  Streaming  │
│  + Tools    │   SSE   │  + Tools     │  Stream │  + Tools    │
└─────────────┘         └──────────────┘         └─────────────┘
       │
       │ Execute tools locally
       ▼
┌─────────────────┐
│   DataStore     │
│   (Local DB)    │
└─────────────────┘
```

## Implementation Components

### 1. Backend: Lambda Function (chatStream)

**File**: `amplify/backend/function/chatStream/src/app.js`

**Key Changes**:
- Use **Server-Sent Events (SSE)** format instead of plain text
- Stream tool calls as structured JSON chunks
- Set `Content-Type: text/event-stream`

**SSE Format**:
```javascript
// Text content
data: {"type":"text-delta","textDelta":"Hello"}\n\n

// Tool call start
data: {"type":"tool-call-delta","toolCallType":"function","toolCallId":"call_abc123","toolName":"search_content","argsTextDelta":"{"}\n\n

// Tool call arguments (streaming)
data: {"type":"tool-call-delta","toolCallType":"function","toolCallId":"call_abc123","toolName":"search_content","argsTextDelta":"\"query\""}\n\n

// Finish
data: {"type":"finish","finishReason":"tool_calls"}\n\n
data: [DONE]\n\n
```

**Backend Implementation**:
```javascript
// Stream OpenAI format: "data: {...}\n\n"
for await (const chunk of completion) {
  const delta = chunk.choices[0]?.delta;
  
  // Handle text content
  if (delta?.content) {
    const dataChunk = {
      type: 'text-delta',
      textDelta: delta.content,
    };
    res.write(`data: ${JSON.stringify(dataChunk)}\n\n`);
  }
  
  // Handle tool calls
  if (delta?.tool_calls) {
    for (const toolCall of delta.tool_calls) {
      if (toolCall.id) {
        const chunk = {
          type: 'tool-call-delta',
          toolCallType: 'function',
          toolCallId: toolCall.id,
          toolName: toolCall.function?.name || '',
          argsTextDelta: toolCall.function?.arguments || '',
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      } else if (toolCall.function?.arguments) {
        // Continuation of arguments
        const deltaChunk = {
          type: 'tool-call-delta',
          toolCallType: 'function',
          toolCallId: currentToolCall?.toolCallId,
          toolName: currentToolCall?.toolName,
          argsTextDelta: toolCall.function.arguments,
        };
        res.write(`data: ${JSON.stringify(deltaChunk)}\n\n`);
      }
    }
  }
}

res.write('data: [DONE]\n\n');
res.end();
```

### 2. Client: ChatSidebar Component

**File**: `src/components/ChatSidebar.js`

**Key Changes** (✅ ALL IMPLEMENTED):
- ✅ Use `DefaultChatTransport` with `streamProtocol: 'data'`
- ✅ Define tools with `experimental_tools`
- ✅ Use `experimental_sendAutomaticallyWhen` for automatic tool execution
- ✅ Register 12 client-side CRUD tools
- ✅ Remove deprecated `onToolCall` pattern
- ✅ Remove `addToolOutputRef` workaround

**Transport Setup** (✅ IMPLEMENTED):
```javascript
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';

const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    fetch: customFetch, // Custom fetch that routes through Amplify
    streamProtocol: 'data', // SSE format with tool call support
}), [customFetch]);
```

**Tool Registration** (✅ IMPLEMENTED):
```javascript
// Register all client-side tools with experimental_tools pattern
const clientSideTools = useMemo(() => {
    const tools = {};
    
    // List of tools that should execute client-side (have access to DataStore)
    const clientSideToolNames = [
        'search_content',
        'create_section',
        'create_unit',
        'create_assignment',
        'add_timer_to_unit',
        'create_vocabulary_word',
        'create_question',
        'list_sections',
        'list_units',
        'get_unit_details',
        'update_unit',
        'delete_assignment'
    ];

    // Register each client-side tool
    toolDefinitions.forEach(toolDef => {
        const toolName = toolDef.function.name;
        
        if (clientSideToolNames.includes(toolName)) {
            tools[toolName] = {
                description: toolDef.function.description,
                parameters: toolDef.function.parameters,
                execute: async (args) => {
                    console.log(`[ChatSidebar] Executing ${toolName}:`, args);
                    
                    try {
                        const result = await executeTool(toolName, args);
                        console.log(`[ChatSidebar] ${toolName} result:`, result);
                        return result;
                    } catch (error) {
                        console.error(`[ChatSidebar] Error executing ${toolName}:`, error);
                        return {
                            success: false,
                            error: error.message || `Failed to execute ${toolName}`
                        };
                    }
                }
            };
        }
    });

    return tools;
}, []);

const chatHookResult = useChat({
    transport,
    
    // Register client-side tools using experimental_tools
    experimental_tools: clientSideTools,
    
    // Automatically execute client-side tools when ready
    experimental_sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    
    onError: (error) => {
        console.error('Chat error:', error);
    },
    
    onFinish: (message) => {
        console.log('Message finished:', message);
    },
});
```

### 3. Tool Definitions

**File**: `src/utils/chatTools.js`

Tools are defined with OpenAI function calling schema and executed client-side:

```javascript
export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'search_content',
      description: 'Search through files, vocabulary, and questions',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
          type: { 
            type: 'string', 
            enum: ['all', 'files', 'words', 'questions'],
            description: 'Type of content to search'
          },
        },
        required: ['query']
      }
    }
  },
  // ... more tools
];

export async function executeTool(toolName, args) {
  const toolMap = {
    search_content: executeSearchContent,
    create_section: executeCreateSection,
    // ... more executors
  };

  const executor = toolMap[toolName];
  if (!executor) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  try {
    return await executor(args);
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, error: error.message };
  }
}
```

## Message Flow

### 1. User sends message
```javascript
sendMessage({ text: "Search for photosynthesis" });
```

### 2. Lambda sends SSE stream
```
data: {"type":"text-delta","textDelta":"I'll"}\n\n
data: {"type":"text-delta","textDelta":" search"}\n\n
data: {"type":"tool-call-delta","toolCallType":"function","toolCallId":"call_123","toolName":"search_content","argsTextDelta":"{"}\n\n
data: {"type":"tool-call-delta","toolCallType":"function","toolCallId":"call_123","toolName":"search_content","argsTextDelta":"\"query\":\"photosynthesis\""}\n\n
data: {"type":"tool-call-delta","toolCallType":"function","toolCallId":"call_123","toolName":"search_content","argsTextDelta":"}"}\n\n
data: {"type":"finish","finishReason":"tool_calls"}\n\n
```

### 3. Client executes tool
```javascript
// AI SDK automatically calls:
const result = await executeTool('search_content', { query: 'photosynthesis' });

// Returns:
{
  success: true,
  results: [
    { type: 'file', name: 'Biology Unit 3', similarity: 0.92 },
    { type: 'word', phrase: '光合成', definition: 'photosynthesis', similarity: 0.95 }
  ]
}
```

### 4. Client sends tool result back
```javascript
// AI SDK automatically sends tool result
messages.push({
  role: 'assistant',
  parts: [
    { type: 'tool-call', toolCallId: 'call_123', toolName: 'search_content', args: {...} },
    { type: 'tool-result', toolCallId: 'call_123', result: {...} }
  ]
});
```

### 5. Lambda generates final response
```
data: {"type":"text-delta","textDelta":"I found"}\n\n
data: {"type":"text-delta","textDelta":" 2 results"}\n\n
data: {"type":"finish","finishReason":"stop"}\n\n
```

## Rendering Tool Calls in UI

**File**: `src/components/ChatSidebar.js`

Tool calls are stored in `message.parts` array:

```javascript
{messages.map((message) => {
  // Extract text content
  const textContent = message.parts
    ?.filter(part => part.type === 'text')
    .map(part => part.text)
    .join('');
  
  // Extract tool invocations
  const toolParts = message.parts?.filter(part => 
    part.type?.startsWith('tool-')
  ) || [];
  
  return (
    <Box key={message.id}>
      {/* Render text */}
      {textContent && <pre>{textContent}</pre>}
      
      {/* Render tools */}
      {toolParts.map((part) => (
        <Box key={part.toolCallId} sx={{ bgcolor: 'info.light', p: 1 }}>
          <Typography variant="caption">
            🔧 {part.type.replace('tool-', '')}
          </Typography>
          
          {part.state === 'input-streaming' && (
            <Typography>Preparing tool call...</Typography>
          )}
          
          {part.state === 'input-available' && (
            <Typography>Executing...</Typography>
          )}
          
          {part.state === 'output-available' && (
            <Typography color="success.main">
              ✓ Success: {JSON.stringify(part.output)}
            </Typography>
          )}
          
          {part.state === 'output-error' && (
            <Typography color="error.main">
              ✗ Error: {part.errorText}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
})}
```

## Available Tools

### Content Management
- `search_content` - Semantic search across files, vocabulary, questions
- `list_sections` - List all class sections
- `list_units` - List all learning units
- `get_unit_details` - Get detailed unit information

### Creation Tools
- `create_section` - Create new class section
- `create_unit` - Create new learning unit
- `create_assignment` - Assign unit to section
- `create_vocabulary_word` - Add word to dictionary
- `create_question` - Add practice question

### Modification Tools
- `update_unit` - Update unit properties
- `add_timer_to_unit` - Set time limit for unit
- `delete_assignment` - Remove assignment

### Content Generation
- `generate_unit_content` - Generate educational content templates

## Debugging

### Enable Debug Logging
```javascript
// Backend
console.log('[Chat] Tool call chunk:', JSON.stringify(chunk));

// Client
console.log('[ChatSidebar] Tool execution:', toolName, args);
console.log('[ChatSidebar] Tool result:', result);
```

### Check Network Tab
1. Open browser DevTools → Network
2. Filter for `/chat` requests
3. Check Response → EventStream
4. Look for `data: {...}` chunks

### Common Issues

**Problem**: Tools not executing
- **Check**: `experimental_tools` is properly defined
- **Check**: `experimental_sendAutomaticallyWhen` is set
- **Check**: Backend sends `type: 'tool-call-delta'` chunks

**Problem**: Tool results not appearing
- **Check**: Tool executor returns proper JSON structure
- **Check**: `execute` function is async and returns Promise
- **Check**: Error handling in executor doesn't swallow results

**Problem**: Stream ends prematurely
- **Check**: Backend sends `data: [DONE]\n\n` at end
- **Check**: No errors in Lambda CloudWatch logs
- **Check**: Response headers include `Content-Type: text/event-stream`

## Testing

### Manual Test
```javascript
// Send message that should trigger tool
sendMessage({ text: "Search for photosynthesis" });

// Expected console output:
// [ChatSidebar] Executing tool: search_content { query: "photosynthesis" }
// [executeSearchContent] Starting search...
// [ChatSidebar] Tool result: { success: true, results: [...] }
```

### Unit Test (Future)
```javascript
import { executeTool } from './chatTools';

test('search_content returns results', async () => {
  const result = await executeTool('search_content', { 
    query: 'test', 
    type: 'all' 
  });
  
  expect(result.success).toBe(true);
  expect(result.results).toBeDefined();
});
```

## Best Practices

1. **Always validate tool arguments** in executor functions
2. **Return structured JSON** with `success` and `error` fields
3. **Log tool executions** for debugging
4. **Handle DataStore errors** gracefully
5. **Use tool results in UI** to show progress
6. **Test tool functions independently** before integration
7. **Document tool parameters** clearly in descriptions
8. **Keep tool functions focused** - one responsibility each
9. **Use semantic search** when available for better results
10. **Cache expensive operations** where appropriate

## Performance Considerations

- **Tool execution is client-side** - has access to local DataStore
- **Multiple tool calls** can happen in sequence
- **Streaming continues** after tool execution for final response
- **Tool results are included** in next message to AI for context
- **Large results** should be summarized before sending back to AI

## Security

- **Tool execution happens client-side** with user's auth context
- **All DataStore operations** respect Amplify auth rules
- **Tools cannot access** data outside user's permissions
- **No sensitive data** should be logged in tool execution
- **Validate all inputs** before DataStore operations

## Future Enhancements

- [ ] Add tool execution rate limiting
- [ ] Implement tool result caching
- [ ] Add undo/redo for destructive tools
- [ ] Create tool execution history/audit log
- [ ] Add tool execution analytics
- [ ] Build tool composition (chaining)
- [ ] Add tool permission system
- [ ] Implement optimistic UI updates
