# Gen 1 → Gen 2 Schema Simplification & Analysis

## Current Gen 1 Schema Summary

**11 Core Models:**
- Unit, Assignment, Grade, Section, Word, Question, File, Document, ParsedContent, AgentJob, AssistantChat, Settings, AIFeedback

**Observations:**
1. **Schema is well-designed** - Clear relationships, good auth rules, proper indexing
2. **Heavy GraphQL Mutations** - 30+ custom mutations (OpenAI functions)
3. **JSON fields for flexibility** - `data`, `metadata`, `feedback`, `webhookData`, `resumeState`
4. **Moderation built-in** - `moderationStatus`, `moderationFlags` on Unit, Question, Word, Grade
5. **Embeddings scattered** - `embedding`, `embeddingModel`, `embeddingDimensions` repeated on Unit, Word, Question, File, Section

## Proposed Simplifications for Gen 2

### 1. Consolidate Embedding Fields into Shared Type
```typescript
// Instead of repeating embedding fields 5+ times
type EmbeddingInfo {
  embedding: [Float!]!
  model: String!
  dimensions: Int!
  version: AWSTimestamp!
  wordCount: Int!
}
```

**Models to simplify:**
- Unit, Word, Question, File, Section
- Move from 5 fields each → 1 embedded object

**Impact:** -25 fields, cleaner model definitions, easier to extend embeddings

### 2. Consolidate Moderation Fields into Shared Type
```typescript
type ModerationInfo {
  status: String  // "pending", "approved", "flagged"
  flags: AWSJSON  // Categories
  checkedAt: AWSDateTime
}
```

**Models to simplify:**
- Unit, Question, Word, Grade, ParsedContent (if needed)
- Move from 3 fields each → 1 embedded object

**Impact:** -12 fields, consistent moderation across models

### 3. Convert Lambda Mutations to Custom Handlers (Keep in Schema, move logic to handlers)
**Current approach (works fine):**
```graphql
generateAudio(phrase: String!, voice: String): String 
  @function(name: "openaiFunction")
```

**Gen 2 equivalent** - No change needed! Gen 2 supports custom mutations the same way, but can use:
- Direct Lambda references via `@lambda`
- Or move to WebSocket handlers for streaming

**For Phase 1:** Keep as-is, migrate to `@lambda` directive when Lambda functions converted

### 4. Flatten Audio/Waveform Data Storage
**Current (works but redundant):**
```graphql
audio: [String]
waveformData: AWSJSON
definitionAudio: [String]
definitionWaveformData: AWSJSON
```

**Gen 2 approach:** Keep as-is (S3 paths handled separately), but document the pattern

### 5. Simplify ParsedContent Structure
**Current:** Each field is AWSJSON (vocabularyJSON, summariesJSON, etc.)

**Gen 2 approach:** Create concrete types for better querying later
```typescript
type VocabularyItem {
  word: String!
  definition: String
  context: String
  page: Int
}

type ParsedContent {
  ...
  vocabulary: [VocabularyItem]
  summaries: [SummaryItem]
  objectives: [ObjectiveItem]
  concepts: [ConceptItem]
  questions: [QuestionItem]
}
```

**Trade-off:** More verbose schema, but enables:
- Typed queries: `unit.documents.parsedContent.vocabulary.list()`
- Better introspection
- Easier to validate in Lambda

**Decision:** Keep AWSJSON for now (flexible during iteration), add typed models in Phase 2 if needed

## Gen 2 Migration Path

### Step 1: Verbatim Port (Fastest)
Copy all models 1:1 to TypeScript with embedded types for Embedding + Moderation
- **Pros:** Fast, minimal testing, safe
- **Cons:** Still repetitive, harder to maintain

### Step 2: Simplified Port (Recommended for Phase A)
- Consolidate Embedding + Moderation fields
- Keep other optimizations for later
- Add TypeScript enums for constants (PublishedStatus, FileProtectionLevels, etc.)

### Step 3: Advanced Refactor (Post-Phase A)
- Convert AWSJSON to typed models gradually
- Simplify ParsedContent after testing real usage
- Move more mutations to WebSocket handlers

## File-Based Convention (Gen 2 Feature)

Gen 2 uses directory structure as schema organization:
```
amplify/
  data/
    resource.ts                     # Main defineData() export
    models/
      core.ts                        # Unit, Assignment, Grade, Section
      content.ts                     # Word, Question, File
      analysis.ts                    # Document, ParsedContent, AgentJob
      user.ts                        # Settings, AIFeedback
      chat.ts                        # AssistantChat
```

**Benefits:**
- Logical grouping by domain
- Easier to find & modify related models
- Can import/export type subsets

## Recommendations

**For Phase A (This Week):**
1. ✅ Verbatim port all 11 models to TypeScript
2. ✅ Add EmbeddingInfo & ModerationInfo types (consolidates 37 fields → 8)
3. ✅ Use file-based convention (separate domain files)
4. ✅ Keep mutations as-is (migrate Lambda functions in Phase D)
5. ⏸ Keep AWSJSON fields as-is (refactor later if needed)

**Result:** Clean Gen 2 schema in ~400 lines TypeScript (vs 541 GraphQL)

## Next: Create Gen 2 Backend Structure

Ready to:
1. Create `amplify/backend.ts` (main config)
2. Create `amplify/data/resource.ts` with consolidated models
3. Deploy to sandbox
4. Verify schema in AppSync console

Proceed?
