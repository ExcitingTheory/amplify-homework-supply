# S3 Content Storage Spec — Unit Draft/Publish with Version History

## Overview

Move Lexical editor content (`Unit.data`) and Yjs snapshots (`Unit.yjsSnapshot`) from inline DynamoDB fields to S3 objects. This removes the 400KB DynamoDB item size limit, shrinks subscription payloads, separates draft from published content, and enables version history on publish.

## S3 Path Convention

```
private/{identityId}/units/{unitId}/draft.json        ← Current draft (owner-only)
private/{identityId}/units/{unitId}/yjs-snapshot.bin  ← Yjs Y.Doc state (owner-only)
private/{identityId}/units/{unitId}/history/v{N}.json ← Snapshot at publish time (owner-only)
protected/{identityId}/units/{unitId}/published.json  ← Published (all authenticated can read)
```

**Access model**:
- **`private/{entity_id}/*`**: Only the owner (instructor) can read/write. Drafts, Yjs state, and version history are invisible to learners and other instructors.
- **`protected/{entity_id}/*`**: Owner can read/write/delete. All authenticated users can read. Published content is accessible to any signed-in learner.

The `identityId` is already stored on the `Unit` model (`Unit.identityId`). This is the Cognito identity pool ID — the same value used for `protected/` and `private/` paths throughout the app.

**Why not `public/`**: Unit content should not be guest-readable. Unpublished drafts must be strictly owner-only. Even published content should require authentication.

**Lambda access**: Lambda functions use IAM role credentials, which have full bucket access regardless of path prefix. No changes needed for Lambda S3 reads.

## Schema Changes

**File**: `amplify/data/resource.ts` — `Unit` model

Add two fields, remove two:

```typescript
// New fields
contentVersion: a.integer(),         // Incremented on every save. Triggers S3 fetch on change.
publishedContentVersion: a.integer(), // contentVersion at time of last publish

// Remove these fields (no migration needed — not deployed yet):
// data: a.json(),          ← DELETE
// yjsSnapshot: a.string(), ← DELETE
```

## S3 Content Utility

**New file**: `src/utils/unitContentStorage.ts`

```typescript
import { uploadData, downloadData } from 'aws-amplify/storage';

/** S3 key helpers — require identityId (from Unit.identityId) */
function draftKey(identityId: string, unitId: string): string {
  return `private/${identityId}/units/${unitId}/draft.json`;
}
function publishedKey(identityId: string, unitId: string): string {
  return `protected/${identityId}/units/${unitId}/published.json`;
}
function yjsSnapshotKey(identityId: string, unitId: string): string {
  return `private/${identityId}/units/${unitId}/yjs-snapshot.bin`;
}
function historyKey(identityId: string, unitId: string, version: number): string {
  return `private/${identityId}/units/${unitId}/history/v${version}.json`;
}

/**
 * Save draft content to S3.
 * Called by saveEditorContent in unitContext and useYjsUnit save.
 */
export async function saveDraftContent(
  identityId: string,
  unitId: string,
  content: string,
): Promise<void> {
  await uploadData({
    path: draftKey(identityId, unitId),
    data: content,
    options: { contentType: 'application/json' },
  }).result;
}

/**
 * Save Yjs snapshot to S3 (binary).
 * Called by useYjsUnit debounced save.
 */
export async function saveYjsSnapshot(
  identityId: string,
  unitId: string,
  snapshot: Uint8Array,
): Promise<void> {
  await uploadData({
    path: yjsSnapshotKey(identityId, unitId),
    data: new Blob([snapshot]),
    options: { contentType: 'application/octet-stream' },
  }).result;
}

/**
 * Load Yjs snapshot from S3.
 * Returns null if no snapshot exists.
 */
export async function loadYjsSnapshot(
  identityId: string,
  unitId: string,
): Promise<Uint8Array | null> {
  try {
    const result = await downloadData({ path: yjsSnapshotKey(identityId, unitId) }).result;
    const buffer = await result.body.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null; // File doesn't exist yet
  }
}

/**
 * Publish: copy current draft to published key + history snapshot.
 * Returns the new contentVersion used for the history key.
 */
export async function publishContent(
  identityId: string,
  unitId: string,
  contentVersion: number,
): Promise<void> {
  // Read current draft (owner reads from private/)
  const draftResult = await downloadData({ path: draftKey(identityId, unitId) }).result;
  const draftContent = await draftResult.body.text();

  // Write to protected/ (published) and private/ (history) in parallel
  await Promise.all([
    uploadData({
      path: publishedKey(identityId, unitId),
      data: draftContent,
      options: { contentType: 'application/json' },
    }).result,
    uploadData({
      path: historyKey(identityId, unitId, contentVersion),
      data: draftContent,
      options: { contentType: 'application/json' },
    }).result,
  ]);
}

/**
 * Load content from S3.
 * Instructors load draft (private/), learners load published (protected/).
 */
export async function loadContent(
  identityId: string,
  unitId: string,
  variant: 'draft' | 'published',
): Promise<string | null> {
  const path = variant === 'draft'
    ? draftKey(identityId, unitId)       // private/ — only owner can read
    : publishedKey(identityId, unitId);  // protected/ — all authenticated can read
  try {
    const result = await downloadData({ path }).result;
    return await result.body.text();
  } catch {
    return null;
  }
}

/**
 * Load a specific historical version.
 */
export async function loadHistoryVersion(
  identityId: string,
  unitId: string,
  version: number,
): Promise<string | null> {
  try {
    const result = await downloadData({
      path: historyKey(identityId, unitId, version),
    }).result;
    return await result.body.text();
  } catch {
    return null;
  }
}

/**
 * Restore a historical version to draft.
 * Does NOT publish — instructor must explicitly publish after reviewing.
 */
export async function restoreVersion(
  identityId: string,
  unitId: string,
  version: number,
): Promise<boolean> {
  const content = await loadHistoryVersion(identityId, unitId, version);
  if (!content) return false;
  await saveDraftContent(identityId, unitId, content);
  return true;
}
```

