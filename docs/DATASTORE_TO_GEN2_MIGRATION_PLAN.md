# DataStore to Gen2 Client Migration Plan

**Created**: January 23, 2026  
**Status**: 60-70% Complete ⚠️  
**Updated**: January 27, 2026  
**Remaining Effort**: 20-40 hours  
**Priority**: Medium (backend complete, frontend partially migrated)

## Progress Summary

### ✅ Completed
- **Gen2 Client Utility**: `src/utils/amplifyClient.ts` - Singleton client with error handling
- **Context Files**: 6 contexts using `getAmplifyClient()` (unitContext.js, sectionContext.js, filesContext.js, dictionaryContext.js, settingsContext.js, sectionContext.js)
- **Components**: 27+ components using Gen2 patterns (query, mutations, subscriptions)
- **Backend**: All 20+ data models available via Gen2 API

### ⏳ Remaining Work
- ~30 files still using DataStore imports
- Real-time subscription patterns need conversion from `observeQuery()` to `client.models.X.observeQuery()`
- Test coverage for migrated components

---

## Executive Summary

This plan details the migration of ~100+ DataStore calls across 50+ files from AWS Amplify Gen 1 DataStore to Gen 2 GraphQL client. The backend is Gen2-ready; this migration unblocks full Gen2 functionality including real-time sync and WebSocket integration.

**Key Stats:**
- **Files affected**: ~55 files (contexts, pages, components, utils)
- **DataStore operations**: 100+ calls (query, save, delete, observe, observeQuery)
- **Timeline**: 6-8 weeks with dedicated focus
- **Risk**: Medium (existing patterns well-documented, comprehensive testing needed)

---

## Table of Contents

