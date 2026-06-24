# Agent Architecture Plan

## Overview

Transform the Kai (student) and Sage (instructor) chatbots from context-stuffed bots into tool-calling agents with semantic retrieval (RAG), persistent memory tiers, configurable hyperparameters, and streaming multi-step execution. Leverage existing embedding infrastructure (text-embedding-3-small, 512d, IVF search bundles) for retrieval tools.

## Goals

- [x] Convert `/api/chat` from single-turn `streamText` to multi-step agent with `maxSteps` (streaming preserved via `toDataStreamResponse()`)
- [x] Add server-side retrieval tools (RAG over embeddings, file content, document search)
- [x] Add memory tools (read/write per-user, per-section, per-unit conversation memory)
- [x] Add instructor-specific analytics tools (student progress, section struggles)
- [x] Add model hyperparameter tuning UI in admin settings and section settings
- [x] Slim system prompt to essentials + let agent retrieve context on demand
- [x] Use IVF clustering for large bundles, linear scan for small, HNSW for future scale
- [x] Stream all responses including intermediate tool calls to UI
- [x] Use SSE-compatible structured generation (`structuredOutput` / tool schemas) where appropriate

## Non-Goals

- External vector database (Pinecone, Weaviate) — scale doesn't justify it yet
- OpenAI Assistants API — too opaque, less control
- Fine-tuned models — prompt engineering + RAG is sufficient
- Real-time collaboration on memory — eventual consistency is fine

## Architecture

### Agent Execution Model

```
User message → /api/chat (POST)
    │
    ├─ Step 1: streamText with tools + maxSteps
    │    ├─ Model decides: answer directly OR call tool(s)
    │    ├─ If tool call → execute server-side tools → feed result back
    │    ├─ If client-side tool → stream tool call to client → client executes
    │    └─ Continue until model produces final text or maxSteps reached
    │
    ├─ All steps streamed via toDataStreamResponse()
    │    ├─ Text chunks: "0:..." 
    │    ├─ Tool calls: "b:..." 
    │    ├─ Tool results: "9:..."
    │    └─ Finish: "d:..."
    │
    └─ After final response: async memory update (non-blocking)
```

### AI SDK v6 Agent Pattern

```typescript
// Current (single-step):
const result = streamText({
  model: openai("gpt-4o"),
  system: systemMessage,
  messages,
  tools,
  temperature: 0.7,
});

// Agent (multi-step with streaming):
const result = streamText({
  model: openai(resolvedModel), // configurable per persona
  system: slimSystemMessage,    // minimal context + tool descriptions
  messages,
  tools: agentTools,            // server-side + client-side tools
  maxSteps: 5,                  // allow multi-step reasoning
  temperature,                  // configurable
  maxOutputTokens,              // configurable
  // onStepFinish for memory updates
  onStepFinish: async ({ toolCalls, toolResults, text }) => {
    // Async: log tool usage, update conversation memory
  },
});

return result.toDataStreamResponse(); // streaming preserved
```

### Tool Architecture

#### Server-Side Tools (execute on server, results streamed back)

| Tool | Persona | Description |
|------|---------|-------------|
| `semantic_search` | Both | RAG over embeddings — units, words, questions, documents |
| `read_file_content` | Both | Retrieve actual file content (text/PDF transcript/audio transcript) |
| `get_student_progress` | Both | Grades, accuracy, attempts for student (Kai: self only) |
| `get_student_memory` | Both | Full structured memory profile |
| `update_memory_insight` | Both | Write new learning insight to conversation memory |
| `recall_conversations` | Both | Search past conversation summaries by topic |
| `get_course_outline` | Both | Full section outline with summaries |
| `get_section_analytics` | Sage | Aggregated student struggles, common errors |
| `get_student_list` | Sage | List students in section with progress summary |
| `generate_embedding` | Sage | Embed arbitrary text for comparison |

#### Client-Side Tools (streamed to UI, executed in browser)

| Tool | Persona | Description |
|------|---------|-------------|
| `search_content` | Both | Existing client-side search (kept for UI integration) |
| `startPracticeDrill` | Kai | Launch practice drill dialog |
| `create_section` | Sage | Create new class section |
| `copy_gamification_settings` | Sage | Copy settings between sections |
| `create_recording_script` | Sage | Generate RS3 script |
| `insert_*` | Sage | Block insertion tools (heading, quiz, etc.) |

#### Structured Generation Tools

For tools that return structured data the UI renders:

