# Custom Blocks Implementation Plan

**Date**: January 4, 2026  
**Status**: 📋 Planning Phase

## Overview

This document outlines the implementation plan for four new custom Lexical editor blocks that will enhance the Homework Supply platform with instructor notes, polling, real-time chat, and collaborative editing capabilities.

---

## 1. Instructor Notes Block

### Purpose
Repurpose the currently commented-out sticky node as instructor-only notes that are automatically stripped from student workbooks and optionally sanitized from grade data.

### Current State
- StickyNode exists but is commented out in [src/components/Editor3/plugins/ToolBarPlugin.js](../src/components/Editor3/plugins/ToolBarPlugin.js)
- Import statement: `// import { $createStickyNode } from '../../nodes/StickyNode';`
- No current node file in `src/components/Editor3/nodes/`

### Design

#### Node Structure
```javascript
// src/components/Editor3/nodes/InstructorNoteNode/InstructorNoteNode.js
export class InstructorNoteNode extends DecoratorNode {
  static getType() {
    return 'instructor-note';
  }
  
  __id: string;           // Unique block ID
  __content: string;      // Note content (markdown)
  __color: string;        // Note color (#ffeb3b, #f48fb1, etc.)
  __visibility: 'private' | 'visible-in-grade' | 'visible-to-student';
  __createdAt: AWSTimestamp;
  __updatedAt: AWSTimestamp;
  __author: string;       // Instructor username
}
```

#### Visibility Modes
1. **private** (default): Stripped from workbooks and grades, visible only in unit editor
2. **visible-in-grade**: Included in grade data for instructor reference during grading
3. **visible-to-student**: Shown to students as hints/guidance (borderless, different styling)

#### Data Flow

**Unit Creation/Editing** (Instructor):
```javascript
// In Editor3/index.js
const editorContent = editor.getEditorState().toJSON();
// Contains InstructorNoteNode in tree

await DataStore.save(Unit.copyOf(currentUnit, updated => {
  updated.data = JSON.stringify(editorContent); // Full content with notes
}));
```

**Workbook Generation** (Student):
```javascript
// In pages/workbook/[unitId]/[assignmentId].js
const sanitizedContent = sanitizeInstructorNotes(unitData, 'student');
// Strips 'private' and 'visible-in-grade' notes
// Converts 'visible-to-student' notes to hint blocks
```

**Grade Data** (Student Submission):
```javascript
// When student submits
const gradeContent = sanitizeInstructorNotes(workbookData, 'grade');
// Strips 'private' notes only
// Preserves 'visible-in-grade' for instructor review

await DataStore.save(new Grade({
  data: JSON.stringify(gradeContent),
  // ... other fields
}));
```

#### Implementation Tasks

##### Phase 1: Node Creation
- [ ] Create `src/components/Editor3/nodes/InstructorNoteNode/`
- [ ] Implement `InstructorNoteNode.js` (DecoratorNode)
- [ ] Create `InstructorNoteComponent.jsx` (React UI)
  - Textarea for content
  - Color picker (6 preset colors)
  - Visibility dropdown
  - Delete button
  - Timestamp/author display
- [ ] Export node in `src/components/Editor3/index.js`

##### Phase 2: Plugin Integration
- [ ] Create `InstructorNotePlugin.js`
- [ ] Add `INSERT_INSTRUCTOR_NOTE_COMMAND`
- [ ] Uncomment and update toolbar button
- [ ] Add keyboard shortcut (Cmd+Shift+N)
- [ ] Add to markdown transformers (optional)

##### Phase 3: Sanitization Utilities
- [ ] Create `src/utils/contentSanitizer.js`
- [ ] Implement `sanitizeInstructorNotes(editorState, mode)`:
  ```javascript
  /**
   * @param {EditorState} editorState - Lexical editor state
   * @param {'student' | 'grade' | 'instructor'} mode
   * @returns {EditorState} Sanitized state
   */
  function sanitizeInstructorNotes(editorState, mode) {
    // Walk Lexical tree
    // Remove nodes based on visibility + mode
    // Return new state
  }
  ```
- [ ] Add to `src/utils/editorUtils.js` for reusability

##### Phase 4: Integration Points
- [ ] Update `pages/workbook/[unitId]/[assignmentId].js`:
  - Sanitize unit data before rendering workbook
- [ ] Update grade submission in `src/context/unitContext.js`:
  - Sanitize workbook data before saving to Grade.data
- [ ] Update `src/components/Editor3/index.js`:
  - Display all notes in instructor view
  - Add filter toggle in toolbar

