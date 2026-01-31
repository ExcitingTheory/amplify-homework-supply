# Yjs + Amplify Gen 2 Migration Plan
**Real-time Collaboration & Offline-First Architecture**

> ⚠️ **CRITICAL**: Amplify Gen 2 stores all JSON fields as strings.  
> - **Read**: `JSON.parse(unit.data || '{}')` 
> - **Write**: `data: JSON.stringify(editorState)`  
> - See [Section 12: Common Pitfalls](#12-common-pitfalls---gen-2-json-string-handling) for details

## Executive Summary

Migrate from AWS Amplify DataStore (Gen 1) to **Yjs + Amplify Gen 2** for:
- ✅ Real-time multi-user collaboration
- ✅ Offline-first CRDT synchronization  
- ✅ Reduced bandwidth (delta updates vs. full queries)
- ✅ Sub-100ms latency for collaboration
- ✅ Better conflict resolution (automatic via CRDT)

---

## 1. Current State Analysis

### DataStore Usage Patterns

**Primary Subscriptions:**
```
unitContext.js       → Unit (observeQuery) + Grade (observeQuery)
sectionContext.js    → Section + Assignment (observeQuery)
dictionaryContext.js → Word (observeQuery)
fileContext.js       → File + Document (observeQuery)
settingsContext.js   → Settings (observeQuery)
tabContext.js        → AssistantChat (observeQuery)
```

**Write Operations:**
- `Unit.save()` - Editor content (data field = JSON string, requires `JSON.stringify()`)
- `Grade.save()` - Student submissions (data field = JSON string)
- `Word.save()` - Vocabulary updates (waveformData = JSON string)
- `File.save()` - File metadata (metadata = JSON string)

**Key Limitation:** DataStore polls every ~1-2 seconds (no real-time push)

### Models Requiring Real-time Sync

| Model | Priority | Sync Strategy | Offline Need |
|-------|----------|---------------|--------------|
| **Unit** (editor content) | 1 | Y.Text for editor, Y.Map for metadata | YES |
| **Grade** (submissions) | 1 | Y.Map with structure: `{ blockId: { complete, accuracy, answer } }` | YES |
| **Chat Window** | 1 | Y.Array of messages + awareness for typing indicator | YES |
| **Private Unit View** | 1 | Y.Map for view state (scroll, selections, drafts) | YES |
| **Question** (quiz blocks) | 1 | Y.Map for question content, answers, media | YES |
| **ParsedContent** (doc analysis) | 1 | Y.Map for extracted vocab, summaries, concepts, feedback | YES |
| **Word** (vocab) | 2 | Y.Array for vocabulary list | Optional |
| **Assignment** | 2 | Y.Map for due dates, status | NO |
| **Section** | 3 | Y.Map | NO |

---

## 2. Target Architecture

### Technology Stack

```
Frontend Layer
  ├─ Lexical Editor (binds to Y.Text)
  ├─ Yjs (CRDT)
  ├─ IndexedDB (offline persistence)
  └─ Y.WebsocketProvider (sync)
         ↓
Sync Layer (WebSocket server)
  ├─ Message broker (SQS/Redis for queuing updates)
  └─ Room management (per document + learner + code each learner or instructor has their own room)
         ↓
Backend (Amplify Gen 2)
  ├─ GraphQL API (mutations for final state)
  ├─ Lambda (WebSocket handler, streaming API)
  └─ DynamoDB (source of truth)
```

### Yjs Document Structure

```javascript
// Example for Unit editing session
const ydoc = new Y.Doc()

// Editor content (Lexical JSON)
const ytext = ydoc.getText('editorContent')

// Metadata (name, owner, timestamps)
const ymetadata = ydoc.getMap('metadata')
ymetadata.set('name', 'Unit Name')
ymetadata.set('owner', 'user123')
ymetadata.set('status', 'DRAFT')

// Awareness (presence: cursors, selections, who's online)
const yawareness = ydoc.awareness
yawareness.setLocalState({
  user: { name: 'John', color: '#ff0000' },
  cursor: { line: 5, ch: 10 },
  selection: { from: 10, to: 50 }
})

// CHAT WINDOW (NEW)
const ychat = ydoc.getArray('chatMessages')
// Each message: { id, author, content, timestamp, edited }
ychat.push([new Y.Map([
  ['id', 'msg-1'],
  ['author', 'student1'],
  ['content', 'How do I conjugate this verb?'],
  ['timestamp', Date.now()],
  ['edited', false]
])])

// Chat typing indicator (via awareness)
yawareness.setLocalState({
  ...yawareness.getLocalState(),
  typing: { authorId: 'student1', since: Date.now() }
})

// QUESTIONS (NEW)
const yquestions = ydoc.getMap('questions')
// Each question map: { id, type, text, audio, images, answers, options }
const question1 = new Y.Map([
  ['id', 'q-1'],
  ['type', 'audio-response'],
  ['text', 'Listen and repeat: こんにちは'],
  ['audio', ['s3://...audio.mp3']],
  ['expectedAnswer', 'こんにちは'],
  ['hints', new Y.Array(['Formal greeting', 'Good afternoon'])],
  ['options', new Y.Array(['こんにちは', 'こんばんは', 'おはよう'])]
])
yquestions.set('q-1', question1)

// PARSED CONTENT (DOCUMENT ANALYSIS FEEDBACK) (NEW)
const yparsedContent = ydoc.getMap('parsedContent')
// Real-time feedback as analyzeDocument Lambda streams results
yparsedContent.set('status', 'analyzing') // pending, extracting, analyzing, completed
yparsedContent.set('vocabularyJSON', new Y.Array([
  new Y.Map([
    ['word', 'こんにちは'],
    ['definition', 'Good morning/afternoon'],
    ['context', 'Page 5'],
    ['page', 5]
  ])
]))
yparsedContent.set('summariesJSON', new Y.Array([
  new Y.Map([
    ['title', 'Chapter Overview'],
    ['content', 'This chapter covers...'],
    ['page_range', '1-5']
  ])
]))
yparsedContent.set('conceptsJSON', new Y.Array([
  new Y.Map([
    ['concept', 'Japanese greetings'],
    ['description', 'Formal and informal greetings...'],
    ['related_vocabulary', ['おはよう', 'こんばんは']]
  ])
]))
yparsedContent.set('questionsJSON', new Y.Array())
yparsedContent.set('progress', '45%') // Real-time progress from Lambda
yparsedContent.set('processingTime', 2340) // ms
yparsedContent.set('tokensUsed', 5420)

// PRIVATE UNIT VIEW (NEW)
const yprivateView = ydoc.getMap('privateUnitView')
yprivateView.set('scrollPosition', { x: 0, y: 450 })
yprivateView.set('selectedBlockId', 'block-123')
yprivateView.set('draftAnswer', 'こんにちは...')
yprivateView.set('lastViewedAt', Date.now())

// SYNC TO DATABASE (CRITICAL - Gen 2 requires JSON.stringify)
// When persisting to DynamoDB, all structured data must be stringified:
const syncToDatabase = async () => {
  // Extract Yjs state
  const metadata = {}
  ymetadata.forEach((value, key) => {
    metadata[key] = value
  })
  
  const chatMessages = ychat.toArray().map(msg => {
    const obj = {}
    msg.forEach((v, k) => obj[k] = v)
    return obj
  })
  
  // MUST stringify before saving to Gen 2
  await client.models.Unit.update({
    id: unitId,
    name: metadata.name, // Simple strings OK
    data: JSON.stringify({ /* Lexical state */ }), // MUST stringify
    chatMessagesJSON: JSON.stringify(chatMessages), // MUST stringify
    _version: currentVersion + 1
  })
}
```
```

### Sync Flow

```
User edits locally → Y.Doc updated → IndexedDB persisted
                  ↓
         Y.update sent via WebSocket
                  ↓
      Backend receives Y.update
      (all clients get it + forward to DB)
                  ↓
    Store Y.snapshot in DynamoDB
    (compressed CRDT state)
                  ↓
   Other connected clients apply update
   (automatic CRDT merge, no conflicts)
```

---

## 3. Migration Phases

### Phase 0: Setup (Week 1)
**Goal:** Establish infrastructure, not touch existing code yet.

**Tasks:**
- [ ] Create `src/lib/yjs/` folder structure
- [ ] Install dependencies: `yjs`, `y-websocket`, `y-indexeddb`, `lib0`
- [ ] Create `YjsProvider.js` - wrapper around Y.Doc + providers
- [ ] Create `WebSocketServer.js` (Node.js server or Lambda)
- [ ] Create `SyncAdapter.js` - converts Yjs updates to GraphQL mutations
- [ ] Write unit tests for providers

**Deliverables:**
- Yjs provider library ready to use
- WebSocket server handling Y.updates
- No breaking changes to existing app

---

### Phase 1: Editor Content Migration (Week 2-3)
**Goal:** Migrate `Unit.data` (Lexical editor content) to Yjs Y.Text.

**Current Flow:**
```
Unit.data (JSON string) → JSON.parse() → Editor3 loads → Edit → 
  JSON.stringify() → Unit.save(copyOf)
```

**New Flow:**
```
Y.Text (CRDT) → Lexical binds to Y.Text → Edit → Y.update sent → 
  Server snapshot → JSON.stringify() → DynamoDB
```

**Tasks:**
- [ ] Create `useYjsUnit()` hook (replaces DataStore subscription)
- [ ] Bind Lexical editor to Y.Text via `YjsBinding`
- [ ] Update `DataPlugin.js` to handle Y.updates instead of DataStore saves
- [ ] Create `syncUnitToDb()` mutation (debounced Y.snapshot → DynamoDB)
- [ ] Test editor collaboration locally (multi-tab)

**Backwards Compatibility:**
- Keep DataStore Unit model during transition
- `Unit.data` becomes "last snapshot" field (JSON string - must `JSON.stringify()` before save)
- Yjs updates stored in `Unit.yjsSnapshot` field (binary data as base64 string)
- Always parse on read: `const editorState = JSON.parse(unit.data || '{}')`

**Conflict Resolution:**
- Yjs handles it automatically (CRDT)
- User A edits line 1, User B edits line 2 → both changes merge
- No manual conflict resolution needed

---

### Phase 2: Grade Submissions Migration (Week 4-5)
**Goal:** Real-time grade/submission sync.

**Current Flow:**
```
Grade.data (JSON string) → JSON.parse() → blockId → answer → User saves → 
  JSON.stringify() → Grade.save()
```

**New Flow:**
```
Y.Map (blockId → Y.Map { complete, accuracy, answer })
   ↓
Student updates answer → Y.update
   ↓
Instructor sees update in real-time (same Grade doc)
   ↓
Instructor leaves feedback → Y.Map feedback field
   ↓
Server snapshot → JSON.stringify() → DynamoDB
```

**Tasks:**
- [ ] Create `GradeYDoc` structure (Y.Map with nested maps)
- [ ] Create `useYjsGrade()` hook
- [ ] Add instructor/student awareness (who's viewing, who's editing)
- [ ] Implement feedback flow (instructor → student)
- [ ] Handle permissions (student can't modify own grade accuracy)

**Conflict Resolution:**
- Student and instructor editing different fields → auto-merge
- Both editing same field → Last-write-wins (timestamp-based)

---

### Phase 2b: Question Content Real-time Sync (Week 5-6)
**Goal:** Live question editing with instructor/student collaboration.

**Current Flow:**
```
Question.save() → DataStore → Polling → lag
Instructor edits question → Students don't see until refresh
```

**New Flow:**
```
Y.Map (question)
   ├─ text
   ├─ audio: Y.Array
   ├─ images: Y.Array
   ├─ options: Y.Array
   ├─ hints: Y.Array
   └─ expectedAnswer

Instructor edits → Y.update → Students see instantly
Students see updates via awareness (who's editing what)
Changes persist to IndexedDB (view while offline)
```

**Tasks:**
- [ ] Create `useYjsQuestion()` hook
- [ ] Bind question editor to Y.Maps
- [ ] Add instructor/student awareness (editing indicator)
- [ ] Handle media array updates (audio, images)
- [ ] Validate question structure on sync
- [ ] Implement permission checks (instructor can edit, students view)

**Permissions:**
- Instructors: can edit all fields
- Students: read-only (see updates in real-time)
- Server validates on final save

---

### Phase 3b: ParsedContent Analysis Feedback Real-time (Week 6)
**Goal:** Stream document analysis results in real-time as they arrive from Lambda.

**Current Flow:**
```
analyzeDocument() Lambda runs → Updates ParsedContent
→ User polls DataStore → 1-2s latency before seeing results
→ Feedback appears slowly during analysis
```

**New Flow:**
```
analyzeDocument() Lambda starts
   ↓
Lambda streams progress via WebSocket
   ↓
Y.Map updates in real-time
   ├─ status: 'analyzing'
   ├─ progress: '45%'
   ├─ vocabularyJSON: Y.Array (updates incrementally)
   ├─ summariesJSON: Y.Array (updates as extracted)
   ├─ conceptsJSON: Y.Array
   └─ questionsJSON: Y.Array
   
User sees results appear in real-time
Results persist to IndexedDB (view while offline)
```

**Tasks:**
- [ ] Modify `analyzeDocument` Lambda to stream updates via WebSocket
- [ ] Create `useYjsParsedContent()` hook
- [ ] Bind analysis result panels to Y.Arrays (vocab, summaries, concepts, questions)
- [ ] Add progress indicator (status, % complete)
- [ ] Display token usage + processing time
- [ ] Implement cancellation via Y.Map flag

**Real-time Updates:**
- Status changes: pending → extracting → analyzing → completed
- Vocabulary array gets appended to as words are extracted
- Summaries appear as they're generated
- Concepts built up incrementally
- Questions generated on-the-fly

**Permissions:**
- File owner: can see all results + cancel
- Other instructors: view-only
- Students: no access to analysis

---

### Phase 3: Chat Window Real-time Sync (Week 5-6)
**Goal:** Live chat messages with presence awareness.

**Current Flow:**
```
AssistantChat.save() → DataStore → Polling updates → lag
```

**New Flow:**
```
Y.Array (messages)
   ↓
User types message → Y.Array.push()
   ↓
Awareness sends typing indicator (presence)
   ↓
Other users see message instantly + know who's typing
   ↓
Message persists to IndexedDB (offline readable)
```

**Yjs Structure:**
```javascript
const ychat = ydoc.getArray('chatMessages')
// Each message map: { id, author, content, timestamp, edited, role }

// Typing awareness
yawareness.setLocalState({
  typing: { 
    userId: 'user123',
    userName: 'John',
    since: Date.now()
  }
})
```

**Tasks:**
- [ ] Create `ChatYDoc` wrapper (Y.Array for messages)
- [ ] Create `useYjsChat()` hook
- [ ] Bind chat message list to Y.Array
- [ ] Add typing indicator via awareness
- [ ] Implement message edit/delete (tombstone pattern)
- [ ] Implement message pruning (archive old messages)

**Permissions:**
- Only message author can edit/delete own messages
- Instructors can delete any message
- Server validates on sync

---

### Phase 4: Private Unit View State (Week 6-7)
**Goal:** Sync scroll position, selections, drafts.

**Current Problem:**
```
User A has scroll at bottom
User A closes, comes back
Scroll position is lost (starts at top)
```

**New Flow:**
```
Y.Map (viewState)
   ├─ scrollPosition: { x, y, blockId }
   ├─ selectedBlockId: 'block-123'
   ├─ selectedText: { from, to, text }
   ├─ draftAnswers: { blockId: 'user answer...' }
   └─ lastViewedAt: timestamp

User reopens unit → Y.Map loaded from IndexedDB
→ Scroll restored to last position
→ Draft answers visible
→ Per-user (no awareness broadcast)
```

**Yjs Structure:**
```javascript
const yprivateView = ydoc.getMap('privateUnitView')

// Not exposed to other users, just stored locally + IndexedDB
yprivateView.set('scrollPosition', { 
  blockId: 'block-456',
  top: 1200,
  timestamp: Date.now()
})

yprivateView.set('draftAnswers', new Y.Map([
  ['quiz-block-1', 'こんにちは'],
  ['meaning-block-2', 'Hello response...']
]))
```

**Tasks:**
- [ ] Create `useYjsUnitViewState()` hook
- [ ] Debounce scroll/selection updates to IndexedDB
- [ ] Auto-restore scroll position on load
- [ ] Store draft answers separately (not synced to server)
- [ ] Clean up old view state (>7 days)

**No Sync to Server:**
- Private view state stays local + IndexedDB
- No broadcasting to other users
- Each user has their own copy
- Faster, no bandwidth overhead

---

### Phase 5: DataStore Removal (Week 8+)
**Goal:** Complete cutover from DataStore to Yjs/GraphQL.

**Migration Order:**
1. Unit (editor) ✅
2. Grade (submissions) ✅
3. Question (quiz blocks) ✅
4. ParsedContent (analysis feedback) ✅
5. Chat messages ✅
6. Private unit view ✅
7. Word (vocabulary)

4. Assignment/Section (read-mostly)

**Tasks:**
- [ ] Remove DataStore subscriptions from contexts
- [ ] Update `unitContext.js` to use `useYjsUnit()`
- [ ] Remove `Grade.save()` calls
- [ ] Delete models from `src/models/` (auto-gen from schema)
- [ ] Test full offline scenario (WiFi off, edit, reconnect)

---

## 4. Implementation Details

### ⚠️ CRITICAL: Gen 2 JSON String Handling

**Amplify Gen 2 stores all JSON fields as strings**. You MUST parse on read and stringify on write:

```javascript
// ❌ WRONG - Gen 2 returns strings, not objects
const { data } = await client.models.Unit.get({ id: unitId })
const editorState = data.data // This is a STRING, not an object!

// ✅ CORRECT - Always parse JSON fields
const { data } = await client.models.Unit.get({ id: unitId })
const editorState = JSON.parse(data.data || '{}') // Now it's an object

// ❌ WRONG - Can't save objects directly
await client.models.Grade.update({ 
  id: gradeId, 
  data: { 'block-1': { complete: true } } // Will fail or corrupt data
})

// ✅ CORRECT - Always stringify JSON fields before save
const gradeData = { 'block-1': { complete: true, accuracy: 85 } }
await client.models.Grade.update({ 
  id: gradeId, 
  data: JSON.stringify(gradeData) // Must be a string
})
```

**Affected Models:**
- `Unit.data` - Lexical editor state (JSON string)
- `Grade.data` - Block answers/grades (JSON string)  
- `Word.waveformData` - Audio waveform (JSON string)
- `File.metadata` - File metadata (JSON string)
- `ParsedContent.vocabularyJSON`, `summariesJSON`, `conceptsJSON`, `questionsJSON` - All JSON strings

**Migration Pattern:**
```javascript
// 1. READ: Always parse
const unit = await DataStore.query(Unit, id)
const editorContent = unit.data ? JSON.parse(unit.data) : {}

// 2. WRITE: Always stringify
await DataStore.save(Unit.copyOf(unit, updated => {
  updated.data = JSON.stringify(editorContent) // MUST stringify
}))
```

---

### YjsProvider Wrapper

```javascript
// src/lib/yjs/YjsProvider.js
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

export class YjsDocProvider {
  constructor(docName, config = {}) {
    this.ydoc = new Y.Doc()
    this.docName = docName
    
    // Offline persistence
    this.indexeddb = new IndexeddbPersistence(docName, this.ydoc)
    
    // WebSocket sync
    this.wsProvider = new WebsocketProvider(
      config.wsUrl || 'ws://localhost:3001',
      docName,
      this.ydoc,
      {
        awareness: this.ydoc.awareness,
        resyncInterval: 5000,
        maxBackoffTime: 30000,
      }
    )
    
    this.wsProvider.on('sync', (isSynced) => {
      if (isSynced) {
        console.log(`[YjsProvider] ${docName} synced with server`)
      }
    })
  }
  
  getMap(name) {
    return this.ydoc.getMap(name)
  }
  
  getText(name) {
    return this.ydoc.getText(name)
  }
  
  getArray(name) {
    return this.ydoc.getArray(name)
  }
  
  setAwareness(state) {
    this.ydoc.awareness.setLocalState(state)
  }
  
  destroy() {
    this.wsProvider.destroy()
    this.indexeddb.destroy()
  }
}
```

### Context Adapter Layer

```javascript
// src/context/unitContextYjs.js (NEW - replaces unitContext.js)
import { useEffect, useState, useRef } from 'react'
import { YjsDocProvider } from '../lib/yjs/YjsProvider'
import { generateClient } from 'aws-amplify/data' // Gen 2 client

const client = generateClient()

const useYjsUnit = (unitId) => {
  const providerRef = useRef(null)
  const [unit, setUnit] = useState({})
  const [isSynced, setIsSynced] = useState(false)
  
  useEffect(() => {
    // Fetch initial snapshot from DynamoDB (Gen 2)
    client.models.Unit.get({ id: unitId }).then(({ data }) => {
      if (!data) return
      
      // CRITICAL: Parse JSON string fields from Gen 2
      const parsedUnit = {
        ...data,
        data: data.data ? JSON.parse(data.data) : null,
      }
      setUnit(parsedUnit)
    })
    
    const provider = new YjsDocProvider(`unit-${unitId}`)
    providerRef.current = provider
    
    const ymap = provider.getMap('metadata')
    const ytext = provider.getText('editorContent')
    
    // Subscribe to metadata changes
    ymap.observe((event) => {
      const newUnit = {}
      ymap.forEach((value, key) => {
        newUnit[key] = value
      })
      setUnit(prev => ({ ...prev, ...newUnit }))
    })
    
    // Subscribe to sync status
    provider.wsProvider.on('sync', (isSynced) => {
      setIsSynced(isSynced)
    })
    
    return () => provider.destroy()
  }, [unitId])
  
  const updateMetadata = async (updates) => {
    // Update Yjs map first (local)
    const ymap = providerRef.current.getMap('metadata')
    Object.entries(updates).forEach(([key, value]) => {
      ymap.set(key, value)
    })
    
    // Stringify JSON fields before saving to Gen 2
    const stringifiedUpdates = {
      ...updates,
      data: updates.data ? JSON.stringify(updates.data) : undefined,
    }
    
    // Sync to DynamoDB
    await client.models.Unit.update({ id: unitId, ...stringifiedUpdates })
  }
  
  return { unit, isSynced, updateMetadata }
}
```

### WebSocket Server (Lambda)

```javascript
// amplify/backend/function/yjsSync/index.js
import * as Y from 'yjs'
import { WebSocketServer } from 'ws'

const rooms = new Map() // roomId -> Y.Doc

const wss = new WebSocketServer({ port: 3001 })

wss.on('connection', (ws, req) => {
  const roomId = req.url.slice(1) // /unit-123 → unit-123
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Y.Doc())
  }
  
  const ydoc = rooms.get(roomId)
  const encoder = new Y.encoding.Encoder()
  const decoder = new Y.encoding.Decoder(new Uint8Array())
  
  // Send current state
  Y.encoding.writeVarUint(encoder, 0) // Sync step 1
  Y.encoding.writeVarUint8Array(encoder, Y.encodeState(ydoc))
  ws.send(encoder.toUint8Array())
  
  // Listen for updates from client
  ws.on('message', (message) => {
    const update = new Uint8Array(message)
    Y.applyUpdate(ydoc, update)
    
    // Broadcast to other clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === 1) {
        client.send(update)
      }
    })
    
    // Store in DynamoDB (async)
    persistYjsSnapshot(roomId, Y.encodeState(ydoc))
  })
})
```

---

## 5. Offline-First Strategy

### IndexedDB Persistence

```javascript
// Automatically persists Y.updates to IndexedDB
const indexeddb = new IndexeddbPersistence(docName, ydoc)