## unitContext.jsx Changes

### `saveEditorContent` — Write to S3 instead of DynamoDB

**Before**:
```javascript
const { data: savedUnit, errors } = await client.models.Unit.update({
  id: currentUnit.id,
  data: newContent,
  _version: currentUnit._version,
});
```

**After**:
```javascript
import { saveDraftContent } from '../utils/unitContentStorage';

// 1. Upload content to S3 (private — owner only)
await saveDraftContent(currentUnit.identityId, currentUnit.id, newContent);

// 2. Bump contentVersion in DynamoDB (no content payload)
const nextContentVersion = (currentUnit.contentVersion || 0) + 1;
const { data: savedUnit, errors } = await client.models.Unit.update({
  id: currentUnit.id,
  contentVersion: nextContentVersion,
  _version: currentUnit._version,
});

// 3. Update local ref
if (savedUnit) {
  unitRef.current = {
    ...unitRef.current,
    _version: savedUnit._version,
    contentVersion: nextContentVersion,
  };
}
```

### `handleStatusChange("PUBLISHED")` — Copy draft to published + history

**After existing status update, add**:
```javascript
import { publishContent } from '../utils/unitContentStorage';

if (status === 'PUBLISHED') {
  const currentVersion = currentUnit.contentVersion || 1;
  await publishContent(currentUnit.identityId, currentUnit.id, currentVersion);

  // Also update publishedContentVersion + publishedAt in DynamoDB
  await client.models.Unit.update({
    id: currentUnit.id,
    publishedContentVersion: currentVersion,
    publishedAt: Date.now(),
    _version: savedUnit._version, // Use version from status update
  });
}
```

### Subscription — Detect `contentVersion` change → fetch from S3

**In the `onUpdate` / `loadUnit` handler**, add before dispatching:

```javascript
import { loadContent } from '../utils/unitContentStorage';

async function loadUnit(unitRecord) {
  // Skip if version hasn't changed (existing logic)
  if (unitRecord._version <= versionRef.current) return;

  // Detect content version change — fetch from S3
  const prevContentVersion = unitRef.current?.contentVersion || 0;
  if (unitRecord.contentVersion > prevContentVersion) {
    const isInstructor = /* existing role check */ session?.groups?.includes('Instructors');
    const variant = isInstructor ? 'draft' : 'published';
    const s3Content = await loadContent(unitRecord.identityId, unitRecord.id, variant);
    if (s3Content) {
      unitRecord = { ...unitRecord, data: s3Content };
    }
  }

  // Continue with existing dispatch logic...
}
```

