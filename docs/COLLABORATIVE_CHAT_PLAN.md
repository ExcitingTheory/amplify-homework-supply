# Collaborative Chat Plan

## Overview

A real-time, Yjs-powered chat system with three scopes (Guild, Unit/Workbook/Section, and a shared context-aware room) featuring `#topics`, threaded messages, `@mentions`, and AI bot integration via `@kai`.

**Key Insight**: Workbook, Unit, and Section share a single chat room (per section) with **private topics** scoped to each context. Guild chat is a separate room.

---

## Architecture

### Chat Room Types

| Room | Y.Doc Name | Access Control | Topics Scope |
|------|-----------|----------------|--------------|
| **Section Chat** | `chat-section-{sectionId}` | All section members | Shared + private topics for units/workbooks |
| **Guild Chat** | `chat-guild-{guildId}` | Guild members only | Guild-specific topics |

### Shared Section Chat with Context-Private Topics

The section room contains a flat set of topics. Each topic has a `scope` field:

- `scope: "section"` — visible to all section members (general discussion)
- `scope: "unit:{unitId}"` — visible only when viewing that unit
- `scope: "workbook:{gradeId}"` — visible only when in that workbook

The UI filters visible topics based on the current page context.

---

## Y.Doc Structure

### Section Chat Doc (`chat-section-{sectionId}`)

```
Y.Map("meta")
├── name: string
├── sectionId: string
├── createdAt: string

Y.Map("topics")          // Key = topicId
├── {topicId}: {
│     id: string,
│     name: string,          // e.g. "#general", "#homework-help"
│     scope: string,         // "section" | "unit:{unitId}" | "workbook:{gradeId}"
│     createdBy: string,     // userId
│     createdAt: string,
│     pinned: boolean,
│     archived: boolean
│   }

Y.Map("threads")         // Key = topicId, value = Y.Array of messages
├── {topicId}: Y.Array([
│     {
│       id: string,
│       parentId: string | null,   // null = top-level, set = reply in thread
│       authorId: string,
│       authorName: string,
│       content: string,           // Markdown-like content
│       mentions: string[],        // ["@kai", "@studentName"]
│       createdAt: string,
│       editedAt: string | null,
│       reactions: { [emoji]: string[] }  // emoji → userIds
│     }
│   ])

Y.Map("presence")        // Awareness overlay — who's typing, online status
```

### Guild Chat Doc (`chat-guild-{guildId}`)

Same structure as section chat, but all topics are `scope: "guild"`.

---

## Implementation Phases

### Phase 1: Core Infrastructure

#### 1.1 Yjs Provider — `ChatCollaborationProvider`

**File**: `src/yjs/ChatCollaborationProvider.ts`

```typescript
// Extends YjsDocProvider
// Doc name: "chat-section-{id}" or "chat-guild-{id}"
// Creates: Y.Map("meta"), Y.Map("topics"), Y.Map("threads"), Y.Map("presence")
// Methods: createTopic(), postMessage(), editMessage(), deleteMessage(), addReaction()
```

#### 1.2 React Hooks — `src/yjs/chatHooks.ts`

| Hook | Returns |
|------|---------|
| `useChatRoom(config)` | `{ provider, isSynced, isConnected }` |
| `useChatTopics(scope?)` | `{ topics, createTopic, pinTopic, archiveTopic }` |
| `useChatThread(topicId)` | `{ messages, sendMessage, editMessage, deleteMessage, addReaction }` |
| `useChatPresence()` | `{ onlineUsers, typingUsers }` |
| `useMentions(content)` | `{ parsedMentions, mentionedUsers, mentionedBot }` |

#### 1.3 Mention Parser — `src/utils/chatMentions.ts`

- Parse `@kai` → triggers AI response pipeline
- Parse `@firstName lastName` → resolves to userId from section/guild membership
- Autocomplete data source from section members or guild members

---

### Phase 2: AI Bot Integration (`@kai`)

#### 2.1 Kai Bot Handler

When `@kai` is detected in a message:

1. Extract the question/prompt from the message content
2. Build context from the current topic scope (unit content, workbook data, etc.)
3. Route to existing OpenAI Lambda or Vercel AI SDK streaming endpoint
4. Post Kai's response as a new message in the same thread (authorId = "kai-bot")

**File**: `src/utils/kaiBotHandler.ts`

- Uses existing `ChatContext` / AI SDK infrastructure
- Kai's messages are **not** synced via Yjs write (server-authoritative) — the collab server posts them after processing
- Alternative: A lightweight Yjs "bot observer" on the server that watches for `@kai` mentions and responds

#### 2.2 Server-Side Bot Observer

**File**: `amplify/functions/yjsSync/kaiBotObserver.ts`

- Listens to Y.Array updates on the collab server
- When a message contains `@kai`, calls OpenAI and appends the response to the same thread
- Uses the existing `openai` Lambda function's logic

---

### Phase 3: UI Components

#### 3.1 `ChatPanel` (Main Container)

**File**: `src/components/Chat/ChatPanel.tsx`

- Sidebar or bottom panel (responsive)
- Shows topic list + active thread
- Integrates with page context (unit, workbook, section) to filter topics

#### 3.2 `TopicList`

**File**: `src/components/Chat/TopicList.tsx`

