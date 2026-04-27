# Test Verification Plan — Feature Expansion

Maps each FEATURE_PLAN.md feature to the appropriate test layer(s), following established project patterns.

**Test layers available:**

| Layer | Tool | When to use | Run command |
|-------|------|-------------|-------------|
| **Unit** | Vitest + happy-dom + @testing-library/react | Pure logic, hooks, providers, utilities | `npm run test:unit` |
| **Integration** | Vitest (requires sandbox) | Multi-provider sync, Lambda functions, API calls | `npm run test:integration` |
| **Performance** | Vitest (requires sandbox) | Latency budgets, CRDT convergence time | `npm run test:performance` |
| **Storybook** | Vitest browser + Playwright | Component rendering, a11y, visual regression | `npm run test:storybook` |
| **E2E** | Cypress | Full user flows, multi-user scenarios | `npx cypress run` |
| **Visual** | Chromatic | Screenshot diffs on PRs | `npm run chromatic` |

---

## Phase 1 — Yjs Infrastructure Completion

### 1.1 Presence Indicators (`WorkbookPresenceBar`, idle fade, cursor debounce)

**Unit tests** — `src/yjs/__tests__/WorkbookPresenceBar.test.ts`
- `useBlockEditors(provider, blockId)` returns users whose cursor matches blockId
- `useBlockEditors` excludes the local client
- `useBlockEditors` updates when awareness changes
- `lastInteraction` is set in awareness on `updateBlock` / `updateCursor`
- Idle fade: users with `lastInteraction > 60s ago` are marked idle
- Cursor debounce: `updateCursor` calls are batched within 300ms

Pattern: Follow `WorkbookCollaboration.test.ts` — create providers with `connect: false, persistence: false`, manipulate awareness directly, assert hook output with `renderHook`.

**Storybook** — `src/components/Workbook/WorkbookPresenceBar.stories.tsx`
- Default: 3 users connected (mocked awareness)
- One user idle (faded avatar)
- Single user (just "you")
- Block-level indicator: "Being edited by Alice"

**Cypress** — extend `cypress/e2e/yjs-collaboration.cy.ts`
- Instructor opens editor → presence bar shows 1 user
- (Simulated via sequential login) Learner opens workbook → data from first session persists

---

### 1.2 SyncAdapter completion

**Integration tests** — `test/integration/sync-adapter.test.ts`
- `persistWorkbook(gradeId, data)` calls `client.models.Grade.update()` with correct `_version`
- `loadWorkbook(gradeId)` returns parsed workbook data from Grade.data
- `persistComments(gradeId, threads)` creates/updates WorkbookComment records
- Round-trip: persist → load returns identical data
- Conflict: stale `_version` throws ConflictError

Pattern: Follow `test/integration/api.test.ts` — use `signInAs()` helper, real Amplify sandbox.

---

## Phase 2 — Comments & History

### 2.1 WorkbookComment (Yjs + DynamoDB)

**Unit tests** — `src/yjs/__tests__/WorkbookComments.test.ts`
- `commentsMap` Y.Map is created in WorkbookCollaborationProvider
- `addComment(blockId, text)` adds a thread to the commentsMap
- `resolveThread(threadId)` sets `resolved: true`
- `useWorkbookComments(provider, blockId)` returns only threads for that block
- `useWorkbookComments` updates reactively when commentsMap changes
- Thread structure matches `CommentThread` interface

**Integration tests** — `test/integration/workbook-comments.test.ts`
- Two providers sync comments via Y.Doc state exchange (follow `multi-user-collaboration.test.ts` pattern)
- Provider A adds comment → sync → Provider B sees it
- Both providers add comments to same block → merge without conflict
- Comment persistence to DynamoDB via SyncAdapter round-trips correctly

**Storybook** — `src/components/Workbook/CommentThread.stories.tsx`
- Empty thread (just the "Add comment" button)
- Thread with 3 replies
- Resolved thread (grayed out)
- Thread being typed (typing indicator)

### 2.2 Block-level change history

**Unit tests** — `src/yjs/__tests__/BlockHistory.test.ts`
- `updateBlock` pushes entry to `history-{blockId}` Y.Array
- History entry contains `userId, displayName, timestamp, fieldChanged, oldValue, newValue`
- History trims to 50 entries on sync
- `useBlockHistory(provider, blockId)` returns entries in chronological order

