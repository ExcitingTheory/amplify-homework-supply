# Notification System

> **Status**: Complete  
> **Implemented**: May 2026  
> **Branch**: `feat/app-router-migration`

Real-time notification system with model, context, UI components, Lambda utilities, and tests.

## Overview

A full notification system for Homework Supply covering real-time in-app notifications, scheduled reminders, badge counts on navigation items, a notification inbox, and an admin CLI for system-wide announcements.

---

## 1. Data Model

### 1.1 `Notification` Model (new)

```typescript
Notification: a
  .model({
    _version: a.integer().default(1),
    _lastChangedAt: a.timestamp().default(0),
    _deleted: a.boolean().default(false),
    recipientId: a.string().required(),      // Cognito sub of the recipient
    type: NotificationType,                   // enum (see below)
    category: NotificationCategory,           // enum: ASSIGNMENT, COLLABORATION, GAMIFICATION, SQUAD, SYSTEM
    title: a.string().required(),
    body: a.string(),
    linkPath: a.string(),                     // e.g. "/section/abc123", "/review/xyz"
    linkLabel: a.string(),                    // e.g. "View Assignment", "Join Review"
    referenceId: a.string(),                  // ID of the source entity (assignment, squad, room, etc.)
    referenceType: a.string(),                // "Assignment", "HomeworkRoom", "Squad", "GroupChallenge", etc.
    senderName: a.string(),                   // Display name of who triggered it (or "System")
    seen: a.boolean().default(false),         // Opened/expanded the notification
    interacted: a.boolean().default(false),   // Clicked a link or action from the notification
    expiresAt: a.datetime(),                  // Auto-cleanup TTL (optional)
    metadata: a.json(),                       // Extensible payload (badge info, XP amount, etc.)
  })
  .secondaryIndexes((index) => [
    index("recipientId")
      .sortKeys(["createdAt"])
      .name("byRecipient")
      .queryField("listNotificationsByRecipient"),
    index("type").name("byType"),
  ])
  .authorization((allow) => [
    allow.owner().identityClaim("sub").inField("recipientId"),
    allow.group("Admins"),
  ]),
```

### 1.2 `NotificationType` Enum

```typescript
const NotificationType = a.enum([
  // Assignments & Grades
  "ASSIGNMENT_NEW",          // New assignment added to your section
  "ASSIGNMENT_DUE_SOON",    // 24h before due date reminder
  "ASSIGNMENT_DUE_NOW",     // Due right now
  "GRADE_RECEIVED",         // Instructor graded your submission
  "PEER_REVIEW_COMPLETE",   // Peer review of your work finished

  // Collaboration
  "PEER_REVIEW_INVITE",     // Invited to review someone's work
  "PRACTICE_SESSION_INVITE",// Invited to a collaborative practice session
  "WORKBOOK_SESSION_INVITE",// Invited to a workbook collaboration session
  "HOMEWORK_ROOM_OPENED",   // A homework room was opened in your section

  // Gamification
  "XP_MILESTONE",           // Hit an XP milestone (100, 500, 1000, etc.)
  "LEVEL_UP",               // Leveled up
  "BADGE_EARNED",           // Earned a badge
  "BADGE_LOST",             // Lost a badge (anti-badge applied)
  "DEBUFF_APPLIED",         // Debuff/cosmetic penalty applied
  "DEBUFF_EXPIRED",         // Debuff expired
  "STREAK_MILESTONE",       // Streak milestone (7, 14, 30 days)
  "STREAK_AT_RISK",         // No activity today, streak will break tomorrow
  "PERSONAL_BEST",          // New personal best on a unit

  // Challenges & Squad
  "CHALLENGE_STARTED",      // Group challenge started
  "CHALLENGE_ENDING_SOON",  // Challenge ending in 24h
  "CHALLENGE_COMPLETED",    // Group challenge completed
  "SQUAD_POST_NEW",         // New post in your squad
  "SQUAD_MEMBER_JOINED",    // New member joined your squad
  "SQUAD_METADATA_UPDATED", // Squad name/description changed
  "SQUAD_INVITE",           // Invited to join a squad

  // Chat
  "CHAT_MENTION",           // Mentioned in a chat you host or subscribe to
  "CHAT_NEW_MESSAGE",       // New message in a chat you're subscribed to

  // System
  "SYSTEM_ANNOUNCEMENT",    // Admin system-wide announcement
  "SYSTEM_MAINTENANCE",     // Maintenance window notification
]);
```

