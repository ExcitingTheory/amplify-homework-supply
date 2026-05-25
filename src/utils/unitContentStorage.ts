import { uploadData, downloadData, list } from "aws-amplify/storage";

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
function historyKey(
  identityId: string,
  unitId: string,
  version: number,
): string {
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
 * Publish: copy current draft to published key + history snapshot.
 * Returns the new contentVersion used for the history key.
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

  // Write to protected/ (published) and private/ (history) in parallel
  const publishResults = await Promise.allSettled([
    uploadData({
      path: publishedKey(identityId, unitId),
      data: draftContent,
      options: { contentType: "application/json" },
    }).result,
    uploadData({
      path: historyKey(identityId, unitId, contentVersion),
      data: draftContent,
      options: { contentType: "application/json" },
    }).result,
  ]);
  const publishFailures = publishResults.filter((r) => r.status === "rejected");
  if (publishFailures.length > 0) {
    console.error(
      "[unitContentStorage] Publish partially failed:",
      publishFailures.map((f) => (f as PromiseRejectedResult).reason),
    );
  }
}

/**
 * Load content from S3.
 * Instructors load draft (private/), learners load published (protected/).
 */
export async function loadContent(
  identityId: string,
  unitId: string,
  variant: "draft" | "published",
): Promise<string | null> {
  const path =
    variant === "draft"
      ? draftKey(identityId, unitId)
      : publishedKey(identityId, unitId);
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