// When user goes offline:
// 1. Edit happens locally → Y.Doc updates
// 2. Persisted to IndexedDB immediately
// 3. WebSocket tries to reconnect (exponential backoff)

// When user comes back online:
// 1. WebSocket reconnects
// 2. Client sends pending Y.updates
// 3. Server merges updates (CRDT handles conflicts)
// 4. IndexedDB clears (synced state = source of truth)
```

### Handling Long Offline Periods

```javascript
// If offline for >24 hours, fetch fresh snapshot from server
const lastSyncTime = indexeddb.get('_lastSync')
if (Date.now() - lastSyncTime > 86400000) {
  // Fetch Unit snapshot from GraphQL (Gen 2)
  const { data } = await client.models.Unit.get({ id: unitId })
  
  // Parse JSON string fields
  const editorState = JSON.parse(data.data || '{}')
  const yjsSnapshot = data.yjsSnapshot // base64 string
  
  // Apply Yjs snapshot (decode from base64 if stored as base64)
  if (yjsSnapshot) {
    const updateBytes = Buffer.from(yjsSnapshot, 'base64')
    Y.applyUpdate(ydoc, updateBytes)
  }
}
```

---

## 6. Conflict Resolution

### CRDT (Conflict-free Replicated Data Type)

**Automatic** via Yjs:
```javascript
// User A edits offset 0
ytext.insert(0, 'Hello')

