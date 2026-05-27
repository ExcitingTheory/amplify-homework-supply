# S3 Embeddings Storage Spec

## Overview

Move embedding vectors from inline DynamoDB fields (`embedding: EmbeddingInfo`) to S3 objects. This eliminates ~5 KB per model item from subscription payloads and DynamoDB storage, while keeping lightweight metadata in-place for freshness checks.

## Problem

**5 models** currently store embeddings inline in DynamoDB:
- `Unit.embedding` — 512-dim vector (~5 KB JSON)
- `Section.embedding` — 512-dim vector (~5 KB JSON)
- `Question.embedding` — 512-dim vector (~5 KB JSON)
- `File.embedding` — multi-page embeddings (N × 5 KB JSON)
- `Word.embedding` — 512-dim vector (~5 KB JSON)

**Impact**:
- Every `observeQuery` / subscription delivers the full embedding blob to all clients
- Clients never use raw embeddings from subscriptions — they use IndexedDB or in-memory vector stores
- DynamoDB 400 KB limit constrains multi-page document embeddings
- Wasted bandwidth on every model update (name change re-sends entire embedding)

## S3 Path Convention

```
private/{identityId}/embeddings/{modelName}/{modelId}.json
```

Examples:
```
private/{identityId}/embeddings/unit/{unitId}.json
private/{identityId}/embeddings/section/{sectionId}.json
private/{identityId}/embeddings/question/{questionId}.json
private/{identityId}/embeddings/word/{wordId}.json
private/{identityId}/embeddings/file/{fileId}.json        ← may contain multi-page array
```

**Access model**: `private/` — only owner (instructor) can read/write. Embeddings are derived from content the owner created. Learner-side semantic search uses the in-memory vector store built from published content at runtime (already handled by `CourseVectorStore`).

**Lambda access**: IAM role has full bucket access — no prefix restrictions.

## Schema Changes

**File**: `amplify/data/resource.ts`

### Replace `EmbeddingInfo` customType

**Before**:
```typescript
const EmbeddingInfo = a.customType({
  embedding: a.json(),       // ← The large vector array (~5 KB+)
  model: a.string(),
  dimensions: a.integer(),
  version: a.timestamp(),
  wordCount: a.integer(),
});
```

**After**:
```typescript
const EmbeddingInfo = a.customType({
  // Vector data moved to S3 — only metadata remains in DynamoDB
  model: a.string(),
  dimensions: a.integer(),
  version: a.timestamp(),     // Timestamp of last generation — cache key for S3 fetch
  wordCount: a.integer(),
  pageCount: a.integer(),     // Number of page embeddings (for multi-page files)
});
```

Remove `embedding: a.json()` from the custom type. All 5 models continue to use `EmbeddingInfo` — the shape just gets lighter.

### Keep `PageEmbedding` type (for S3 file format)

`PageEmbedding` remains as a type reference for documentation and Lambda return types, but it's no longer stored in DynamoDB.

## S3 Embedding File Format

Each `.json` file in S3 contains:

```json
{
  "model": "text-embedding-3-small",
  "dimensions": 512,
  "generatedAt": 1716600000000,
  "wordCount": 342,
  "pages": [
    {
      "page": 0,
      "embedding": [0.023, -0.041, ...],
      "text": "First 200 chars of source text..."
    }
  ]
}
```

For single-page models (Unit, Section, Word, Question): `pages` array has exactly 1 element.
For File model: `pages` array has N elements (one per parsed page).

## S3 Embedding Utility

**New file**: `src/utils/embeddingStorage.ts`

```typescript
import { uploadData, downloadData } from 'aws-amplify/storage';

type ModelName = 'unit' | 'section' | 'question' | 'word' | 'file';

interface PageEmbedding {
  page: number;
  embedding: number[];
  text?: string;
}

interface EmbeddingFile {
  model: string;
  dimensions: number;
  generatedAt: number;
  wordCount: number;
  pages: PageEmbedding[];
}

function embeddingKey(identityId: string, modelName: ModelName, modelId: string): string {
  return `private/${identityId}/embeddings/${modelName}/${modelId}.json`;
}

/**
 * Save embedding vector(s) to S3.
 * Called after generating embedding via Lambda.
 */
export async function saveEmbedding(
  identityId: string,
  modelName: ModelName,
  modelId: string,
  data: EmbeddingFile,
): Promise<void> {
  await uploadData({
    path: embeddingKey(identityId, modelName, modelId),
    data: JSON.stringify(data),
    options: { contentType: 'application/json' },
  }).result;
}

/**
 * Load embedding from S3.
 * Returns null if not yet generated.
 */
export async function loadEmbedding(
  identityId: string,
  modelName: ModelName,
  modelId: string,
): Promise<EmbeddingFile | null> {
  try {
    const result = await downloadData({
      path: embeddingKey(identityId, modelName, modelId),
    }).result;
    const text = await result.body.text();
    return JSON.parse(text);
  } catch {
    return null; // Not generated yet
  }
}

/**
 * Load just the vectors (no metadata) for vector store population.
 */
export async function loadEmbeddingVectors(
  identityId: string,
  modelName: ModelName,
  modelId: string,
): Promise<number[][] | null> {
  const data = await loadEmbedding(identityId, modelName, modelId);
  if (!data) return null;
  return data.pages.map(p => p.embedding);
}
```

## Frontend Changes

### `src/utils/embeddingGenerator.jsx`

**`generateUnitEmbedding`** — After generating the vector via Lambda:

**Before**:
```javascript
await amplifyClient.models.Unit.update({
  id: unit.id,
  embedding: JSON.stringify(embedding),  // ← 5 KB in DynamoDB
  embeddingVersion: Date.now(),
  embeddingWordCount: extracted.totalWordCount,
});
```