**Storybook** — `src/components/Workbook/BlockHistory.stories.tsx`
- Timeline with 5 edits from 2 users
- Empty history state
- Collapsed vs expanded toggle

---

## Phase 3 — XP, Memory, Nailed It

### 3.1 XP System

**Unit tests** — `src/utils/__tests__/xpCalculation.test.ts`
- `calculateTotalXP(logs)` sums all xpAmount values
- `calculateLevel(totalXP)` returns correct level for each threshold boundary (0→1, 149→1, 150→2, 400→3, etc.)
- `getXPForAction(reason)` returns correct amount per `XPReason`
- Edge cases: empty logs → 0 XP, level 1

**Unit tests** — `src/components/__tests__/XPToast.test.tsx`
- Renders with correct XP amount and reason text
- Auto-dismisses after 3 seconds
- Queue: multiple XP events show sequentially, not stacked

**Lambda tests** — `amplify/functions/__tests__/xpAward.test.ts`
- Awards correct XP for each action type
- Creates `StudentXPLog` record with correct fields
- Idempotency: same action + same gradeId doesn't double-award
- Triggers badge check after XP write

**Integration tests** — `test/integration/xp-system.test.ts`
- Submit grade → XP log created → total XP queryable
- XP log entries are immutable (no update/delete)
- LeaderboardEntry updates after XP log write

**Storybook** — `src/components/Gamification/XPToast.stories.tsx`
- +50 XP homework submitted
- +20 XP nailed it
- +75 XP streak bonus
- Queue of 3 notifications

**Storybook** — `src/components/Gamification/LevelBadge.stories.tsx`
- Each level (1–6) with label and icon
- Progress bar showing XP to next level

### 3.2 Student Memory

**Lambda tests** — `amplify/functions/__tests__/studentMemory.test.ts`
- `updateStudentMemory(studentId, feedback, blockContext)` appends to "Recent Feedback History"
- Memory stays under 4KB soft cap (trims oldest history entries)
- `buildSystemPrompt(studentId)` includes memory markdown
- Memory doc follows expected markdown structure
- First interaction creates initial memory document

**Integration tests** — `test/integration/ai-memory.test.ts`
- AI feedback call includes student memory in system prompt
- Memory updates after feedback is saved
- Memory bootstrap Lambda processes existing students correctly

**Unit tests** — `src/utils/__tests__/memoryParser.test.ts`
- Parse memory markdown into structured sections
- Trim history to N entries
- Detect and extract "Nailed It Moments" section
- Handle empty/missing memory gracefully

### 3.3 Nailed It Detection

**Unit tests** — `src/utils/__tests__/nailedItParser.test.ts`
- Parse JSON envelope from AI response: `{ feedback, nailedIt, nailedItReason, xpToAward }`
- Handle malformed JSON gracefully (fallback to plain text feedback)
- `nailedIt: false` awards 0 XP
- `nailedIt: true` awards 20 XP and extracts reason

**Storybook** — `src/components/Gamification/NailedItBadge.stories.tsx`
- Badge chip with star icon
- In context: block header with badge applied
- Tooltip showing the AI reason

**Storybook** — `src/components/Gamification/NailedItCelebration.stories.tsx`
- Celebration modal open state
- With confetti animation (mocked `canvas-confetti`)
- XP breakdown display
- Dismiss interaction

---

## Phase 4 — Engagement Layer

### 4.1 Badges

**Lambda tests** — `amplify/functions/__tests__/badgeCheck.test.ts`
- Each badge trigger condition correctly detected:
  - First Submission: 1+ grade with `complete: true`
  - Good Eye: 1+ peer review completed
  - Quick Draw: submission within 1 hour of assignment open
  - Sharpshooter: 5 nailed-it blocks in one homework
  - Consistent: 7-day streak
  - Team Player: 10 peer reviews
  - Deep Thinker: 50 AI feedback triggers
  - Top of Class: #1 on leaderboard for 7 days
  - Perfectionist: 3 perfect scores
- Badge awarded only once (idempotent)
- `StudentBadge` record created with `awardedAt`

**Storybook** — `src/components/Gamification/BadgeShelf.stories.tsx`
- All badges earned
- Partial badges (some locked/grayed)
- Empty state (new student)
- Single badge detail hover/tooltip

### 4.2 Streaks

