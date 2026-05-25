# Offline Student Experience

> **Status**: Complete  
> **Implemented**: May 2026

Full PWA with service worker, offline data cache, sync queue, and on-device LLM fallback. Students can complete lessons, chat with AI, and receive grading offline — results sync on reconnect.

---

## Current State

| Capability | Status |
|---|---|
| Service Worker / PWA | ❌ None |
| App manifest / install prompt | ❌ None |
| Offline data cache (DynamoDB) | ❌ None |
| Offline media cache (S3) | ❌ None |
| Grade submission queue | ❌ None — `saveGrade` throws on network failure |
| AI chat offline | ❌ All AI calls require Lambda/OpenAI network access |
| AI grading offline | ❌ `verifyDefinition`, `verifyWord`, `verifyShortAnswer` all require Lambda |
| Yjs local persistence | ✅ `y-indexeddb` persists CRDT state across reloads |
| Embedding cache | ✅ `VectorStoreDB` in IndexedDB (performance cache only) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Student Browser                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Service      │  │  IndexedDB   │  │  On-Device LLM   │  │
│  │  Worker       │  │  DataStore   │  │  (WebLLM /        │  │
│  │  (Workbox)    │  │              │  │   Transformers.js)│  │
│  │              │  │  • Units     │  │                   │  │
│  │  Cache:      │  │  • Words     │  │  • Chat responses │  │
│  │  • App shell │  │  • Questions │  │  • Answer grading │  │
│  │  • Static    │  │  • Grades    │  │  • Feedback gen   │  │
│  │  • Media     │  │  • Files     │  │                   │  │
│  │  • Fonts     │  │  • Memory    │  │  Model: ~2-4GB    │  │
│  └──────┬───────┘  │  • Sync queue│  │  (Phi-3/Gemma-2B) │  │
│         │          └──────┬───────┘  └────────┬──────────┘  │
│         │                 │                    │             │
│  ┌──────┴─────────────────┴────────────────────┴──────────┐  │
│  │               Offline Orchestrator                      │  │
│  │  • Network status detection                             │  │
│  │  • Route to on-device vs cloud AI                       │  │
│  │  • Sync queue management                                │  │
│  │  • Conflict resolution                                  │  │
│  └─────────────────────────┬──────────────────────────────┘  │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ (when online)
                    ┌────────▼────────┐
                    │  AWS Backend    │
                    │  • AppSync      │
                    │  • Lambda/OpenAI│
                    │  • S3           │
                    │  • Cognito      │
                    └─────────────────┘