// User B edits offset 0 (same location, different times)
ytext.insert(0, 'Hi')

// Yjs applies both: Result = 'HelloHi' or 'HiHello' 
// (depends on client ID, but deterministic)
// NO conflicts, NO manual merge needed
```

### Metadata Conflicts (Last-Write-Wins)

```javascript
// For non-operational transforms (name, status)
// Store timestamp with each change
ymetadata.set('name', { value: 'New Name', ts: Date.now() })

// On merge, pick entry with newer timestamp
const mergeMetadata = (incoming) => {
  if (incoming.ts > ymetadata.get('name').ts) {
    ymetadata.set('name', incoming)
  }
}
```

### Permission Conflicts

```javascript
// Student tries to edit their own accuracy score
// Server-side validation blocks it
validateGradeEdit(studentId, gradeData) {
  if (gradeData.accuracy && studentId === grade.owner) {
    throw new Error('Students cannot modify their own accuracy')
  }
}
```

---

## 7. Rollback Plan

If Yjs migration causes issues:

1. **Revert Editor Only** (Phase 1):
   - Use DataStore Unit.data as fallback
   - Keep Y.updates as "preview only"
   - Flip a feature flag to disable Yjs binding

2. **Full Rollback** (Any Phase):
   - Switch `useYjsUnit()` → original `useDataStoreUnit()`
   - Drop Y.* fields from schema
   - Restore DataStore subscriptions

**Estimated Time:** 2-4 hours per component reverted

---

## 8. Testing Strategy

### Unit Tests
```javascript
// src/lib/yjs/__tests__/YjsProvider.test.js
test('syncs Y.Text edits across docs', async () => {
  const doc1 = new YjsDocProvider('test-doc')
  const doc2 = new YjsDocProvider('test-doc')
  
  doc1.getText('content').insert(0, 'Hello')
  await waitForSync(100)
  
  expect(doc2.getText('content').toString()).toBe('Hello')
})
```

### Integration Tests
```javascript
// cypress/e2e/editor-collaboration.cy.js
it('syncs edits in real-time between tabs', () => {
  cy.window().then(win => {
    const doc1 = win.yjs.getDoc('unit-1')
    const doc2 = win.yjs.getDoc('unit-1')
    
    doc1.getText('editor').insert(0, 'Test')
    expect(doc2.getText('editor').toString()).toBe('Test')
  })
})
```

### E2E Tests
- [ ] Editor offline sync
- [ ] Grade submission conflict resolution
- [ ] Multi-user simultaneous edits
- [ ] Network reconnection scenarios
- [ ] Large document performance (100k+ chars)

---

## 9. Performance Benchmarks

| Metric | DataStore | Yjs | Target |
|--------|-----------|-----|--------|
| Edit latency | 2-3s | 50-100ms | <100ms |
| Sync bandwidth | ~2KB/edit | 100-500B | <500B |
| Offline capacity | ~5 edits | Unlimited | Unlimited |
| Memory (100k chars) | 8MB+ | 2MB | <5MB |
| CPU (merge 1k updates) | 500ms | 50ms | <100ms |

---

## 10. Timeline

```
Week 1:  Infrastructure (Yjs, WebSocket server)
Week 2-3: Editor content migration
Week 4-5: Grade submission sync
Week 5-6: Question content sync + Chat messages (parallel)
Week 6:   ParsedContent analysis feedback (parallel with chat)
Week 6-7: Private unit view state
Week 8+:  DataStore removal + optimization
```

**Total Duration:** 8-10 weeks  
**Team Size:** 2-3 engineers

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| WebSocket server downtime | Medium | High | Fallback to polling, auto-reconnect |
| IndexedDB quota exceeded | Low | Medium | Compression, pruning old docs |
| CRDT divergence | Very Low | High | Version vectors, periodic validation |
| Performance regression | Medium | Medium | Benchmarking at each phase |
| Data loss on migration | Very Low | Critical | Dual-write (Y.updates + DataStore) |

---

## 12. Common Pitfalls - Gen 2 JSON String Handling

### ❌ Pitfall 1: Forgetting to Parse JSON on Read

```javascript
// WRONG - Treating JSON string as object
const { data } = await client.models.Unit.get({ id: unitId })
console.log(data.data.root) // ❌ TypeError: Cannot read property 'root' of undefined
// data.data is a STRING like '{"root":{"children":[]}}'