**Unit tests** — `src/utils/__tests__/streakCalculation.test.ts`
- Consecutive days increment streak
- Missing a day resets `currentStreak` to 0
- `longestStreak` never decreases
- Timezone handling: activity at 11:59 PM and 12:01 AM same timezone = same day (not 2 days)

**Lambda tests** — `amplify/functions/__tests__/streakCron.test.ts`
- Daily cron resets streaks where `lastActivityDate < yesterday`
- Active streaks (activity today or yesterday) are not reset
- Awards streak XP at 3-day and 7-day milestones

**Storybook** — `src/components/Gamification/StreakIndicator.stories.tsx`
- Active streak: 🔥 5 days
- No streak (0 days, no flame)
- Milestone streak (7 days, special glow)

### 4.3 Homework XP Summary

**Storybook** — `src/components/Gamification/HomeworkXPSummary.stories.tsx`
- Completion card with XP breakdown (submission + on-time + nailed-it blocks)
- High score (perfect + multiple nailed-its)
- Minimal score (just submission XP)

---

## Phase 5 — Peer Review Rooms

### 5.1 PeerReviewRoomProvider

**Unit tests** — `src/yjs/__tests__/PeerReviewRoomProvider.test.ts`
- Creates Yjs doc with name `review-{roomId}`
- `sendMessage(content)` appends to `messages` Y.Array
- `getMessages()` returns all messages in order
- `closeRoom()` sets status to `REVIEW_COMPLETE`
- `inviteUser(userId)` adds to `invitedUserIds` in roomState Y.Map
- Awareness includes `{ user, typing, viewingBlockId }`
- `getRoomState()` returns current room metadata

Pattern: Follow `WorkbookCollaboration.test.ts` — instantiate with `connect: false`.

**Integration tests** — `test/integration/peer-review-room.test.ts`
- Two providers sync messages via Y.Doc state exchange
- Provider A sends message → sync → Provider B sees it
- Concurrent messages from both providers merge correctly (CRDT ordering)
- Room state changes sync (status, invites)
- Room close persists messages to `HomeworkRoom.messages` in DynamoDB

### 5.2 Peer Review Hooks

**Unit tests** — `src/yjs/__tests__/peerReviewHooks.test.ts`
- `usePeerReviewRoom` returns provider, messages, peers, connected state
- `useRoomMessages` updates when messages Y.Array changes
- `useRoomPeers` returns awareness peer list excluding self
- `sendMessage` function adds message with correct structure (id, author, timestamp)
- Typing indicator updates via awareness

### 5.3 HomeworkRoom DynamoDB Model

**Integration tests** — `test/integration/homework-room.test.ts`
- CRUD: create room → query by gradeId → query by ownerId
- Auth: owner can read/write, invited users can read, others cannot access
- Room close: status update + message persistence
- Secondary indexes (`byGrade`, `byOwner`) return correct results

### 5.4 @AI Mention Handler

**Lambda tests** — `amplify/functions/__tests__/peerReviewAI.test.ts`
- Extracts question from `@AI what about this?` → `what about this?`
- Includes workbook context in the AI call
- Returns message with `messageType: 'AI_SUGGESTION'`
- Handles empty/invalid @AI mentions gracefully

**Unit tests** — `src/utils/__tests__/aiMentionParser.test.ts`
- Parse `@AI` from message content
- Extract question text after `@AI`
- Handle `@AI` at start, middle, end of message
- Handle `@ai` case-insensitive

### 5.5 Peer Review UI

**Storybook** — `src/components/PeerReview/PeerReviewRoom.stories.tsx`
- Split pane: read-only workbook + chat
- Empty room (just opened, no messages)
- Active review (multiple messages from 2 peers + 1 AI suggestion)
- Closed/completed room (read-only chat, summary shown)
- Mobile: single pane with toggle

**Storybook** — `src/components/PeerReview/RoomInvite.stories.tsx`
- Invite dialog with user search
- Already invited users list
- Empty state (no peers in section)

**Cypress** — `cypress/e2e/peer-review.cy.ts`
- Instructor creates assignment → student completes homework
- Student opens peer review room
- Student sends message in chat
- (Simulated) Second student sees the room and messages after login switch
- Room close flow: summary generated, chat becomes read-only

---

## Phase 6 — Leaderboard & Polish

### 6.1 LeaderboardEntry Cache

