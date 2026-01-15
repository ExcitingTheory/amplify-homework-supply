# Editor Surfaces & Content Deduplication Plan

**Last Updated**: January 9, 2026  
**Status**: Planning Phase

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part 1: Convert Text Fields to Editor Surfaces](#part-1-convert-text-fields-to-editor-surfaces)
3. [Part 2: Content Deduplication](#part-2-content-deduplication)
4. [Part 3: Search Query Caching & Analytics](#part-3-search-query-caching--analytics)
5. [Part 4: Chat Persistence & Soft Delete](#part-4-chat-persistence--soft-delete)
6. [Implementation Timeline](#implementation-timeline)
7. [Success Metrics](#success-metrics)

---

## Executive Summary

This document outlines four major initiatives:

1. **Editor Surface Migration**: Convert 50+ TextField/TextareaAutosize components to Lexical editor surfaces with appropriate rich text capabilities
2. **Content Deduplication**: Implement shared content library with references to eliminate duplicate units, files, and vocabulary
3. **Search Analytics**: Cache all search queries to understand user behavior and improve search relevance
4. **Chat Persistence**: Prevent chat deletion, implement soft delete with hide/archive functionality

**Total Estimated Effort**: 180-220 hours  
**Priority**: High - Improves content authoring, reduces storage costs, enables data-driven improvements

---

## Part 1: Convert Text Fields to Editor Surfaces

### Current State Analysis

#### Text Input Inventory (50+ instances found)

**Simple Text Fields (Single Line - No Rich Text Needed)**
- ✅ Unit name (currently TextField)
- ✅ Section name/code (currently TextField)
- ✅ File metadata: filename, artist, composer, tags (currently TextField/contentEditable)
- ✅ Word phonetic, phrase (currently TextField)
- ✅ Question prompts (short, single line - currently TextField)
- ✅ Assignment due dates (date picker - currently TextField)
- ✅ Search inputs (FileManager2, DictionaryEditor2 - currently TextField)
- ✅ PDF analysis note

**Multi-line Text Areas (Need Rich Text)**
- ❌ Unit description (currently not editable, but should support rich text)
- ❌ Section description (currently TextField, needs rich text)
- ❌ Custom answer prompts (AnswerEditor - TextareaAutosize → needs **rich text**)
- ❌ Meaning association instructions (MeaningAssociationEditor - TextareaAutosize → needs **rich text**)
- ❌ Document review comments (currently TextareaAutosize → needs **rich text**)

**Already Using Lexical Editor**
- ✅ Main unit content (Editor3/index.js - full Lexical editor)
- ✅ Image captions (ImageComponent - nested Lexical)
- ✅ File metadata descriptions (FileMetadataComponent - Lexical composer)
- ✅ Dictionary word notes (DictionaryEditor2 - Lexical composer for examples)

### Categorization: Rich Text vs Plain Text

| Component | Field | Current | Proposed | Rich Text? | Reasoning |
|-----------|-------|---------|----------|------------|-----------|
| **Unit** | name | TextField | TextField | ❌ | Short identifier, no formatting needed |
| **Unit** | description | Not editable | Lexical Editor | ✅ | Needs bold, italic, lists, links for course overview |
| **Section** | name | TextField | TextField | ❌ | Short identifier (e.g., "JPN101-SP24") |
| **Section** | description | TextField | Lexical Editor | ✅ | Class syllabus, policies, links to resources |
| **Word** | phrase | TextField | TextField | ❌ | Japanese text, no formatting |
| **Word** | phonetic | TextField | TextField | ❌ | Romaji/hiragana, no formatting |
| **Word** | definition | TextField | Lexical Editor | ✅ | Examples, usage notes, formatting for clarity |
| **File** | name | TextField | TextField | ❌ | Filename, no formatting |
| **File** | description | TextareaAutosize | Lexical Editor | ✅ | Metadata, credits, links to related content |
| **File** | tags | TextField | TextField | ❌ | Comma-separated, no formatting |
| **File** | artist/composer | TextField | TextField | ❌ | Name, no formatting |
| **Question** | prompt | TextField | Lexical Editor | ✅ | May need bold for emphasis, furigana for Japanese |
| **Question** | feedback | TextareaAutosize | Lexical Editor | ✅ | Detailed explanations, links to resources |
| **AnswerEditor** | instructions | TextareaAutosize | Lexical Editor | ✅ | Step-by-step guidance, formatting |
| **CustomAnswerEditor** | prompt | TextareaAutosize | Lexical Editor | ✅ | Rich prompts with examples |
| **MeaningAssociation** | instructions | TextareaAutosize | Lexical Editor | ✅ | Exercise instructions, formatting |
| **FreeSoloDialog** | description | TextareaAutosize | Lexical Editor | ✅ | Word usage examples, context |
| **ChatSidebar** | input | TextField | TextField | ❌ | Single-line chat input, no formatting |
| **PDFAnalysis** | notes | TextareaAutosize | Lexical Editor | ✅ | Review comments, highlights, links |
| **VocabularyReview** | word notes | TextField | Lexical Editor | ✅ | Usage examples, mnemonics |

### Implementation Strategy

#### Phase 1: Create Reusable Editor Components 

**Goal**: Build standardized Lexical editor wrappers for different use cases

**Components to Create**:

1. **`<SimpleRichTextEditor />`** - Basic rich text (bold, italic, links, lists)
   ```jsx
   // src/components/Editor3/components/SimpleRichTextEditor.jsx
   import { LexicalComposer } from '@lexical/react/LexicalComposer';
   import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
   import { ContentEditable } from '@lexical/react/LexicalContentEditable';
   import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
   import { ListPlugin } from '@lexical/react/LexicalListPlugin';
   import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
   
   /**
    * Lightweight rich text editor for descriptions, definitions, feedback
    * 
    * Features:
    * - Bold, italic, underline
    * - Bulleted/numbered lists
    * - Links
    * - Auto-save to DataStore
    * - Compact toolbar (floating or inline)
    * 
    * @param {string} initialValue - JSON string from DataStore field
    * @param {function} onChange - Callback with JSON string
    * @param {string} placeholder - Placeholder text
    * @param {boolean} autoFocus - Auto-focus on mount
    * @param {number} minHeight - Minimum height in pixels
    */
   export function SimpleRichTextEditor({ 
     initialValue, 
     onChange, 
     placeholder = "Enter text...",
     autoFocus = false,
     minHeight = 100,
   }) {
     // Implementation with minimal nodes (TextNode, ParagraphNode, ListNode, LinkNode)
   }
   ```

2. **`<InlineRichTextEditor />`** - Single-line rich text (for short prompts)
   ```jsx
   // Restricts to single paragraph, Enter key saves/blurs
   // Use for: question prompts, short instructions
   ```

3. **`<CollaborativeRichTextEditor />`** - Future: Multi-user editing with Y.js
   ```jsx
   // For team content creation (instructor collaboration)
   // See YJS_NOTES.md for implementation details
   ```

#### Phase 3: Component Replacement

**Replace TextFields/TextareaAutosize** with `<SimpleRichTextEditor />`:

| File | Component | Lines | Effort | Priority |
|------|-----------|-------|--------|----------|
| `DictionaryEditor2.js` | Word definition editor | ~50 | 4h | High - Frequently used |
| `FileManager2.js` | File description editor | ~100 | 6h | High - Complex component |
| `QuestionEditor2.js` | Question feedback | ~30 | 3h | High - Core feature |
| `AnswerEditor.js` | Answer instructions | ~40 | 3h | Medium |
| `MeaningAssociationEditor.js` | Exercise instructions | ~40 | 3h | Medium |
| `FreeSoloCreateOptionDialog.js` | Word examples | ~20 | 2h | Low |
| `AssignmentConfiguration.js` | Assignment notes | ~15 | 2h | Low |
| `MainToolbar.js` | Unit description | ~30 | 3h | High - First impression |


**Test Cases**:
1. ✅ Create new record with rich text → verify JSON saved correctly
2. ✅ Edit existing plaintext record → verify migration works
3. ✅ Copy/paste from Microsoft Word → verify formatting preserved
4. ✅ Undo/redo history → verify history plugin works
5. ✅ Mobile editing → verify touch interactions
6. ✅ Search functionality → verify plainText fields indexed
7. ✅ DataStore sync → verify real-time updates
8. ✅ Accessibility → verify screen reader compatibility

**Storybook Stories**:
```jsx
// src/components/Editor3/components/SimpleRichTextEditor.stories.jsx
export const WithExistingContent = {
  args: {
    initialValue: mockLexicalJSON,
    placeholder: "Edit word definition..."
  }
};

export const Empty = {
  args: {
    initialValue: null,
    placeholder: "Enter text..."
  }
};

export const ReadOnly = {
  args: {
    initialValue: mockLexicalJSON,
    readOnly: true
  }
};
```

**Effort Summary**:
- Phase 1 (Components): 40 hours
- Phase 2 (Schema): 8 hours
- Phase 3 (Migration): 60 hours
- Phase 4 (Testing): 20 hours
- **Total**: 128 hours

---

## Part 2: Content Deduplication

### Problem Statement

**Current Issues**:
- ❌ Instructors duplicate entire units when they want to reuse content
- ❌ Same vocabulary words exist in multiple units (storage waste)
- ❌ Updating shared content requires editing multiple copies
- ❌ No way to see "canonical" version vs derivatives
- ❌ S3 files uploaded multiple times (same audio file in 5 units)

**Example Scenario**:
- Instructor creates "Hiragana Basics" unit for JPN101
- Wants to reuse for JPN102 with minor modifications
- Currently: Duplicates entire unit (10MB of files, 50 vocabulary words)
- Desired: Reference original unit, override specific sections

### Proposed Architecture

#### Content Library System

**New DataStore Models** (add to schema.graphql):

```graphql
# Shared content library - canonical source of truth
type ContentTemplate @model @auth(rules: [
  { allow: groups, groups: ["Admins", "Instructors"]},
  { allow: public, operations: [read]}
]) {
  id: ID!
  type: String!  # "unit", "vocabulary-set", "question-bank", "file-collection"
  name: String!
  description: AWSJSON
  author: String  # Creator username
  isPublic: Boolean  # Share with other instructors
  version: Int  # Increment on edit
  data: AWSJSON  # Actual content (Lexical JSON, word list, etc.)
  usageCount: Int  # How many units reference this
  tags: [String]  # Searchable tags
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}

# Reference to shared content with overrides
type ContentReference @model @auth(rules: [
  { allow: owner, ownerField: "owner" },
  { allow: groups, groups: ["Admins", "Instructors"]}
]) {
  id: ID!
  templateID: ID!  # FK to ContentTemplate
  template: ContentTemplate @belongsTo(fields: ["templateID"])
  unitID: ID @index(name: "byUnit")
  owner: String
  overrides: AWSJSON  # JSON describing what's different from template
  version: Int  # Which template version is referenced
}

# Track content usage for analytics
type ContentUsageLog @model @auth(rules: [
  { allow: groups, groups: ["Admins"], operations: [read, create]}
]) {
  id: ID!
  templateID: ID @index(name: "byTemplate")
  userID: String @index(name: "byUser")
  action: String  # "referenced", "cloned", "edited", "removed"
  unitID: ID
  timestamp: AWSDateTime
}
```

#### Deduplication Patterns

**Pattern 1: Vocabulary Sets** (Highest ROI - Most duplicated)

```javascript
// BEFORE: Each unit has duplicate Word records
const unit1 = await DataStore.query(Unit, "unit1-id");
const words1 = await unit1.words.toArray(); // 50 words

const unit2 = await DataStore.query(Unit, "unit2-id");
const words2 = await unit2.words.toArray(); // Same 50 words, duplicate IDs

// AFTER: Units reference shared vocabulary template
const vocabTemplate = await DataStore.save(new ContentTemplate({
  type: "vocabulary-set",
  name: "JLPT N5 Core Vocabulary",
  author: session.username,
  isPublic: true,
  version: 1,
  data: JSON.stringify({
    words: [/* array of word objects */]
  })
}));

// Unit references template
await DataStore.save(new ContentReference({
  templateID: vocabTemplate.id,
  unitID: unit.id,
  overrides: JSON.stringify({
    // Exclude specific words, add unit-specific ones
    excludeWords: ["word-id-1", "word-id-2"],
    addWords: [/* unit-specific words */]
  })
}));
```

**Pattern 2: File Deduplication** (S3 Cost Reduction)

```javascript
// BEFORE: Same audio file uploaded 5 times
// s3://bucket/public/audio/konnichiwa-v1.mp3
// s3://bucket/public/audio/konnichiwa-v2.mp3 (same file, different unit)
// s3://bucket/public/audio/konnichiwa-v3.mp3 (same file, different unit)

// AFTER: Content-addressable storage with hash-based keys
import { generateFileHash } from '../utils/fileHashUtils';

const hashAudioFile = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const uploadDeduplicated = async (file) => {
  const hash = await hashAudioFile(file);
  const key = `public/audio/${hash}.${file.name.split('.').pop()}`;
  
  // Check if file already exists
  try {
    await Storage.get(key, { download: false });
    console.log('File already exists, skipping upload');
    return key;
  } catch (error) {
    // File doesn't exist, upload it
    await Storage.put(key, file, { contentType: file.type });
    return key;
  }
};
```

**Pattern 3: Unit Templates** (Reusable Lesson Structures)

```jsx
// UI: Content Library Browser
<ContentLibraryDialog>
  <TemplateGrid>
    {templates.map(template => (
      <TemplateCard
        key={template.id}
        title={template.name}
        author={template.author}
        usageCount={template.usageCount}
        onReference={() => {
          // Create ContentReference linking to this template
          createReference(template.id, currentUnit.id);
        }}
        onClone={() => {
          // Create new template based on this one (deep copy)
          cloneTemplate(template.id);
        }}
      />
    ))}
  </TemplateGrid>
</ContentLibraryDialog>
```

#### Implementation Phases

**Phase 1: Schema & Models** (Week 1, 12 hours)
- Add ContentTemplate, ContentReference, ContentUsageLog to schema.graphql
- Run `amplify push`
- Update src/models/

**Phase 2: Vocabulary Deduplication** (Week 2-3, 30 hours)
- Build VocabularyTemplateManager UI
- Implement template creation from existing words
- Add reference resolution logic
- Migration script to deduplicate existing vocabulary

**Phase 3: File Deduplication** (Week 3-4, 24 hours)
- Implement hash-based S3 key generation
- Add FileManager2 deduplication check
- Migration script to find duplicate files
- Update File model to track hash

**Phase 4: Unit Templates** (Week 4-5, 36 hours)
- ContentLibraryDialog UI
- Template creation workflow
- Override editor (merge template + unit-specific changes)
- Template versioning & update notifications

**Phase 5: Analytics Dashboard** (Week 5, 12 hours)
- ContentUsageLog collection
- Analytics dashboard showing most-used templates
- Orphaned content detection

**Effort Summary**:
- Phase 1: 12 hours
- Phase 2: 30 hours
- Phase 3: 24 hours
- Phase 4: 36 hours
- Phase 5: 12 hours
- **Total**: 114 hours

---

## Part 3: Search Query Caching & Analytics

### Problem Statement

**Current Issues**:
- ❌ No visibility into what users search for
- ❌ Search queries executed fresh every time (performance waste)
- ❌ Can't identify popular content or gaps
- ❌ No search quality metrics (clicks, relevance)

### Proposed Solution

#### Search Analytics Model

```graphql
type SearchQuery @model @auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: groups, groups: ["Admins"], operations: [read]}
]) {
  id: ID!
  userID: String! @index(name: "byUser")
  query: String!
  searchMode: String  # "keyword", "semantic", "hybrid"
  resultCount: Int
  clickedResults: [String]  # Array of clicked file/word/question IDs
  timestamp: AWSDateTime!
  context: String  # "unit-editor", "file-manager", "dictionary"
  sessionID: String @index(name: "bySession")  # Group queries by session
}

# Aggregate popular searches (updated daily via Lambda)
type PopularSearch @model @auth(rules: [
  { allow: groups, groups: ["Admins"], operations: [read, create, update]}
]) {
  id: ID!
  query: String!
  count: Int!
  avgResultCount: Int
  avgClickRate: Float  # How often users click results
  lastQueried: AWSDateTime
  period: String  # "daily", "weekly", "monthly"
}
```

#### Implementation

**1. Capture Search Queries** (FileManager2.js, DictionaryEditor2.js):

```javascript
// FileManager2.js - Track every search
const handleSearch = async (searchTerm) => {
  setSearch(searchTerm);
  
  // Capture query
  const searchQueryRecord = await DataStore.save(new SearchQuery({
    userID: session.username,
    query: searchTerm,
    searchMode: searchMode,
    timestamp: new Date().toISOString(),
    context: 'file-manager',
    sessionID: sessionId, // Generate on mount, persist in state
  }));
  
  // Execute search
  const results = await vectorStore.search(queryEmbedding, filters, 50, searchTerm);
  
  // Update with result count
  await DataStore.save(SearchQuery.copyOf(searchQueryRecord, updated => {
    updated.resultCount = results.length;
  }));
  
  setSearchResults(results);
};

// Track clicks
const handleResultClick = async (fileId) => {
  // Update latest search query with clicked result
  const recentQuery = await DataStore.query(SearchQuery, 
    q => q.sessionID.eq(sessionId).timestamp.gt(Date.now() - 60000), // Last minute
    { sort: s => s.timestamp('DESCENDING'), limit: 1 }
  );
  
  if (recentQuery[0]) {
    await DataStore.save(SearchQuery.copyOf(recentQuery[0], updated => {
      updated.clickedResults = [...(updated.clickedResults || []), fileId];
    }));
  }
};
```

**2. Search Result Caching** (IndexedDB):

```javascript
// src/utils/searchCache.js
import Dexie from 'dexie';

class SearchCacheDB extends Dexie {
  constructor() {
    super('SearchCache');
    this.version(1).stores({
      queries: '++id, query, searchMode, timestamp',
      results: '++id, queryId, [fileId+score]'
    });
  }
  
  async cacheSearch(query, searchMode, results) {
    const queryRecord = await this.queries.add({
      query,
      searchMode,
      timestamp: Date.now(),
    });
    
    await this.results.bulkAdd(
      results.map(r => ({
        queryId: queryRecord,
        fileId: r.id,
        score: r.similarity,
        metadata: JSON.stringify(r)
      }))
    );
  }
  
  async getCached(query, searchMode, maxAge = 300000) { // 5 min cache
    const cached = await this.queries
      .where('query').equals(query)
      .and(q => q.searchMode === searchMode && (Date.now() - q.timestamp) < maxAge)
      .first();
    
    if (!cached) return null;
    
    const results = await this.results.where('queryId').equals(cached.id).toArray();
    return results.map(r => JSON.parse(r.metadata));
  }
}

export const searchCache = new SearchCacheDB();
```

**3. Analytics Dashboard** (New component):

```jsx
// src/components/SearchAnalyticsDashboard.js
export function SearchAnalyticsDashboard() {
  const [popularSearches, setPopularSearches] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchTrends, setSearchTrends] = useState([]);
  
  useEffect(() => {
    // Load PopularSearch aggregates
    DataStore.query(PopularSearch, 
      q => q.period.eq('weekly'),
      { sort: s => s.count('DESCENDING'), limit: 20 }
    ).then(setPopularSearches);
    
    // Load recent searches (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    DataStore.query(SearchQuery,
      q => q.timestamp.gt(weekAgo),
      { sort: s => s.timestamp('DESCENDING'), limit: 100 }
    ).then(setRecentSearches);
  }, []);
  
  return (
    <Box>
      <Typography variant="h4">Search Analytics</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Top Searches (This Week)</Typography>
            <List>
              {popularSearches.map(search => (
                <ListItem key={search.id}>
                  <ListItemText
                    primary={search.query}
                    secondary={`${search.count} searches • ${(search.avgClickRate * 100).toFixed(1)}% click rate`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Search Quality Metrics</Typography>
            <Typography>
              Avg results per search: {avgResultCount}
            </Typography>
            <Typography>
              Searches with zero results: {zeroResultRate}%
            </Typography>
            <Typography>
              Click-through rate: {avgClickRate}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
```

**4. Lambda Aggregation** (Daily cron):

```javascript
// amplify/backend/function/aggregateSearchQueries/src/index.js
exports.handler = async (event) => {
  // Run daily to aggregate SearchQuery → PopularSearch
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const queries = await getAllSearchQueries(yesterday);
  const grouped = groupByQuery(queries);
  
  for (const [query, records] of Object.entries(grouped)) {
    await updatePopularSearch({
      query,
      count: records.length,
      avgResultCount: avg(records.map(r => r.resultCount)),
      avgClickRate: records.filter(r => r.clickedResults?.length > 0).length / records.length,
      lastQueried: new Date().toISOString(),
      period: 'daily'
    });
  }
};
```

**Effort Summary**:
- Search query capture: 8 hours
- Result caching: 6 hours
- Analytics dashboard: 12 hours
- Lambda aggregation: 6 hours
- **Total**: 32 hours

---

## Part 4: Chat Persistence & Soft Delete

### Problem Statement

**Current Issues**:
- ❌ Chat history lost on page refresh (stored in `useChat` state only)
- ❌ No way to review past conversations
- ❌ Users accidentally clear chat and lose context
- ❌ Can't hide sensitive chats without deleting them
- ❌ No instructor visibility into student AI usage

### Proposed Solution

#### Chat History Model

```graphql
type ChatConversation @model @auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: groups, groups: ["Admins"], operations: [read]}
]) {
  id: ID!
  userID: String! @index(name: "byUser")
  title: String  # Auto-generated from first message or user-set
  context: AWSJSON  # Unit, files, sections at time of conversation
  isArchived: Boolean  # Soft delete
  isHidden: Boolean  # Hide from sidebar, but keep in DB
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  messages: [ChatMessage] @hasMany(indexName: "byConversation", fields: ["id"])
}

type ChatMessage @model @auth(rules: [
  { allow: owner, ownerField: "userID" },
  { allow: groups, groups: ["Admins"], operations: [read]}
]) {
  id: ID!
  conversationID: ID! @index(name: "byConversation")
  userID: String!
  role: String!  # "user", "assistant", "system"
  content: String!
  toolCalls: AWSJSON  # Record of tools used
  timestamp: AWSDateTime!
  feedbackScore: Int  # User rating (1-5 stars)
  feedbackComment: String
}
```

#### Implementation

**1. Persist Chat on Every Message** (ChatSidebar.js):

```javascript
const ChatSidebar = () => {
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  
  // Load or create conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      // Get active conversation for current unit
      const existing = await DataStore.query(ChatConversation,
        c => c.userID.eq(session.username)
          .isArchived.eq(false)
          .isHidden.eq(false),
        { sort: s => s.updatedAt('DESCENDING'), limit: 1 }
      );
      
      if (existing[0]) {
        setConversationId(existing[0].id);
        // Load messages
        const msgs = await existing[0].messages.toArray();
        // Restore to useChat hook
        setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
      } else {
        // Create new conversation
        const newConv = await DataStore.save(new ChatConversation({
          userID: session.username,
          title: `Chat - ${unit.name}`,
          context: JSON.stringify({ unitId: unit.id, unitName: unit.name }),
          isArchived: false,
          isHidden: false,
        }));
        setConversationId(newConv.id);
      }
    };
    
    loadConversation();
  }, [unit.id]);
  
  // Save message after send
  const handleSendMessage = useCallback(async (message) => {
    // Call useChat's sendMessage
    await sendMessage(message);
    
    // Persist to DataStore
    await DataStore.save(new ChatMessage({
      conversationID: conversationId,
      userID: session.username,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }));
  }, [conversationId, sendMessage]);
  
  // Save assistant response
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && conversationId) {
      DataStore.save(new ChatMessage({
        conversationID: conversationId,
        userID: session.username,
        role: 'assistant',
        content: lastMessage.content,
        toolCalls: JSON.stringify(lastMessage.toolCalls || []),
        timestamp: new Date().toISOString(),
      }));
      
      // Update conversation updatedAt
      DataStore.query(ChatConversation, conversationId).then(conv => {
        DataStore.save(ChatConversation.copyOf(conv, updated => {
          updated.updatedAt = new Date().toISOString();
        }));
      });
    }
  }, [messages, conversationId]);
};
```

**2. Soft Delete UI** (Sidebar with Archive):

```jsx
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
  {/* Conversation Tabs */}
  <Tabs value={activeTab} onChange={handleTabChange}>
    <Tab label="Active" />
    <Tab label={`Archived (${archivedCount})`} />
  </Tabs>
  
  {/* Conversation List */}
  <List sx={{ flexGrow: 1, overflow: 'auto' }}>
    {filteredConversations.map(conv => (
      <ListItem
        key={conv.id}
        button
        selected={conv.id === conversationId}
        onClick={() => loadConversation(conv.id)}
      >
        <ListItemText
          primary={conv.title}
          secondary={new Date(conv.updatedAt).toLocaleString()}
        />
        <ListItemSecondaryAction>
          <IconButton onClick={() => archiveConversation(conv.id)}>
            <ArchiveIcon />
          </IconButton>
          <IconButton onClick={() => hideConversation(conv.id)}>
            <VisibilityOffIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ))}
  </List>
  
  {/* Current Chat Messages */}
  <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
    {messages.map(renderMessage)}
  </Box>
  
  {/* Input */}
  <TextField {...inputProps} />
</Box>
```

**3. Conversation Management Actions**:

```javascript
const archiveConversation = async (convId) => {
  const conv = await DataStore.query(ChatConversation, convId);
  await DataStore.save(ChatConversation.copyOf(conv, updated => {
    updated.isArchived = true;
  }));
  
  // Create new conversation
  startNewConversation();
};

const hideConversation = async (convId) => {
  const conv = await DataStore.query(ChatConversation, convId);
  await DataStore.save(ChatConversation.copyOf(conv, updated => {
    updated.isHidden = true;
  }));
};

const unarchiveConversation = async (convId) => {
  const conv = await DataStore.query(ChatConversation, convId);
  await DataStore.save(ChatConversation.copyOf(conv, updated => {
    updated.isArchived = false;
  }));
};

// Admin: View all hidden chats (moderation)
const viewHiddenChats = async () => {
  const hidden = await DataStore.query(ChatConversation, c => c.isHidden.eq(true));
  return hidden;
};
```

**4. Conversation Search** (Find past chats):

```jsx
<TextField
  placeholder="Search conversations..."
  onChange={(e) => searchConversations(e.target.value)}
  InputProps={{
    startAdornment: <SearchIcon />
  }}
/>

const searchConversations = async (query) => {
  const allConvs = await DataStore.query(ChatConversation,
    c => c.userID.eq(session.username).isHidden.eq(false)
  );
  
  // Search in conversation titles and message content
  const results = [];
  for (const conv of allConvs) {
    if (conv.title?.toLowerCase().includes(query.toLowerCase())) {
      results.push(conv);
      continue;
    }
    
    const messages = await conv.messages.toArray();
    if (messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))) {
      results.push(conv);
    }
  }
  
  setFilteredConversations(results);
};
```

**Effort Summary**:
- Schema & models: 4 hours
- Conversation persistence: 10 hours
- Soft delete UI: 8 hours
- Conversation management: 6 hours
- Search functionality: 4 hours
- **Total**: 32 hours

---

## Implementation Timeline

### Month 1: Editor Surfaces
- **Week 1**: Create SimpleRichTextEditor, InlineRichTextEditor components
- **Week 2**: Update GraphQL schema, run migration scripts
- **Week 3**: Replace TextFields in DictionaryEditor2, FileManager2, QuestionEditor2
- **Week 4**: Replace remaining TextFields, write Storybook stories, test

### Month 2: Deduplication & Search Analytics
- **Week 1**: Implement ContentTemplate model, vocabulary deduplication
- **Week 2**: File deduplication (hash-based S3 keys)
- **Week 3**: Search query capture, caching, SearchQuery model
- **Week 4**: Analytics dashboard, Lambda aggregation

### Month 3: Chat Persistence & Polish
- **Week 1**: ChatConversation/ChatMessage models, conversation persistence
- **Week 2**: Soft delete UI, conversation management
- **Week 3**: Testing, bug fixes, performance optimization
- **Week 4**: Documentation, training materials

**Total Timeline**: 12 weeks (3 months)  
**Total Effort**: ~300 hours

---

## Success Metrics

### Part 1: Editor Surfaces
- ✅ 100% of description fields use rich text editors
- ✅ Content creation time reduced by 20% (formatting built-in)
- ✅ User satisfaction score > 8/10 for new editor UX
- ✅ Zero data loss during migration

### Part 2: Deduplication
- ✅ Storage reduction: 40% fewer duplicate files on S3
- ✅ Vocabulary duplication rate < 10%
- ✅ Template usage: 60% of new units reference templates
- ✅ Content update efficiency: 1 edit updates 5+ units

### Part 3: Search Analytics
- ✅ 100% of searches logged
- ✅ Search cache hit rate > 30%
- ✅ Zero-result searches < 15%
- ✅ Click-through rate > 40%
- ✅ Monthly analytics reports generated

### Part 4: Chat Persistence
- ✅ 100% of chats persisted to DataStore
- ✅ Chat deletion rate < 5% (vs 30% with "clear chat")
- ✅ Conversation search < 2 seconds
- ✅ Archived conversations retrievable indefinitely
- ✅ Zero accidental data loss

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | High | Low | Run migration scripts on staging first, backups before each phase |
| Performance degradation (rich text rendering) | Medium | Medium | Use React.memo, virtual scrolling for long documents |
| S3 hash collisions (deduplication) | High | Very Low | Use SHA-256 (2^256 keyspace), add file size check |
| Search analytics storage costs | Low | Medium | Implement data retention policy (90 days), aggregate to PopularSearch |
| Chat history privacy concerns | High | Low | Strong auth rules, admin audit log, user delete option |

---

## Next Steps

1. **Review & Approve**: Stakeholder sign-off on plan
2. **Environment Setup**: Create staging environment for testing
3. **Phase 1 Kickoff**: Build SimpleRichTextEditor component
4. **Weekly Check-ins**: Progress tracking, adjust timeline as needed

**Last Updated**: January 9, 2026  
**Document Owner**: Development Team  
**Status**: Awaiting Approval