```

---

## Phase 1: PWA Foundation & App Shell Caching

**Goal**: Make the app installable and cache static assets so the shell loads offline.

### 1.1 Service Worker with Workbox

Install `@ducanh2912/next-pwa` (maintained fork of `next-pwa`) or use `serwist` (the modern successor):

```bash
npm install serwist @serwist/next
```

Configure in `next.config.js`:

```javascript
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withSerwist({
  // ...existing config
});
```

**Caching strategies**:

| Asset Type | Strategy | TTL |
|---|---|---|
| App shell (HTML, JS, CSS) | StaleWhileRevalidate | 24h |
| Fonts (`/Cormorant/`, `/DM_Sans/`, etc.) | CacheFirst | 30d |
| Static images (`/public/`) | CacheFirst | 7d |
| S3 media (audio/video/PDF) | CacheFirst | 7d (see Phase 2) |
| API calls (AppSync/REST) | NetworkFirst | fallback to IndexedDB |
| PDF.js worker | CacheFirst | version-pinned |

### 1.2 Web App Manifest

Create `public/manifest.json`:

```json
{
  "name": "Homework Supply",
  "short_name": "HW Supply",
  "description": "Interactive learning platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 1.3 Network Status Detection

Create `src/hooks/useNetworkStatus.ts`:

```typescript
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
```

Surface a banner in the app layout when offline so students know their state.

### Deliverables
- [ ] Serwist service worker with caching strategies
- [ ] `manifest.json` and app icons
- [ ] `useNetworkStatus` hook + offline banner UI
- [ ] Install prompt handling (`beforeinstallprompt`)

---

## Phase 2: Data Prefetch & Offline DataStore

**Goal**: Pre-download all data a student needs for assigned lessons into IndexedDB.

### 2.1 Offline DataStore (`src/offline/OfflineDataStore.ts`)

Use `idb` (already a dependency via `VectorStoreDB`) to create a structured offline store:

```typescript
interface OfflineStore {
  units: { id: string; data: string; version: number; cachedAt: number };
  words: { id: string; unitId: string; phrase: string; definition: string; audio?: Blob };
  questions: { id: string; unitId: string; prompt: string; answer: string; choices?: string[] };
  files: { id: string; unitId: string; blob: Blob; contentType: string; path: string };
  grades: { id: string; unitId: string; data: string; complete: boolean; synced: boolean };
  studentMemory: { id: string; memoryMarkdown: string };
  syncQueue: { id: string; operation: string; model: string; payload: string; createdAt: number };
}
```

### 2.2 Assignment Prefetch

When a student opens the **Sections** page or **Assignment list**, trigger background prefetch for assigned units:

```typescript
async function prefetchAssignment(unitId: string) {
  // 1. Fetch Unit (including full Lexical JSON)
  const unit = await client.models.Unit.get({ id: unitId });
  await offlineDB.put('units', { id: unit.id, data: unit.data, version: unit._version });

  // 2. Fetch Words via join table
  const words = await unit.words.toArray();
  for (const word of words) {
    await offlineDB.put('words', { id: word.id, unitId, ...word });
    // Pre-cache audio blobs
    if (word.audio) await cacheMediaFile(word.audio);
  }

  // 3. Fetch Questions via join table
  const questions = await unit.questions.toArray();
  for (const q of questions) {
    await offlineDB.put('questions', { id: q.id, unitId, ...q });
    if (q.audio) await cacheMediaFile(q.audio);
  }

  // 4. Fetch and cache all media files
  const files = await unit.files.toArray();
  for (const file of files) {
    const blob = await fetchAndCacheS3File(file.path);
    await offlineDB.put('files', { id: file.id, unitId, blob, contentType: file.type, path: file.path });
  }

  // 5. Fetch student memory
  const memory = await client.models.StudentMemory.list({ filter: { owner: { eq: username } } });
  if (memory.data[0]) {
    await offlineDB.put('studentMemory', memory.data[0]);
  }
}
```

### 2.3 Media Caching via Service Worker

For S3 audio/video/PDF files, use the service worker's Cache API:

```typescript
// In service worker
self.addEventListener('fetch', (event) => {
  if (isS3MediaRequest(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open('s3-media-v1').then(cache => cache.put(event.request, clone));
        return response;
      }))
    );
  }
});
```

**Challenge**: S3 presigned URLs expire. Solutions:
- Cache by the **S3 object key** (strip query params) rather than full URL
- On prefetch, request long-lived URLs (up to 7 days)
- On cache miss while offline, check IndexedDB `files` store for the blob fallback

### 2.4 Context Provider Integration

Modify `UnitContext`, `DictionaryContext`, `FilesContext` to transparently fall back to offline data:

```typescript
// In UnitContext, replace observeQuery with:
if (!isOnline) {
  const cachedUnit = await offlineDB.get('units', unitId);
  if (cachedUnit) {
    setUnit(cachedUnit);
    return; // No subscription needed offline
  }
}
// Otherwise, subscribe normally...
```

### Deliverables
- [ ] `OfflineDataStore` module with IndexedDB schema
- [ ] `prefetchAssignment()` function
- [ ] S3 media caching strategy (service worker + IndexedDB blob fallback)
- [ ] Presigned URL expiry handling
- [ ] Context providers read from offline store when network unavailable
- [ ] UI: prefetch progress indicator per assignment ("Available offline ✓")

---

## Phase 3: Offline Grade Submission & Sync Queue

**Goal**: Students can complete and submit work offline; it syncs when reconnected.

### 3.1 Offline-First `saveGrade`

Wrap the existing `saveGrade` in an offline-aware layer:

```typescript
async function saveGradeOfflineAware(gradeId: string, data: object, meta: object) {
  // Always save to local IndexedDB first (instant feedback)
  await offlineDB.put('grades', {
    id: gradeId,
    data: JSON.stringify(data),
    ...meta,
    synced: false,
    savedAt: Date.now(),
  });

  if (navigator.onLine) {
    try {
      await client.models.Grade.update({ id: gradeId, data: JSON.stringify(data), ...meta });
      await offlineDB.put('grades', { ...existing, synced: true });
    } catch (err) {
      // Enqueue for later sync
      await enqueueSyncOperation('Grade', 'update', { id: gradeId, data, ...meta });
    }
  } else {
    // Enqueue for later sync
    await enqueueSyncOperation('Grade', 'update', { id: gradeId, data, ...meta });
  }
}
```

### 3.2 Sync Queue

```typescript
interface SyncOperation {
  id: string;
  model: string;       // 'Grade' | 'AssistantChat' | ...
  operation: string;    // 'create' | 'update'
  payload: string;      // JSON serialized
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

class SyncQueue {
  async enqueue(op: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount'>): Promise<void>;
  async processQueue(): Promise<{ success: number; failed: number }>;
  async getPendingCount(): Promise<number>;
}
```

**Sync trigger**: When `navigator.onLine` fires, or on a `sync` event via Background Sync API:

```typescript
// In service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'grade-sync') {
    event.waitUntil(syncQueue.processQueue());
  }
});
```

### 3.3 Conflict Resolution

Since grades use `_version` for optimistic locking:

1. On sync attempt, fetch current `_version` from server
2. If local `_version` matches, update normally
3. If conflict: **local wins for grade data** (student's answers are canonical), merge the `data` JSON fields
4. Log conflict for instructor review

### Deliverables
- [ ] `SyncQueue` class with IndexedDB persistence
- [ ] Offline-aware `saveGrade` wrapper
- [ ] Background Sync registration
- [ ] Conflict resolution strategy for `_version` mismatches
- [ ] UI: "X changes pending sync" indicator + manual retry button
- [ ] Sync status per grade (synced / pending / error)

---

## Phase 4: On-Device AI for Chat & Grading

**Goal**: Provide AI chat tutoring and answer grading feedback without network, using a small language model running in the browser.

### 4.1 Technology Options

| Option | Model Size | Inference Speed | Browser Support | Offline? |
|---|---|---|---|---|
| **WebLLM** (`@mlc-ai/web-llm`) | 1-4 GB | ~10-30 tok/s (WebGPU) | Chrome 113+ | ✅ Full |
| **Transformers.js** (`@huggingface/transformers`) | 0.5-2 GB | ~5-15 tok/s (WASM) | All modern | ✅ Full |
| **Chrome Built-in AI** (Gemini Nano) | Pre-installed | Fast | Chrome 127+ (Origin Trial) | ✅ Full |

**Recommended approach**: Tiered strategy

1. **Primary**: Chrome Built-in AI (Gemini Nano) — zero download, pre-installed on Chrome, ideal for Chromebook students
2. **Fallback**: WebLLM with `Phi-3.5-mini-instruct` (2.4GB quantized) — broader model capabilities
3. **Minimum viable**: Transformers.js with a tiny model for basic answer comparison

### 4.2 On-Device Chat (`src/offline/OfflineChatEngine.ts`)

```typescript
interface OfflineChatEngine {
  /** Check if on-device AI is available */
  isAvailable(): Promise<boolean>;

  /** Initialize the model (download if needed, warm up) */
  initialize(onProgress?: (percent: number) => void): Promise<void>;

  /** Generate a streaming chat response */
  chat(
    messages: ChatMessage[],
    context: OfflineChatContext,
  ): AsyncGenerator<string>;

  /** Grade a student answer */
  gradeAnswer(params: {
    studentAnswer: string;
    expectedAnswer: string;
    prompt: string;
    type: 'definition' | 'shortAnswer' | 'word';
  }): Promise<{ score: number; feedback: string; accurate: boolean }>;
}

interface OfflineChatContext {
  unitName: string;
  unitDescription: string;
  vocabulary: Array<{ phrase: string; definition: string }>;
  questions: Array<{ prompt: string; answer: string }>;
  studentMemory?: string;
  gradeAccuracy?: number;
}
```

### 4.3 System Prompt Adaptation

The existing `buildStudentSystemPrompt.ts` constructs a rich Socratic tutor prompt. For on-device use:

- **Slim the prompt** to fit smaller context windows (4K-8K tokens vs 128K for GPT-4o)
- Keep: unit name, vocabulary list (limited to current section), student grade status
- Drop: full grade data JSON, file listings, extended memory beyond 500 chars
- Add: explicit instruction that this is a **lightweight tutor** — keep responses concise

```typescript
function buildOfflineSystemPrompt(context: OfflineChatContext): string {
  return `You are a helpful tutor for "${context.unitName}".
${context.unitDescription ? `Topic: ${context.unitDescription}` : ''}

Vocabulary to help with: ${context.vocabulary.slice(0, 15).map(w => `${w.phrase}: ${w.definition}`).join('; ')}

Student's current accuracy: ${context.gradeAccuracy ?? 'not started'}%.
${context.studentMemory ? `Student notes: ${context.studentMemory.slice(0, 500)}` : ''}

Guidelines:
- Be encouraging and Socratic — ask guiding questions rather than giving answers directly.
- Keep responses under 150 words.
- Reference the vocabulary and questions from this unit.
- If the student seems stuck, offer a hint rather than the full answer.`;
}
```

### 4.4 On-Device Grading

For `verifyDefinition` / `verifyShortAnswer` replacement:

```typescript
async function gradeAnswerOffline(params: GradeParams): Promise<GradeResult> {
  const prompt = `Grade this student answer.
Question: "${params.prompt}"
Expected answer: "${params.expectedAnswer}"
Student's answer: "${params.studentAnswer}"

Respond in JSON: { "score": 0-100, "accurate": true/false, "feedback": "brief feedback" }`;

  const response = await offlineChatEngine.generate(prompt);
  return JSON.parse(response);
}
```

**Fallback for models that can't reliably output JSON**: Use simple string similarity + keyword matching:

```typescript
function gradeAnswerHeuristic(expected: string, student: string): GradeResult {
  const similarity = jaroWinkler(normalize(expected), normalize(student));
  const keywordHits = extractKeywords(expected).filter(k => student.toLowerCase().includes(k));
  const score = Math.round((similarity * 0.4 + (keywordHits.length / keywords.length) * 0.6) * 100);

  return {
    score,
    accurate: score >= 70,
    feedback: score >= 70
      ? 'Good answer! Your response captures the key concepts.'
      : `Try to include these key ideas: ${keywords.filter(k => !student.toLowerCase().includes(k)).join(', ')}`,
  };
}
```

### 4.5 Audio Handling Offline

Whisper (used for `verifyWord` / `verifyAudioUrl`) cannot run in-browser at acceptable speed today. Options:

1. **Defer audio grading**: Record audio locally, store blob in IndexedDB, grade server-side on sync
2. **Whisper.cpp via WASM** (`whisper-turbo` or `@nicepkg/whisper-webgpu`): ~1-5 min per 30s clip on recent hardware — not great UX but functional
3. **Skip audio blocks offline**: Show "Audio answers will be graded when you're back online" message, allow text fallback

**Recommendation**: Option 1 (defer) for v1, explore Option 2 for v2 if student devices have WebGPU.

### 4.6 Model Download & Storage Management

```typescript
class ModelManager {
  /** Check available storage quota */
  async getStorageBudget(): Promise<{ available: number; used: number }>;

  /** Pre-download model for offline use */
  async downloadModel(modelId: string, onProgress: (p: number) => void): Promise<void>;

  /** Check if model is cached and ready */
  async isModelReady(modelId: string): Promise<boolean>;

  /** Delete cached model to free space */
  async deleteModel(modelId: string): Promise<void>;
}
```

**Storage considerations**:
- Phi-3.5-mini quantized: ~2.4 GB
- Gemini Nano (Chrome built-in): 0 GB (pre-installed)
- Student Chromebooks may have limited storage — always check `navigator.storage.estimate()` before download
- Show clear UI: "Download AI model for offline use (2.4 GB)" with cancel option

### Deliverables
- [ ] `OfflineChatEngine` with Chrome Built-in AI primary + WebLLM fallback
- [ ] `buildOfflineSystemPrompt` — compact prompt builder
- [ ] On-device grading for text answers (LLM + heuristic fallback)
- [ ] Audio recording deferred grading (store blob, sync later)
- [ ] `ModelManager` for download/storage/cleanup
- [ ] UI: model download progress, "AI available offline" indicator
- [ ] Integration with `ChatSidebar` — transparent routing (online → GPT-4o, offline → on-device)

---

## Phase 5: Transparent Online/Offline Routing

**Goal**: Students shouldn't need to think about connectivity. The app seamlessly routes between cloud and local.

### 5.1 AI Router (`src/offline/AIRouter.ts`)

```typescript
class AIRouter {
  async chat(messages: Message[], context: ChatContext): AsyncGenerator<string> {
    if (navigator.onLine && !this.preferOffline) {
      // Use cloud GPT-4o via existing chatStream Lambda
      yield* this.cloudChat(messages, context);
    } else if (await this.offlineEngine.isAvailable()) {
      // Use on-device model
      yield* this.offlineEngine.chat(messages, context);
    } else {
      yield "I'm currently offline and the AI model isn't available. Your work is being saved locally and will sync when you reconnect.";
    }
  }

  async gradeAnswer(params: GradeParams): Promise<GradeResult> {
    if (navigator.onLine) {
      return this.cloudGrade(params); // Existing Lambda calls
    }
    if (await this.offlineEngine.isAvailable()) {
      return this.offlineEngine.gradeAnswer(params);
    }
    // Heuristic fallback — always available, no model needed
    return gradeAnswerHeuristic(params.expectedAnswer, params.studentAnswer);
  }
}
```

### 5.2 Deferred Grading Reconciliation

When a student completes work offline with on-device AI grading, then reconnects:

1. **Sync grade data** to server from the sync queue
2. **Re-grade with GPT-4o** in the background (authoritative server-side grading)
3. If scores differ significantly (>15 points), flag for instructor review
4. Update `Grade.accuracy` with server-authoritative score
5. Notify student only if their grade changed

```typescript
async function reconcileOfflineGrades(gradeId: string) {
  const localGrade = await offlineDB.get('grades', gradeId);
  const gradeData = JSON.parse(localGrade.data);

  for (const [blockId, block] of Object.entries(gradeData)) {
    if (block.gradedOffline) {
      const serverResult = await client.queries.verifyShortAnswer({
        answer: block.userAnswer,
        prompt: block.prompt,
        expected: block.expectedAnswer,
      });

      if (Math.abs(serverResult.score - block.accuracy) > 15) {
        block.accuracy = serverResult.score;
        block.feedback = serverResult.feedback;
        block.reconciledFromOffline = true;
        block.offlineScore = block.accuracy; // Preserve for audit
      }
    }
  }
  // Update the grade with authoritative scores
  await saveGrade(gradeId, gradeData);
}
```

### 5.3 Search Content Tool Offline

The `search_content` client-side tool in chat uses `VectorStoreDB` (already in IndexedDB). This means **vector search already works offline** if embeddings were prefetched. Just ensure `prefetchAssignment` also populates the embedding cache.

### Deliverables
- [ ] `AIRouter` class with transparent cloud/local switching
- [ ] Deferred grading reconciliation pipeline
- [ ] Instructor dashboard: flag for offline-graded submissions with score discrepancy
- [ ] Ensure vector search embeddings are included in prefetch
- [ ] Network transition handling (mid-chat switch from offline to online)

---

## Phase 6: UX Polish & Student Controls

### 6.1 Offline Status UI

- **Persistent banner**: "You're offline — your work is saved locally" with sync count
- **Per-assignment badge**: "Available offline ✓" / "Download for offline use" / "Downloading…"
- **Chat indicator**: "AI Tutor (offline mode)" vs "AI Tutor"
- **Sync dashboard**: Show pending items, last sync time, manual sync button
- **Grade caveat**: "Graded locally — final score may adjust when online" badge on offline-graded blocks

### 6.2 Storage Management UI

In student Settings:
- Show current offline storage usage (cached lessons, AI model, media)
- Per-assignment: "Remove offline data" action
- AI model: "Download / Remove AI model" toggle
- Quota warning when approaching storage limits

### 6.3 Instructor Controls

- Toggle per-assignment: "Allow offline completion"
- Dashboard column: "Graded offline" flag, original offline score vs reconciled score
- Bulk re-grade action for offline submissions

### Deliverables
- [ ] Offline status banner component
- [ ] Per-assignment offline availability badges
- [ ] Offline chat mode indicator
- [ ] Storage management page in Settings
- [ ] Instructor offline grading dashboard

---

## Implementation Order & Dependencies

```
Phase 1 (PWA Foundation)          ← No dependencies, start here
    │
    ▼
Phase 2 (Data Prefetch)           ← Depends on Phase 1 service worker
    │
    ├──▶ Phase 3 (Sync Queue)     ← Depends on Phase 2 offline store
    │
    └──▶ Phase 4 (On-Device AI)   ← Independent of Phase 3, parallel track
              │
              ▼
         Phase 5 (Router)         ← Depends on Phase 3 + Phase 4
              │
              ▼
         Phase 6 (UX)             ← Depends on all above
```

**Suggested timeline**:
- Phase 1: Foundation sprint
- Phase 2+3: Data & sync sprint (parallel)
- Phase 4: AI sprint (can start in parallel with Phase 2)
- Phase 5+6: Integration sprint

---

## Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Storage quota on Chromebooks | Students can't download AI model | Tiered approach: Chrome Built-in AI (0 GB) → WebLLM (2.4 GB) → heuristic fallback (0 GB) |
| On-device grading accuracy | Inconsistent scores vs GPT-4o | Server reconciliation + instructor flag + heuristic fallback for simple blocks |
| S3 presigned URL expiry | Cached media URls break | Cache by object key, not full URL; store blobs directly in IndexedDB for critical media |
| `_version` conflicts on sync | Grade updates rejected | Fetch latest version before sync, merge strategy favoring student data |
| WebGPU not available | WebLLM won't run | Fall back to Transformers.js (WASM) → heuristic grading |
| Large unit data (>10MB Lexical JSON) | IndexedDB storage pressure | Compress with `CompressionStream` API; lazy-load media blobs on demand |
| Background Sync API support | Not available in all browsers | Fallback to `visibilitychange` + `online` event listeners |

---

## Key Dependencies to Add

```json
{
  "serwist": "^9.x",
  "@serwist/next": "^9.x",
  "@mlc-ai/web-llm": "^0.2.x",
  "idb": "^8.x (already present)",
  "jaro-winkler": "^0.2.x"
}
```

Optional (if Chrome Built-in AI is prioritized):
- No npm dependency needed — uses `window.ai` API (Origin Trial)

---

## Open Questions

1. **Which student devices are we targeting?** Chromebooks, iPads, phones — this affects WebGPU availability and storage budgets. Focus on Chromebook and Phones first, with graceful degradation.
2. **What's the acceptable AI model download size?** Chromebooks may only have 2-4 GB free. Chrome Built-in AI avoids this entirely. Attempt to use built -in AI where possible, with WebLLM as a fallback for more capable models. Built in for Chromebooks, WebLLM for others that can support it, heuristic fallback for everything else.
3. **Should offline grading be "provisional" (re-graded on sync) or "final"?** Recommendation: provisional with instructor override. yes
4. **Do timed assignments work offline?** Timer logic is client-side already, but could be manipulated — acceptable risk for offline? yes
5. **Should chat history from offline sessions sync?** Yes, store in `AssistantChat` model on reconnect for continuity.
