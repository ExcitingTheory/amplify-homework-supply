import { uploadData, downloadData, list } from "aws-amplify/storage";
import { extractTextFromLexical } from "./extractTextFromLexical";

/** S3 key helpers — require identityId (from Unit.identityId) */
function draftKey(identityId: string, unitId: string): string {
  return `private/${identityId}/units/${unitId}/draft.json`;
}
/**
 * Phase 6: published content lives under the type-scoped CDN path.
 * identityId is intentionally excluded — the publishUnit Lambda writes here
 * using its IAM execution role (no Cognito identity needed).
 */
function publishedKey(unitId: string): string {
  return `protected/units/${unitId}/published.json`;
}
function yjsSnapshotKey(identityId: string, unitId: string): string {
  return `private/${identityId}/units/${unitId}/yjs-snapshot.bin`;
}
function historyKey(
  identityId: string,
  unitId: string,
  version: number,
): string {
  return `private/${identityId}/units/${unitId}/history/v${version}.json`;
}

function plainTextKey(identityId: string, unitId: string): string {
  return `protected/${identityId}/units/${unitId}/plain.txt`;
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
    options: { contentType: "application/json" },
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
    data: new Blob([new Uint8Array(snapshot)]),
    options: { contentType: "application/octet-stream" },
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
    const path = yjsSnapshotKey(identityId, unitId);
    // Check if the file exists first to avoid 404 console errors
    const { items } = await list({ path });
    if (!items || items.length === 0) return null;

    const result = await downloadData({ path }).result;
    const blob = await result.body.blob();
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null; // File doesn't exist yet or download failed
  }
}

/**
 * Publish: write a history snapshot only.
 *
 * Phase 6: writing to the CDN path (protected/units/{id}/published.json)
 * is handled exclusively by the publishUnit Lambda, which runs under its
 * IAM execution role and also rewrites media paths. Callers in unitContext
 * should call client.mutations.publishUnit({ unitId }) instead.
 *
 * This function is kept for the history-snapshot side-effect and for any
 * callers that haven't been migrated yet.
 */
export async function publishContent(
  identityId: string,
  unitId: string,
  contentVersion: number,
): Promise<void> {
  // Read current draft (owner reads from private/)
  const draftResult = await downloadData({ path: draftKey(identityId, unitId) })
    .result;
  const draftContent = await draftResult.body.text();

  // Only write history snapshot — published.json is written by the publishUnit Lambda
  try {
    await uploadData({
      path: historyKey(identityId, unitId, contentVersion),
      data: draftContent,
      options: { contentType: "application/json" },
    }).result;
  } catch (err) {
    console.error("[unitContentStorage] History snapshot failed:", err);
  }

  // Write plain text for embedding generation and full-text search
  try {
    const plainText = extractTextFromLexical(draftContent);
    if (plainText) {
      await uploadData({
        path: plainTextKey(identityId, unitId),
        data: plainText,
        options: { contentType: "text/plain" },
      }).result;
    }
  } catch (err) {
    console.error("[unitContentStorage] Plain text write failed:", err);
  }
}

/**
 * Load content from S3 / CDN.
 * Instructors load draft (Amplify Storage private/), learners load published
 * directly from CloudFront using the signed cookie issued at login.
 *
 * identityId is still required for the 'draft' variant; it is intentionally
 * unused for 'published' to keep the caller signature stable.
 */
export async function loadContent(
  identityId: string,
  unitId: string,
  variant: "draft" | "published",
): Promise<string | null> {
  if (variant === "draft") {
    try {
      const result = await downloadData({ path: draftKey(identityId, unitId) })
        .result;
      return await result.body.text();
    } catch {
      return null;
    }
  }

  // Phase 6: published content is fetched from CloudFront.
  // The browser automatically sends the CloudFront-Policy / CloudFront-Signature /
  // CloudFront-Key-Pair-Id cookies set by app/providers.tsx at login.
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
  if (!cdnDomain) {
    // Fallback: read via Amplify Storage (no CDN available, e.g. local dev)
    try {
      const result = await downloadData({ path: publishedKey(unitId) }).result;
      return await result.body.text();
    } catch {
      return null;
    }
  }

  try {
    const url = `https://${cdnDomain}/${publishedKey(unitId)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    return await res.text();
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

/**
 * List all version history entries for a unit.
 * Returns version numbers in descending order (newest first).
 */
export async function listVersionHistory(
  identityId: string,
  unitId: string,
): Promise<number[]> {
  try {
    const prefix = `private/${identityId}/units/${unitId}/history/`;
    const result = await list({ path: prefix });
    const versions = result.items
      .map((item) => {
        const match = item.path.match(/\/v(\d+)\.json$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((v): v is number => v != null)
      .sort((a, b) => b - a);
    return versions;
  } catch {
    return [];
  }
}

// Re-export key helpers for server-side usage
export { draftKey, publishedKey, yjsSnapshotKey, historyKey };

// ─── Generic Model Yjs Snapshot Storage ───────────────────────────────────────
// Used by useYjsWord, useYjsQuestion, useYjsFile to store Yjs snapshots in S3
// instead of DynamoDB (same pattern as Unit snapshots above).

type ModelType = "words" | "questions" | "files";

function modelSnapshotKey(
  identityId: string,
  modelType: ModelType,
  modelId: string,
): string {
  return `private/${identityId}/${modelType}/${modelId}/yjs-snapshot.bin`;
}

export async function saveModelYjsSnapshot(
  identityId: string,
  modelType: ModelType,
  modelId: string,
  snapshot: Uint8Array,
): Promise<void> {
  await uploadData({
    path: modelSnapshotKey(identityId, modelType, modelId),
    data: new Blob([new Uint8Array(snapshot)]),
    options: { contentType: "application/octet-stream" },
  }).result;
}

export async function loadModelYjsSnapshot(
  identityId: string,
  modelType: ModelType,
  modelId: string,
): Promise<Uint8Array | null> {
  try {
    const path = modelSnapshotKey(identityId, modelType, modelId);
    const { items } = await list({ path });
    if (!items || items.length === 0) return null;

    const result = await downloadData({ path }).result;
    const blob = await result.body.blob();
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/** S3 key for unit thumbnail image */
function thumbnailKey(unitId: string): string {
  return `protected/units/${unitId}/thumbnail.png`;
}

/**
 * Upload a unit thumbnail image (PNG blob) to S3.
 * Returns the S3 key for storing in Unit.thumbnail.
 */
export async function saveThumbnail(
  unitId: string,
  blob: Blob,
): Promise<string> {
  const key = thumbnailKey(unitId);
  await uploadData({
    path: key,
    data: blob,
    options: { contentType: "image/png" },
  }).result;
  return key;
}