### 1.3 `NotificationCategory` Enum

```typescript
const NotificationCategory = a.enum([
  "ASSIGNMENT",
  "COLLABORATION",
  "GAMIFICATION",
  "SQUAD",
  "CHAT",
  "SYSTEM",
]);
```

---

## 2. Delivery Architecture

### 2.1 Real-Time Notifications (AppSync Subscriptions)

Notifications that happen as a direct result of user actions are created inline and delivered via AppSync `observeQuery()`:

| Trigger | Where Created | Type |
|---------|---------------|------|
| Assignment created/updated | Section Lambda or gamification Lambda | `ASSIGNMENT_NEW` |
| Peer review invite | `createPeerReviewRoom` section Lambda | `PEER_REVIEW_INVITE` |
| Practice session invite | Client-side when host shares code | `PRACTICE_SESSION_INVITE` |
| Workbook session invite | Client-side when host shares link | `WORKBOOK_SESSION_INVITE` |
| Badge earned/lost | `checkBadges` gamification Lambda | `BADGE_EARNED`, `BADGE_LOST` |
| XP milestone / Level up | `awardXP` gamification Lambda | `XP_MILESTONE`, `LEVEL_UP` |
| Debuff applied/expired | `checkBadges` gamification Lambda | `DEBUFF_APPLIED`, `DEBUFF_EXPIRED` |
| Personal best | `checkPersonalBest` gamification Lambda | `PERSONAL_BEST` |
| Squad post | Client-side when post is created | `SQUAD_POST_NEW` |
| Squad member joined | Client-side on squad join | `SQUAD_MEMBER_JOINED` |
| Squad metadata changed | Client-side on squad update | `SQUAD_METADATA_UPDATED` |
| Challenge started/completed | Admin/instructor action | `CHALLENGE_STARTED`, `CHALLENGE_COMPLETED` |
| Peer review completed | `generateReviewSummary` peerReviewAI Lambda | `PEER_REVIEW_COMPLETE` |
| Homework room opened | Client-side when room is created | `HOMEWORK_ROOM_OPENED` |
| Chat mention | `handleAIMention` or client-side | `CHAT_MENTION` |

**Pattern**: Lambda functions or client-side code calls `client.models.Notification.create(...)`. The recipient's `NotificationContext` picks it up via `observeQuery()`.

### 2.2 Scheduled Notifications (Lambda Cron)

A new **`notificationCron`** Lambda runs on EventBridge schedule (`rate(1 hour)`) to handle time-based notifications:

| Check | Action |
|-------|--------|
| Assignments due in next 24h | Create `ASSIGNMENT_DUE_SOON` for all students in the section |
| Assignments due right now (within the hour) | Create `ASSIGNMENT_DUE_NOW` |
| Challenges ending in 24h | Create `CHALLENGE_ENDING_SOON` for all challenge participants |
| Streaks at risk (no activity today, close to daily reset) | Create `STREAK_AT_RISK` |
| Debuffs expiring | Create `DEBUFF_EXPIRED` |

**Deduplication**: Before creating, query existing notifications for `(recipientId, type, referenceId)` to avoid duplicates.

### 2.3 System Notifications (Admin CLI)

A **`sendSystemNotification`** GraphQL mutation (Admins-only) creates a `SYSTEM_ANNOUNCEMENT` or `SYSTEM_MAINTENANCE` notification for all active users.

**CLI script** at `scripts/send-notification.ts`:
```bash
npx tsx scripts/send-notification.ts --type announcement \
  --title "Scheduled Maintenance" \
  --body "The system will be down for maintenance on May 15 from 2-4 AM UTC." \
  --expires "2026-05-15T04:00:00Z"
```