- Lists `#topics` for current scope
- "New Topic" button
- Pinned topics at top
- Unread indicators

#### 3.3 `ThreadView`

**File**: `src/components/Chat/ThreadView.tsx`

- Chronological message list
- Threaded replies (indent or inline expand)
- Real-time typing indicators
- Scroll-to-bottom / new message toast

#### 3.4 `MessageComposer`

**File**: `src/components/Chat/MessageComposer.tsx`

- Text input with `@mention` autocomplete (MUI Autocomplete or custom popover)
- `#topic` creation shortcut
- Markdown support (bold, italic, code, links)
- Enter to send, Shift+Enter for newline

#### 3.5 `MentionChip`

**File**: `src/components/Chat/MentionChip.tsx`

- Renders `@kai` with bot icon
- Renders `@studentName` with avatar
- Clickable to view profile

---

### Phase 4: Context Integration

#### 4.1 ChatContext Update

**File**: `src/context/chatContext.jsx` (extend existing)

- Add `chatRoomProvider` state
- Connect/disconnect based on active section or guild
- Expose `currentTopicScope` derived from router path:
  - `/unit/{id}` → `"unit:{id}"`
  - `/workbook/{id}` → `"workbook:{id}"`
  - `/section/{id}` → `"section"`
  - `/guilds/{id}` → `"guild"`

#### 4.2 Route-Based Scope Detection

```typescript
function getCurrentChatScope(pathname: string, params: Record<string, string>) {
  if (pathname.includes('/unit/')) return `unit:${params.unitId}`;
  if (pathname.includes('/workbook/')) return `workbook:${params.gradeId}`;
  if (pathname.includes('/guild')) return `guild`;
  return 'section';  // default
}
```

---

### Phase 5: Authorization & Persistence

#### 5.1 Collab Server Auth Check

Extend `amplify/functions/yjsSync/index.ts`:

- On WebSocket connect to `chat-section-{id}`: verify user is a member of that section
- On WebSocket connect to `chat-guild-{id}`: verify user is a member of that guild
- Reject unauthorized connections

#### 5.2 Persistence to DynamoDB (Optional)

The collab server's `persistCallback` already saves Y.Doc state. For searchability/moderation:

- Periodically snapshot topic messages to a `ChatMessage` Amplify model
- Enables admin moderation panel, search across chat history
- Yjs remains source of truth for real-time; DynamoDB is async backup

#### 5.3 Moderation

- Instructors can delete any message, archive topics
- Content filtering via existing `moderationFlag` pattern
- Report button on messages → flags for instructor review

---

## Data Flow Diagram

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Browser A  │◄──────────────────►│  Yjs Collab      │
│  (Student)  │                    │  Server (WS)     │
└─────────────┘                    │                  │
                                   │  ┌────────────┐  │
┌─────────────┐     WebSocket      │  │ Kai Bot    │  │
│  Browser B  │◄──────────────────►│  │ Observer   │  │
│  (Student)  │                    │  └─────┬──────┘  │
└─────────────┘                    └────────┼─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │  OpenAI Lambda   │
                                   │  (GPT-4)         │
                                   └──────────────────┘
```

---

## File Inventory (New Files)

| File | Purpose |
|------|---------|
| `src/yjs/ChatCollaborationProvider.ts` | Yjs provider for chat rooms |
| `src/yjs/chatHooks.ts` | React hooks for chat state |
| `src/utils/chatMentions.ts` | `@mention` parsing and resolution |
| `src/utils/kaiBotHandler.ts` | AI bot invocation on `@kai` |
| `src/components/Chat/ChatPanel.tsx` | Main chat container |
| `src/components/Chat/TopicList.tsx` | Topic sidebar/list |
| `src/components/Chat/ThreadView.tsx` | Message thread display |
| `src/components/Chat/MessageComposer.tsx` | Input with mentions |
| `src/components/Chat/MentionChip.tsx` | Rendered mention UI |
| `amplify/functions/yjsSync/kaiBotObserver.ts` | Server-side AI response |

---

## Key Decisions

1. **Yjs for all real-time state** — messages, topics, presence, typing indicators. No Amplify subscriptions needed for chat.
2. **Single section room, scope-filtered topics** — avoids room proliferation; a student in a section sees all "section" topics plus context-specific topics when on a unit/workbook page.
3. **Server-side Kai bot** — the collab server observes Y.Doc changes and injects AI responses, keeping bot logic decoupled from clients.
4. **No new Amplify data models required** for MVP — Yjs persistence handles storage. DynamoDB backup is Phase 5 (optional for moderation/search).
5. **Mention autocomplete** uses existing section membership (from `SectionContext`) and guild membership (from guild model's `members` array).

---

## Dependencies

- Already installed: `yjs`, `y-websocket`, `y-indexeddb`
- No new packages needed for MVP
- Optional: `@tiptap/extension-mention` or custom MUI autocomplete for mention UX

---

## Migration from Existing Chat

The current `ChatSidebar` is an **AI-only** chat (1:1 with Kai via OpenAI threads). It remains as-is for private AI tutoring. The new collaborative chat is a **peer** chat where Kai can be summoned via `@kai`. Both can coexist:

- `ChatSidebar` = Private AI tutor (existing)
- `ChatPanel` = Collaborative peer chat with optional AI (new)
