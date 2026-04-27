# Homework Supply — Feature Expansion Plan
**Platform:** Next.js + React + Material UI + AWS Amplify + GraphQL + OpenAI  
**Scope:** Real-time Collaboration, Peer Review Rooms, Gamification, Leaderboard, AI Memory, Nailed It Components

---

## Table of Contents

1. [Real-Time Workbook Collaboration Enhancements](#1-real-time-workbook-collaboration-enhancements)
2. [Peer Review Chat Rooms](#2-peer-review-chat-rooms)
3. [Gamification — Explicit Plan](#3-gamification--explicit-plan)
4. [Leaderboard](#4-leaderboard)
5. [AI Memory — Exercise History, Prompt Changes & Markdown Storage](#5-ai-memory--exercise-history-prompt-changes--markdown-storage)
6. [Nailed It Components](#6-nailed-it-components)
7. [Data Model Changes Summary](#7-data-model-changes-summary)
8. [Implementation Sequence](#8-implementation-sequence)

---

## 1. Real-Time Workbook Collaboration Enhancements

### Current State
Real-time collaboration exists via Yjs CRDT infrastructure:

- **`src/yjs/YjsProvider.ts`** — Core provider wrapping `Y.Doc` + `y-websocket` + `y-indexeddb`
- **`src/yjs/WorkbookCollaborationProvider.ts`** — Specialized provider for student workbooks, keyed by Grade ID (`workbook-{gradeId}`). Has 3 Y.Maps: `workbookData`, `metadata`, `feedback`
- **`src/yjs/workbookHooks.ts`** — 5 React hooks: `useWorkbookCollaboration`, `useWorkbookBlock`, `useTutorPresence`, `useWorkbookFeedback`, `useWorkbookStats`
- **`src/yjs/hooks.ts`** — Low-level hooks: `useYjsProvider`, `useYMap`, `useYArray`, `useYText`, `useAwareness`
- **`src/yjs/SyncAdapter.ts`** — GraphQL bridge (currently stub-only — all mutations are TODOs)
- **`amplify/custom/websocket/`** — Production API Gateway WebSocket API with DynamoDB connection tracking and snapshot persistence
- **`amplify/functions/yjsSync/`** — Local dev WebSocket server (port 3001)
- **`src/components/Workbook/`** — `ConnectionStatus`, `TutorCursorOverlay`, `TutorPresenceBanner`, `WorkbookProgress`
- **`src/components/Editor3/plugins/CollaborationPlugin.tsx`** — Lexical + `@lexical/yjs` integration
- **`src/hooks/useYjsUnit.ts`** — Unit editor Yjs hook (loads/saves `yjsSnapshot` to Unit model)

**Transport**: Yjs Awareness protocol over WebSocket — no AppSync subscriptions needed for presence or real-time state.

### What to Build

#### 1.1 Presence Indicators (Enhance Existing)
The foundation exists (`TutorPresenceBanner`, `TutorCursorOverlay`, `ConnectionStatus`). Extend it:

- **Avatar row**: Add `WorkbookPresenceBar` component at workbook header. Reads from `useAwareness` hook — all connected clients already publish `{ user: { username, role, displayName, color } }` via `WorkbookCollaborationProvider.initializeAwareness()`.
- **Idle fade**: Add `lastInteraction` timestamp to awareness state. `WorkbookPresenceBar` fades avatars where `Date.now() - lastInteraction > 60000`.
- **Cursor debounce**: Already handled — `updateCursor(blockId, position?)` writes to awareness. Add 300ms debounce in `useWorkbookBlock` before calling `provider.updateCursor()`.

```typescript
// In WorkbookCollaborationProvider — awareness state shape (already exists)
awareness.setLocalState({
  user: { username, role, displayName, color },
  timestamp: Date.now(),
  gradeId,
  cursor: { blockId, position },   // updated on focus/type
  lastInteraction: Date.now(),      // NEW — updated on any user action
})
```

**No new DynamoDB models needed.** Presence lives entirely in Yjs Awareness (ephemeral, in-memory on the WebSocket server).

#### 1.2 Inline Commenting on Workbook Cells/Blocks
Use a **Yjs Y.Map for real-time thread state** + **DynamoDB for persistence** (comments must survive after all users disconnect).

- **Real-time layer**: Add a `comments` Y.Map to `WorkbookCollaborationProvider`. Keys are `{blockId}-{threadId}`. Values are comment thread objects. All connected clients see comments appear instantly via Yjs sync.
- **Persistence layer**: A `WorkbookComment` DynamoDB model stores comments durably. The `workbook-sync` CustomEvent (already used for Grade.data sync) also persists dirty comment threads.
- **New hook**: `useWorkbookComments(provider, blockId)` — subscribes to the `comments` Y.Map filtered by blockId.

```typescript
// Comment thread in Yjs Y.Map
interface CommentThread {
  id: string
  blockId: string
  comments: Array<{
    id: string
    authorId: string
    authorName: string
    authorRole: 'student' | 'tutor' | 'instructor' | 'admin'
    content: string
    createdAt: string
  }>
  resolved: boolean
  resolvedBy?: string
  createdAt: string
}

// In WorkbookCollaborationProvider — add 4th Y.Map
private commentsMap: Y.Map<CommentThread>
// initialized as: this.commentsMap = this.getMap('comments')
```

**DynamoDB model** (for persistence only — real-time reads come from Yjs):
```typescript
// In amplify/data/resource.ts
WorkbookComment: a.model({
  gradeId: a.id().required(),      // links to Grade (= workbook)
  blockId: a.string().required(),
  threadData: a.json(),            // serialized CommentThread
  resolved: a.boolean().default(false),
  _version: a.integer(),
  _lastChangedAt: a.timestamp(),
  _deleted: a.boolean(),
}).secondaryIndexes(index => [
  index('gradeId').sortKeys(['blockId']).name('byGradeBlock'),
]).authorization(allow => [
  allow.owner(),
  allow.groups(['Admins', 'Instructors']),
])
```

#### 1.3 Block-Level Lock Indicator
Pure Awareness — no persistence needed.

- **Publish**: When a user focuses a block, call `provider.updateCursor(blockId)`. The cursor data in awareness already includes `{ cursor: { blockId } }`.
- **Subscribe**: `useTutorPresence(provider, blockId)` already filters by blockId. Extend to include all roles (not just tutors) and show a `Chip` with the user's name: "Being edited by [Name]".
- **Implementation**: Add `useBlockEditors(provider, blockId)` hook that returns all non-self users whose awareness `cursor.blockId` matches.

```typescript
// New hook in workbookHooks.ts
export function useBlockEditors(
  provider: WorkbookCollaborationProvider | null,
  blockId: string
): WorkbookUser[] {
  // Filters awareness states where cursor.blockId === blockId && clientId !== self
}
```

#### 1.4 Change Attribution
Use Yjs `Y.UndoManager` origin tracking + a `history` Y.Array per block.

- **On each block update**: Push `{ userId, displayName, timestamp, fieldChanged, oldValue, newValue }` to a `history` Y.Array in the workbook doc.
- **UI**: "History" toggle per block shows a collapsed timeline. Uses `useYArray(provider.getDoc().getArray('history-{blockId}'))`.
- **Cleanup**: Trim history arrays to last 50 entries on each workbook sync to prevent unbounded growth.

#### 1.5 Collaborative AI Feedback Broadcast
Already partially implemented — `WorkbookCollaborationProvider.setFeedback(blockId, feedback)` writes to the `feedback` Y.Map, and `useWorkbookFeedback(provider)` subscribes to changes.

- **Complete the loop**: When AI feedback arrives for any block, call `provider.setFeedback(blockId, feedback)`. All connected clients receive it instantly via Y.Map observation.
- **UI**: The `onNewFeedback` callback in `useWorkbookFeedback` should trigger an MUI Snackbar for non-submitting users: "AI feedback received on Block N — [preview]".

---

## 2. Peer Review Chat Rooms

### Concept
Each homework assignment gets its own chat room. The room owner (student) can invite specific peers to join. This makes peer review structured and contextual rather than happening in a general channel.

### Architecture — Yjs-First with DynamoDB Persistence

Peer review rooms use the same Yjs infrastructure as workbook collaboration. Each room is a Yjs document (`review-{roomId}`) with Y.Arrays for messages and Y.Maps for room state. DynamoDB stores the durable record for after-session access.

#### 2.1 Room Model

**Yjs document structure** (real-time layer — room name: `review-{roomId}`):
```typescript
// Y.Map 'roomState'
interface YjsRoomState {
  id: string
  gradeId: string        // links to the homework workbook
  ownerId: string
  title: string
  status: 'OPEN' | 'CLOSED' | 'REVIEW_COMPLETE'
  invitedUserIds: string[]
  createdAt: string
  closedAt?: string
}

// Y.Array 'messages' — append-only, CRDT-ordered
interface YjsRoomMessage {
  id: string             // uuid
  authorId: string
  authorName: string
  authorRole: string
  content: string
  messageType: 'TEXT' | 'AI_SUGGESTION' | 'SYSTEM' | 'PEER_ANNOTATION'
  referencedBlockId?: string
  createdAt: string
}
```

**DynamoDB model** (persistence — written on room close and periodically during session):
```typescript
// In amplify/data/resource.ts
HomeworkRoom: a.model({
  gradeId: a.id().required(),
  ownerId: a.string().required(),
  title: a.string().required(),
  status: a.enum(['OPEN', 'CLOSED', 'REVIEW_COMPLETE']),
  invitedUserIds: a.string().array(),
  messages: a.json(),              // serialized Y.Array snapshot
  aiReviewSummary: a.string(),
  closedAt: a.datetime(),
  _version: a.integer(),
  _lastChangedAt: a.timestamp(),
  _deleted: a.boolean(),
}).secondaryIndexes(index => [
  index('gradeId').name('byGrade'),
  index('ownerId').name('byOwner'),
]).authorization(allow => [
  allow.owner(),
  allow.groups(['Admins', 'Instructors']),
  allow.groupDefinedIn('invitedUserIds').to(['read']),
])
```

#### 2.2 New Yjs Provider: `PeerReviewRoomProvider`

```typescript
// src/yjs/PeerReviewRoomProvider.ts
// Extends YjsDocProvider — room name: `review-{roomId}`
// Two Y types:
//   - roomState: Y.Map  (room metadata, status, invites)
//   - messages: Y.Array  (append-only chat messages)
//
// Awareness carries: { user, typing: boolean, viewingBlockId }
//
// Methods:
//   sendMessage(content, messageType?, referencedBlockId?)
//   getMessages(): YjsRoomMessage[]
//   closeRoom() → sets status, triggers AI summary, persists to DynamoDB
//   inviteUser(userId)
//   getRoomState(): YjsRoomState
```

#### 2.3 New Hook: `usePeerReviewRoom`

```typescript
// src/yjs/peerReviewHooks.ts
export function usePeerReviewRoom(options: {
  roomId: string
  user: WorkbookUser
  gradeId: string      // the workbook to display read-only
  wsUrl?: string
}): {
  provider: PeerReviewRoomProvider | null
  messages: YjsRoomMessage[]
  roomState: YjsRoomState
  connectedPeers: WorkbookUser[]
  sendMessage: (content: string, type?: string, blockId?: string) => void
  closeRoom: () => Promise<void>
  inviteUser: (userId: string) => void
  isConnected: boolean
}
```

#### 2.4 Room Lifecycle

1. **Create**: Student completes homework → "Open for Peer Review" button → creates `HomeworkRoom` in DynamoDB + opens Yjs document `review-{roomId}`.
2. **Invite**: Owner adds peer userIds to `roomState.invitedUserIds` via Yjs. A DynamoDB trigger sends notification (or poll-based: peers query `HomeworkRoom` by `invitedUserIds` containing their ID).
3. **Review Session**: Peers connect to the same Yjs doc. Read-only workbook in left pane (uses existing `useWorkbookCollaboration` with `readOnly: true`). Chat in right pane renders `messages` Y.Array.
4. **Close**: Owner calls `closeRoom()` → status set to `REVIEW_COMPLETE` in both Yjs and DynamoDB. Triggers AI summary Lambda. Room becomes read-only.

#### 2.5 UI Layout (Split Pane)

```
┌─────────────────────────┬────────────────────────┐
│  Homework Workbook      │  Peer Review Chat      │
│  (read-only for peers)  │                        │
│  Uses existing          │  [System] Alice joined │
│  WorkbookCollaboration  │  [Bob] Question on Q3  │
│  Provider in readOnly   │  [Alice] Good point..  │
│  mode — same Yjs doc    │  [AI] Suggested fix:.. │
│                         │  ─────────────────     │
│                         │  [  Type a message  ]  │
└─────────────────────────┴────────────────────────┘
```

Use MUI `Grid` with collapsible right panel. On mobile, toggle between workbook and chat views.

#### 2.6 Real-Time Implementation

All real-time is Yjs. No GraphQL subscriptions needed:

```typescript
// In usePeerReviewRoom hook
const messagesArray = provider.getDoc().getArray<YjsRoomMessage>('messages')

// Subscribe to new messages — Yjs Y.Array observation
messagesArray.observe((event) => {
  setMessages(Array.from(messagesArray))
})

// Send a message — appends to Y.Array, syncs to all peers instantly
function sendMessage(content: string) {
  messagesArray.push([{
    id: crypto.randomUUID(),
    authorId: user.username,
    authorName: user.displayName,
    content,
    messageType: 'TEXT',
    createdAt: new Date().toISOString(),
  }])
}
```

#### 2.7 AI in the Room
`@AI` mention triggers the OpenAI completion endpoint. The `@AI` handler:

1. Extracts the question from the message content (after `@AI`)
2. Loads the workbook context from the same Yjs doc (via `WorkbookCollaborationProvider.getWorkbookData()`)
3. Calls the existing `chatStream` Lambda with the question + workbook context
4. Posts the AI response as a `messageType: 'AI_SUGGESTION'` entry in the messages Y.Array
5. All connected peers see it instantly — no polling

```typescript
// In PeerReviewRoomProvider
async sendAIMessage(question: string, workbookContext: WorkbookBlockData): Promise<void> {
  // POST to /chat streaming endpoint with room context
  // On complete response, push to messages Y.Array:
  this.messagesArray.push([{
    id: crypto.randomUUID(),
    authorId: 'ai-tutor',
    authorName: 'AI Tutor',
    authorRole: 'ai',
    content: aiResponse,
    messageType: 'AI_SUGGESTION',
    createdAt: new Date().toISOString(),
  }])
}
```

#### 2.8 Peer Review Completion Flow
When the owner marks the review complete:
- Room Yjs doc status → `REVIEW_COMPLETE`. All connected peers see the status change instantly.
- Messages Y.Array is serialized and persisted to `HomeworkRoom.messages` in DynamoDB.
- Each participating peer automatically earns XP (see Gamification section).
- A **"Review Summary"** is generated by AI (via Lambda): a brief 3-sentence summary of what was discussed. Stored in `HomeworkRoom.aiReviewSummary`.
- Owner gets a prompt: *"Did peer review help you? 👍 👎"*

#### 2.9 WebSocket Infrastructure (Shared)

Both workbook collaboration and peer review rooms share the same WebSocket infrastructure:

| Environment | Server | URL |
|---|---|---|
| **Local dev** | `amplify/functions/yjsSync/index.ts` — standalone Node.js, port 3001 | `ws://localhost:3001` |
| **Production** | `amplify/custom/websocket/` — API Gateway WebSocket + Lambda handler + DynamoDB connections table | `wss://{apiId}.execute-api.{region}.amazonaws.com/live` |

Room isolation is handled by Yjs document names:
- Workbook rooms: `workbook-{gradeId}`
- Peer review rooms: `review-{roomId}`
- Unit editor rooms: `unit-{unitId}`

The WebSocket handler routes messages by document name — clients in different rooms never receive each other's updates.

---

## 3. Gamification — Explicit Plan

### Design Principles
- XP and badges should feel earned, not inflationary.
- Visible to the student always; visible to peers in the leaderboard context only.
- Never shame for inactivity — only celebrate progress.

### 3.1 XP (Experience Points) System

| Action | XP Awarded | Notes |
|--------|-----------|-------|
| Submit a homework assignment | 50 XP | On first submit |
| Receive AI feedback and revise | 25 XP | Only if revision made within 24h |
| Complete all blocks in a workbook | 75 XP | Completion bonus |
| Participate in peer review (as reviewer) | 40 XP | Per session |
| Host a peer review room | 30 XP | Per session |
| Earn a "Nailed It" on a block | 20 XP | Per block flagged by AI as excellent |
| Submit on time (before deadline) | 15 XP | Punctuality bonus |
| 3-day submission streak | 30 XP | Streak bonus |
| 7-day streak | 75 XP | Milestone streak |
| Perfect score on an exercise | 100 XP | Rare, high-value |

#### XP Data Model

```graphql
type StudentXPLog @model @auth(...) {
  id: ID!
  studentId: ID! @index(name: "byStudent")
  xpAmount: Int!
  reason: XPReason!
  relatedEntityId: ID    # homeworkId, roomId, blockId etc.
  createdAt: AWSDateTime!
}

enum XPReason {
  HOMEWORK_SUBMITTED
  HOMEWORK_REVISED
  WORKBOOK_COMPLETED
  PEER_REVIEW_GIVEN
  PEER_REVIEW_HOSTED
  NAILED_IT
  ON_TIME_BONUS
  STREAK_3DAY
  STREAK_7DAY
  PERFECT_SCORE
}
```

Total XP is derived from the log — never stored as a mutable field, to prevent drift.

```javascript
// Derive total XP
const totalXP = xpLogs.reduce((sum, log) => sum + log.xpAmount, 0);
```

### 3.2 Levels

Simple level thresholds. Label them course-thematically (customize per cohort):

| Level | XP Required | Default Label |
|-------|-------------|---------------|
| 1 | 0 | Beginner |
| 2 | 150 | Explorer |
| 3 | 400 | Practitioner |
| 4 | 800 | Contributor |
| 5 | 1500 | Expert |
| 6 | 2500 | Master |

Display the level badge next to the student's name in the workbook header and in the leaderboard.

### 3.3 Badges (Achievements)

Awarded once, permanently displayed on the student's profile:

| Badge | Trigger |
|-------|---------|
| 🔥 First Submission | Submit first homework |
| 👀 Good Eye | Complete first peer review |
| ⚡ Quick Draw | Submit within 1 hour of assignment opening |
| 🎯 Sharpshooter | Earn 5 "Nailed It" blocks in one homework |
| 📅 Consistent | 7-day streak |
| 🤝 Team Player | Participate in 10 peer reviews |
| 🧠 Deep Thinker | Trigger AI feedback 50 times |
| 🏆 Top of Class | Reach #1 on leaderboard for a week |
| 🌟 Perfectionist | Perfect score on 3 exercises |

```graphql
type StudentBadge @model @auth(...) {
  id: ID!
  studentId: ID! @index(name: "byStudent")
  badgeType: BadgeType!
  awardedAt: AWSDateTime!
}
```

Badge checking runs as a Lambda function triggered after every `StudentXPLog` write.

### 3.4 Streaks

Track daily submission streaks. A streak increments when a student submits or meaningfully engages (revise, review) on consecutive calendar days (in their timezone).

```graphql
type StudentStreak @model @auth(...) {
  id: ID!
  studentId: ID! @index(name: "byStudent", queryField: "streakByStudent")
  currentStreak: Int!
  longestStreak: Int!
  lastActivityDate: AWSDate!
}
```

A scheduled Lambda (cron daily) checks all streaks and resets `currentStreak` to 0 if `lastActivityDate < yesterday`.

### 3.5 Where Gamification Appears in the UI

| Location | What Shows |
|----------|-----------|
| **Workbook header** | Student's level badge + current XP bar (progress to next level) |
| **Block completion** | XP toast notification (+50 XP) slides in from bottom-right |
| **Homework submission screen** | XP summary card: "You earned 125 XP for this submission" |
| **Student profile page** | Badge shelf, level, XP total, streak counter |
| **Peer review room** | Small XP indicator: "You'll earn 40 XP for completing this review" |
| **Leaderboard page** | Full rankings (see Section 4) |
| **Dashboard sidebar** | Streak flame icon + count, current level |

---

## 4. Leaderboard

### Design Decision: Two Modes

**Mode A — Relative Rank (Live)**
Shows each student's rank by total XP within their cohort. Updates in near-real-time.

**Mode B — Completion Milestone Board**
Shows which students have completed each assignment. No numeric ranking — just a grid of names × assignments with ✅ indicators. Lower pressure, still motivating.

**Recommendation**: Build both. Default to Mode B for new cohorts (less competitive pressure). Let instructors toggle to Mode A per cohort.

### 4.1 Data Model

```graphql
type LeaderboardEntry @model @auth(...) {
  id: ID!
  cohortId: ID! @index(name: "byCohort")
  studentId: ID!
  studentName: String!
  avatarColor: String!
  totalXP: Int!
  level: Int!
  completedAssignments: Int!
  currentStreak: Int!
  lastUpdated: AWSDateTime!
}
```

This is a **denormalized cache** — rebuilt by a Lambda triggered on every XP log write. Do not derive it live from joins for leaderboard queries; too slow at scale.

### 4.2 Leaderboard UI Component

```
┌────────────────────────────────────────────────────┐
│  📊 Cohort Leaderboard              [XP | Complete]│
├────┬──────────────────┬──────┬──────┬──────────────┤
│ #  │ Student          │ XP   │ Lvl  │ Streak       │
├────┼──────────────────┼──────┼──────┼──────────────┤
│ 🥇 │ Maria Garcia     │ 1840 │  5   │ 🔥 12 days   │
│ 🥈 │ James Kim        │ 1620 │  5   │ 🔥 8 days    │
│ 🥉 │ Priya Patel      │ 1450 │  4   │ 🔥 5 days    │
│  4 │ Tom Nguyen       │ 1200 │  4   │ 2 days       │
│ ── │ ── YOU ──────── │  950 │  3   │ 🔥 4 days    │ ← always pinned
│ .. │ (collapsed)      │      │      │              │
└────┴──────────────────┴──────┴──────┴──────────────┘
```

Key UX decisions:
- The current student's row is always pinned and highlighted, even if they're rank 47.
- Top 3 get medal emojis.
- The gap between the student's row and the rows above/below shows who to "chase."
- Clicking any row opens that student's public profile (badges only — no detailed scores).

### 4.3 Completion Grid (Mode B)

```
             | HW1 | HW2 | HW3 | HW4 | HW5 |
Maria Garcia |  ✅  |  ✅  |  ✅  |  ✅  |  ⏳  |
James Kim    |  ✅  |  ✅  |  ✅  |  ⬜  |  ⬜  |
Priya Patel  |  ✅  |  ✅  |  ⬜  |  ⬜  |  ⬜  |
YOU          |  ✅  |  ✅  |  ✅  |  ✅  |  ⬜  |
```

Legend: ✅ Submitted | ⏳ In Progress | ⬜ Not Started

### 4.4 Privacy Controls
- Instructors can disable the leaderboard entirely per cohort.
- Students can opt out of appearing (their row shows as "Anonymous Student" with no name).
- Peer names are only visible if both students are in the same cohort.

---

## 5. AI Memory — Exercise History, Prompt Changes & Markdown Storage

### 5.1 The Problem Today
Each AI feedback call is stateless. The model has no knowledge of:
- What this student has done before.
- Patterns of mistakes they repeatedly make.
- Concepts they've demonstrated mastery of.
- Their communication style and level.

### 5.2 The Solution: Per-Student Memory Document

Store a markdown document per student in the database. This document is a **living summary** of their learning history. It gets loaded into the system prompt of every AI call for that student.

#### Memory Document Structure (Markdown)

```markdown
# Student Memory: [Student Name]
Last Updated: [ISO timestamp]

## Learning Profile
- Cohort: [Cohort Name]
- Current Level: Practitioner (Level 3)
- Assignments Completed: 7 of 12
- Average Revision Rate: 2.1 revisions per submission

## Demonstrated Strengths
- Strong conceptual understanding of [Topic A]
- Consistent use of examples when explaining abstract ideas
- Improves significantly after receiving feedback (revision rate above average)

## Recurring Mistakes
- Tends to conflate [Concept X] with [Concept Y] — has appeared in HW2, HW4, HW6
- Frequently forgets to address edge cases in analytical responses
- Answers sometimes lack a clear conclusion

## Recent Feedback History (Last 5 Interactions)
- HW7, Block 3: Correctly identified the core issue but explanation was unclear. Revised and improved.
- HW6, Block 1: Conflated X with Y again. AI pointed out the distinction. Student acknowledged.
- HW5, Block 2: Excellent response — marked Nailed It.
- HW4, Block 4: Missed edge case. Revised after prompt.
- HW3, Block 2: Strong answer, no revision needed.

## Nailed It Moments
- HW5 Block 2: Exceptional analysis of [topic]
- HW3 Block 5: Clear, well-structured response

## Notes for AI Tutor
- This student responds well to Socratic questioning rather than direct correction.
- Prefers concise feedback — avoid lengthy explanations.
- Has shown consistent improvement since HW4.
```

#### Storage in DynamoDB (via AppSync)

```graphql
type StudentMemory @model @auth(...) {
  id: ID!
  studentId: ID! @index(name: "byStudent", queryField: "memoryByStudent")
  memoryMarkdown: String!   # The full markdown document above
  lastUpdated: AWSDateTime!
  version: Int!             # Optimistic concurrency
}
```

**Size**: A well-maintained memory document should stay under 4KB. Set a soft cap and trim the "Recent Feedback History" to the last 10 interactions when it would exceed it.

### 5.3 When to Update the Memory Document

Memory is updated by a Lambda function triggered **after every AI feedback interaction is saved**:

```
Student submits block
  → OpenAI generates feedback
  → Feedback saved to DB
  → Lambda: updateStudentMemory(studentId, homeworkId, blockId, feedback, studentResponse)
      → Load current memory markdown
      → Call OpenAI with: "Given this existing memory [memory] and this new interaction [interaction], 
         return an updated memory document. Maintain the structure. Be concise. 
         Update recurring mistakes, strengths, and recent history."
      → Save updated memory markdown back to DB
```

This secondary AI call is cheap (small tokens, fast) and runs async — it does not block the student's feedback response.

### 5.4 Modified System Prompt

**Current pattern (assumed):**
```javascript
const systemPrompt = `You are a helpful tutor. Give feedback on the student's response.`;
```

**New pattern with memory:**
```javascript
async function buildSystemPrompt(studentId) {
  const memory = await getStudentMemory(studentId); // fetch from DB

  return `
You are a skilled, encouraging tutor on the Homework Supply platform.

## Your Role
Provide specific, actionable feedback on the student's response to the current exercise block.
Be concise. Focus on the most important 1-2 things to improve.

## Student Memory
${memory ? memory.memoryMarkdown : 'No history yet — this appears to be the student\'s first submission.'}

## Instructions
- Reference their memory only when directly relevant (e.g., if they're repeating a known mistake, name it: "This is similar to what came up in your earlier work on X — let's address it properly this time.")
- Acknowledge genuine improvement explicitly if you see it compared to their history.
- If this response demonstrates mastery, say so clearly. This will trigger a "Nailed It" evaluation.
- Do not lecture. Be direct and warm.
- End with exactly one follow-up question to push their thinking deeper.
`;
}
```

### 5.5 Exercise History Access for AI

Beyond the memory document, the AI should have access to the **raw exercise history** for the current homework when relevant. Load the last N block responses from the current workbook session into the user message, not the system prompt:

```javascript
const userMessage = `
## Current Exercise Block
${currentBlockQuestion}

## Student's Response
${studentResponse}

## Other Blocks Completed This Session (for context)
${previousBlocksThisSession.map(b => `Block ${b.order}: ${b.studentResponse}`).join('\n\n')}
`;
```

Keep this to the current homework session only — full history goes in the memory document.

### 5.6 Memory Bootstrap for Existing Students

For students who already have exercise history when this feature launches, run a one-time Lambda:

```javascript
// For each student with existing history:
// 1. Load all their past homework submissions
// 2. Call OpenAI: "Based on these submissions, generate an initial student memory document in this format: [format]"
// 3. Save to StudentMemory table
```

---

## 6. Nailed It Components

### 6.1 What "Nailed It" Means
A "Nailed It" is awarded when the AI evaluates a student's response as demonstrating genuine mastery of the concept being tested — not just a correct answer, but a response that shows understanding, clarity, and depth.

### 6.2 AI Detection

Add a structured evaluation step to the AI feedback call. Ask the model to return a JSON envelope alongside its feedback:

```javascript
const feedbackPrompt = `
${systemPrompt}

Respond in JSON format:
{
  "feedback": "Your written feedback here...",
  "nailedIt": true | false,
  "nailedItReason": "Brief reason if nailedIt is true, else null",
  "xpToAward": number  // 0 if not nailed it, 20 if nailed it
}
`;
```

Parse the JSON response. If `nailedIt: true`, trigger the Nailed It flow.

**Guard against inflation**: The system prompt should explicitly say: *"Award nailedIt sparingly — only when the response is genuinely exceptional. Roughly 1 in 10 responses should qualify."* Track the rate in the memory document and tune if needed.

### 6.3 "Nailed It" UI Components

#### Component A: Block-Level Badge
On the workbook block itself, when `nailedIt: true` is returned:

```jsx
// NailedItBadge.jsx
// Appears inline in the block header after feedback returns
<Chip
  icon={<StarIcon />}
  label="Nailed It"
  color="success"
  variant="filled"
  size="small"
  sx={{ fontWeight: 700, ml: 1 }}
/>
```

The block gets a subtle green-left-border treatment to remain visually distinct for the rest of the session.

#### Component B: Full-Screen Celebration Modal
Triggers once per session maximum (not on every nailed-it block — only the first one, or if a threshold is hit). Keeps the momentum without becoming annoying.

```jsx
// NailedItCelebration.jsx
<Dialog open={showCelebration} maxWidth="xs" fullWidth>
  <Box sx={{ textAlign: 'center', p: 4 }}>
    <Typography variant="h1" sx={{ fontSize: '4rem' }}>🎯</Typography>
    <Typography variant="h5" fontWeight={700} mt={2}>
      Nailed It!
    </Typography>
    <Typography variant="body1" color="text.secondary" mt={1}>
      {nailedItReason}
    </Typography>
    <Chip label="+20 XP" color="success" sx={{ mt: 2, fontSize: '1rem', p: 1 }} />
    <Button
      variant="contained"
      fullWidth
      sx={{ mt: 3 }}
      onClick={() => setShowCelebration(false)}
    >
      Keep Going
    </Button>
  </Box>
</Dialog>
```

Add `canvas-confetti` for a 2-second confetti burst when this opens:
```javascript
import confetti from 'canvas-confetti';
useEffect(() => {
  if (showCelebration) {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }
}, [showCelebration]);
```

#### Component C: XP Toast (Every XP Award)
A lightweight MUI Snackbar that appears bottom-right for all XP events:

```jsx
// XPToast.jsx
<Snackbar
  open={open}
  autoHideDuration={2500}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <Alert severity="success" icon={<BoltIcon />} sx={{ fontWeight: 600 }}>
    +{xpAmount} XP — {xpReason}
  </Alert>
</Snackbar>
```

A global `XPContext` handles queuing multiple XP events so they don't overlap.

#### Component D: Homework Completion XP Summary
When the student submits or completes a full homework:

```jsx
// HomeworkXPSummary.jsx
<Card sx={{ border: '2px solid', borderColor: 'success.main', p: 3 }}>
  <Typography variant="h6" fontWeight={700}>🏁 Homework Complete!</Typography>
  <Divider sx={{ my: 2 }} />
  <Stack spacing={1}>
    <XPLineItem label="Homework Submitted" xp={50} />
    <XPLineItem label="All Blocks Completed" xp={75} />
    <XPLineItem label="3 Nailed It Blocks" xp={60} />
    <XPLineItem label="On-Time Bonus" xp={15} />
  </Stack>
  <Divider sx={{ my: 2 }} />
  <Typography variant="h5" fontWeight={700} color="success.main">
    Total: +200 XP
  </Typography>
  <LinearProgress
    variant="determinate"
    value={progressToNextLevel}
    sx={{ mt: 2, height: 10, borderRadius: 5 }}
  />
  <Typography variant="caption" color="text.secondary">
    {xpToNextLevel} XP to Level {nextLevel}
  </Typography>
</Card>
```

#### Component E: Nailed It Wall (Profile Page)
A student's profile page gets a "Wall of Excellence" section showing all their Nailed It blocks as cards with the block question snippet and the AI's reason:

```jsx
// NailedItWall.jsx
<Grid container spacing={2}>
  {nailedItBlocks.map(block => (
    <Grid item xs={12} sm={6} key={block.id}>
      <Card sx={{ borderLeft: '4px solid', borderColor: 'success.main' }}>
        <CardContent>
          <Typography variant="overline" color="success.main">🎯 Nailed It</Typography>
          <Typography variant="body2" fontWeight={600}>{block.question}</Typography>
          <Typography variant="caption" color="text.secondary" mt={1}>
            {block.nailedItReason}
          </Typography>
          <Typography variant="caption" display="block" color="text.disabled" mt={0.5}>
            {block.homeworkTitle} · {formatDate(block.createdAt)}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>
```

### 6.4 Where Nailed It Appears — Summary

| Location | What |
|----------|------|
| Workbook block (inline) | Green badge chip + left border |
| Feedback panel | Highlighted "Nailed It" banner above AI feedback text |
| Celebration modal | Full-screen moment (first per session) |
| XP toast | +20 XP notification |
| Homework completion summary | Counted in XP breakdown |
| Student profile | Nailed It Wall of Excellence |
| Leaderboard | Nailed It count column (optional) |
| Memory document | Recorded for AI context |

---

## 7. Data Model Changes Summary

### New DynamoDB Models

| Model | Purpose | Real-time Layer |
|-------|---------|-----------------|
| `WorkbookComment` | Persisted threaded comments on workbook blocks | Yjs Y.Map `comments` in workbook doc |
| `HomeworkRoom` | Peer review room metadata + archived messages | Yjs doc `review-{roomId}` |
| `StudentXPLog` | Immutable ledger of all XP events | N/A (write-only) |
| `StudentBadge` | Awarded badges per student | N/A |
| `StudentStreak` | Current and longest streak tracking | N/A |
| `StudentMemory` | Per-student AI memory markdown document | N/A |
| `LeaderboardEntry` | Denormalized leaderboard cache per cohort | N/A |

### Removed from Original Plan (Handled by Yjs)

| Original Model | Replaced By |
|----------------|-------------|
| `WorkbookPresence` | Yjs Awareness protocol (ephemeral, in-memory) |
| `RoomMessage` | Yjs Y.Array `messages` in review doc (persisted to `HomeworkRoom.messages` on close) |

### New Yjs Providers & Hooks

| File | Purpose |
|------|---------|
| `src/yjs/PeerReviewRoomProvider.ts` | Yjs provider for peer review rooms (`review-{roomId}`) |
| `src/yjs/peerReviewHooks.ts` | `usePeerReviewRoom`, `useRoomMessages`, `useRoomPeers` |
| `src/yjs/workbookHooks.ts` | + `useBlockEditors`, `useWorkbookComments` (extend existing) |

### Modified Existing Yjs Files

| File | Change |
|------|--------|
| `src/yjs/WorkbookCollaborationProvider.ts` | Add `commentsMap` Y.Map, `lastInteraction` awareness field, history Y.Array per block |
| `src/yjs/SyncAdapter.ts` | Complete the stub implementations — wire actual Amplify GraphQL mutations for snapshot persistence |
| `amplify/custom/websocket/handler.ts` | Handle `review-*` document names alongside `workbook-*` and `unit-*` |

### Modified DynamoDB Models

| Model | Change |
|-------|--------|
| `Grade` | Add `reviewRoomId: a.id()`, `aiReviewSummary: a.string()`, `nailedItCount: a.integer()` |
| `Grade.data` blocks | Add `nailedIt: boolean`, `nailedItReason: string`, `xpAwarded: number` inside block JSON |

### Architecture Decision: Yjs vs GraphQL Subscriptions

| Concern | Yjs Awareness / Y.Maps | AppSync Subscriptions |
|---------|----------------------|----------------------|
| Presence / cursors | **Use Yjs** — ephemeral, no DB writes, sub-100ms latency | Too slow (network round-trip + DynamoDB write + subscription fan-out) |
| Chat messages | **Use Yjs** — instant delivery, CRDT ordering, offline merge | Would work but adds model complexity and subscription management |
| Block comments | **Yjs for real-time** + DynamoDB for persistence | Persistence needed, but real-time reads from Yjs during session |
| Workbook block data | **Use Yjs** (already implemented) | Already replaced |
| AI feedback broadcast | **Use Yjs** — `feedbackMap` Y.Map already exists | Unnecessary |
| Room metadata (status, invites) | **DynamoDB** — needs to be queryable when users aren't connected | Yjs only works when connected |
| XP / Badges / Streaks | **DynamoDB only** — no real-time needed between users | Not a real-time concern |

---

## 8. Implementation Sequence

### Phase 1 — Yjs Infrastructure Completion (Weeks 1–2)
- [ ] Complete `SyncAdapter.ts` — wire actual Amplify GraphQL mutations (currently stubs)
- [ ] Auto-populate `NEXT_PUBLIC_YJS_WS_URL` from `amplify_outputs.json` at build time
- [ ] Add `lastInteraction` to awareness state in `WorkbookCollaborationProvider`
- [ ] Add 300ms cursor debounce in `useWorkbookBlock`
- [ ] Add `useBlockEditors(provider, blockId)` hook for block-level editing indicators
- [ ] Wire `feedbackMap` broadcast into workbook UI (Snackbar for non-submitting users)
- [ ] `WorkbookPresenceBar` component (avatar row from awareness)
- [ ] Block-level "being edited by [Name]" indicator component

### Phase 2 — Comments & History (Weeks 3–4)
- [ ] Add `commentsMap` Y.Map to `WorkbookCollaborationProvider`
- [ ] `WorkbookComment` DynamoDB model in `amplify/data/resource.ts`
- [ ] `useWorkbookComments(provider, blockId)` hook
- [ ] Comment thread UI: gutter icon, side drawer, threaded replies, resolve/unresolve
- [ ] Comment persistence via `workbook-sync` CustomEvent
- [ ] Block-level change history Y.Array + `useBlockHistory` hook
- [ ] History toggle UI per block (collapsed timeline)

### Phase 3 — Foundation: XP, Memory, Nailed It (Weeks 5–7)
- [ ] `StudentXPLog` model + XP award Lambda
- [ ] `StudentMemory` model + initial memory generation
- [ ] Modified AI system prompt loading memory
- [ ] Nailed It detection in AI response (JSON envelope)
- [ ] XP Toast component
- [ ] Nailed It block badge

### Phase 4 — Engagement Layer (Weeks 8–10)
- [ ] `StudentBadge` model + badge-check Lambda
- [ ] `StudentStreak` model + daily cron
- [ ] Level thresholds + level badge in workbook header
- [ ] Homework XP Summary card on completion
- [ ] Nailed It celebration modal + confetti
- [ ] Nailed It Wall on profile page

### Phase 5 — Peer Review Rooms (Weeks 11–13)
- [ ] `PeerReviewRoomProvider` — Yjs provider for `review-{roomId}` docs
- [ ] `usePeerReviewRoom` + `useRoomMessages` + `useRoomPeers` hooks
- [ ] `HomeworkRoom` DynamoDB model
- [ ] Update `amplify/custom/websocket/handler.ts` to handle `review-*` rooms
- [ ] Peer review room page (`pages/review/[id].tsx`) — split pane layout
- [ ] "Open for Peer Review" button on workbook completion
- [ ] Room invite system (DynamoDB query by `invitedUserIds`)
- [ ] `@AI` mention handler — calls `chatStream` Lambda with room context
- [ ] AI review summary on room close
- [ ] Message persistence on room close

### Phase 6 — Leaderboard & Polish (Weeks 14–16)
- [ ] `LeaderboardEntry` denormalized cache + Lambda
- [ ] Leaderboard page (Mode A: XP rank)
- [ ] Completion grid (Mode B)
- [ ] Privacy controls (opt-out, instructor toggle)
- [ ] Memory bootstrap Lambda for existing students
- [ ] XP rate tuning based on real engagement data
- [ ] Nailed It rate audit (ensure ~10% award rate)
- [ ] Mobile layout for peer review rooms
- [ ] Performance audit on leaderboard + WebSocket connections

---

*Document version 2.0 — April 2026 — Reworked Sections 1, 2, 7, 8 to use Yjs CRDT infrastructure*  
*Repo: github.com/ExcitingTheory/amplify-homework-supply*
