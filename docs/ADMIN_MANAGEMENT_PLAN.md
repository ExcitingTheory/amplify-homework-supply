# Admin Dashboard & Data Management Plan

Status: mixed — some items shipped, some are proposed designs pending approval.
Scope: admin/instructor navigation, admin maintenance pages, moderation coverage,
and a full-account archive/replay system.

## 1. Navigation audit — orphaned routes

Audit of every `page.tsx`/`page.jsx` under `app/[locale]/**` against every
`href=`/`router.push(` in the codebase.

### Fixed in this session

- `/admin/analytics`, `/admin/archives`, `/admin/words` had **zero** in-app
  links (Storybook/docs/tests only). Added to [MainToolbar.jsx](../src/components/MainToolbar.jsx)'s
  admin nav section (both the mobile drawer and the desktop icon rail).
- `/admin/moderation` was only linked from
  [InstructorDashboard.jsx](../src/components/InstructorDashboard.jsx), not from
  the nav drawer itself — now also in the nav drawer.
- `/admin/files` and `/admin/questions` didn't exist — created (see §2) and
  linked from the nav drawer.

### Still orphaned (not addressed yet)

| Route | Notes |
| --- | --- |
| `/section/[id]/settings/ai` | Zero links anywhere, including from `SectionDetailClient.jsx` itself (which has no "settings" references at all). Only reachable by typing the URL. |
| `/xp-history` | No `href`/`router.push` in real components — only in Storybook stories. |
| `/privacy` | No footer/legal link anywhere; only appears in `PUBLIC_PATHS` allow-lists (`app/providers.tsx`, `proxy.ts`). |
| `/profile/[username]` (other users) | Nothing links to a classmate's/student's profile — leaderboard rows, student tables, gradebook names are plain text. Only reachable for your **own** profile via `/profile` → redirect. |
| `/instructor/grade/[id]` | Reachable only indirectly, via the moderation list and notification links — not from the section gradebook itself. |

### Intentionally unlinked (not bugs)

- `/offline` — service worker fallback page.
- `/workbook-offline` — service worker redirect target for a specific unit.

**Open follow-up**: decide whether to add a Settings entry point into
`SectionDetailClient` for `/section/[id]/settings/ai`, a footer `/privacy`
link, and student-name links to `/profile/[username]` from leaderboards/gradebooks.

## 2. Admin maintenance pages — Words/Files/Questions pattern

Pattern established by the pre-existing `/admin/words` page: server component
authenticates (Admins/Instructors only) and pre-fetches all records; a client
component renders health-stat cards (clickable filters), a search/filter
toolbar, a table, and bulk delete with a confirm dialog.

### Shipped

- **[`/admin/files`](../app/%5Blocale%5D/admin/files/page.tsx)** +
  [`FileListClient.tsx`](../app/%5Blocale%5D/admin/files/FileListClient.tsx) —
  stats: orphaned (no Unit/Word/Question/Chat/Document reference — computed
  server-side by cross-referencing `UnitFile`/`WordFile`/`QuestionFile`/
  `AssistantChatFile` join tables plus `File.documentID`), missing thumbnail,
  large (>10MB), flagged, AI-generated.
- **[`/admin/questions`](../app/%5Blocale%5D/admin/questions/page.tsx)** +
  [`QuestionListClient.tsx`](../app/%5Blocale%5D/admin/questions/QuestionListClient.tsx) —
  stats: missing audio, missing answer/choices, missing embedding, flagged,
  generated vs. manual.