##### Phase 5: Schema Changes (Optional)
If we want to store notes separately:
```graphql
type InstructorNote @model @auth(
  rules: [
    { allow: owner },
    { allow: groups, groups: ["Instructors", "Admins"] }
  ]
) {
  id: ID!
  content: String!
  color: String
  visibility: String! # 'private', 'visible-in-grade', 'visible-to-student'
  blockId: String!    # Reference to position in unit.data
  unitID: ID! @index(name: "byUnit")
  owner: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

**Pros**: Separate audit trail, easier to query/filter  
**Cons**: More complex sync, duplicate data

**Recommendation**: Start with inline storage (simpler), migrate to separate model if needed.

---

## 2. Poll Block with Aggregation

### Purpose
Enable instructors to insert poll/survey questions that aggregate responses from all students in real-time.

### Design

#### Node Structure
```javascript
// src/components/Editor3/nodes/PollNode/PollNode.js
export class PollNode extends DecoratorNode {
  static getType() {
    return 'poll';
  }
  
  __id: string;           // Unique poll ID
  __question: string;     // Poll question
  __options: Array<{      // Poll options
    id: string;
    text: string;
  }>;
  __allowMultiple: boolean; // Allow multiple selections
  __anonymousResponses: boolean; // Hide usernames
  __createdAt: AWSTimestamp;
}
```

#### Data Model
```graphql
# In amplify/backend/api/japanese5/schema.graphql

