# Phase D: Lambda Function Migration to Gen 2

**Status:** In Progress  
**Estimated Duration:** 2 weeks  
**Dependencies:** Phase A (Gen 2 backend), Phase C (WebSocket)

## Overview

Phase D migrates all Gen 1 Lambda functions to Gen 2 custom queries/mutations with function handlers. This includes:
- OpenAI integrations (chat, audio, image, transcription)
- Document analysis & PDF processing
- Embeddings generation
- Content moderation
- AI feedback collection

## Function Inventory

### Mutations (Data-modifying operations)

| Function | Gen 1 Name | Gen 2 Type | Handler | Purpose |
|----------|-----------|-----------|---------|---------|
| `chat` | openai-${env} | Mutation | openaiHandler | Stream chat via Vercel AI SDK |
| `generateAudio` | openai-${env} | Mutation | openaiHandler | Generate audio phrase (Vercel AI) |
| `generateAudioFile` | openai-${env} | Mutation | openaiHandler | Generate + save audio to S3 |
| `generateImage` | openai-${env} | Mutation | openaiHandler | Generate image prompt (Vercel AI) |
| `generateImageFile` | openai-${env} | Mutation | openaiHandler | Generate + save image to S3 |
| `analyzeDocument` | analyzeDocument-${env} | Mutation | documentAnalysisHandler | Start async PDF analysis |
| `cancelDocumentAnalysis` | analyzeDocument-${env} | Mutation | documentAnalysisHandler | Cancel running analysis |
| `generateEmbeddings` | generateEmbeddings-${env} | Mutation | embeddingsHandler | Generate page embeddings |
| `generateEmbedding` | generateEmbedding-${env} | Mutation | embeddingsHandler | Generate single embedding |
| `moderateContent` | moderation-${env} | Mutation | moderationHandler | Check content with OpenAI |
| `contentCompletion` | contentCompletion-${env} | Mutation | aiHandler | AI-assisted content generation |
| `suggestBlocks` | suggestBlocks-${env} | Mutation | aiHandler | Suggest Lexical blocks for unit |
| `predictUnitData` | predictUnitData-${env} | Mutation | aiHandler | Predict unit structure |
| `predictUnitByData` | predictUnitByData-${env} | Mutation | aiHandler | Predict from existing data |
| `useAssistantEditor` | openai-${env} | Mutation | assistantHandler | Use OpenAI Assistant thread |
| `initAssistantEditor` | openai-${env} | Mutation | assistantHandler | Initialize Assistant |
| `updateAssistantEditor` | openai-${env} | Mutation | assistantHandler | Update Assistant config |
| `deleteAssistantEditor` | openai-${env} | Mutation | assistantHandler | Delete Assistant + thread |
| `chatAssistantThread` | openai-${env} | Mutation | assistantHandler | Chat with Assistant thread |
| `createSectionGroup` | manageSection-${env} | Mutation | sectionHandler | Create class section |
| `addSelfToSection` | manageSection-${env} | Mutation | sectionHandler | Student joins section |

### Queries (Read-only operations)

| Function | Gen 1 Name | Gen 2 Type | Handler | Purpose |
|----------|-----------|-----------|---------|---------|
| `listSectionStudents` | manageSection-${env} | Query | sectionHandler | List students in section |
| `verifyDefinition` | openai-${env} | Query | openaiHandler | Check definition correctness |
| `verifyWord` | openai-${env} | Query | openaiHandler | Check word understanding |
| `verifyShortAnswer` | openai-${env} | Query | openaiHandler | Grade short answer |
| `transcribe` | openai-${env} | Query | openaiHandler | Transcribe audio file |
| `verifyAudio` | openai-${env} | Query | openaiHandler | Verify audio response (base64) |
| `verifyAudioUrl` | openai-${env} | Query | openaiHandler | Verify audio response (S3 URL) |
| `transcribeUrl` | openai-${env} | Query | openaiHandler | Transcribe audio from S3 URL |
| `processImage` | openai-${env} | Query | openaiHandler | Analyze image (base64) |
| `processImageUrl` | openai-${env} | Query | openaiHandler | Analyze image from S3 URL |
| `verifyImage` | openai-${env} | Query | openaiHandler | Verify image response (base64) |
| `verifyImageUrl` | openai-${env} | Query | openaiHandler | Verify image response (S3 URL) |

## Migration Strategy

### Option A: Lift & Shift (Recommended for Phase D)
- Wrap existing Gen 1 Lambda functions with Gen 2 mutation/query handlers
- No code changes to Lambda logic
- Minimal testing required
- **Timeline:** Fast (~1 week)

### Option B: Full Rewrite
- Rewrite Lambda functions for Gen 2 best practices
- Consolidate multiple functions into single handler
- Better error handling, structured logging
- **Timeline:** 2-3 weeks

### Decision: Use Option A for Phase D
- Phase D focus: Get functions working in Gen 2 schema
- Phase F (later) can optimize/consolidate

## Implementation Plan

### Step 1: Organize Functions by Handler

**openaiHandler** (consolidates 12 functions):
```
- chat, generateAudio, generateAudioFile
- generateImage, generateImageFile
- verifyDefinition, verifyWord, verifyShortAnswer
- transcribe, verifyAudio, verifyAudioUrl, transcribeUrl
- processImage, processImageUrl, verifyImage, verifyImageUrl
```