```typescript
// Example: semantic_search returns typed results
semantic_search: tool({
  description: "Search course content using semantic similarity",
  parameters: z.object({
    query: z.string(),
    scope: z.enum(["unit", "section", "all"]).default("unit"),
    types: z.array(z.enum(["units", "words", "questions", "documents", "files"])).default(["units", "words", "questions"]),
    limit: z.number().default(5),
  }),
  execute: async ({ query, scope, types, limit }) => {
    // 1. Generate query embedding via OpenAI
    // 2. Load search bundle(s) from S3
    // 3. IVF or linear search based on bundle size
    // 4. Return scored results with content previews
    return { results: [...], totalMatched: N };
  },
}),
```

### Memory Model

#### New Schema: ConversationMemory

```typescript
ConversationMemory: a.model({
  _version: a.integer(),
  _lastChangedAt: a.timestamp(),
  _deleted: a.boolean(),
  // Scoping
  userId: a.string().required(),
  role: a.enum(["learner", "instructor", "admin"]),
  sectionId: a.id(),            // null = cross-section
  unitId: a.id(),               // null = section-wide
  // Short-term: rolling summary of recent conversations
  recentSummary: a.string(),    // last 3-5 conversation summaries
  recentUpdatedAt: a.datetime(),
  // Long-term: accumulated insights
  insights: a.json(),           // [{topic, insight, confidence, sourceConversationId, updatedAt}]
  // Preferences learned over time
  preferences: a.json(),        // {communicationStyle, detailLevel, preferredLanguage}
  // Topic tracking (avoid repetition, deepen on return)
  topicsDiscussed: a.json(),    // [{topic, lastDiscussedAt, depth, wasResolved}]
  // Embedding for memory retrieval
  embedding: EmbeddingInfo,
})
.secondaryIndexes(index => [
  index("userId").sortKeys(["sectionId"]).name("byUser"),
  index("sectionId").sortKeys(["unitId"]).name("bySection"),
])
.authorization(allow => [
  allow.ownerDefinedIn("userId"),
  allow.group("Admins"),
  allow.group("Instructors").to(["read"]),
]),
```

#### Memory Tiers

```
┌─────────────────────────────────────────────────────────────────────┐
│ Tier 1: Always in System Prompt (~1-2K tokens)                       │
│  • Unit name + summary (from courseOutline)                           │
│  • Student's top 3 weak areas (from StudentMemory)                   │
│  • Communication preference (from ConversationMemory.preferences)    │
│  • Current grade status (complete/in-progress, accuracy)             │
│                                                                      │
│ Tier 2: Retrieved by Tool (~5-8K tokens per call)                    │
│  • Full student memory profile (get_student_memory)                  │
│  • Relevant unit content via RAG (semantic_search)                   │
│  • Past conversation context (recall_conversations)                  │
│  • File/document content (read_file_content)                         │
│                                                                      │
│ Tier 3: Deep Search (on explicit user request)                       │
│  • Cross-unit semantic search                                        │
│  • Full section analytics (instructor only)                          │
│  • Historical grade data                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Embedding Search Architecture

#### Current Infrastructure (Keep)

- **Model**: `text-embedding-3-small` (512 dimensions)
- **Storage**: S3 JSON bundles per unit/instructor
- **Index strategies**: Linear scan (small bundles) and IVF (large bundles)
- **Client-side search**: IndexedDB-cached bundles with IVF/linear search

#### Additions for Agent RAG

```
┌─────────────────────────────────────────────────────────────────────┐
│ SEARCH STRATEGY SELECTION (by bundle size)                           │
│                                                                      │
│  < 100 items  → Linear scan (brute force cosine similarity)          │
│    • Exact results, no index overhead                                │
│    • Used for: single unit content, small vocab sets                 │
│                                                                      │
│  100-5000 items → IVF (Inverted File Index)                          │
│    • K-means clustering with nProbe centroid scan                    │
│    • Already implemented in searchBundles.ts                         │
│    • Used for: instructor-wide search, section content               │
│    • Parameters: k=√N centroids, nProbe=max(3, k/4)                 │
│                                                                      │
│  5000+ items → HNSW (Hierarchical Navigable Small Worlds)            │
│    • Required for platform-wide search and community browse          │
│    • Build graph at index time, traverse at query time               │
│    • Parameters: M=16 connections, efConstruction=200, efSearch=50   │
│    • Needed now — platform bundle exceeds IVF efficiency threshold   │
│                                                                      │
│ SCORING                                                              │
│  • L2-normalized dot product (equivalent to cosine similarity)       │
│  • Threshold: 0.3 (filter noise)                                    │
│  • Re-ranking: optional BM25 hybrid for keyword+semantic fusion      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Server-Side Retrieval Flow