type Poll @model @auth(
  rules: [
    { allow: owner },
    { allow: groups, groupsField: "learner", operations: [read, create] }
  ]
) {
  id: ID!
  pollId: String! @index(name: "byPollId") # Matches PollNode.__id
  question: String!
  options: AWSJSON! # Array of { id, text }
  allowMultiple: Boolean
  anonymousResponses: Boolean
  unitID: ID! @index(name: "byUnit")
  sectionID: ID @index(name: "bySection") # Optional: section-specific polls
  learner: String
  owner: String
  responses: [PollResponse] @hasMany(indexName: "byPoll", fields: ["id"])
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type PollResponse @model @auth(
  rules: [
    { allow: owner },
    { allow: owner, ownerField: "pollOwner", operations: [read] }
  ]
) {
  id: ID!
  pollID: ID! @index(name: "byPoll")
  pollOwner: String # Owner of the poll (instructor)
  selectedOptions: [String!]! # Array of option IDs
  owner: String # Student who responded
  username: String # For non-anonymous display
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### Data Flow

**Poll Creation** (Instructor):
```javascript
// In editor, insert PollNode
const pollNode = $createPollNode({
  id: generateId(),
  question: "What's your favorite learning method?",
  options: [
    { id: '1', text: 'Visual (videos, images)' },
    { id: '2', text: 'Auditory (listening, speaking)' },
    { id: '3', text: 'Reading/Writing' },
    { id: '4', text: 'Kinesthetic (hands-on)' }
  ],
  allowMultiple: false,
  anonymousResponses: false
});

// On unit save, create Poll records
await DataStore.save(new Poll({
  pollId: pollNode.__id,
  question: pollNode.__question,
  options: JSON.stringify(pollNode.__options),
  unitID: currentUnit.id,
  // ... other fields
}));
```

**Poll Response** (Student in Workbook):
```javascript
// Student selects option(s)
await DataStore.save(new PollResponse({
  pollID: poll.id,
  pollOwner: poll.owner,
  selectedOptions: ['2'], // Option IDs
  username: session.username
}));
```

**Aggregation Display** (Instructor):
```javascript
// In PollResultsComponent
const poll = await DataStore.query(Poll, (p) => p.pollId.eq(pollId));
const responses = await DataStore.query(PollResponse, (r) => r.pollID.eq(poll.id));

// Aggregate
const results = poll.options.map(option => ({
  ...option,
  count: responses.filter(r => r.selectedOptions.includes(option.id)).length,
  percentage: (count / responses.length) * 100,
  responders: anonymousResponses 
    ? [] 
    : responses.filter(r => r.selectedOptions.includes(option.id)).map(r => r.username)
}));
```

#### Real-Time Updates
```javascript
// Subscribe to poll responses
const subscription = DataStore.observeQuery(
  PollResponse,
  (r) => r.pollID.eq(poll.id)
).subscribe(({ items }) => {
  updateAggregation(items);
});
```

#### UI Components

**PollEditorComponent** (Instructor):
- Question input
- Add/remove options
- Toggle multiple selections
- Toggle anonymous responses
- Preview aggregated results

**PollStudentComponent** (Student Workbook):
- Display question
- Radio buttons (single) or checkboxes (multiple)
- Submit button
- "You've already responded" message
- Optional: See aggregated results after responding

**PollResultsComponent** (Instructor Dashboard):
- Bar chart of results
- Percentage breakdown
- List of responders (if not anonymous)
- Export to CSV button
- Filtering by section

#### Implementation Tasks

##### Phase 1: Data Models
- [ ] Add `Poll` and `PollResponse` types to schema
- [ ] Run `amplify push`
- [ ] Increment SCHEMA_VERSION in `_app.js`

##### Phase 2: Node Creation
- [ ] Create `src/components/Editor3/nodes/PollNode/`
- [ ] Implement `PollNode.js` (DecoratorNode)
- [ ] Create `PollEditorComponent.jsx` (Instructor UI)
- [ ] Create `PollStudentComponent.jsx` (Student UI)
- [ ] Create `PollResultsComponent.jsx` (Aggregation display)

##### Phase 3: Plugin
- [ ] Create `src/components/Editor3/plugins/PollPlugin.js`
- [ ] Add `INSERT_POLL_COMMAND`
- [ ] Update toolbar with poll button
- [ ] Handle poll creation on unit save

##### Phase 4: Synchronization
- [ ] Create `src/utils/pollSync.js`:
  - `syncPollsOnUnitSave(unitData, unitID)`: Create Poll records
  - `deletePollsOnBlockRemove(pollId)`: Cleanup
- [ ] Integrate into `src/context/unitContext.js`

##### Phase 5: Aggregation
- [ ] Create `src/context/pollContext.js`:
  - Subscribe to poll responses
  - Compute aggregations
  - Provide `{ polls, responses, aggregatedResults }`
- [ ] Create `src/components/PollDashboard.js`:
  - List all polls for instructor
  - Filter by unit/section
  - Export results

##### Phase 6: Student Interaction
- [ ] Update `pages/workbook/[unitId]/[assignmentId].js`:
  - Render `PollStudentComponent` for poll nodes
  - Handle response submission
  - Show "Already responded" state
- [ ] Optional: Show aggregated results to students after voting

---

## 3. Section Chat Block

### Purpose
Enable real-time threaded conversations where students can tag classmates and instructors within their section.

### Design

#### Node Structure
```javascript
// src/components/Editor3/nodes/ChatNode/ChatNode.js
export class ChatNode extends DecoratorNode {
  static getType() {
    return 'chat';
  }
  
  __id: string;           // Unique chat ID
  __title: string;        // Chat topic/title
  __sectionID: string;    // Section this chat belongs to
  __unitID: string;       // Unit context (optional)
  __createdAt: AWSTimestamp;
}
```

#### Data Models
```graphql
# In amplify/backend/api/japanese5/schema.graphql

type ChatThread @model @auth(
  rules: [
    { allow: groups, groupsField: "learner", operations: [read, create] },
    { allow: owner }
  ]
) {
  id: ID!
  chatId: String! @index(name: "byChatId") # Matches ChatNode.__id
  title: String!
  sectionID: ID! @index(name: "bySection")
  unitID: ID @index(name: "byUnit")
  learner: String # Section's learner group
  owner: String # Creator
  messages: [ChatMessage] @hasMany(indexName: "byThread", fields: ["id"])
  participants: [String!] # Array of usernames
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type ChatMessage @model @auth(
  rules: [
    { allow: groups, groupsField: "learner", operations: [read, create] },
    { allow: owner, operations: [read, update, delete] }
  ]
) {
  id: ID!
  threadID: ID! @index(name: "byThread")
  learner: String
  content: String! # Markdown with @mentions
  author: String! # Username
  authorName: String # Display name
  parentID: ID @index(name: "byParent") # For threaded replies
  mentions: [String!] # Usernames mentioned with @
  attachments: [String] # S3 keys for files
  reactions: AWSJSON # { emoji: [usernames] }
  edited: Boolean
  owner: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type ChatNotification @model @auth(
  rules: [
    { allow: owner }
  ]
) {
  id: ID!
  messageID: ID! @index(name: "byMessage")
  recipient: String! @index(name: "byRecipient") # Username
  read: Boolean!
  owner: String
  createdAt: AWSDateTime!
}
```

#### Features

**Threaded Conversations**:
- Top-level messages in thread
- Nested replies (1 level deep)
- Expandable/collapsible threads

**@Mentions**:
- Autocomplete from section participants
- Syntax: `@username`
- Triggers notification to mentioned user
- Highlighted in message

**Reactions**:
- Emoji reactions (👍, ❤️, 😂, 🎉, etc.)
- Multiple users can react
- Display count + reactors

**Attachments**:
- Upload images/audio/PDFs
- Store in `protected/{userId}/chat/` in S3
- Inline preview for images
- Download link for files

#### Data Flow

**Chat Creation** (Instructor):
```javascript
// In editor, insert ChatNode
const chatNode = $createChatNode({
  id: generateId(),
  title: "Discussion: Kanji Radicals",
  sectionID: currentSection.id,
  unitID: currentUnit.id
});

// On unit save, create ChatThread
await DataStore.save(new ChatThread({
  chatId: chatNode.__id,
  title: chatNode.__title,
  sectionID: chatNode.__sectionID,
  unitID: currentUnit.id,
  learner: currentSection.learner,
  participants: []
}));
```

**Message Sending** (Student/Instructor):
```javascript
// Parse @mentions
const mentions = extractMentions(content); // ['alice', 'bob']

const message = await DataStore.save(new ChatMessage({
  threadID: thread.id,
  content: content,
  author: session.username,
  authorName: session.attributes.name,
  mentions: mentions,
  learner: thread.learner
}));

// Create notifications
for (const username of mentions) {
  await DataStore.save(new ChatNotification({
    messageID: message.id,
    recipient: username,
    read: false,
    owner: username
  }));
}
```

**Real-Time Updates**:
```javascript
// Subscribe to thread messages
const subscription = DataStore.observeQuery(
  ChatMessage,
  (m) => m.threadID.eq(thread.id)
).subscribe(({ items }) => {
  setMessages(items.sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  ));
});
```

**Notifications**:
```javascript
// Subscribe to user's notifications
const subscription = DataStore.observeQuery(
  ChatNotification,
  (n) => n.recipient.eq(session.username).read.eq(false)
).subscribe(({ items }) => {
  setUnreadCount(items.length);
});
```

#### UI Components

**ChatThreadComponent** (In Workbook/Editor):
- Thread title
- Participant avatars
- Message list (scrollable)
- Compose box with @mention autocomplete
- File upload button
- Emoji picker for reactions
- "Load more" pagination

**ChatMessageComponent**:
- Author name + avatar
- Timestamp
- Message content (markdown rendered)
- @mentions highlighted
- Reactions bar
- Reply button
- Edit/delete (for author)
- Attachment previews

**ChatSidebar** (Alternative to inline):
- List all threads in section
- Unread indicators
- Filter by unit
- Click to open thread

**NotificationBadge**:
- Red dot on chat icon
- Number of unread @mentions
- Click to open notifications panel

#### Implementation Tasks

##### Phase 1: Data Models
- [ ] Add `ChatThread`, `ChatMessage`, `ChatNotification` to schema
- [ ] Run `amplify push`
- [ ] Increment SCHEMA_VERSION in `_app.js`

##### Phase 2: Node Creation
- [ ] Create `src/components/Editor3/nodes/ChatNode/`
- [ ] Implement `ChatNode.js` (DecoratorNode)
- [ ] Create `ChatThreadComponent.jsx`
- [ ] Create `ChatMessageComponent.jsx`
- [ ] Create `ChatComposeBox.jsx` with @mention autocomplete

##### Phase 3: Plugin
- [ ] Create `src/components/Editor3/plugins/ChatPlugin.js`
- [ ] Add `INSERT_CHAT_COMMAND`
- [ ] Update toolbar with chat button
- [ ] Handle thread creation on unit save

##### Phase 4: Context Provider
- [ ] Create `src/context/chatContext.js`:
  - Subscribe to section threads
  - Subscribe to messages for active thread
  - Subscribe to user notifications
  - Provide `{ threads, messages, notifications, sendMessage, markAsRead }`

##### Phase 5: Utilities
- [ ] Create `src/utils/chatUtils.js`:
  - `extractMentions(content)`: Parse @username
  - `renderMentions(content)`: Highlight mentions in UI
  - `uploadChatAttachment(file)`: S3 upload
- [ ] Create `src/components/MentionAutocomplete.jsx`:
  - Lexical plugin for @mention autocomplete
  - Fetch section participants

##### Phase 6: Notifications
- [ ] Create `src/components/ChatNotifications.jsx`:
  - Notification panel
  - Mark as read
  - Navigate to message
- [ ] Add notification badge to main nav

##### Phase 7: Integration
- [ ] Update `pages/workbook/[unitId]/[assignmentId].js`:
  - Render ChatThreadComponent for chat nodes
- [ ] Update `src/components/Editor3/index.js`:
  - Render ChatThreadComponent in editor (instructor view)

##### Phase 8: Moderation (Future)
- [ ] Flag inappropriate messages
- [ ] Instructor can delete any message
- [ ] Mute participants

---

## 4. Real-Time Collaboration with Y.js

### Purpose
Enable real-time collaborative editing with WebSockets, offline persistence via DataStore, and allow instructors to view student workbooks in real-time during grading.

### Architecture Overview

**Technology Stack**:
- **Y.js**: CRDT (Conflict-free Replicated Data Type) for collaborative editing
- **y-websocket**: WebSocket provider for sync
- **Lexical Yjs Bindings**: `@lexical/yjs` for Lexical integration
- **AWS API Gateway WebSocket API**: Server infrastructure
- **Lambda**: Handle WebSocket connections, messages, and disconnections
- **DynamoDB**: Store Yjs updates for persistence
- **DataStore**: Offline-first persistence for updates

### Design

#### Y.js Document Structure
```javascript
// Each Grade has a unique Y.js document
const ydoc = new Y.Doc();

// Root structure
const yXmlFragment = ydoc.getXmlFragment('editor'); // Lexical content
const yAwareness = provider.awareness; // User cursors/selections

// Metadata
const yMeta = ydoc.getMap('meta');
yMeta.set('gradeID', grade.id);
yMeta.set('unitID', grade.unitID);
yMeta.set('owner', grade.owner);
yMeta.set('version', grade._version);
```

#### WebSocket API Gateway Setup

**Endpoint**: `wss://[api-id].execute-api.[region].amazonaws.com/[stage]`

**Routes**:
- `$connect`: Establish WebSocket connection
- `$disconnect`: Cleanup on disconnect
- `$default`: Handle Yjs sync messages
- `join-document`: Subscribe to a specific document
- `leave-document`: Unsubscribe
- `broadcast-awareness`: Sync cursors/presence

**Lambda Functions**:

1. **wsConnect** (`$connect`):
   ```javascript
   // Store connection
   await DynamoDB.put({
     TableName: 'WebSocketConnections',
     Item: {
       connectionId: event.requestContext.connectionId,
       username: event.queryStringParameters.username,
       timestamp: Date.now()
     }
   });
   ```

2. **wsDisconnect** (`$disconnect`):
   ```javascript
   // Remove connection
   await DynamoDB.delete({
     TableName: 'WebSocketConnections',
     Key: { connectionId }
   });
   ```

3. **wsMessage** (`$default`):
   ```javascript
   // Handle Yjs sync messages
   const message = JSON.parse(event.body);
   
   if (message.type === 'sync-step-1' || message.type === 'sync-step-2') {
     // Retrieve Yjs state from DynamoDB
     const state = await getYjsState(message.documentId);
     
     // Apply update
     Y.applyUpdate(ydoc, message.update);
     
     // Persist to DynamoDB
     await saveYjsState(message.documentId, Y.encodeStateAsUpdate(ydoc));
     
     // Broadcast to other connections
     await broadcastToDocument(message.documentId, message);
   }
   ```

4. **joinDocument**:
   ```javascript
   // Subscribe connection to document
   await DynamoDB.put({
     TableName: 'DocumentConnections',
     Item: {
       documentId: message.documentId,
       connectionId: event.requestContext.connectionId,
       role: message.role, // 'owner' or 'instructor'
       timestamp: Date.now()
     }
   });
   
   // Send initial state
   const state = await getYjsState(message.documentId);
   await sendMessage(connectionId, { type: 'sync-step-1', state });
   ```

#### Data Models

```graphql
# In amplify/backend/api/japanese5/schema.graphql

type CollaborationSession @model @auth(
  rules: [
    { allow: owner },
    { allow: owner, ownerField: "instructor", operations: [read, update] }
  ]
) {
  id: ID!
  documentId: String! @index(name: "byDocumentId") # gradeID or unitID
  documentType: String! # 'grade' or 'unit'
  gradeID: ID @index(name: "byGrade")
  unitID: ID @index(name: "byUnit")
  owner: String # Student
  instructor: String # Instructor viewing
  activeConnections: AWSJSON # [{ connectionId, username, role, joinedAt }]
  yjsState: String # Base64 encoded Yjs state
  yjsStateVector: String # Base64 encoded state vector
  lastSyncedAt: AWSDateTime
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type YjsUpdate @model @auth(
  rules: [
    { allow: owner },
    { allow: owner, ownerField: "instructor", operations: [read] }
  ]
) {
  id: ID!
  sessionID: ID! @index(name: "bySession")
  update: String! # Base64 encoded Yjs update
  clock: Int! # Logical clock for ordering
  author: String! # Username who made the update
  owner: String
  instructor: String
  createdAt: AWSDateTime!
}
```

#### Client-Side Integration

**Lexical Editor with Y.js**:
```javascript
// src/components/Editor3/CollaborativeEditor.jsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

function CollaborativeEditor({ gradeId, isInstructor, studentUsername }) {
  const ydoc = useRef(new Y.Doc()).current;
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const wsProvider = new WebsocketProvider(
      'wss://[api-id].execute-api.[region].amazonaws.com/prod',
      `grade-${gradeId}`, // Room name
      ydoc,
      {
        params: {
          username: session.username,
          role: isInstructor ? 'instructor' : 'owner'
        }
      }
    );

    wsProvider.on('status', event => {
      console.log('WebSocket status:', event.status); // 'connected' | 'disconnected'
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
    };
  }, [gradeId]);

  // Offline persistence with DataStore
  useEffect(() => {
    if (!provider) return;

    // Subscribe to Yjs updates
    ydoc.on('update', async (update, origin) => {
      if (origin !== 'datastore') { // Prevent loops
        // Persist to DataStore
        await DataStore.save(new YjsUpdate({
          sessionID: collaborationSession.id,
          update: btoa(String.fromCharCode(...update)),
          clock: ydoc.store.clients.get(ydoc.clientID),
          author: session.username,
          owner: studentUsername,
          instructor: isInstructor ? session.username : null
        }));
      }
    });

    // Load offline updates when coming back online
    if (provider.wsconnected) {
      loadOfflineUpdates();
    }
  }, [provider, ydoc]);

  async function loadOfflineUpdates() {
    const updates = await DataStore.query(YjsUpdate, 
      u => u.sessionID.eq(collaborationSession.id),
      { sort: s => s.clock('ASCENDING') }
    );

    updates.forEach(update => {
      const decodedUpdate = Uint8Array.from(atob(update.update), c => c.charCodeAt(0));
      Y.applyUpdate(ydoc, decodedUpdate, 'datastore');
    });
  }

  const initialConfig = {
    namespace: 'CollaborativeEditor',
    nodes: [/* ... all custom nodes ... */],
    editorState: null, // Y.js provides state
    onError: (error) => console.error(error)
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <CollaborationPlugin
        id={`grade-${gradeId}`}
        providerFactory={(id, yjsDocMap) => {
          yjsDocMap.set(id, ydoc);
          return provider;
        }}
        shouldBootstrap={false}
      />
      {/* ... rest of editor plugins ... */}
    </LexicalComposer>
  );
}
```

#### Instructor "Pop-In" Feature

**Use Case**: Instructor views Grades page, clicks on a student's in-progress assignment, and can see their workbook in real-time.

**Flow**:
1. Instructor navigates to `/grades`
2. Clicks "View Live" on student's assignment
3. Opens `/workbook/[unitId]/[assignmentId]?view-only=true&student=[username]`
4. Connects to same Y.js document as student
5. Sees student's edits in real-time
6. Can add comments (using InstructorNoteNode with `visibility: 'visible-to-student'`)
7. Student sees "Instructor is viewing" indicator

**Permissions**:
- CollaborationSession model allows `instructor` to read/update
- Grade model allows `instructor` to read
- WebSocket Lambda verifies auth before allowing connection

**UI Indicators**:
```javascript
// Show active users
function AwarenessBar({ provider }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!provider) return;

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().entries());
      setUsers(states.map(([clientId, state]) => ({
        clientId,
        username: state.user?.name,
        role: state.user?.role,
        cursor: state.cursor,
        selection: state.selection
      })));
    });
  }, [provider]);

  return (
    <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
      {users.map(user => (
        <Chip
          key={user.clientId}
          label={user.username}
          color={user.role === 'instructor' ? 'secondary' : 'primary'}
          size="small"
          avatar={<Avatar>{user.username[0].toUpperCase()}</Avatar>}
        />
      ))}
    </Box>
  );
}
```

#### Conflict Resolution

**Y.js CRDT** handles conflicts automatically:
- No "overwrite" issues
- Concurrent edits merge intelligently
- Operational Transformation under the hood

**DataStore Conflicts**:
- YjsUpdate records are append-only (no conflicts)
- CollaborationSession uses optimistic locking (`_version`)
- On conflict, refetch and retry

#### Implementation Tasks

##### Phase 1: Infrastructure Setup
- [ ] Create WebSocket API in API Gateway
- [ ] Create Lambda functions:
  - `wsConnect`
  - `wsDisconnect`
  - `wsMessage`
  - `joinDocument`
  - `broadcastAwareness`
- [ ] Create DynamoDB tables:
  - `WebSocketConnections` (connectionId, username)
  - `DocumentConnections` (documentId, connectionId, role)
  - `YjsDocumentState` (documentId, state, stateVector)
- [ ] Add IAM permissions for Lambdas

##### Phase 2: Data Models
- [ ] Add `CollaborationSession` and `YjsUpdate` to schema
- [ ] Run `amplify push`
- [ ] Increment SCHEMA_VERSION in `_app.js`

##### Phase 3: Client Library
- [ ] Install dependencies:
  ```bash
  npm install yjs y-websocket @lexical/yjs
  ```
- [ ] Create `src/utils/collaboration.js`:
  - `createYjsDocument(documentId)`
  - `connectWebSocket(ydoc, documentId, role)`
  - `persistUpdate(update, sessionId)`
  - `loadOfflineUpdates(sessionId)`

##### Phase 4: Lexical Integration
- [ ] Create `src/components/Editor3/plugins/CollaborationPlugin.js`:
  - Wrap `@lexical/react/LexicalCollaborationPlugin`
  - Add awareness (cursors, selections)
  - Handle offline queue
- [ ] Update `src/components/Editor3/index.js`:
  - Add `collaborative` prop
  - Conditionally render CollaborationPlugin
  - Disable history plugin when collaborative

##### Phase 5: Student Workbook
- [ ] Update `pages/workbook/[unitId]/[assignmentId].js`:
  - Create CollaborationSession on mount
  - Initialize Y.js document
  - Connect WebSocket
  - Enable CollaborationPlugin
  - Show AwarenessBar

##### Phase 6: Instructor View
- [ ] Create `pages/grades/[gradeId]/live.js`:
  - Read-only editor (or comment-only)
  - Connect to student's Y.js document
  - Show "Viewing [Student Name]'s work" header
  - Add instructor awareness (different color cursor)
- [ ] Update `pages/grades.js`:
  - Add "View Live" button for incomplete grades
  - Link to `/grades/[gradeId]/live`

##### Phase 7: Offline Handling
- [ ] Queue Y.js updates in DataStore when offline
- [ ] On reconnect:
  - Apply queued updates to ydoc
  - Sync with server
  - Clear queue
- [ ] Show "Offline" indicator in UI

##### Phase 8: Testing
- [ ] Test concurrent edits (2 students, 1 document)
- [ ] Test instructor pop-in
- [ ] Test offline → online sync
- [ ] Test conflict resolution (rare with CRDTs, but verify)
- [ ] Load testing (50+ concurrent connections)

##### Phase 9: Monitoring
- [ ] CloudWatch metrics for WebSocket connections
- [ ] Log Yjs update frequency
- [ ] Alert on high error rates

---

## Integration & Dependencies

### Cross-Feature Interactions

**Instructor Notes + Collaboration**:
- Instructors can add notes in real-time while viewing student work
- Notes with `visibility: 'visible-to-student'` appear as inline comments

**Poll + Chat**:
- Polls can have discussion threads attached
- Link ChatNode to PollNode for contextual conversation

**All Blocks + Y.js**:
- All custom nodes work in collaborative mode
- Y.js handles block insertions/deletions across clients

### Shared Utilities

**src/utils/blockIdGenerator.js**:
```javascript
export function generateBlockId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**src/utils/sanitizeEditorState.js**:
- Used by InstructorNoteNode sanitization
- Filter nodes based on predicates

**src/utils/websocketManager.js**:
- Shared WebSocket connection pool
- Reconnection logic
- Heartbeat/ping for keep-alive

### Context Providers

**src/context/collaborationContext.js**:
- Manages Y.js documents
- WebSocket connections
- Awareness states
- Offline queue

**src/context/pollContext.js**:
- Poll subscriptions
- Response aggregation

**src/context/chatContext.js**:
- Thread subscriptions
- Message sending
- Notification management

---

## Rollout Plan

### Phase 1: Instructor Notes (2-3 weeks)
**Priority**: High - Simple, no real-time complexity  
**Dependencies**: None  
**Deliverables**:
- InstructorNoteNode implementation
- Sanitization utilities
- Toolbar integration
- Documentation

### Phase 2: Poll Aggregation (3-4 weeks)
**Priority**: Medium - Useful standalone feature  
**Dependencies**: None  
**Deliverables**:
- Poll data models
- PollNode implementation
- Aggregation dashboard
- Real-time subscription

### Phase 3: Section Chat (4-5 weeks)
**Priority**: Medium - Enhances collaboration  
**Dependencies**: None (but can leverage websockets from Phase 4)  
**Deliverables**:
- Chat data models
- ChatNode implementation
- @mention system
- Notification system

### Phase 4: Real-Time Collaboration (6-8 weeks)
**Priority**: High - Complex but transformative  
**Dependencies**: WebSocket infrastructure  
**Deliverables**:
- AWS WebSocket API
- Lambda functions
- Y.js integration
- Collaborative editor
- Instructor pop-in feature
- Offline persistence

### Total Timeline: ~16-20 weeks (4-5 months)

---

## Testing Strategy

### Unit Tests
- [ ] InstructorNoteNode serialization/deserialization
- [ ] Sanitization logic for different visibility modes
- [ ] Poll aggregation calculations
- [ ] @mention extraction
- [ ] Y.js update encoding/decoding

### Integration Tests
- [ ] Create instructor note → Save → Load → Verify sanitization
- [ ] Create poll → Submit responses → Verify aggregation
- [ ] Send chat message → Trigger notification → Mark as read
- [ ] Concurrent edits → Verify Y.js merge

### E2E Tests (Cypress)
- [ ] Instructor creates note, student doesn't see it in workbook
- [ ] Student answers poll, instructor sees updated results
- [ ] Student @mentions classmate, notification is sent
- [ ] Two students edit simultaneously, changes merge correctly
- [ ] Instructor pops into student workbook, sees real-time changes

### Performance Tests
- [ ] 100 concurrent WebSocket connections
- [ ] 1000 poll responses aggregation speed
- [ ] 500 messages in chat thread load time
- [ ] Y.js sync time with 10MB document

---

## Security Considerations

### Authentication
- All WebSocket connections must include valid Cognito token
- Lambda authorizer validates tokens before `$connect`
- Reject unauthenticated connections

### Authorization
- Students can only join their own Grade documents
- Instructors can join any Grade for students in their sections
- Verify `instructor` field on Grade matches session username

### Data Validation
- Sanitize all user input (chat messages, poll responses)
- Prevent XSS in @mentions and markdown
- Limit message size (1MB max)
- Rate limiting on WebSocket messages (10 msg/sec)

### Privacy
- Anonymous poll responses don't store usernames
- Chat messages are section-scoped (can't access other sections)
- Instructor notes with `private` visibility are never sent to students

---

## Monitoring & Analytics

### Metrics to Track
- **Instructor Notes**: Usage frequency, visibility distribution
- **Polls**: Average response rate, time to first response
- **Chat**: Messages per section, @mention frequency, active threads
- **Collaboration**: Concurrent sessions, average session duration, offline sync frequency

### Dashboards
- **Admin Dashboard**: Overall usage across all features
- **Instructor Dashboard**: Per-section engagement metrics
- **Performance Dashboard**: WebSocket health, Lambda errors, DynamoDB throttles

---

## Documentation Updates

After implementation, update:
- [ ] [docs/API.md](./API.md) - New data models
- [ ] [docs/ONBOARDING.md](./ONBOARDING.md) - Setup instructions for WebSocket API
- [ ] [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [ ] [docs/USER_GUIDE.md](./USER_GUIDE.md) (new) - How to use new blocks
- [ ] [.github/copilot-instructions.md](../.github/copilot-instructions.md) - Architecture updates

---

## Open Questions

1. **Instructor Notes**: Should we allow collaborative editing of notes (multiple instructors)?
2. **Polls**: Should students see results before or after submitting?
3. **Chat**: Should we support file attachments larger than 10MB?
4. **Collaboration**: Should we snapshot Y.js state periodically or only on disconnect?
5. **All**: Should we support undo/redo across collaborative sessions?

---

## Success Criteria

### Instructor Notes
- ✅ Instructors can create notes in 3 visibility modes
- ✅ Notes are correctly stripped from student workbooks
- ✅ Notes are preserved in grading view when appropriate

### Polls
- ✅ Polls show real-time results as students respond
- ✅ Aggregation is accurate with 100+ responses
- ✅ Anonymous mode hides student identities

### Chat
- ✅ Students can send messages and @mention classmates
- ✅ Notifications are delivered within 1 second
- ✅ Threads support nested replies

### Collaboration
- ✅ Two students can edit simultaneously without conflicts
- ✅ Instructors can view student work in real-time
- ✅ Offline edits sync when connection is restored
- ✅ Cursor positions and selections are visible

---

**Next Steps**: Review this plan with the team, prioritize phases, and begin Phase 1 (Instructor Notes) implementation.