// CORRECT - Always parse
const { data } = await client.models.Unit.get({ id: unitId })
const editorState = JSON.parse(data.data || '{}')
console.log(editorState.root) // ✅ Works
```

### ❌ Pitfall 2: Forgetting to Stringify on Write

```javascript
// WRONG - Saving object directly
await client.models.Grade.update({
  id: gradeId,
  data: { 'block-1': { complete: true } } // ❌ Will corrupt data
})

// CORRECT - Always stringify
await client.models.Grade.update({
  id: gradeId,
  data: JSON.stringify({ 'block-1': { complete: true } }) // ✅ Works
})
```

### ❌ Pitfall 3: Double-Stringifying

```javascript
// WRONG - Stringifying twice
const gradeData = { 'block-1': { complete: true } }
const jsonString = JSON.stringify(gradeData)
await client.models.Grade.update({
  id: gradeId,
  data: JSON.stringify(jsonString) // ❌ Double-stringified!
})
// Result in DB: "\"{\\\"block-1\\\":{\\\"complete\\\":true}}\""

// CORRECT - Stringify once
await client.models.Grade.update({
  id: gradeId,
  data: JSON.stringify(gradeData) // ✅ One level of stringification
})
```

### ❌ Pitfall 4: Null/Undefined Handling

```javascript
// WRONG - Assuming undefined/null are safe
const unit = await client.models.Unit.get({ id: unitId })
const editorState = JSON.parse(unit.data.data) // ❌ Throws if data.data is null