**Lambda tests** — `amplify/functions/__tests__/leaderboardUpdate.test.ts`
- XP log write triggers leaderboard entry update
- Student's `totalXP`, `level`, `currentStreak` are correct
- Rank is calculated relative to cohort
- New student gets rank = last

**Integration tests** — `test/integration/leaderboard.test.ts`
- Multiple students with different XP → correct rank ordering
- XP change → rank recalculation
- Cohort isolation: students in different sections don't affect each other's rank

### 6.2 Leaderboard UI

**Storybook** — `src/components/Leaderboard/LeaderboardTable.stories.tsx`
- Mode A (XP rank): top 3 with medals, current user pinned, gap indicator
- Mode A: single student (you're #1)
- Mode B (completion grid): assignments × students with status icons
- Mode B: all complete, mixed progress
- Privacy: anonymous student rows
- Empty state: no data yet

**Storybook** — `src/components/Leaderboard/CompletionGrid.stories.tsx`
- Full grid with ✅ ⏳ ⬜ states
- Current student row highlighted
- Single assignment, many assignments

### 6.3 Privacy Controls

**Unit tests** — `src/utils/__tests__/leaderboardPrivacy.test.ts`
- Opt-out student appears as "Anonymous Student"
- Instructor toggle hides entire leaderboard
- Peer names only visible within same cohort

**Cypress** — `cypress/e2e/leaderboard.cy.ts`
- Student views leaderboard, sees own row pinned
- Student opts out → name replaced with "Anonymous Student"
- Instructor toggles leaderboard off → students see disabled message

---

## Cross-Cutting Test Concerns

### WebSocket Infrastructure (Shared)

**Integration tests** — `test/integration/websocket-routing.test.ts`
- `workbook-{gradeId}` routes to workbook handler
- `review-{roomId}` routes to peer review handler
- `unit-{unitId}` routes to unit editor handler
- Cross-room isolation: messages in one room never leak to another

**Performance tests** — `test/performance/yjs-collaboration.test.ts` (extend existing)
- Presence update latency < 200ms (awareness round-trip)
- Comment sync latency < 500ms
- Peer review message delivery < 300ms
- 10 concurrent users in one room: no message loss

### DynamoDB Model Auth Rules

**Integration tests** — `test/integration/model-auth.test.ts`
- Each new model's `@auth` rules verified:
  - `WorkbookComment`: owner read/write, Admins/Instructors read/write
  - `HomeworkRoom`: owner read/write, invited users read-only
  - `StudentXPLog`: owner read, Admins read
  - `StudentBadge`: owner read, Admins read
  - `StudentStreak`: owner read/write, Admins read
  - `StudentMemory`: owner read, system (Lambda) write
  - `LeaderboardEntry`: section members read, system (Lambda) write
- Negative tests: unauthorized user cannot read/write

### Accessibility

All new Storybook stories include a11y checks via `@storybook/addon-a11y` (already configured globally).

Key a11y focus areas:
- **Presence avatars**: `aria-label` for each user, role="status" for connection state
- **Comment threads**: proper heading hierarchy, `aria-expanded` for collapse/expand
- **XP toast**: `role="alert"`, auto-dismiss respects `prefers-reduced-motion`
- **Celebration modal**: focus trap, Escape to dismiss, respects `prefers-reduced-motion` (skip confetti)
- **Leaderboard table**: proper `<table>` semantics, `aria-current="true"` on user's row
- **Peer review chat**: `role="log"` on message list, `aria-live="polite"` for new messages

### Mock Data Requirements

New mock data files needed in `.storybook/__mocks__/ui-data/`:

| File | Contents |
|------|----------|
| `workbook-comments.json` | Sample CommentThread objects for Storybook |
| `peer-review-messages.json` | Sample YjsRoomMessage array |
| `xp-logs.json` | Sample StudentXPLog entries for different actions |
| `badges.json` | All badge types with earned/unearned states |
| `leaderboard.json` | Sample LeaderboardEntry array (10 students) |
| `student-memory.md` | Sample memory markdown document |
| `nailed-it-blocks.json` | Sample blocks with nailedIt flag |

Validate all mock data with Zod schemas via `npm run storybook:validate-mocks` (extend existing `test/storybook/validate-mocks.test.ts`).

---

## Test File Summary

### New Unit Tests (Vitest)
| File | Feature |
|------|---------|
| `src/yjs/__tests__/WorkbookComments.test.ts` | Comment Y.Map CRUD + hook |
| `src/yjs/__tests__/BlockHistory.test.ts` | History Y.Array + trimming |
| `src/yjs/__tests__/PeerReviewRoomProvider.test.ts` | Room provider lifecycle |
| `src/yjs/__tests__/peerReviewHooks.test.ts` | Room hooks reactivity |
| `src/utils/__tests__/xpCalculation.test.ts` | XP math + level thresholds |
| `src/utils/__tests__/streakCalculation.test.ts` | Streak logic + timezone |
| `src/utils/__tests__/nailedItParser.test.ts` | JSON envelope parsing |
| `src/utils/__tests__/memoryParser.test.ts` | Memory markdown parsing |
| `src/utils/__tests__/aiMentionParser.test.ts` | @AI extraction |
| `src/utils/__tests__/leaderboardPrivacy.test.ts` | Privacy/anonymization |
| `src/components/__tests__/XPToast.test.tsx` | Toast rendering + queue |

### New Integration Tests (Vitest, requires sandbox)
| File | Feature |
|------|---------|
| `test/integration/sync-adapter.test.ts` | SyncAdapter → DynamoDB round-trip |
| `test/integration/workbook-comments.test.ts` | Multi-user comment sync |
| `test/integration/peer-review-room.test.ts` | Multi-user chat sync |
| `test/integration/homework-room.test.ts` | HomeworkRoom CRUD + auth |
| `test/integration/xp-system.test.ts` | XP log → leaderboard pipeline |
| `test/integration/ai-memory.test.ts` | Memory in AI prompt |
| `test/integration/leaderboard.test.ts` | Rank calculation + cohort isolation |
| `test/integration/websocket-routing.test.ts` | Room name routing |
| `test/integration/model-auth.test.ts` | Auth rules for all new models |

### New Lambda Tests (Vitest)
| File | Feature |
|------|---------|
| `amplify/functions/__tests__/xpAward.test.ts` | XP award + idempotency |
| `amplify/functions/__tests__/badgeCheck.test.ts` | Badge trigger conditions |
| `amplify/functions/__tests__/streakCron.test.ts` | Streak reset cron |
| `amplify/functions/__tests__/studentMemory.test.ts` | Memory update + system prompt |
| `amplify/functions/__tests__/leaderboardUpdate.test.ts` | Leaderboard cache rebuild |
| `amplify/functions/__tests__/peerReviewAI.test.ts` | @AI handler in rooms |

### New Storybook Stories
| File | Feature |
|------|---------|
| `src/components/Workbook/WorkbookPresenceBar.stories.tsx` | Presence avatars |
| `src/components/Workbook/CommentThread.stories.tsx` | Comment UI |
| `src/components/Workbook/BlockHistory.stories.tsx` | Edit timeline |
| `src/components/Gamification/XPToast.stories.tsx` | XP notifications |
| `src/components/Gamification/LevelBadge.stories.tsx` | Level display |
| `src/components/Gamification/NailedItBadge.stories.tsx` | Nailed It chip |
| `src/components/Gamification/NailedItCelebration.stories.tsx` | Celebration modal |
| `src/components/Gamification/HomeworkXPSummary.stories.tsx` | Completion summary |
| `src/components/Gamification/BadgeShelf.stories.tsx` | Badge collection |
| `src/components/Gamification/StreakIndicator.stories.tsx` | Streak display |
| `src/components/PeerReview/PeerReviewRoom.stories.tsx` | Full room layout |
| `src/components/PeerReview/RoomInvite.stories.tsx` | Invite dialog |
| `src/components/Leaderboard/LeaderboardTable.stories.tsx` | XP ranking |
| `src/components/Leaderboard/CompletionGrid.stories.tsx` | Assignment grid |

### New/Extended Cypress E2E Tests
| File | Feature |
|------|---------|
| `cypress/e2e/yjs-collaboration.cy.ts` | + presence bar assertions |
| `cypress/e2e/peer-review.cy.ts` | Full peer review flow |
| `cypress/e2e/leaderboard.cy.ts` | Leaderboard viewing + privacy |

### Performance Tests (extend existing)
| File | Feature |
|------|---------|
| `test/performance/yjs-collaboration.test.ts` | + comment/presence/chat latency |