**After**:
```javascript
import { saveEmbedding } from './embeddingStorage';

// 1. Save vector to S3 (private — owner only)
await saveEmbedding(unit.identityId, 'unit', unit.id, {
  model: 'text-embedding-3-small',
  dimensions: 512,
  generatedAt: Date.now(),
  wordCount: extracted.totalWordCount,
  pages: [{ page: 0, embedding, text: extracted.text.substring(0, 200) }],
});

// 2. Update metadata only in DynamoDB (no vector payload)
await amplifyClient.models.Unit.update({
  id: unit.id,
  embedding: {
    model: 'text-embedding-3-small',
    dimensions: 512,
    version: Date.now(),
    wordCount: extracted.totalWordCount,
    pageCount: 1,
  },
  _version: unit._version,
});
```

Same pattern for `generateSectionEmbedding`, `generateWordEmbedding`, `generateQuestionEmbedding`.

### `src/utils/vectorStoreDB.jsx`

`loadEmbeddingsFromS3` already handles loading from S3 — no changes needed. The function downloads, decompresses if needed, and stores in IndexedDB.

### `src/context/fileContext.jsx` / `CourseVectorStore`

When building the vector store for semantic search, load embeddings on-demand from S3 using `loadEmbedding()` instead of reading from the model record's `embedding` field.

### `src/workers/embeddingWorker.js`

No change needed — receives vectors already extracted from IndexedDB/memory.

## Lambda Changes

### `amplify/functions/embeddings/handler.ts`

The `generateEmbeddings` operation currently writes vectors to `ParsedContent.metadata`:

**After**: Also write to S3 and update only metadata in DynamoDB:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const bucket = process.env.STORAGE_BUCKET_NAME;

// After generating embeddings for a file's pages:
const embeddingFile = {
  model: 'text-embedding-3-small',
  dimensions: 512,
  generatedAt: Date.now(),
  wordCount: totalWordCount,
  pages: pageEmbeddings, // [{page, embedding, text}]
};

await s3.send(new PutObjectCommand({
  Bucket: bucket,
  Key: `private/${identityId}/embeddings/file/${fileId}.json`,
  Body: JSON.stringify(embeddingFile),
  ContentType: 'application/json',
}));

// Update File model with metadata only (no vector)
await client.graphql({
  query: UPDATE_FILE,
  variables: {
    input: {
      id: fileId,
      embedding: {
        model: 'text-embedding-3-small',
        dimensions: 512,
        version: Date.now(),
        wordCount: totalWordCount,
        pageCount: pageEmbeddings.length,
      },
      _version: currentVersion,
    },
  },
});
```

### Environment Variable

Add `STORAGE_BUCKET_NAME` to embedding Lambda:
```typescript
import { storage } from '../../storage/resource';

export const embeddingsFunction = defineFunction({
  environment: {
    STORAGE_BUCKET_NAME: storage.bucketName,
  },
});
```

## Migration Strategy

Since embeddings are regenerable (not user content), migration is straightforward:

1. **Deploy schema change** — removes `embedding` field from `EmbeddingInfo`
2. **Existing records** — `embedding.version` timestamp stays; vector is gone from DynamoDB
3. **On-demand regeneration** — when vector store needs an embedding:
   - Check S3 first (by model/id path)
   - If missing → trigger `generateEmbedding` (regenerates from content)
   - Never falls back to DynamoDB `embedding` field (it's removed)
4. **Bulk backfill** (optional) — script to regenerate all embeddings to S3

No user data is lost because embeddings are derived from content that still exists.

## Performance Impact

| Operation | Before (DynamoDB inline) | After (S3) | Delta |
|-----------|------------------------|------------|-------|
| Unit subscription payload | ~5-10 KB per unit | ~200 bytes metadata | **95% smaller** |
| Word list subscription | ~5 KB × N words | ~200 bytes × N | **95% smaller** |
| File subscription (multi-page) | 5 KB × pages | ~200 bytes metadata | **Massive reduction** |
| Semantic search init | Read from model fields | S3 GET (parallel) | +100ms one-time |
| Embedding generation | 1 DDB write (5 KB) | 1 S3 PUT + 1 DDB write (200 B) | +50ms |
| DynamoDB item size | Approaches 400 KB limit | Well under limit | **Removes constraint** |

## Implementation Order

1. `src/utils/embeddingStorage.ts` — new S3 utility
2. `amplify/data/resource.ts` — remove `embedding: a.json()` from `EmbeddingInfo`
3. `src/utils/embeddingGenerator.jsx` — save to S3, update metadata only in DDB
4. `amplify/functions/embeddings/handler.ts` — write to S3
5. `src/context/fileContext.jsx` — load vectors from S3 for vector store
6. `src/utils/vectorStoreDB.jsx` — update `loadEmbeddingsFromS3` path handling if needed
7. Build verification + sandbox deploy

## Relationship to S3 Content Storage

This spec complements [S3_CONTENT_STORAGE_SPEC.md](S3_CONTENT_STORAGE_SPEC.md) (Unit.data → S3). Together they eliminate all large blobs from DynamoDB:

| Field | Size | Spec |
|-------|------|------|
| `Unit.data` (Lexical JSON) | 10-400 KB | S3_CONTENT_STORAGE_SPEC ✅ Done |
| `Unit.yjsSnapshot` (binary) | 10-200 KB | S3_CONTENT_STORAGE_SPEC ✅ Done |
| `*.embedding` (vectors) | 5-50 KB | **This spec** |

After both specs are complete, DynamoDB items are pure metadata (<2 KB typical), subscriptions are lightweight, and the 400 KB limit is irrelevant.