// CORRECT - Default to empty object/array
const editorState = JSON.parse(unit.data.data || '{}')
const chatMessages = JSON.parse(unit.data.chatMessagesJSON || '[]')
```

### ❌ Pitfall 5: Mixing Yjs and Direct JSON Saves

```javascript
// WRONG - Bypassing Yjs sync layer
const ymap = ydoc.getMap('metadata')
ymap.set('name', 'New Name') // Updates Yjs

// Then immediately:
await client.models.Unit.update({ 
  id: unitId, 
  name: 'Different Name' // ❌ Out of sync with Yjs!
})

// CORRECT - Use Yjs as single source of truth
const ymap = ydoc.getMap('metadata')
ymap.set('name', 'New Name')
// Let Yjs provider handle DB sync automatically
```

### ✅ Best Practice Checklist

- [ ] Parse JSON fields on read: `JSON.parse(data.field || '{}')`
- [ ] Stringify JSON fields on write: `data: JSON.stringify(obj)`
- [ ] Handle null/undefined: Use fallback `|| '{}'` or `|| '[]'`
- [ ] Use single source of truth: Yjs OR direct DB, not both
- [ ] Test with empty/null data: Verify `data: null` doesn't break parsing
- [ ] Validate after parse: Check structure matches expected schema

---

## 13. Next Steps

**Immediate (Today):**
1. [ ] Approve this plan
2. [ ] Assign 2 engineers to Phase 0
3. [ ] Set up WebSocket infrastructure

**This Week:**
1. [ ] Create Yjs provider library
2. [ ] Deploy test WebSocket server
3. [ ] Write basic Y.Text binding tests

**Next Week:**
1. [ ] Start Editor3 integration
2. [ ] Begin Lexical ↔ Y.Text binding