1. [Migration Patterns](#migration-patterns)
2. [File Inventory](#file-inventory)
3. [Phase-by-Phase Plan](#phase-by-phase-plan)
4. [Testing Strategy](#testing-strategy)
5. [Rollback Procedures](#rollback-procedures)
6. [Code Examples](#code-examples)

---

## Migration Patterns

### Pattern 1: Simple Query (Read Single Item)

**Gen 1 DataStore:**
```javascript
import { DataStore } from 'aws-amplify/datastore';
import { Unit } from '../models';

const unit = await DataStore.query(Unit, unitId);
```

**Gen 2 Client:**
```typescript
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

const { data: unit, errors } = await client.models.Unit.get({ id: unitId });
if (errors) {
  console.error('Error fetching unit:', errors);
}
```

---

### Pattern 2: Query with Filter

**Gen 1 DataStore:**
```javascript
const sections = await DataStore.query(Section, s => s.owner.eq(myUserId));
```

**Gen 2 Client:**
```typescript
const { data: sections, errors } = await client.models.Section.list({
  filter: {
    owner: { eq: myUserId }
  }
});
```

---

### Pattern 3: Create New Record

**Gen 1 DataStore:**
```javascript
const newUnit = await DataStore.save(new Unit({
  name: 'My Unit',
  description: 'Description',
  data: JSON.stringify(editorContent),
}));
```

**Gen 2 Client:**
```typescript
const { data: newUnit, errors } = await client.models.Unit.create({
  name: 'My Unit',
  description: 'Description',
  data: JSON.stringify(editorContent),
});
```

---

### Pattern 4: Update Existing Record

**Gen 1 DataStore:**
```javascript
await DataStore.save(Unit.copyOf(currentUnit, updated => {
  updated.name = newName;
  updated.data = JSON.stringify(editorContent);
}));
```

**Gen 2 Client:**
```typescript
const { data: updatedUnit, errors } = await client.models.Unit.update({
  id: currentUnit.id,
  name: newName,
  data: JSON.stringify(editorContent),
});
```

**Note:** Gen2 automatically handles version conflicts via optimistic concurrency control.

---

### Pattern 5: Delete Record

**Gen 1 DataStore:**
```javascript
await DataStore.delete(unit);
// OR
await DataStore.delete(Unit, unitId);
```

**Gen 2 Client:**
```typescript
const { data: deleted, errors } = await client.models.Unit.delete({
  id: unit.id
});
```

---

### Pattern 6: ObserveQuery (Real-time Subscription)

**Gen 1 DataStore:**
```javascript
const subscription = DataStore.observeQuery(Unit).subscribe(({ items, isSynced }) => {
  setUnits(items);
  setIsSynced(isSynced);
});

return () => subscription.unsubscribe();
```

**Gen 2 Client:**
```typescript
const subscription = client.models.Unit.observeQuery().subscribe({
  next: ({ items, isSynced }) => {
    setUnits(items);
    setIsSynced(isSynced);
  },
  error: (error) => console.error('Subscription error:', error)
});

return () => subscription.unsubscribe();
```

---

### Pattern 7: Observe (Model-level Changes)

**Gen 1 DataStore:**
```javascript
const subscription = DataStore.observe(Grade).subscribe(() => {
  fetchGrades();
});

return () => subscription.unsubscribe();
```

**Gen 2 Client:**
```typescript
// Gen2 uses observeQuery for all subscriptions
const subscription = client.models.Grade.observeQuery().subscribe({
  next: () => {
    fetchGrades();
  }
});

return () => subscription.unsubscribe();
```

---

### Pattern 8: Lazy Loading Relationships (Many-to-Many)

**Gen 1 DataStore:**
```javascript
const unit = await DataStore.query(Unit, unitId);
const words = await unit.words.toArray(); // Lazy load UnitWord join
```

**Gen 2 Client:**
```typescript
const { data: unit } = await client.models.Unit.get({ id: unitId });

// Fetch related words via join table
const { data: unitWords } = await client.models.UnitWord.list({
  filter: { unitID: { eq: unitId } }
});

// Get full word objects
const wordPromises = unitWords.map(uw => 
  client.models.Word.get({ id: uw.wordID })
);
const wordResults = await Promise.all(wordPromises);
const words = wordResults.map(r => r.data).filter(Boolean);
```

---

### Pattern 9: DataStore Lifecycle (Start/Stop/Clear)

**Gen 1 DataStore:**
```javascript
await DataStore.stop();
await DataStore.clear();
await DataStore.start();
```

**Gen 2 Client:**
```typescript
// No longer needed - Gen2 client handles lifecycle automatically
// Remove these calls during migration
```

---

## File Inventory

### Critical Path (Phase 1) - Core Contexts

| File | DataStore Operations | Priority | Est. Hours | Dependencies |
|------|---------------------|----------|------------|--------------|
| [src/context/unitContext.js](../src/context/unitContext.js) | observeQuery (Grade), query, save | **P0** | 8-12 | None |
| [src/context/fileContext.js](../src/context/fileContext.js) | observeQuery (File, Document) | **P0** | 6-8 | None |
| [src/context/sectionContext.js](../src/context/sectionContext.js) | observeQuery (Section, Assignment) | **P0** | 6-8 | None |
| [src/context/dictionaryContext.js](../src/context/dictionaryContext.js) | observeQuery (Word, Question) | **P0** | 6-8 | None |
| [src/context/settingsContext.js](../src/context/settingsContext.js) | query (Settings), save | **P1** | 2-3 | None |
| [src/context/tabContext.js](../src/context/tabContext.js) | query, save | **P1** | 2-3 | None |

**Subtotal Phase 1**: 30-42 hours

---

### Phase 2 - Main Pages

| File | DataStore Operations | Priority | Est. Hours | Dependencies |
|------|---------------------|----------|------------|--------------|
| [pages/_app.js](../pages/_app.js) | start, stop, clear | **P0** | 2-3 | Remove lifecycle |
| [pages/index.js](../pages/index.js) | query, observe (Grade, Assignment, Section, Unit) | **P0** | 4-6 | unitContext |
| [pages/units.js](../pages/units.js) | query, observe, save | **P1** | 3-4 | unitContext |
| [pages/sections.js](../pages/sections.js) | query, observe, save | **P1** | 3-4 | sectionContext |
| [pages/grades.js](../pages/grades.js) | query, observe (Grade, Section) | **P1** | 3-4 | sectionContext |
| [pages/section/[id].js](../pages/section/[id].js) | query, observe, save, delete (Section, Assignment, Grade, Unit) | **P1** | 6-8 | sectionContext, unitContext |
| [pages/profile.js](../pages/profile.js) | clear | **P2** | 1 | None |

**Subtotal Phase 2**: 22-30 hours

---

### Phase 3 - Editor Components

| File | DataStore Operations | Priority | Est. Hours | Dependencies |
|------|---------------------|----------|------------|--------------|
| [src/components/Editor3/index.js](../src/components/Editor3/index.js) | Multiple operations | **P0** | 4-6 | unitContext |
| [src/components/Editor3/plugins/StoryProgressPlugin.js](../src/components/Editor3/plugins/StoryProgressPlugin.js) | save (Grade) | **P0** | 2-3 | unitContext |
| [src/components/Editor3/plugins/DragDropPastePlugin.js](../src/components/Editor3/plugins/DragDropPastePlugin.js) | save (File) | **P1** | 2-3 | fileContext |
| [src/components/Editor3/plugins/PlaylistPlugin.js](../src/components/Editor3/plugins/PlaylistPlugin.js) | query, save (UnitFile, File) | **P1** | 3-4 | fileContext |
| [src/components/Editor3/components/FileManager2.js](../src/components/Editor3/components/FileManager2.js) | query, save, delete (File, Document, ParsedContent) | **P0** | 6-8 | fileContext |
| [src/components/Editor3/components/DocumentUploader.js](../src/components/Editor3/components/DocumentUploader.js) | query, save, delete (Document) | **P1** | 3-4 | fileContext |
| [src/components/Editor3/components/AssignmentConfiguration.js](../src/components/Editor3/components/AssignmentConfiguration.js) | save, delete (Assignment) | **P1** | 2-3 | sectionContext |
| [src/components/Editor3/components/AnswerEditor.js](../src/components/Editor3/components/AnswerEditor.js) | query, save, delete (Word, UnitWord) | **P1** | 3-4 | dictionaryContext |
| [src/components/Editor3/components/MeaningAssociationEditor.js](../src/components/Editor3/components/MeaningAssociationEditor.js) | query, save, delete (Word, UnitWord) | **P1** | 3-4 | dictionaryContext |
| [src/components/Editor3/components/PlaylistEditor.js](../src/components/Editor3/components/PlaylistEditor.js) | query, save, delete (File, UnitFile) | **P1** | 3-4 | fileContext |
| [src/components/Editor3/components/ConfigurationManager.js](../src/components/Editor3/components/ConfigurationManager.js) | save (Unit) | **P1** | 2-3 | unitContext |
| [src/components/Editor3/components/AudioWaveformPlayer.js](../src/components/Editor3/components/AudioWaveformPlayer.js) | save (File) | **P2** | 2-3 | fileContext |
| [src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js](../src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.js) | observe, query, save (Question) | **P1** | 4-5 | dictionaryContext |

**Subtotal Phase 3**: 39-54 hours

---

### Phase 4 - Dictionary & Chat Components

| File | DataStore Operations | Priority | Est. Hours | Dependencies |
|------|---------------------|----------|------------|--------------|
| [src/components/DictionaryEditor2.js](../src/components/DictionaryEditor2.js) | save, delete (Word) | **P0** | 6-8 | dictionaryContext |
| [src/components/ChatSidebar.js](../src/components/ChatSidebar.js) | query, save, delete, observeQuery (AssistantChat, AssistantChatFile, Document) | **P1** | 6-8 | Multiple |
| [src/components/ChatSidebar/SearchResults.js](../src/components/ChatSidebar/SearchResults.js) | query, save (Unit, UnitWord, QuestionUnit) | **P1** | 3-4 | dictionaryContext |
| [src/components/VocabularyReview2.tsx](../src/components/VocabularyReview2.tsx) | query, observeQuery (Document, ParsedContent) | **P1** | 3-4 | fileContext |
| [src/components/QuestionsReview2.tsx](../src/components/QuestionsReview2.tsx) | query, observeQuery (Document, ParsedContent) | **P1** | 3-4 | fileContext |
| [src/components/SectionAssigner.js](../src/components/SectionAssigner.js) | save, delete (Assignment) | **P1** | 2-3 | sectionContext |
| [src/components/RecordingStudio2.js](../src/components/RecordingStudio2.js) | save (File) | **P2** | 2-3 | fileContext |
| [src/components/AIFeedbackWidget.tsx](../src/components/AIFeedbackWidget.tsx) | save (AiFeedback) | **P2** | 2-3 | None |
| [src/components/MainToolbar.js](../src/components/MainToolbar.js) | clear (Section) | **P2** | 1 | None |
| [src/components/MeaningAssociationExercise/*.js](../src/components/MeaningAssociationExercise/) | 3 files, basic operations | **P2** | 3-4 | dictionaryContext |

**Subtotal Phase 4**: 31-44 hours

---

### Phase 5 - Utilities & Hooks

| File | DataStore Operations | Priority | Est. Hours | Dependencies |
|------|---------------------|----------|------------|--------------|
| [src/utils/chatTools.js](../src/utils/chatTools.js) | query, save, delete (Word, Question, File, Section, Unit, Assignment) | **P1** | 6-8 | All contexts |
| [src/utils/embeddingGenerator.js](../src/utils/embeddingGenerator.js) | query (Unit, Section) | **P2** | 2-3 | unitContext |
| [src/hooks/useEmbeddings.js](../src/hooks/useEmbeddings.js) | Comments only (no active calls) | **P3** | 1 | None |
| [src/components/embeddings/WordEmbeddingIntegration.js](../src/components/embeddings/WordEmbeddingIntegration.js) | Comments only (no active calls) | **P3** | 1 | None |

**Subtotal Phase 5**: 10-13 hours

---

## Total Effort Summary

| Phase | Hours | Files | Priority |
|-------|-------|-------|----------|
| Phase 1: Core Contexts | 30-42 | 6 | Critical |
| Phase 2: Main Pages | 22-30 | 7 | High |
| Phase 3: Editor Components | 39-54 | 13 | High |
| Phase 4: Dictionary & Chat | 31-44 | 10 | Medium |
| Phase 5: Utils & Hooks | 10-13 | 4 | Low |
| **Total** | **132-183 hours** | **40 files** | - |

**Realistic Estimate**: 150-180 hours (accounting for testing, debugging, refactoring)

---

## Phase-by-Phase Plan

### Phase 1: Core Contexts (Week 1-2)

**Goal**: Migrate foundational contexts that other components depend on.

#### Step 1.1: Create Gen2 Client Utility
**Files**: `src/utils/amplifyClient.ts` (new)

```typescript
// src/utils/amplifyClient.ts
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

// Singleton client instance
let client: ReturnType<typeof generateClient<Schema>> | null = null;

export const getAmplifyClient = () => {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
};

// Re-export for convenience
export type { Schema };
```

**Effort**: 1 hour

---

#### Step 1.2: Migrate unitContext.js
**File**: [src/context/unitContext.js](../src/context/unitContext.js)

**Current DataStore Usage:**
- `DataStore.observeQuery(Grade)` - Subscribe to grade changes
- Various query/save operations in child functions

**Migration Steps:**
1. Import `getAmplifyClient()` instead of DataStore
2. Replace `DataStore.observeQuery(Grade)` with `client.models.Grade.observeQuery()`
3. Update `saveGrade()` to use `client.models.Grade.create()` or `.update()`
4. Update all version tracking (OCC) to rely on Gen2's built-in handling
5. Test grade creation, update, and real-time sync

**Testing Checklist:**
- [ ] Grade creation works
- [ ] Grade update works with OCC
- [ ] Real-time subscription updates state
- [ ] Rubric calculation still functions
- [ ] Version ref tracking works with new data

**Effort**: 8-12 hours

---

#### Step 1.3: Migrate fileContext.js
**File**: [src/context/fileContext.js](../src/context/fileContext.js)

**Current DataStore Usage:**
- `DataStore.observeQuery(File)` - Line 346
- `DataStore.observeQuery(Document)` - Line 421

**Migration Steps:**
1. Replace File subscription with `client.models.File.observeQuery()`
2. Replace Document subscription with `client.models.Document.observeQuery()`
3. Keep S3 operations as-is (already using Gen2 `uploadData`, `list`, `remove`)
4. Test file uploads, deletions, and document analysis

**Testing Checklist:**
- [ ] File list updates in real-time
- [ ] Document analysis status updates
- [ ] File uploads to S3 work
- [ ] File deletion cascades properly

**Effort**: 6-8 hours

---

#### Step 1.4: Migrate sectionContext.js
**File**: [src/context/sectionContext.js](../src/context/sectionContext.js)

**Migration Steps:**
1. Replace DataStore operations with Gen2 client
2. Update Section and Assignment subscriptions
3. Test join code generation and section enrollment

**Testing Checklist:**
- [ ] Section creation works
- [ ] Assignment creation/deletion works
- [ ] Join codes function properly
- [ ] Student enrollment updates in real-time

**Effort**: 6-8 hours

---

#### Step 1.5: Migrate dictionaryContext.js
**File**: [src/context/dictionaryContext.js](../src/context/dictionaryContext.js)

**Migration Steps:**
1. Replace Word and Question subscriptions
2. Update UnitWord join table operations
3. Test vocabulary and question bank updates

**Testing Checklist:**
- [ ] Word list updates properly
- [ ] Question bank updates
- [ ] Unit-word associations work
- [ ] Embedding generation still functions

**Effort**: 6-8 hours

---

#### Step 1.6: Migrate settingsContext.js & tabContext.js
**Files**: [src/context/settingsContext.js](../src/context/settingsContext.js), [src/context/tabContext.js](../src/context/tabContext.js)

**Migration Steps:**
1. Simple query/save operations - straightforward migration
2. Test settings persistence

**Effort**: 4-6 hours total

---

### Phase 2: Main Pages (Week 3)

**Goal**: Update all Next.js pages to use migrated contexts.

#### Step 2.1: Remove DataStore Lifecycle from _app.js
**File**: [pages/_app.js](../pages/_app.js)

**Changes:**
- Remove `DataStore.start()`, `DataStore.stop()`, `DataStore.clear()`
- Remove schema version checking (Gen2 handles this)
- Keep Amplify.configure()

**Effort**: 2-3 hours

---

#### Step 2.2: Migrate Dashboard Page
**File**: [pages/index.js](../pages/index.js)

**Current DataStore Usage:**
- `DataStore.query(Grade)`
- `DataStore.observe(Grade)`
- `DataStore.query(Assignment)`
- `DataStore.observe(Assignment)`
- `DataStore.query(Section)`
- `DataStore.observe(Section)`
- `DataStore.query(Unit)`
- `DataStore.observe(Unit)`

**Migration Steps:**
1. Replace all `DataStore.query()` with `client.models.*.list()`
2. Replace all `DataStore.observe()` with `client.models.*.observeQuery()`
3. Ensure context data is used instead of duplicate queries where possible

**Effort**: 4-6 hours

---

#### Step 2.3: Migrate Units, Sections, Grades Pages
**Files**: [pages/units.js](../pages/units.js), [pages/sections.js](../pages/sections.js), [pages/grades.js](../pages/grades.js)

**Migration Steps:**
1. Replace query/observe/save operations
2. Leverage context data where available
3. Test CRUD operations

**Effort**: 9-12 hours total (3-4 hours each)

---

#### Step 2.4: Migrate Section Detail Page
**File**: [pages/section/[id].js](../pages/section/[id].js)

**Current DataStore Usage:**
- Complex queries with filters
- Multiple model interactions (Section, Assignment, Grade, Unit)
- Delete operations

**Migration Steps:**
1. Replace filtered queries with Gen2 filter syntax
2. Update all subscriptions
3. Test assignment creation/deletion
4. Test section deletion cascade

**Effort**: 6-8 hours

---

### Phase 3: Editor Components (Week 4-5)

**Goal**: Update Lexical editor and all plugins.

#### Step 3.1: Migrate Editor Core
**File**: [src/components/Editor3/index.js](../src/components/Editor3/index.js)

**Migration Steps:**
1. Use unitContext's migrated methods
2. Remove any direct DataStore calls
3. Test editor state persistence

**Effort**: 4-6 hours

---

#### Step 3.2: Migrate Editor Plugins
**Files**: StoryProgressPlugin, DragDropPastePlugin, PlaylistPlugin

**Migration Steps:**
1. Replace File/Grade save operations
2. Update UnitFile join table operations
3. Test drag-drop file uploads
4. Test playlist functionality

**Effort**: 7-10 hours total

---

#### Step 3.3: Migrate Editor Components
**Files**: FileManager2, DocumentUploader, AssignmentConfiguration, AnswerEditor, etc. (10 files)

**Migration Steps:**
1. One component at a time
2. Focus on CRUD operations
3. Test each component in isolation via Storybook
4. Integration test in full editor

**Effort**: 28-38 hours total

---

### Phase 4: Dictionary & Chat (Week 6)

**Goal**: Complete DictionaryEditor2, ChatSidebar, and review components.

#### Step 4.1: Migrate DictionaryEditor2
**File**: [src/components/DictionaryEditor2.js](../src/components/DictionaryEditor2.js)

**Migration Steps:**
1. Replace Word save/delete operations
2. Test bulk operations (delete multiple words)
3. Test audio upload integration
4. Test embedding generation

**Effort**: 6-8 hours

---

#### Step 4.2: Migrate ChatSidebar
**File**: [src/components/ChatSidebar.js](../src/components/ChatSidebar.js)

**Migration Steps:**
1. Replace AssistantChat CRUD operations
2. Update AssistantChatFile join table
3. Test file association with chats
4. Test document observation subscription

**Effort**: 6-8 hours

---

#### Step 4.3: Migrate Other Components
**Files**: SearchResults, VocabularyReview2, QuestionsReview2, SectionAssigner, RecordingStudio2, etc.

**Migration Steps:**
1. Simple save/query operations
2. Test integration with migrated contexts

**Effort**: 19-28 hours total

---

### Phase 5: Utilities & Final Cleanup (Week 7)

**Goal**: Complete utility migrations and comprehensive testing.

#### Step 5.1: Migrate chatTools.js
**File**: [src/utils/chatTools.js](../src/utils/chatTools.js)

**Current Usage**: Extensive DataStore operations for chat tool functions

**Migration Steps:**
1. Update all tool functions to use Gen2 client
2. Test each tool function individually
3. Verify chat tool integration still works

**Effort**: 6-8 hours

---

#### Step 5.2: Cleanup & Documentation
**Tasks:**
1. Remove all DataStore imports
2. Update README/docs with Gen2 patterns
3. Remove Gen1 model files if no longer needed
4. Update Copilot instructions

**Effort**: 4-5 hours

---

## Testing Strategy

### Unit Testing

**New Tests to Create:**
```
test/unit/contexts/
  ├── unitContext.test.ts
  ├── fileContext.test.ts
  ├── sectionContext.test.ts
  └── dictionaryContext.test.ts

test/unit/utils/
  ├── amplifyClient.test.ts
  └── chatTools.test.ts
```

**Testing Patterns:**
```typescript
// Mock Gen2 client
import { getAmplifyClient } from '@/utils/amplifyClient';

jest.mock('@/utils/amplifyClient', () => ({
  getAmplifyClient: jest.fn(() => ({
    models: {
      Unit: {
        get: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        observeQuery: jest.fn(() => ({
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
        }))
      }
    }
  }))
}));
```

---

### Integration Testing

**E2E Test Scenarios** (see [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md)):
1. **Unit CRUD**: Create, read, update, delete units
2. **Assignment Flow**: Create section, assign unit, complete assignment
3. **Real-time Sync**: Multi-user editing, subscription updates
4. **File Management**: Upload, delete, associate files
5. **Grading Flow**: Complete unit, submit grade, instructor review

**Test Environment**: Amplify Sandbox with test data

---

### Storybook Testing

**Update Storybook Mocks:**
```
.storybook/__mocks__/
  ├── amplifyClient.ts (new - replaces DataStore mock)
  └── ui-data/ (update to use Gen2 data structures)
```

**Test Each Migrated Component:**
- DictionaryEditor2
- FileManager2
- ChatSidebar
- All Editor components

---

### Manual Testing Checklist

After each phase:
- [ ] Test in Amplify Sandbox
- [ ] Verify real-time updates work
- [ ] Check error handling
- [ ] Confirm OCC (optimistic concurrency) functions
- [ ] Test offline behavior (if applicable)
- [ ] Verify auth integration

---

## Rollback Procedures

### Git Strategy

**Branch Structure:**
```
main
└── gen2-migration
    ├── phase-1-contexts
    ├── phase-2-pages
    ├── phase-3-editor
    ├── phase-4-dictionary-chat
    └── phase-5-utils
```

**Each phase branch should:**
1. Be fully tested before merging
2. Include rollback commit tags
3. Have corresponding test results documented

---

### Rollback Steps

If migration causes production issues:

1. **Immediate Rollback** (< 5 minutes):
   ```bash
   git revert <migration-commit-sha>
   npm run deploy
   ```

2. **Partial Rollback** (specific component):
   ```bash
   git checkout main -- src/context/unitContext.js
   git commit -m "Rollback unitContext to DataStore"
   ```

3. **Full Rollback** (entire migration):
   ```bash
   git checkout main
   git branch -D gen2-migration
   npm run deploy
   ```

---

### Dual-Mode Support (Transition Period)

**If needed**, support both DataStore and Gen2 simultaneously:

```typescript
// src/utils/dataClient.ts
import { DataStore } from 'aws-amplify/datastore';
import { getAmplifyClient } from './amplifyClient';

const USE_GEN2 = process.env.NEXT_PUBLIC_USE_GEN2 === 'true';

export const getDataClient = () => {
  if (USE_GEN2) {
    return getAmplifyClient();
  }
  return {
    query: (model, ...args) => DataStore.query(model, ...args),
    save: (record) => DataStore.save(record),
    delete: (record) => DataStore.delete(record),
    // ... other methods
  };
};
```

**Not recommended** - adds complexity, but available as safety net.

---

## Code Examples

### Example 1: unitContext.js Migration

**Before (DataStore):**
```javascript
// src/context/unitContext.js (Gen1)
import { DataStore } from "aws-amplify/datastore";
import { Grade } from "../models";

// Inside useEffect
React.useEffect(() => {
  if (!session.username) return;

  const subscription = DataStore.observeQuery(Grade, g =>
    g.owner.eq(session.username)
      .assignmentID.eq(id)
  ).subscribe(({ items }) => {
    const incomplete = items.filter(g => !g.complete);
    const complete = items.filter(g => g.complete).slice(0, 5);
    setGrade(incomplete[0] || {});
    setRecentGrades(complete);
  });

  return () => subscription.unsubscribe();
}, [session.username, id]);
```

**After (Gen2):**
```typescript
// src/context/unitContext.js (Gen2)
import { getAmplifyClient } from "../utils/amplifyClient";

// Inside useEffect
React.useEffect(() => {
  if (!session.username) return;

  const client = getAmplifyClient();

  const subscription = client.models.Grade.observeQuery({
    filter: {
      owner: { eq: session.username },
      assignmentID: { eq: id }
    }
  }).subscribe({
    next: ({ items }) => {
      const incomplete = items.filter(g => !g.complete);
      const complete = items.filter(g => g.complete).slice(0, 5);
      setGrade(incomplete[0] || {});
      setRecentGrades(complete);
    },
    error: (err) => console.error('Grade subscription error:', err)
  });

  return () => subscription.unsubscribe();
}, [session.username, id]);
```

---

### Example 2: Save with OCC

**Before (DataStore):**
```javascript
// Manually track version
const nextVersion = versionRef.current + 1;
versionRef.current = nextVersion;

await DataStore.save(Grade.copyOf(currentGrade, updated => {
  updated.data = JSON.stringify(gradeData);
  updated.complete = true;
  updated.accuracy = totalAccuracy;
}));

// Check if subscription returned expected version
if (newGrade._version > nextVersion) {
  // Unexpected update, re-fetch
}
```

**After (Gen2):**
```typescript
// Gen2 handles versioning automatically
const { data: updatedGrade, errors } = await client.models.Grade.update({
  id: currentGrade.id,
  data: JSON.stringify(gradeData),
  complete: true,
  accuracy: totalAccuracy,
});

if (errors) {
  // Handle conflict (Gen2 throws error if version mismatch)
  console.error('Version conflict:', errors);
  // Optionally re-fetch and retry
}

// Update ref with new version
versionRef.current = updatedGrade._version;
```

---

### Example 3: Many-to-Many Join Table

**Before (DataStore):**
```javascript
// Add word to unit
const existing = await DataStore.query(UnitWord, uw =>
  uw.unitID.eq(unitId).wordID.eq(wordId)
);

if (!existing.length) {
  await DataStore.save(new UnitWord({
    unitID: unitId,
    wordID: wordId,
  }));
}
```

**After (Gen2):**
```typescript
// Add word to unit
const { data: existing } = await client.models.UnitWord.list({
  filter: {
    unitID: { eq: unitId },
    wordID: { eq: wordId }
  }
});

if (!existing || existing.length === 0) {
  await client.models.UnitWord.create({
    unitID: unitId,
    wordID: wordId,
  });
}
```

---

## Risk Mitigation

### Known Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Breaking real-time sync** | High | Medium | Thorough testing of observeQuery in sandbox; rollback plan ready |
| **OCC version conflicts** | Medium | Medium | Test concurrent edits; Gen2's built-in handling should prevent |
| **Performance degradation** | Medium | Low | Benchmark before/after; Gen2 typically faster than DataStore |
| **Data loss during migration** | High | Very Low | No data migration needed - schema compatible |
| **Auth token issues** | High | Low | Gen2 uses same Cognito; test all auth flows |
| **Storybook mocks broken** | Low | High | Update mocks first, verify all stories render |

---

## Success Criteria

Migration is **complete** when:

- [ ] **All DataStore imports removed** from codebase
- [ ] **100% tests passing** (unit, integration, E2E)
- [ ] **Storybook components render** with Gen2 mocks
- [ ] **Real-time sync works** in sandbox environment
- [ ] **Performance benchmarks** meet or exceed DataStore baseline
- [ ] **No console errors** related to data operations
- [ ] **Documentation updated** with Gen2 patterns
- [ ] **Staging deployment successful** with full feature verification
- [ ] **Rollback procedure tested** and documented

---

## Timeline

### Optimistic (Full-time dedication)

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Phase 1 | Core contexts migrated, tested |
| 2 | Phase 2 | All pages migrated, tested |
| 3 | Phase 3.1-3.2 | Editor core + plugins migrated |
| 4 | Phase 3.3 | Editor components migrated |
| 5 | Phase 4 | Dictionary + chat migrated |
| 6 | Phase 5 | Utils migrated, cleanup complete |
| 7 | Testing | Comprehensive E2E, staging deployment |

**Total**: 7 weeks

---

### Realistic (Part-time, 20 hrs/week)

| Week | Hours | Phase | Deliverables |
|------|-------|-------|--------------|
| 1-2 | 40 | Phase 1 | Core contexts |
| 3-4 | 40 | Phase 2 | Pages |
| 5-7 | 60 | Phase 3 | Editor |
| 8-9 | 40 | Phase 4 | Dictionary + chat |
| 10 | 20 | Phase 5 | Utils + cleanup |
| 11-12 | 40 | Testing | E2E + staging |

**Total**: 12 weeks

---

## Next Steps

1. **Review this plan** with team
2. **Set up feature branch**: `git checkout -b gen2-migration`
3. **Create tracking issues** for each phase
4. **Begin Phase 1**: Migrate core contexts
5. **Weekly status updates** on progress

---

## References

- [Amplify Gen 2 Data Docs](https://docs.amplify.aws/gen2/build-a-backend/data/)
- [Amplify Gen 2 Client API](https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/)
- [GEN2_MIGRATION_STATUS.md](./GEN2_MIGRATION_STATUS.md) - Overall migration status
- [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md) - Testing strategy
- [DATASTORE_OPTIMIZATION_CHANGES.md](../DATASTORE_OPTIMIZATION_CHANGES.md) - Subscription patterns

---

**Document Status**: ✅ Ready for Review  
**Last Updated**: January 23, 2026  
**Author**: GitHub Copilot  
**Reviewed By**: TBD