**documentAnalysisHandler** (consolidates 2 functions):
```
- analyzeDocument
- cancelDocumentAnalysis
```

**embeddingsHandler** (consolidates 2 functions):
```
- generateEmbeddings
- generateEmbedding
```

**aiHandler** (consolidates 4 functions):
```
- contentCompletion
- suggestBlocks
- predictUnitData
- predictUnitByData
```

**assistantHandler** (consolidates 5 functions):
```
- useAssistantEditor, initAssistantEditor
- updateAssistantEditor, deleteAssistantEditor
- chatAssistantThread
```

**sectionHandler** (consolidates 3 functions):
```
- createSectionGroup, addSelfToSection
- listSectionStudents
```

**moderationHandler** (1 function):
```
- moderateContent
```

### Step 2: Define Custom Types & Return Types

```typescript
// Custom types for return values
type EmbeddingResult = {
  embedding: [Float!]!
  model: String!
  dimensions: Int!
  tokenCount: Int!
  error: String
}

type ModerationResult = {
  flagged: Boolean!
  categories: AWSJSON!
  categoryScores: AWSJSON!
  model: String!
  error: String
}

type AnalyzeDocumentResult = {
  success: Boolean!
  fileID: ID!
  documentID: ID
  responseId: String
  pageCount: Int
  progress: String
  message: String
}

type StudentInfo = {
  id: ID!
  name: String
  email: String
}
```

### Step 3: Define Custom Mutations/Queries in Schema

Pattern for each function:
```typescript
// In amplify/data/resource.ts
chat: a
  .mutation()
  .arguments({
    messages: a.string().required(),
    model: a.string()
  })
  .returns(a.string()) // or a.ref('CustomType')
  .authorization(allow => [allow.authenticated()])
  .handler(a.handler.function(openaiHandler))
```

### Step 4: Create Function Handlers

Structure:
```
amplify/data/handlers/
├── openai/handler.ts
├── documentAnalysis/handler.ts
├── embeddings/handler.ts
├── ai/handler.ts
├── assistant/handler.ts
├── section/handler.ts
└── moderation/handler.ts
```

Each handler routes to appropriate function based on `event.info.fieldName`:
```typescript
export const handler: Schema["chat"]["functionHandler"] = async (event) => {
  const { fieldName, arguments: args } = event;
  
  switch (fieldName) {
    case 'chat':
      return await handleChat(args);
    case 'generateAudio':
      return await handleGenerateAudio(args);
    // ... etc
  }
}
```

## File Structure

```
amplify/
├── data/
│   ├── resource.ts (UPDATED - add custom mutations/queries)
│   └── handlers/
│       ├── openai/
│       │   ├── handler.ts (NEW)
│       │   ├── chat.ts (NEW - logic for chat mutation)
│       │   ├── audio.ts (NEW - generateAudio, generateAudioFile)
│       │   └── verify.ts (NEW - verify* functions)
│       ├── documentAnalysis/handler.ts (NEW)
│       ├── embeddings/handler.ts (NEW)
│       ├── ai/handler.ts (NEW)
│       ├── assistant/handler.ts (NEW)
│       ├── section/handler.ts (NEW)
│       └── moderation/handler.ts (NEW)
├── backend.ts (unchanged)
├── auth/resource.ts (unchanged)
└── custom/websocket/ (from Phase C)
```

## Implementation Checklist

- [ ] Add custom return types to data/resource.ts
- [ ] Add chat mutation (openaiHandler)
- [ ] Add generateAudio mutations (openaiHandler)
- [ ] Add image mutations (openaiHandler)
- [ ] Add verify* queries (openaiHandler)
- [ ] Add transcribe queries (openaiHandler)
- [ ] Add analyzeDocument mutations (documentAnalysisHandler)
- [ ] Add generateEmbedding mutations (embeddingsHandler)
- [ ] Add AI content mutations (aiHandler)
- [ ] Add assistant mutations (assistantHandler)
- [ ] Add section mutations/queries (sectionHandler)
- [ ] Add moderation mutation (moderationHandler)
- [ ] Test each function locally
- [ ] Update frontend clients to use new mutations/queries
- [ ] Performance testing (streaming responses, async operations)

## Testing Strategy

### Unit Tests
- Each handler function tested independently
- Mock OpenAI, S3, DynamoDB calls

### Integration Tests
- Full mutation/query flow from frontend
- Error handling (auth failures, rate limits, API errors)

### Load Tests
- Multiple concurrent requests
- Streaming response handling (chat, audio generation)

## Known Challenges

1. **Streaming Responses** - Chat needs to stream tokens
   - **Solution:** AppSync supports streaming subscriptions; implement via WebSocket + AppSync

2. **Async Operations** - Document analysis takes time
   - **Solution:** Use async function handlers (fire-and-forget) + webhooks

3. **Large Uploads** - Audio/image base64 encoding large
   - **Solution:** Use S3 pre-signed URLs + file references instead

## Next Steps

- [ ] Create Phase D implementation document
- [ ] Start with openaiHandler (most functions)
- [ ] Test locally with sandbox
- [ ] Move to Phase E frontend integration
