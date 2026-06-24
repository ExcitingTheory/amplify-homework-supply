# Soft Delete & Recycle Bin Plan

## Overview

Implement soft delete with a recycle bin for instructor content models, chats, and their join tables. "Permanent delete" archives records to compressed S3 storage rather than destroying them. An admin-only UI allows unarchiving from S3 back to DynamoDB with cascading restoration of related data.

## Goals

- [ ] Soft delete marks records as deleted (visible in recycle bin, hidden from normal views)
- [ ] Restore from recycle bin puts records back in active state
- [ ] Permanent delete removes from DynamoDB but archives to S3 (compressed JSON)
- [ ] Admin-only unarchive UI restores records from S3 back to DynamoDB
- [ ] Cascading behavior: deleting/restoring/archiving a parent handles its related join table records
- [ ] Per-model inline filter toggle (show/hide deleted items)
- [ ] Dedicated `/recycle-bin` page showing all soft-deleted items

## Non-Goals

- Auto-purge / TTL-based deletion (all permanent deletes are manual)
- Soft delete on gamification models (StudentProfile, StudentXPLog, etc.)
- Soft delete on AnalyticsSummary, Notification, Settings
- Version history / undo beyond single restore

## Architecture

### Models Affected

**Primary models (get `deletedAt` + `deletedBy` fields):**
- Unit
- Section
- Question
- Word
- File
- Document
- AssistantChat

**Join tables (get `deletedAt` field — cascades from parent):**
- UnitFile
- UnitWord
- QuestionUnit
- UnitDocument
- QuestionFile
- WordFile
- QuestionWord
- DocumentWord
- DocumentQuestion
- AssistantChatFile

### Data Model Changes

Add to each affected model in `amplify/data/resource.ts`:

```typescript
// Soft delete metadata
deletedAt: a.datetime(),    // null = active, set = soft-deleted
deletedBy: a.string(),      // username who deleted (primary models only)
```

### S3 Archive Structure

When permanently deleted, records are archived to:

```
private/{adminIdentityId}/archives/{modelName}/{id}/{timestamp}.json.gz
```

Archive payload format:
```json
{
  "model": "Unit",
  "id": "abc-123",
  "archivedAt": "2026-06-07T12:00:00Z",
  "archivedBy": "admin-username",
  "record": { /* full DynamoDB record */ },
  "relatedRecords": {
    "UnitFile": [ /* join table records */ ],
    "UnitWord": [ /* join table records */ ],
    "QuestionUnit": [ /* join table records */ ]
  }
}
```

### API Changes

**New custom mutations:**

1. `softDelete(modelName, id)` — Sets `deletedAt` + cascades to join tables
2. `restoreRecord(modelName, id)` — Clears `deletedAt` + cascades to join tables
3. `permanentDelete(modelName, id)` — Archives to S3, removes from DynamoDB + join tables
4. `unarchiveRecord(archiveKey)` — Admin-only: reads from S3, recreates in DynamoDB

**New custom queries:**

1. `listArchives(modelName?, limit?, nextToken?)` — Admin-only: lists archived records from S3
2. `getArchive(archiveKey)` — Admin-only: reads archive metadata without restoring

### State Management

**Context changes:**
- All subscription callbacks in contexts already filter items — add `deletedAt == null` filter
- Add `showDeleted` toggle state to contexts that need inline view
- New `RecycleBinContext` for the dedicated page

### Lambda Function

New Lambda: `amplify/functions/recycleBin/`
- Handles `softDelete`, `restoreRecord`, `permanentDelete`, `unarchiveRecord`, `listArchives`, `getArchive`
- Uses Amplify Data Client for DynamoDB operations
- Uses S3 client for archive storage (gzip compressed)
- Validates ownership/permissions before operations
- Cascades operations to join tables

## User Stories

1. As an instructor, I want to delete a unit without losing it permanently, so I can recover it if needed
2. As an instructor, I want to see my deleted items in a recycle bin, so I know what I've removed
3. As an instructor, I want to restore a deleted item with all its relationships intact
4. As an instructor, I want to permanently delete old items to declutter my recycle bin
5. As an admin, I want to recover permanently deleted items from the archive
6. As an admin, I want to see all archived items across all users
7. As an instructor, I want to toggle "show deleted" on a list view to see what's been removed inline

## UI/UX Design

### Recycle Bin Page (`/recycle-bin`)