Implementation: The script authenticates as an admin, queries all `StudentProfile` records to get `studentId` values, and batch-creates `Notification` records.

---

## 3. Frontend Architecture

### 3.1 `NotificationContext` (new)

**File**: `src/context/notificationContext.tsx`

```
Provider wraps the app in providers.tsx (inside AuthGate, after SettingsProvider)

State:
- notifications: Notification[]        // All notifications for current user
- unseenCount: number                   // Total unseen
- unseenByCategory: Record<NotificationCategory, number>  // Counts per category
- loading: boolean

Actions:
- markSeen(notificationId: string)      // Sets seen=true
- markInteracted(notificationId: string)// Sets interacted=true
- markAllSeen()                         // Marks all unseen as seen
- deleteNotification(notificationId)    // Soft delete

Subscription:
- observeQuery({ filter: { recipientId: { eq: currentUser.sub } } })
- Client-side compute unseenCount and unseenByCategory from items
```

### 3.2 Notification Badge Components

**`NotificationBadge`** — Wraps MUI `Badge` to show unseen count on any icon:
```tsx
<NotificationBadge category="COLLABORATION">
  <GroupsIcon />
</NotificationBadge>
```

Used in:
- **MainToolbar AppBar buttons** (Join Study Group, Join Section, User Menu)
- **Drawer menu items** (Sections, Units, Squads, Skills, Leaderboard)
- **User menu** (Profile entry shows total unseen count)

### 3.3 Navigation Integration

#### MainToolbar Drawer (sidebar menu)
Each menu item shows a badge with the relevant unseen count:
- **Sections**: `unseenByCategory.ASSIGNMENT` count
- **Squads**: `unseenByCategory.SQUAD` count
- **Leaderboard**: `unseenByCategory.GAMIFICATION` count (subset: milestones/levelups)
- **Join Study Group/Workbook/Peer Review**: `unseenByCategory.COLLABORATION` count

Below the existing join items, add a divider and a "Notifications" link to `/profile/notifications`.

#### AppBar Buttons
The AppBar join buttons (GroupsIcon for study group, PersonAddIcon for section join) get `NotificationBadge` wrappers showing collaboration-type unseen counts.

#### User Menu
Add "Notifications" menu item with total unseen badge, navigates to `/profile/notifications`.

### 3.4 Join Dialogs — Enhanced with Invitations + Host Mode

Each join dialog (Practice, Workbook, Peer Review) gets two tabs:

**Tab 1: "Join" (existing behavior + invitation list)**
- Shows pending invitations (queried from Notification records of the relevant invite type)
- Each invitation shows: sender name, unit/assignment name, timestamp, "Join" button
- Below invitations: existing room code / link text field
- Clicking an invitation link marks it as `interacted` and navigates

**Tab 2: "Host" (new)**
- Shows a dropdown of available units/grades/practices the user can host
- For Practice: lists drills autogenerated by the system → clicking one creates a collaborative PracticeSession, or offer to go to the practice page where they can make a new practice drill.
- For Workbook: lists units with in-progress grades → clicking one opens sharing
- For Peer Review: lists units with completed grades → clicking one creates a HomeworkRoom
- "Create New" link if applicable (e.g., start a new practice drill)

### 3.5 Notifications Page

**Route**: `/profile/notifications` (new page)

**Layout**:
- Filter tabs: All | Assignments | Collaboration | Gamification | Squad | System
- Each notification card shows:
  - Icon (per type)
  - Title + body
  - Timestamp (relative: "2 hours ago")
  - Action button (if linkPath exists)
  - Visual distinction: **unseen** = bold text + colored left border, **seen but not interacted** = normal text + subtle left border, **interacted** = muted text
- "Mark all as read" button
- Pagination or virtual scroll for large lists

### 3.6 Notification Interaction States

| State | Visual Treatment |
|-------|-----------------|
| **Unseen** (`seen=false`) | Bold title, colored left border (blue), dot indicator |
| **Seen** (`seen=true, interacted=false`) | Normal weight, subtle left border, no dot |
| **Interacted** (`seen=true, interacted=true`) | Muted text color, no border accent |