- Bulk delete only removes the DB record — **does not** delete the underlying
  S3 object (same limitation as the existing Words page's audio handling).
  The confirm dialog says so explicitly for Files.

### Nav drawer update

[MainToolbar.jsx](../src/components/MainToolbar.jsx) admin section (mobile
drawer + desktop icon rail) now links to: Moderation, Analytics, Words, Files,
Questions, Archives, Gamification settings (`/admin/settings`), Recycle Bin —
up from just Gamification + Recycle Bin.

### Proposed, not built: Manage Chats page

`/admin/moderation`'s `ModerationClient` only queries `Grade`, `Unit`, `Word`,
`Question` for flagged items — **`AssistantChat` is missing entirely**, even
though it already has `moderationFlag`, soft-delete fields, and full
recycle-bin/archive support. Flagged chats currently only surface ad hoc
inside `InstructorDashboard`'s own subscription.

Plan:
1. Add `AssistantChat` to the model list in
   `app/[locale]/admin/moderation/page.tsx` so flagged chats show up in the
   existing moderation queue.
2. Build `/admin/chats` mirroring Words/Files/Questions — stats for flagged,
   high-token-cost (`totalTokens`/`turnCount`), empty, and orphaned-by-unit/
   section chats, including `type: "memory"` records.
3. No schema changes required — low risk.

### Proposed, not built: Manage Users page

No admin surface exists today for viewing/managing user accounts. Cognito
operations (`ListUsersInGroup`, `ListUsers`) are already granted to a couple
of Lambdas (`amplify/backend.ts`) but only for narrow purposes (section
collaborator invites, section roster) — nothing lists all users or lets an
admin promote/demote/disable an account.

Plan (bigger lift — needs explicit approval before touching `amplify/`):
1. New Lambda with `cognito-idp:ListUsers` / `AdminGetUser` /
   `AdminAddUserToGroup` / `AdminRemoveUserFromGroup` / `AdminEnableUser` /
   `AdminDisableUser` permissions.
2. New schema-level custom mutations/queries wired to that Lambda
   (admin-only authorization, same pattern as `recycleBinHandler`'s mutations).
3. New `/admin/users` page: list users, show groups/roles, promote/demote,
   enable/disable, and (once built) trigger the per-user archive workflow
   from §3.

**Recommendation**: build Manage Chats first (self-contained, no schema
changes); scope Manage Users as separate, explicitly-approved work.

## 3. Full-account archive + replay ("rattle everything off to an archive bucket")

Goal: for a given student or instructor account, sweep **everything** they
own — content, files, assignments/units/grades, graded files, and chats — to
an S3 archive, with the ability to replay (restore) it back into the system
later. This is net-new design work; nothing below is built yet.

### What already exists today

[`amplify/functions/recycleBin/handler.ts`](../amplify/functions/recycleBin/handler.ts):

- **Soft delete → Recycle Bin**: `deletedAt`/`deletedBy` on `Unit`, `Section`,
  `Question`, `Word`, `File`, `Document`, `AssistantChat`, cascading to join
  tables via `CASCADE_MAP` (`AssistantChat` ↔ `AssistantChatFile` already
  wired both directions).
- **Permanent delete → S3 archive**: gzips `{ record, relatedRecords }` to
  `private/archives/{Model}/{id}/{timestamp}.json.gz`, then deletes the
  DynamoDB rows.
- **Replay → `unarchiveRecord`**: reads the gzip, recreates the DB rows
  (admin-only).
- Admin UI already exists at
  [`/admin/archives`](../app/%5Blocale%5D/admin/archives/page.jsx) to list,
  preview, and unarchive.

### Gaps for a full-account sweep

1. **Scope is per-record, not per-user.** No "everything owned by
   `student-42`" operation exists.
2. **`Assignment` and `Grade` aren't covered at all** — not in
   `SUPPORTED_MODELS`, no soft-delete fields, no cascade entries. `Grade` only
   has a `byOwnerAndSection` GSI, not a plain `byOwner` index, so "every grade
   this student ever produced" currently requires looping every section first.
3. **Binary S3 bytes are never copied** — only the DB record's *reference*
   (`File.path`, `Grade.files[]`, `Word.audio[]`, etc.) is archived. A real
   replay needs the actual bytes, since the live object could be deleted
   independently by then.
4. **Student vs. instructor traversal differs**: an instructor's data fans
   out through *their* `Unit`/`Section`/`Question`/`Word`/`File` (covered
   today); a student's data fans out through `Grade`/`Assignment`/
   `AssistantChat`/their own `File`/`Document` rows (not covered), and a
   *section's* `Grade`/`Assignment` rows are owned by students, not the
   instructor who created the section.

### Proposed design

- **New Lambda operations** (dedicated `userArchiveHandler`, since a
  full-account export has a different execution-time profile than one
  record):
  - `archiveUserData(username, role)` — paginates every model referencing
    that user:
    - **Student scope**: `Grade` (owner), `Assignment` (owner),
      `AssistantChat` (owner — both `chat` and `memory` types), `Document`,
      `StudentProfile`, and their own `File` rows.
    - **Instructor scope**: `Unit`/`Section`/`Question`/`Word`/`File`
      (already cascade-mapped), plus `Assignment`/`Grade`/`AssistantChat`
      fanned out through `Section.owner → sectionID` (captures student work
      that happened inside their sections).
    - Copies every referenced S3 object (`File.path`, `Grade.files[]`,
      `Word.audio[]`, `Question.audio[]`/`answerAudio[]`,
      `AssistantChatFile` → `File.path`, `Section.featuredImage/Video/
      thumbnail`) via `CopyObjectCommand` into
      `private/user-archives/{username}/{timestamp}/files/...`.
    - Writes one manifest (`manifest.json.gz`, or NDJSON per model if large)
      recording every row plus the original→archived file-path mapping.
  - `replayUserArchive(archiveKey)` (admin-only) — recreates rows in
    dependency order (`Unit`/`Section`/`Word`/`Question`/`File` → join tables
    → `Assignment` → `Grade`/`AssistantChat` last), preferably preserving
    original IDs so foreign keys resolve, and copies file bytes back to their
    live paths.
- **Schema additions needed** (touches `amplify/data/resource.ts` — requires
  explicit approval):
  - Add a `byOwner` GSI on `Grade` (and confirm `Assignment`'s existing
    `owner` field is queryable the same way).
  - Add `Assignment`/`Grade`/`AssistantChat` to a cascade/traversal map
    analogous to `CASCADE_MAP`.
  - Two new admin-only mutations (`archiveUserData`, `replayUserArchive`)
    wired to the new Lambda, mirroring `permanentDelete`/`unarchiveRecord`.
- **UI**: extend `/admin/archives` with an "Archive a user" action (username +
  role → confirm → job), listed alongside existing archives with a "Replay"
  button, reusing `useRecycleBinAdmin`'s `listArchives`/`getArchive` pattern.
- **Execution-time caveat**: a single Lambda call won't scale to an
  instructor with years of sections/grades. Recommend a `UserArchiveJob`
  tracking record the admin can poll rather than a synchronous call, or Step
  Functions if this needs to be bulletproof for large accounts.

### Open decision

Which piece to build first once approved:
1. Schema/GSI changes (`Grade.byOwner`, cascade map additions).
2. The new Lambda (`archiveUserData`/`replayUserArchive`).
3. The admin UI ("Archive a user" action + job status view).

## Next steps checklist

- [ ] Decide on orphaned-route follow-ups (§1): AI settings entry point,
      `/privacy` footer link, profile links from leaderboards/gradebooks.
- [ ] Build `/admin/chats` + add `AssistantChat` to the moderation queue (§2).
- [ ] Approve scope/sequencing for Manage Users (§2) and the full-account
      archive/replay system (§3), then begin with the agreed first piece.