```typescript
// In semantic_search tool execute():
async function executeSemanticSearch(query, scope, types, limit, context) {
  // 1. Embed query
  const queryEmbedding = await generateEmbedding(query); // 512d
  const normalizedQuery = l2Normalize(queryEmbedding);

  // 2. Determine search scope
  const bundlePaths = [];
  if (scope === "unit" && context.unitId) {
    bundlePaths.push(`protected/${context.identityId}/search-index/unit/${context.unitId}.json`);
  } else if (scope === "section") {
    // Load all unit bundles in section
    for (const entry of context.courseOutline || []) {
      bundlePaths.push(`protected/${context.identityId}/search-index/unit/${entry.unitId}.json`);
    }
  } else {
    bundlePaths.push(`private/${context.identityId}/search-index/instructor.json`);
  }

  // 3. Load bundles and search
  const allResults = [];
  for (const path of bundlePaths) {
    const bundle = await loadBundleFromS3(path);
    if (!bundle) continue;
    
    // Strategy auto-selected by bundle
    const results = searchBundle(normalizedQuery, bundle, limit, 0.3);
    allResults.push(...results);
  }

  // 4. Sort by score, deduplicate, truncate
  allResults.sort((a, b) => b.score - a.score);
  return allResults.slice(0, limit).map(r => ({
    id: r.item.id,
    type: r.item.type,
    title: r.item.title,
    preview: r.item.meta.preview?.substring(0, 500),
    score: Math.round(r.score * 100) / 100,
    unitId: r.item.meta.unitId,
  }));
}
```

### Hyperparameter Tuning UI

#### PlatformSettings Schema Additions

```typescript
// Add to PlatformSettings model:
// Agent behavior
agentMaxSteps: a.integer().default(5),          // Max tool-calling rounds per turn
agentDefaultTemperature: a.float().default(0.7),
agentDefaultMaxTokens: a.integer().default(4000),
// Per-persona overrides
kaiTemperature: a.float(),
kaiMaxTokens: a.integer(),
kaiMaxSteps: a.integer(),
sageTemperature: a.float(),
sageMaxTokens: a.integer(),
sageMaxSteps: a.integer(),
// Search tuning
searchThreshold: a.float().default(0.3),         // Min cosine similarity for results
searchDefaultLimit: a.integer().default(5),       // Default result count
searchNProbeMultiplier: a.float().default(0.25),  // nProbe = k * multiplier
// Memory
memoryEnabled: a.boolean().default(true),
memorySummarizationModel: a.string(),             // Model for conversation summarization
```

#### Section-Level Overrides (in Section.gamificationConfig or new field)

```typescript
// Add to Section model:
aiConfig: a.json(),
// Stored shape: {
//   kaiEnabled?: boolean,
//   sageEnabled?: boolean,
//   kaiModel?: string,          // override per-section
//   sageModel?: string,
//   kaiTemperature?: number,
//   sageTemperature?: number,
//   kaiSystemPromptAppend?: string,  // section-specific instructions
//   sageSystemPromptAppend?: string,
//   searchThreshold?: number,
//   memoryEnabled?: boolean,
// }
```

#### Admin Settings UI (Platform-wide)