**Seen** is set when:
- User opens the notifications page (all visible become seen)
- User expands a notification in a dropdown
- User opens a page that the notification links to

**Interacted** is set when:
- User clicks a link from the notification
- User clicks an action button (Join, View, etc.)

---

## 4. Lambda Functions

### 4.1 `notificationCron` (new scheduled Lambda)

**Trigger**: EventBridge `rate(1 hour)`
**Purpose**: Create time-based notifications

```typescript
// Pseudo-code
export async function handler() {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // 1. Assignments due soon
  const assignments = await queryAssignmentsDueBetween(now, in24h)
  for (const assignment of assignments) {
    const section = await getSection(assignment.sectionID)
    const students = await listSectionStudents(section.code)
    for (const student of students) {
      await createNotificationIfNotExists({
        recipientId: student.id,
        type: "ASSIGNMENT_DUE_SOON",
        title: `Assignment due soon: ${unitName}`,
        body: `Due ${formatDate(assignment.dueDate)}`,
        linkPath: `/workbook/${assignment.unitID}?sectionId=${assignment.sectionID}`,
        referenceId: assignment.id,
        referenceType: "Assignment",
      })
    }
  }

  // 2. Challenges ending soon
  const challenges = await queryActiveChallengesEndingBefore(in24h)
  // ... similar pattern

  // 3. Streaks at risk
  const profiles = await queryProfilesWithNoActivityToday()
  // ... similar pattern
}
```

### 4.2 `sendSystemNotification` (new mutation handler)

**Trigger**: GraphQL mutation (Admins only)
**Purpose**: Broadcast system-wide notifications

```typescript
export async function handler(event) {
  const { title, body, type, expiresAt } = event.arguments
  const profiles = await listAllStudentProfiles()

  // Batch create notifications for all users
  for (const batch of chunk(profiles, 25)) {
    await Promise.all(batch.map(profile =>
      createNotification({
        recipientId: profile.studentId,
        type: type || "SYSTEM_ANNOUNCEMENT",
        category: "SYSTEM",
        title, body,
        senderName: "System",
        expiresAt,
      })
    ))
  }

  return { success: true, count: profiles.length }
}
```

### 4.3 Existing Lambda Modifications

| Lambda | Change |
|--------|--------|
| `gamification` (`awardXP`) | After XP award, check milestones → create `XP_MILESTONE` or `LEVEL_UP` |
| `gamification` (`checkBadges`) | After badge award/removal → create `BADGE_EARNED` / `BADGE_LOST` / `DEBUFF_APPLIED` |
| `gamification` (`checkPersonalBest`) | After new PB → create `PERSONAL_BEST` |
| `section` (`createPeerReviewRoom`) | After room creation → create `PEER_REVIEW_INVITE` for each `invitedUserIds` |
| `peerReviewAI` (`generateReviewSummary`) | After summary → create `PEER_REVIEW_COMPLETE` for room owner |
| `streakResetCron` | Before reset → create `STREAK_AT_RISK` for users with active streaks |

---

## 5. CLI Script

### `scripts/send-notification.ts`

```bash
# Send a system announcement
npx tsx scripts/send-notification.ts \
  --type announcement \
  --title "System Update v2.5" \
  --body "New features: notification system, improved navigation." \
  --expires "2026-06-01T00:00:00Z"

# Send a maintenance window notice
npx tsx scripts/send-notification.ts \
  --type maintenance \
  --title "Scheduled Maintenance" \
  --body "System will be down May 15, 2-4 AM UTC." \
  --link "/offline" \
  --expires "2026-05-15T04:00:00Z"

# Send to a specific section
npx tsx scripts/send-notification.ts \
  --type announcement \
  --title "Class Update" \
  --body "Check the new assignment posted today." \
  --section "section-id-123"
```

The script:
1. Authenticates using admin credentials (from env vars or AWS profile)
2. Calls the `sendSystemNotification` mutation
3. Reports success/failure count

---

## 6. Implementation Phases