### Initial load

In the initial `client.models.Unit.get({ id })` handler:

```javascript
const { data: unitRecord } = await client.models.Unit.get({ id });

// Always load content from S3
const isInstructor = /* role check */;
const variant = isInstructor ? 'draft' : 'published';
const s3Content = await loadContent(unitRecord.identityId, unitRecord.id, variant);
unitRecord.data = s3Content;
```

## useYjsUnit.ts Changes

### Save — write snapshot to S3 instead of DynamoDB

**Before**:
```typescript
await client.models.Unit.update({
  id: unitId,
  data: JSON.stringify({ content: editorContent }),
  yjsSnapshot: yjsSnapshot,   // base64 string in DynamoDB
  _version: nextVersionRef.current,
});
```

**After**:
```typescript
import { saveDraftContent, saveYjsSnapshot } from '../utils/unitContentStorage';

// Upload content + snapshot to S3 in parallel (private — owner only)
await Promise.all([
  saveDraftContent(unit.identityId, unitId, JSON.stringify({ content: editorContent })),
  saveYjsSnapshot(unit.identityId, unitId, Y.encodeStateAsUpdate(provider.getDoc())),
]);

// Bump contentVersion in DynamoDB (lightweight)
const nextContentVersion = (currentVersionRef.current || 0) + 1;
await client.models.Unit.update({
  id: unitId,
  contentVersion: nextContentVersion,
  _version: nextVersionRef.current,
});
```

### Load — read snapshot from S3

**Before**:
```typescript
const yjsBytes = Buffer.from(unit.yjsSnapshot, 'base64');
Y.applyUpdate(provider.getDoc(), yjsBytes);
```

**After**:
```typescript
import { loadYjsSnapshot } from '../utils/unitContentStorage';

// Load from S3
const yjsBytes = await loadYjsSnapshot(unit.identityId, unitId);

if (yjsBytes) {
  Y.applyUpdate(provider.getDoc(), yjsBytes);
}
```

## DataPlugin.tsx — Fallback Load

No structural change. The fallback path reads `unit.data` from the unit record. Since `unitContext` now overlays S3 content onto `unit.data` before dispatching, DataPlugin works unchanged.

## Lambda Functions

### `amplify/functions/generatePracticeDrill/handler.ts`

Currently reads `unit.data` from GraphQL query result. After migration, `unit.data` in DynamoDB will be empty/stale for migrated units.

**Two options** (recommended: option A):

**A. Lambda reads from S3 directly**:
```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const bucketName = process.env.STORAGE_BUCKET_NAME; // Set in function resource

/**
 * Read published unit content from S3.
 * Requires identityId from Unit record to construct the protected/ path.
 * Lambda IAM role has full bucket access — no path prefix restrictions.
 */
async function getUnitContent(identityId: string, unitId: string): Promise<string | null> {
  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: `protected/${identityId}/units/${unitId}/published.json`,
    }));
    return await response.Body?.transformToString() ?? null;
  } catch {
    return null; // Fall back to unit.data
  }
}

// Usage: query unit first to get identityId, then fetch content
const unit = /* from GraphQL query */;
const content = await getUnitContent(unit.identityId, unit.id);
```

**B. Create a custom query** that resolves S3 content server-side. More complex, not recommended.

### `amplify/functions/gamification/handler.ts`

Same pattern — always read published content from S3.

### Lambda Environment Variable

Add `STORAGE_BUCKET_NAME` to Lambda function definitions in `amplify/functions/*/resource.ts`:

```typescript
import { storage } from '../../storage/resource';

export const myFunction = defineFunction({
  environment: {
    STORAGE_BUCKET_NAME: storage.bucketName,
  },
});
```

Grant S3 read access in the function's resource definition.

## Other Consumers

| Consumer | Change Needed |
|----------|---------------|
| `Editor3/index.tsx` | None — reads `unit.data` from context (already overlaid by unitContext) |
| `NarrativeReader.tsx` | None — receives `contentJson` prop from parent, which reads from context |
| `GradeActions.tsx` | None — reads `unit.data` from context |
| `app/api/chat/route.ts` | Needs update — fetch content from S3 |
| `src/offline/prefetchAssignment.ts` | Needs update — download S3 content for offline cache |