Add to `app/[locale]/admin/settings/page.tsx`:

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Agent Configuration                                           │
│                                                                  │
│ ┌─ Model Selection ─────────────────────────────────────────┐   │
│ │ Default Model: [gpt-4o          ▼]                         │   │
│ │ Kai Model:     [gpt-4o-mini     ▼] (cost-optimized)       │   │
│ │ Sage Model:    [gpt-4o          ▼] (capability-optimized)  │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ Behavior Tuning ─────────────────────────────────────────┐   │
│ │ Kai Temperature:    [====●====] 0.7                        │   │
│ │ Sage Temperature:   [====●====] 0.7                        │   │
│ │ Kai Max Tokens:     [2000    ]                             │   │
│ │ Sage Max Tokens:    [4000    ]                             │   │
│ │ Max Agent Steps:    [5       ]                             │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ Search Tuning ───────────────────────────────────────────┐   │
│ │ Similarity Threshold: [====●====] 0.30                     │   │
│ │ Default Result Limit: [5       ]                           │   │
│ │ IVF nProbe Factor:   [0.25    ] (nProbe = √N × factor)    │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ Memory ──────────────────────────────────────────────────┐   │
│ │ [✓] Enable conversation memory                             │   │
│ │ Summarization Model: [gpt-4o-mini  ▼]                     │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ Prompt Overrides ────────────────────────────────────────┐   │
│ │ Kai System Prompt Override: [                         ]    │   │
│ │ Sage System Prompt Override: [                        ]    │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                      [Save Changes]             │
└─────────────────────────────────────────────────────────────────┘
```

#### Section Settings UI (Per-Section Overrides)

Add tab to `app/[locale]/section/[id]/settings/gamification/page.tsx` or new page:

```
┌─────────────────────────────────────────────────────────────────┐
│ Section AI Settings                                              │
│                                                                  │
│ [✓] Override platform defaults                                   │
│                                                                  │
│ Kai Model:       [Use platform default ▼]                        │
│ Kai Temperature: [====●====] 0.7                                │
│ Sage Model:      [Use platform default ▼]                        │
│ Sage Temperature: [====●====] 0.7                                │
│                                                                  │
│ Section-Specific Instructions (appended to system prompt):       │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ This section focuses on JLPT N5 vocabulary. Kai should     │   │
│ │ emphasize reading practice and kanji recognition.          │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ [✓] Enable conversation memory for this section                  │
│ Search similarity threshold: [====●====] 0.30                    │
│                                                                  │
│                                      [Save]                      │
└─────────────────────────────────────────────────────────────────┘
```

### Model Resolution Chain

```
Section.aiConfig.kaiModel         →  override per-section
  ?? PlatformSettings.kaiModel    →  override platform-wide
  ?? PlatformSettings.defaultAIModel  →  platform default
  ?? "gpt-4o"                     →  hardcoded fallback

// Same chain for temperature, maxTokens, maxSteps, etc.
```

### Data Flow: Complete Agent Turn

```
Student: "I'm confused about past tense conjugation"
    │
    ▼