```
┌─────────────────────────────────────────────────┐
│ Recycle Bin                        [Empty All]   │
├─────────────────────────────────────────────────┤
│ Filter: [All ▼] [Units|Files|Words|Questions...] │
├─────────────────────────────────────────────────┤
│ 📄 Unit: "Chapter 3 - Verbs"                    │
│    Deleted by you • 3 days ago                   │
│    [Restore] [Permanently Delete]                │
├─────────────────────────────────────────────────┤
│ 📁 File: "recording.mp3"                        │
│    Deleted by you • 1 week ago                   │
│    [Restore] [Permanently Delete]                │
└─────────────────────────────────────────────────┘
```

### Admin Archive UI (`/admin/archives`)

```
┌─────────────────────────────────────────────────┐
│ Archives (Admin)                                 │
├─────────────────────────────────────────────────┤
│ Filter: [All ▼] [Search...]                      │
├─────────────────────────────────────────────────┤
│ 📄 Unit: "Chapter 3 - Verbs"                    │
│    Archived by admin@school.edu • 2 weeks ago    │
│    Owner: instructor@school.edu                  │
│    [Unarchive] [Preview]                         │
└─────────────────────────────────────────────────┘
```

### Inline Filter Toggle

Each list view (Units list, Files list, etc.) gets a toggle:
```
[☐ Show deleted items]
```
When enabled, deleted items appear grayed out with restore/permanent-delete actions.

## Dependencies

- `pako` or Node.js built-in `zlib` for gzip compression in Lambda
- S3 client (`@aws-sdk/client-s3`) in Lambda
- No new external frontend libraries needed

## Implementation Plan

### Phase 1: Schema + Lambda Foundation
1. Add `deletedAt` / `deletedBy` fields to affected models
2. Create `recycleBin` Lambda function with all 6 operations
3. Add custom queries/mutations to schema
4. Add S3 archive bucket path to storage config

### Phase 2: Context Layer
5. Update all affected contexts to filter `deletedAt == null` by default
6. Create `RecycleBinContext` for the recycle bin page
7. Add `showDeleted` state to relevant contexts

### Phase 3: UI
8. Create `RecycleBinPage` component
9. Create `AdminArchivesPage` component
10. Add inline "show deleted" toggles to list views
11. Add delete confirmation dialogs with "soft delete" language
12. Add navigation links

### Phase 4: Testing
13. Unit tests for Lambda operations
14. Integration tests for cascade behavior
15. Storybook stories for new UI components

## Cascade Rules

| Action | Parent Effect | Join Table Effect |
|--------|--------------|-------------------|
| Soft Delete Unit | `deletedAt` set | All UnitFile, UnitWord, QuestionUnit, UnitDocument get `deletedAt` |
| Restore Unit | `deletedAt` cleared | All related joins get `deletedAt` cleared |
| Permanent Delete Unit | Archived to S3, removed from DB | Related joins archived + removed |
| Soft Delete File | `deletedAt` set | UnitFile, WordFile, QuestionFile, AssistantChatFile get `deletedAt` |
| Soft Delete Document | `deletedAt` set | UnitDocument, DocumentWord, DocumentQuestion get `deletedAt` |
| Soft Delete Question | `deletedAt` set | QuestionUnit, QuestionFile, QuestionWord, DocumentQuestion get `deletedAt` |
| Soft Delete Word | `deletedAt` set | UnitWord, WordFile, QuestionWord, DocumentWord get `deletedAt` |
| Soft Delete Chat | `deletedAt` set | AssistantChatFile get `deletedAt` |

## Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Large cascade operations timing out | Lambda processes cascades with pagination; uses batch write operations |
| S3 archive becomes large/expensive | Lifecycle policy to move archives to Glacier after 90 days |
| Restoring archived item conflicts with existing ID | Check for ID conflicts before unarchive; fail with clear error |
| Join table records orphaned if parent not restored | Archive includes full relationship graph; restore validates parent exists |
| Subscription storms on cascade soft-delete | Batch updates in Lambda; contexts handle gracefully |

## Success Criteria

- Soft deleting a Unit hides it from all normal views and its join table records
- Restoring a Unit brings it back with all relationships intact
- Permanent delete removes from DynamoDB, creates compressed S3 archive
- Admin can list and unarchive any archived record
- No data is ever truly destroyed — always recoverable by admin
- Existing tests continue to pass (filtered queries exclude deleted items)