### Phase 1: Foundation (Schema + Context + Basic UI)
1. Add `Notification` model, `NotificationType`, and `NotificationCategory` to `amplify/data/resource.ts`
2. Create `src/context/notificationContext.tsx` with `observeQuery` subscription
3. Create `src/components/NotificationBadge.tsx` component
4. Create `/profile/notifications` page with list view
5. Wire `NotificationContext` into `app/providers.tsx`
6. Add notification badges to MainToolbar drawer items and AppBar buttons
7. Add "Notifications" to user profile menu

### Phase 2: Real-Time Notification Creation
8. Modify `gamification` Lambda to create notifications on XP milestones, badges, debuffs, personal bests
9. Modify `section` Lambda to create notifications on peer review invites
10. Modify `peerReviewAI` Lambda to create notifications on review completion
11. Add client-side notification creation for squad posts, member joins, collaboration invites

### Phase 3: Scheduled Notifications
12. Create `notificationCron` Lambda function
13. Wire `notificationCron` to EventBridge hourly schedule in `amplify/backend.ts`
14. Implement assignment due-soon, challenge ending, streak-at-risk checks

### Phase 4: Enhanced Join Dialogs + Host Mode
15. Add invitation list tab to JoinPracticeDialog
16. Add invitation list tab to JoinWorkbookDialog  
17. Add invitation list tab to JoinPeerReviewDialog
18. Add "Host" tab to all three dialogs with unit/grade selection

### Phase 5: Admin CLI + System Notifications
19. Create `sendSystemNotification` mutation in schema
20. Create CLI script `scripts/send-notification.ts`
21. Add `SYSTEM_ANNOUNCEMENT` and `SYSTEM_MAINTENANCE` rendering in notification UI

### Phase 6: Polish
22. Add notification sound/vibration (optional, respects Settings)
23. Add notification expiry cleanup (TTL or scheduled deletion)
24. Add email notification delivery (SES integration, respects `Settings.emailNotifications`)
25. Add browser push notifications (Web Push API, opt-in)

---

## 7. Why Not Yjs for Notifications?

Yjs is designed for CRDT-based collaborative editing (shared documents, presence). Notifications are:
- **Per-user, not shared** — each user has their own notification feed
- **Append-only** — no merge conflicts
- **Query-heavy** — need filtering by type, seen status, pagination
- **Persistent** — must survive page reloads and be queryable server-side

**AppSync subscriptions via `observeQuery()`** are the right fit because:
- Already used everywhere in the app for real-time model updates
- Built-in filtering by `recipientId` (owner auth)
- No additional infrastructure needed
- Consistent with existing patterns (sectionContext, unitContext, etc.)

---

## 8. File Map (new files to create)

```
amplify/data/resource.ts                          # Modified: add Notification model + enums
amplify/functions/notificationCron/               # New: scheduled notification Lambda
  handler.ts
  resource.ts
amplify/backend.ts                                # Modified: wire notificationCron schedule
src/context/notificationContext.tsx                # New: notification state + subscription
src/components/NotificationBadge.tsx               # New: badge wrapper component
src/components/NotificationList.tsx                # New: notification list for inbox page
src/components/NotificationCard.tsx                # New: individual notification card
app/[locale]/profile/notifications/page.tsx        # New: notification inbox page
scripts/send-notification.ts                       # New: admin CLI script
```

---

## 9. Decision Log

| Decision | Rationale |
|----------|-----------|
| AppSync `observeQuery` over Yjs | Per-user feeds, query/filter needs, consistent with existing patterns |
| Hourly cron over per-minute | Assignment due dates are at hour boundaries; hourly is sufficient and cost-effective |
| `seen` + `interacted` two-level read state | Matches email UX (bold = unread, normal = read, muted = acted on) |
| Notification model over embedded array | Scalable, queryable, filterable, paginated — embedded arrays don't scale |
| Admin CLI over admin UI | Faster to build, scriptable for ops, admin UI can come later |
| Client-side notification creation for some events, that are specific to a user's self or a squad or section an instructor is in or chat someone is a member of | Avoids Lambda cold starts for simple create operations; auth rules enforce owner-only writes |