/api/chat (POST) ─── messages + context
    │
    ├─ 1. Resolve persona (Kai)
    ├─ 2. Resolve model config (section → platform → defaults)
    ├─ 3. Load Tier 1 memory into system prompt
    │     • Unit: "Lesson 4 — Verb Conjugation"
    │     • Weak areas: "te-form, irregular verbs"
    │     • Preference: "prefers examples over rules"
    │
    ├─ 4. streamText with maxSteps=5
    │
    │  ┌─ Step 1: Model calls semantic_search("past tense conjugation") ─┐
    │  │  Server executes:                                                 │
    │  │    • Embed query → 512d vector                                   │
    │  │    • Load unit bundle from S3                                    │
    │  │    • IVF search → top 5 results                                  │
    │  │    • Return: [{title: "Past Tense Rules", preview: "...", ...]   │
    │  └─ Tool result streamed to client ("9:...")                        ─┘
    │
    │  ┌─ Step 2: Model calls get_student_memory() ─────────────────────┐
    │  │  Server executes:                                                │
    │  │    • Query StudentMemory for student + unit                      │
    │  │    • Query ConversationMemory for recent context                 │
    │  │    • Return: {weakConcepts: [...], lastDiscussed: "te-form"}    │
    │  └─ Tool result streamed to client                                 ─┘
    │
    │  ┌─ Step 3: Model generates text response ────────────────────────┐
    │  │  "Great question! Let's look at past tense together.            │
    │  │   I noticed you've been working on te-form — past tense         │
    │  │   builds on that same pattern! Here's how..."                   │
    │  │                                                                  │
    │  │  (includes nailed-it evaluation if appropriate)                  │
    │  └─ Text streamed to client ("0:...")                              ─┘
    │
    ├─ 5. onStepFinish: async update ConversationMemory
    │     • topic: "past tense conjugation"
    │     • insight: "confused about te-form → ta-form transformation"
    │
    └─ 6. Response complete ("d:...")
```

## Implementation Order (TODOs)

### Phase 1: Server-Side Retrieval Tools (Agent Foundation)
- [x] 1.1 Create `app/api/_shared/agentTools.ts` — server-side tool definitions with `execute`
- [x] 1.2 Implement `semantic_search` tool (embed query → load bundle from S3 → IVF/linear search → return results)
- [x] 1.3 Implement `read_file_content` tool (load file content from S3 or ParsedContent)
- [x] 1.4 Implement `get_student_progress` tool (query Grade model)
- [x] 1.5 Implement `get_course_outline` tool (read Section.courseOutline)
- [x] 1.6 Update `/api/chat/route.ts` to use `maxSteps: 5` for multi-step agent loop
- [x] 1.7 Slim system prompt — remove bulk context, describe available tools instead
- [x] 1.8 Verify streaming still works end-to-end with tool calls (client already handles "9:" and "b:" protocol)

### Phase 2: Memory System
- [x] 2.1 Add `ConversationMemory` model to schema
- [x] 2.2 Implement `get_student_memory` tool (query StudentMemory + ConversationMemory)
- [x] 2.3 Implement `recall_conversations` tool (search past conversation summaries)
- [x] 2.4 Implement `update_memory_insight` tool (write to ConversationMemory)
- [x] 2.5 Add `onStepFinish` handler for async memory summarization
- [x] 2.6 Build conversation summarizer (gpt-4o-mini call to condense conversation)
- [x] 2.7 Add memory embedding generation for semantic memory recall

### Phase 3: Hyperparameter Tuning UI
- [x] 3.1 Add agent config fields to PlatformSettings model
- [x] 3.2 Add `aiConfig: a.json()` to Section model
- [x] 3.3 Build "AI Agent Configuration" section in admin settings page
- [x] 3.4 Build "Section AI Settings" UI in section settings
- [x] 3.5 Implement model resolution chain in `/api/chat/route.ts` (section → platform → defaults)
- [x] 3.6 Wire resolved config into `streamText` call (model, temperature, maxTokens, maxSteps)

### Phase 4: Instructor Analytics Tools
- [x] 4.1 Implement `get_section_analytics` tool (aggregate grades, common errors)
- [x] 4.2 Implement `get_student_list` tool (section roster with progress)
- [x] 4.3 Add tools to Sage persona allowedTools
- [x] 4.4 Test instructor workflows (e.g., "which students are struggling?")

### Phase 5: Search Infrastructure Enhancements
- [x] 5.1 Add server-side bundle loading utility (S3 → parse → search — reuse client logic)
- [x] 5.2 Implement hybrid scoring (cosine similarity + BM25 keyword boost)
- [x] 5.3 Add section-wide bundle generation (combine all unit bundles in a section)
- [x] 5.4 Add HNSW index builder for platform-wide and instructor bundles (>5000 items) — NEEDED NOW
- [x] 5.5 Auto-rebuild section search bundle on unit publish (extend publishUnit Lambda)

### Phase 6: Testing & Audit
- [x] 6.1 Unit tests for all server-side tools
- [x] 6.2 Integration test: multi-step agent conversation with tool calls
- [x] 6.3 Verify streaming renders correctly in ChatSidebar for tool call steps
- [x] 6.4 Token budget analysis: measure system prompt + tool results per turn
- [x] 6.5 Latency benchmarks: tool call roundtrips vs current context-stuffed approach
- [x] 6.6 Security audit: student can't access other students' data via tool calls
- [x] 6.7 Admin UI functional testing (AIAgentConfig.stories.tsx — 7 stories)

## Available Models (for tuning UI dropdown)

```typescript
const AVAILABLE_MODELS = [
  { id: "gpt-4o", label: "GPT-4o", vendor: "openai", tier: "premium" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", vendor: "openai", tier: "standard" },
  { id: "gpt-4.1", label: "GPT-4.1", vendor: "openai", tier: "premium" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", vendor: "openai", tier: "standard" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", vendor: "openai", tier: "budget" },
  // Future: Anthropic, Google via @ai-sdk providers
];
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Multi-step loops explode costs | `maxSteps` cap (default 5), token limits per step, model tier selection |
| Slow tool calls add latency | Parallel tool execution (AI SDK supports this), S3 bundle caching |
| Student accesses other student data via tools | Tool `execute` functions validate userId from auth context |
| Memory grows unbounded | Rolling summarization (keep last 5 conversations), TTL on old memories |
| Admin sets bad hyperparameters (temp=2.0) | UI validation with sensible ranges (temp: 0-1.5, tokens: 100-8000) |
| IVF quality degrades with skewed clusters | Auto-fallback to linear for bundles <100 items, periodic re-clustering |
| Conversation memory creates write storms | Debounce: only update memory every 3+ turns, batch insights |

## Success Criteria

- Agent retrieves relevant content via RAG instead of dumping everything in system prompt
- System prompt drops from ~8K+ tokens to ~2K tokens (Tier 1 only)
- Student can ask "what did we talk about last time?" and get accurate recall
- Instructor can ask "which students are struggling with past tense?" and get data-backed answer
- Admin can change model from gpt-4o to gpt-4o-mini and see immediate cost reduction
- Instructor can tune temperature per-section for different teaching styles
- Streaming works identically to current UX — tool calls appear inline
- All tool calls complete within 3 seconds (P95)
- No regressions in existing chat functionality