## Migration (Required)

No migration needed — the app is not yet deployed to production. Simply remove the `data` and `yjsSnapshot` fields from the schema and deploy.

### Deployment Order

1. Deploy all changes together (schema + code) in a single push

## Sequence Diagrams

### Instructor Saves (Draft)

```
Instructor → Editor → saveEditorContent()
  │
  ├─ S3 PUT: private/{identityId}/units/{id}/draft.json  (owner only)
  │
  └─ DynamoDB UPDATE: { contentVersion: N+1 }  (metadata only)
       │
       └─ Subscription fires to all clients
            │
            └─ Each client: contentVersion changed?
                 ├─ YES (instructor) → S3 GET private/.../draft.json
                 ├─ YES (learner)    → S3 GET protected/.../published.json
                 └─ NO  → skip (metadata-only change)
```

### Instructor Publishes

```
Instructor → handleStatusChange("PUBLISHED")
  │
  ├─ DynamoDB UPDATE: { status: "PUBLISHED" }
  │
  ├─ S3 COPY: private/.../draft.json → protected/.../published.json
  │
  ├─ S3 PUT: private/.../history/v{N}.json  (snapshot, owner only)
  │
  └─ DynamoDB UPDATE: { publishedContentVersion: N, publishedAt: now }
```

### Learner Opens Workbook

```
Learner → UnitProvider → Unit.get({ id })
  │
  ├─ S3 GET protected/{identityId}/units/{id}/published.json
  │
  └─ Subscribe to Unit.onUpdate
       └─ On contentVersion bump → S3 GET protected/.../published.json → refresh editor
```

### Yjs Collaborative Save

```
Y.Doc change → useYjsUnit debounced save (5s)
  │
  ├─ S3 PUT: private/{identityId}/units/{id}/draft.json
  ├─ S3 PUT: private/{identityId}/units/{id}/yjs-snapshot.bin
  │
  └─ DynamoDB UPDATE: { contentVersion: N+1 }  (triggers subscription)
```

## Performance Impact

| Operation | Before (DynamoDB inline) | After (S3) | Delta |
|-----------|------------------------|------------|-------|
| Unit list query | Heavy (all JSON) | Light (metadata only) | **Faster** |
| Single unit open | 1 round-trip | 1 DynamoDB + 1 S3 GET (~100ms) | +100ms |
| Save | 1 DynamoDB write | 1 S3 PUT + 1 DynamoDB write | +50ms |
| Subscription payload | Full JSON per subscriber | Metadata only → S3 fetch on demand | **Much smaller** |
| Max content size | 400KB (DynamoDB limit) | 5TB (S3 limit) | **Unlimited** |
| Yjs snapshot storage | base64 in DynamoDB (~33% overhead) | Binary in S3 (native) | **25% smaller** |

## Implementation Order

1. `amplify/data/resource.ts` — remove `data`/`yjsSnapshot`, add `contentVersion`/`publishedContentVersion`
2. `src/utils/unitContentStorage.ts` — new S3 utility
3. `src/context/unitContext.jsx` — save, publish, load, subscribe via S3
4. `src/hooks/useYjsUnit.ts` — save + load via S3
5. Lambda functions — read content from S3
6. `app/api/chat/route.ts` + `src/offline/prefetchAssignment.ts` — consumer updates
7. Build verification

## Files Changed

| File | Type | Change |
|------|------|--------|
| `src/utils/unitContentStorage.ts` | **New** | S3 read/write/publish utility |
| `amplify/data/resource.ts` | Schema | Remove `data`/`yjsSnapshot`, add `contentVersion`/`publishedContentVersion` |
| `src/context/unitContext.jsx` | Core | Save to S3, load from S3, subscription version detection |
| `src/hooks/useYjsUnit.ts` | Core | Save/load Yjs snapshot via S3 |
| `amplify/functions/generatePracticeDrill/handler.ts` | Lambda | Read published content from S3 |
| `amplify/functions/gamification/handler.ts` | Lambda | Read published content from S3 |
| `app/api/chat/route.ts` | API | Read content from S3 for AI context |
| `src/offline/prefetchAssignment.ts` | Utility | Download S3 content for offline cache |
