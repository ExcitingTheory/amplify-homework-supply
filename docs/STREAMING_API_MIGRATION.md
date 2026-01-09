# Streaming API Migration Guide

## Overview

Migrated AI authoring features from Edge API routes to AWS Lambda with proper streaming support via REST API.

## What Was Created

### Lambda Functions (Express-based with `aws-serverless-express`)

1. **chatStream** - Streaming chat with tool calling
   - Path: `amplify/backend/function/chatStream/`
   - Endpoint: `POST /chat`
   - Features: OpenAI streaming, tool calls, context building
   - Dependencies: `openai@4.52.7`, `@aws-sdk/client-ssm@3.0.0`

2. **contentCompletionStream** - Streaming content completion
   - Path: `amplify/backend/function/contentCompletionStream/`
   - Endpoint: `POST /complete`
   - Features: Sentence/paragraph completion with streaming
   - Dependencies: `openai@4.52.7`, `@aws-sdk/client-ssm@3.0.0`

3. **suggestBlocksStream** - Block suggestions (JSON response)
   - Path: `amplify/backend/function/suggestBlocksStream/`
   - Endpoint: `POST /suggest-blocks`
   - Features: Pedagogical analysis, structured JSON output
   - Dependencies: `openai@4.52.7`, `@aws-sdk/client-ssm@3.0.0`

## Frontend Migration Status

✅ **COMPLETED** - Frontend has been updated to use REST API endpoints.

### What Was Changed

1. **AIContentCompletionPlugin** - Updated to call `/complete` REST API
   - Removed GraphQL client and mutations
   - Added streaming support via `post()` from `aws-amplify/api`
   - Real-time suggestion updates as content streams in

2. **BlockSuggestionPlugin** - Updated to call `/suggest-blocks` REST API
   - Removed GraphQL client and mutations  
   - Uses `post()` from `aws-amplify/api` for JSON responses
   - Maintains same pedagogical analysis features

3. **ChatSidebar** - Uses proxy endpoint at `/pages/api/chat.js`
   - Keeps Vercel AI SDK's `useChat` hook (no changes needed)
   - Proxy forwards to Amplify REST API with streaming
   - Tool calling continues to work client-side

### Implementation Details

#### Content Completion (Streaming)
```javascript
// src/components/Editor3/plugins/AIContentCompletionPlugin.js
import { post } from 'aws-amplify/api';

const restOperation = post({
  apiName: 'completions',
  path: '/complete',
  options: {
    body: { prompt, context: contextData },
  },
});

const { body } = await restOperation.response;
const reader = body.getReader();
const decoder = new TextDecoder();
let completion = '';

// Stream and update suggestion in real-time
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  completion += decoder.decode(value, { stream: true });
  setSuggestion(completion); // Updates as it streams!
}
```

#### Block Suggestions (JSON)
```javascript
// src/components/Editor3/plugins/BlockSuggestionPlugin.js
import { post } from 'aws-amplify/api';

const restOperation = post({
  apiName: 'completions',
  path: '/suggest-blocks',
  options: {
    body: { unitStructure, currentContext, userHistory },
  },
});

const { body } = await restOperation.response;
const text = await body.text();
const data = JSON.parse(text);
return data.suggestions || [];
```

#### Chat Proxy
```javascript
// pages/api/chat.js
import { post } from 'aws-amplify/api';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { messages, context } = await req.json();
  
  const restOperation = post({
    apiName: 'completions',
    path: '/chat',
    options: { body: { messages, context } },
  });

  const response = await restOperation.response;
  
  // Forward streaming response to useChat hook
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## Next Steps

### 1. ⚠️ CRITICAL: Add Lambda Functions to REST API

**You still need to connect these functions to API Gateway.** Run:

```bash
amplify update api
```

When prompted:
1. Select **REST** API
2. Choose the **completions** API (or create a new "completions" API)
3. Add the following paths:

| Path | Lambda Function | Method | Auth |
|------|----------------|--------|------|
| `/chat` | chatStream | POST | Cognito |
| `/complete` | contentCompletionStream | POST | Cognito |
| `/suggest-blocks` | suggestBlocksStream | POST | Cognito |

**Important**: Enable CORS for all endpoints!

### 2. Deploy Everything

```bash
# Push all changes to AWS
amplify push -y

# After deployment, test each endpoint
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/main/chat \
  -H "Authorization: Bearer YOUR-JWT-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"context":{}}'
```

### 3. Verify OpenAI API Key in SSM

Make sure the OpenAI API key parameter exists for each function:

```bash
# Check if parameters exist
aws ssm get-parameters \
  --names \
    "/amplify/YOUR_APP_ID/main/AMPLIFY_function_chatStream_OPENAI_API_KEY" \
    "/amplify/YOUR_APP_ID/main/AMPLIFY_function_contentCompletionStream_OPENAI_API_KEY" \
    "/amplify/YOUR_APP_ID/main/AMPLIFY_function_suggestBlocksStream_OPENAI_API_KEY" \
  --with-decryption
```

If they don't exist, Amplify will prompt you to add them during `amplify push`.

### 4. Test Each Endpoint

### 5. Remove Old Functions (After Testing)
- Delete `amplify/backend/function/contentCompletion`
- Delete `amplify/backend/function/suggestBlocks`
- Delete `amplify/backend/function/chat` (the non-streaming one)
- Optionally keep `pages/api/chat.js` as a proxy or delete if using direct API calls

## Architecture Benefits

✅ **Real Streaming**: Lambda → API Gateway → Client (event stream)  
✅ **Authentication**: Cognito User Pool authorizer  
✅ **Centralized**: All AI endpoints in one REST API  
✅ **Monitoring**: CloudWatch logs for all Lambda functions  
✅ **Consistent**: Same infrastructure pattern as completions  
✅ **Better DX**: Use `useChat` hook from Vercel AI SDK  

## Testing Checklist

- [ ] ChatSidebar renders and accepts input
- [ ] Chat messages stream in real-time
- [ ] Tool calling works (create_section, search_content, etc.)
- [ ] Content completion appears as ghost text
- [ ] Content completion streams smoothly
- [ ] Block suggestions menu shows AI-powered suggestions
- [ ] Block suggestions include reasoning and priority
- [ ] Authentication is required (401 without valid token)
- [ ] CORS headers allow requests from your domain
- [ ] Error messages are helpful and logged

## Troubleshooting

### Streaming Not Working
- Check API Gateway has Lambda Proxy Integration enabled
- Verify `Content-Type: text/event-stream` header is set
- Ensure Lambda doesn't buffer response (use streaming mode)

### 401 Unauthorized
- Verify Cognito authorizer is configured on API Gateway
- Check JWT token is being sent in Authorization header
- Ensure user pool ID matches auth configuration

### OpenAI API Errors
- Verify SSM parameter exists and has correct value
- Check Lambda has permissions to access SSM
- Review CloudWatch logs for actual OpenAI error messages

### Cold Start Delays
- Consider provisioned concurrency for chat endpoint
- Implement connection pooling for OpenAI client
- Use Lambda layers for shared dependencies

## Performance Considerations

- **Cold Start**: 500-1000ms first invocation
- **Warm Start**: <100ms subsequent invocations  
- **Streaming Latency**: ~500ms to first token
- **API Key Caching**: SSM calls cached in Lambda memory
- **OpenAI Client**: Reused across invocations when warm

## Cost Estimate

Per 1000 requests:
- Lambda invocations: $0.20
- API Gateway: $3.50
- OpenAI API (varies by tokens)
- SSM GetParameter (cached): ~$0.00

Total: ~$3.70/1k requests (excluding OpenAI)
