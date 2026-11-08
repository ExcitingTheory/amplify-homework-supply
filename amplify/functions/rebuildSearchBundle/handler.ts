import type { Handler, SQSEvent } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import {
  EMBEDDING_DIMENSIONS,
  IVF_THRESHOLD,
  l2Normalize,
  buildIndex,
  applyItemDelta,
  type BundleItem,
  type DeltaResult,
  type ItemDelta,
  type SearchBundle,
} from "./searchIndex";

const s3 = new S3Client({});
const BUCKET = process.env.AMPLIFY_STORAGE_BUCKET_NAME || "";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

// Singleton embedding pipeline
let embeddingPipeline: any = null;

/** Records a unit uses, taken from its UnitWord / QuestionUnit / UnitFile joins. */
export interface UnitMembers {
  word?: string[];
  question?: string[];
  file?: string[];
}

/** A section that assigns the published unit, with every unit it assigns. */
export interface SectionUnits {
  sectionId: string;
  unitIds: string[];
}

interface LambdaEvent {
  /**
   * "unit-publish" builds the unit's bundle (and its sections' bundles) from
   * `members`. "platform-reindex" rebuilds every instructor bundle plus the
   * platform bundle and needs no identityId (identities come from S3).
   */
  source:
    | "unit-publish"
    | "content-update"
    | "admin-reindex"
    | "platform-reindex";
  identityId?: string;
  unitId?: string;
  unitName?: string;
  members?: UnitMembers;
  sections?: SectionUnits[];
  force?: boolean;
}

export const PLATFORM_BUNDLE_KEY = "admin/search-index/platform.json";

/**
 * Unit and section bundles are keyed by their own id, outside every
 * client-readable storage prefix. Reads go through /api/search-bundle, which
 * checks that the caller is enrolled in (or owns) the unit or section.
 */
export const unitBundleKey = (unitId: string) =>
  `search-index/unit/${unitId}.json`;
export const sectionBundleKey = (sectionId: string) =>
  `search-index/section/${sectionId}.json`;
/**
 * An instructor's bundle covers all of their content and must stay private to
 * them (admins read the platform bundle). It is keyed by identity outside
 * every client-readable prefix and served only to its owner by /api/search-bundle.
 */
export const instructorBundleKey = (identityId: string) =>
  `search-index/instructor/${identityId}.json`;
const REBUILD_LOCK_KEY = "admin/search-index/.rebuild-lock";
// A full rebuild is capped by the Lambda timeout (15 min); a lock older than
// this belongs to a crashed run and may be taken over.
const REBUILD_LOCK_TTL_MS = 20 * 60 * 1000;
const MAX_DELTA_ATTEMPTS = 5;

// --- S3 Helpers ---

async function readS3JSON(key: string): Promise<any | null> {
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    const body = await resp.Body?.transformToString();
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

async function writeS3JSON(key: string, data: any): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    }),
  );
}

const statusOf = (err: any): number | undefined =>
  err?.$metadata?.httpStatusCode;

const isNotFound = (err: any): boolean =>
  err?.name === "NoSuchKey" || err?.name === "NotFound" || statusOf(err) === 404;

/** A conditional write lost to a concurrent writer (412) or in-flight write (409). */
const isWriteConflict = (err: any): boolean =>
  err?.name === "PreconditionFailed" ||
  err?.name === "ConditionalRequestConflict" ||
  statusOf(err) === 412 ||
  statusOf(err) === 409;

/**
 * Reads JSON plus its ETag. Returns null only when the object does not exist;
 * any other failure throws so a transient error is never mistaken for a delete.
 */
async function readS3JSONStrict(
  key: string,
): Promise<{ data: any; etag?: string } | null> {
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    const body = await resp.Body?.transformToString();
    return body ? { data: JSON.parse(body), etag: resp.ETag } : null;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Immediate "folders" under a prefix, e.g. `private/{identityId}/`. */
async function listS3Prefixes(prefix: string): Promise<string[]> {
  const prefixes: string[] = [];
  let continuationToken: string | undefined;
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        Delimiter: "/",
        ContinuationToken: continuationToken,
      }),
    );
    for (const common of resp.CommonPrefixes || []) {
      if (common.Prefix) prefixes.push(common.Prefix);
    }
    continuationToken = resp.NextContinuationToken;
  } while (continuationToken);
  return prefixes;
}

async function listS3Prefix(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of resp.Contents || []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = resp.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

// --- Embedding Generation ---

async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;
  // Loaded lazily: most rebuilds only read stored vectors and never need the model.
  const { pipeline, env } = await import("@huggingface/transformers");
  // Disable local model loading — always fetch from HuggingFace Hub
  env.allowLocalModels = false;
  // /var/task is read-only on Lambda; /tmp is the only writable location.
  env.cacheDir = "/tmp/transformers-cache";
  embeddingPipeline = await pipeline("feature-extraction", EMBEDDING_MODEL, {
    dtype: "q8",
  });
  return embeddingPipeline;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array).slice(0, EMBEDDING_DIMENSIONS);
}

// --- Bundle Assembly ---

const EMBEDDING_ITEM_TYPES = [
  "unit",
  "file",
  "word",
  "question",
  "section",
] as const;

const EMBEDDING_KEY_PATTERN = new RegExp(
  `^private/([^/]+)/embeddings/(${EMBEDDING_ITEM_TYPES.join("|")})/([^/]+)\\.json$`,
);

/**
 * Turns one stored embedding file into bundle items (one per page). Items that
 * only have text (needsEmbedding) get their vector generated and persisted.
 */
async function itemsFromEmbeddingFile(
  key: string,
  embeddingData: any,
  identityId: string,
  type: BundleItem["type"],
  modelId: string,
  unitId?: string,
): Promise<BundleItem[]> {
  const items: BundleItem[] = [];
  for (const page of embeddingData?.pages || []) {
    // Generate embedding on the fly if item only has text (needsEmbedding flag)
    let embedding = page.embedding;
    if (!embedding && page.text && embeddingData.needsEmbedding) {
      embedding = await generateEmbedding(page.text);
      // Update the stored file with the generated embedding
      page.embedding = embedding;
      await writeS3JSON(key, embeddingData);
    }
    if (!embedding) continue; // Skip items with no text or embedding

    items.push({
      id: page.page > 0 ? `${modelId}-p${page.page}` : modelId,
      type,
      title: embeddingData.title || modelId,
      embedding,
      meta: {
        page: page.page > 0 ? page.page : undefined,
        unitId,
        preview: page.text?.substring(0, 100),
        identityId,
      },
    });
  }
  return items;
}

async function loadPerItemEmbeddings(
  identityId: string,
  unitId?: string,
): Promise<BundleItem[]> {
  const items: BundleItem[] = [];
  const prefix = `private/${identityId}/embeddings/`;

  // If unit-scoped, only load embeddings relevant to that unit
  const embeddingKeys = await listS3Prefix(prefix);

  // Read in parallel batches (a platform rebuild reads one S3 object per item)
  // and process each batch before fetching the next to bound memory.
  const readBatchSize = 25;
  for (let i = 0; i < embeddingKeys.length; i += readBatchSize) {
    const batch = embeddingKeys.slice(i, i + readBatchSize);
    const contents = await Promise.all(batch.map((key) => readS3JSON(key)));

    for (let j = 0; j < batch.length; j++) {
      const key = batch[j];
      const embeddingData = contents[j];
      if (!embeddingData?.pages?.length) continue;

      // Parse type and ID from key: private/{id}/embeddings/{type}/{modelId}.json
      const parts = key.replace(prefix, "").split("/");
      if (parts.length < 2) continue;
      items.push(
        ...(await itemsFromEmbeddingFile(
          key,
          embeddingData,
          identityId,
          parts[0] as BundleItem["type"],
          parts[1].replace(".json", ""),
          unitId,
        )),
      );
    }
  }

  return items;
}

const VECTOR_DECIMALS = 1e5;

const roundVector = (vector: number[]) =>
  vector.map((x) => Math.round(x * VECTOR_DECIMALS) / VECTOR_DECIMALS);

/**
 * Normalizes, rounds and indexes items into a bundle. Unit, section,
 * instructor and platform bundles all go through here, so they differ only in
 * which items they hold. Vectors are rounded to 5 decimals (well below cosine
 * ranking noise) because browsers download whole bundles.
 */
function assembleBundle(items: BundleItem[]): SearchBundle {
  const prepared = items.map((item) => ({
    ...item,
    embedding: roundVector(l2Normalize(item.embedding)),
  }));
  return {
    version: Date.now(),
    dimensions: EMBEDDING_DIMENSIONS,
    model: EMBEDDING_MODEL,
    index: buildIndex(prepared.map((item) => item.embedding)),
    items: prepared,
  };
}

/** Concatenated text nodes of a Lexical editor state. */
function lexicalText(node: any): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  const children: any[] = node.children ?? node.root?.children ?? [];
  return children.map(lexicalText).filter(Boolean).join(" ");
}

async function readUnitPlainText(
  identityId: string,
  unitId: string,
): Promise<string> {
  const plain = await readS3Text(
    `protected/${identityId}/units/${unitId}/plain.txt`,
  );
  if (plain?.trim()) return plain;
  // plain.txt is written by the editor client; fall back to the published content.
  const published = await readS3JSON(`protected/units/${unitId}/published.json`);
  return lexicalText(published);
}

const MEMBER_TYPES = ["word", "question", "file"] as const;

/**
 * The published snapshot of one unit: its own text plus only the words,
 * questions and files it uses. Readable by everyone who can use the unit
 * (protected/ is readable by any signed-in user), so it must never hold
 * content from outside the unit.
 */
async function buildUnitBundle({
  identityId,
  unitId,
  unitName,
  members,
}: {
  identityId: string;
  unitId: string;
  unitName?: string;
  members?: UnitMembers;
}): Promise<SearchBundle> {
  const items: BundleItem[] = [];

  const plainText = await readUnitPlainText(identityId, unitId);
  if (plainText.trim()) {
    // Regenerated on every publish so the unit's vector tracks its content.
    const embedding = await generateEmbedding(plainText);
    await writeS3JSON(`private/${identityId}/embeddings/unit/${unitId}.json`, {
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      generatedAt: Date.now(),
      title: unitName,
      wordCount: plainText.split(/\s+/).length,
      pages: [{ page: 0, embedding, text: plainText.substring(0, 200) }],
    });
    items.push({
      id: unitId,
      type: "unit",
      title: unitName || `Unit ${unitId}`,
      embedding,
      meta: { preview: plainText.substring(0, 100), unitId, identityId },
    });
  }

  const readBatchSize = 25;
  for (const type of MEMBER_TYPES) {
    const ids = [...new Set(members?.[type] ?? [])];
    for (let i = 0; i < ids.length; i += readBatchSize) {
      const batch = ids.slice(i, i + readBatchSize);
      const keys = batch.map(
        (id) => `private/${identityId}/embeddings/${type}/${id}.json`,
      );
      const contents = await Promise.all(keys.map((key) => readS3JSON(key)));
      for (let j = 0; j < batch.length; j++) {
        if (!contents[j]?.pages?.length) continue;
        items.push(
          ...(await itemsFromEmbeddingFile(
            keys[j],
            contents[j],
            identityId,
            type,
            batch[j],
            unitId,
          )),
        );
      }
    }
  }

  return assembleBundle(items);
}

/** Merges already-built unit bundles into one searchable bundle per section. */
async function writeSectionBundles(sections: SectionUnits[]): Promise<void> {
  for (const { sectionId, unitIds } of sections) {
    const seen = new Set<string>();
    const items: BundleItem[] = [];
    for (const unitId of new Set(unitIds)) {
      const bundle = await readS3JSON(unitBundleKey(unitId));
      for (const item of bundle?.items ?? []) {
        if (item?.id && !seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }
    if (items.length === 0) continue;

    await writeS3JSON(sectionBundleKey(sectionId), assembleBundle(items));
    console.log(
      `[rebuildSearchBundle] Section bundle: ${sectionId} (${items.length} items from ${unitIds.length} units)`,
    );
  }
}

async function buildInstructorBundle(
  identityId: string,
): Promise<SearchBundle> {
  return assembleBundle(await loadPerItemEmbeddings(identityId));
}

async function readS3Text(key: string): Promise<string | null> {
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    return (await resp.Body?.transformToString()) || null;
  } catch {
    return null;
  }
}

// --- Instructor + Platform Bundles ---

/** Identity folders directly under private/ (legacy folders simply yield no items). */
async function listIdentityIds(): Promise<string[]> {
  const prefixes = await listS3Prefixes("private/");
  return prefixes
    .map((prefix) => prefix.slice("private/".length).replace(/\/$/, ""))
    .filter(Boolean);
}

async function writeInstructorBundle(
  identityId: string,
): Promise<SearchBundle> {
  const bundle = await buildInstructorBundle(identityId);
  await writeS3JSON(
    instructorBundleKey(identityId),
    bundle,
  );
  return bundle;
}

/**
 * The admin-only platform bundle: the same structure as an instructor bundle,
 * covering every instructor.
 */
async function writePlatformBundle(
  instructorItems: BundleItem[],
): Promise<SearchBundle | null> {
  if (instructorItems.length === 0) return null;
  const bundle = assembleBundle(instructorItems);
  await writeS3JSON(PLATFORM_BUNDLE_KEY, bundle);
  return bundle;
}

/**
 * Earlier builds wrote bundles under protected/{identityId}/ (readable by any
 * signed-in user, and filled with all of the instructor's content) and the
 * instructor bundle under private/{identityId}/. Remove them so nothing
 * stays reachable outside /api/search-bundle.
 */
async function purgeLegacyBundles(identityId: string): Promise<void> {
  try {
    const keys = [
      ...(await listS3Prefix(`protected/${identityId}/search-index/`)),
      ...(await listS3Prefix(`private/${identityId}/search-index/`)),
    ];
    for (const key of keys) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    }
    if (keys.length > 0) {
      console.log(
        `[rebuildSearchBundle] Removed ${keys.length} legacy bundle(s) for ${identityId}`,
      );
    }
  } catch (err) {
    console.warn(
      `[rebuildSearchBundle] Legacy bundle cleanup failed for ${identityId}:`,
      err,
    );
  }
}

interface PlatformReindexResult {
  instructors: number;
  failedInstructors: string[];
  items: number;
  bundleSize: number;
  strategy?: string;
}

/**
 * Rebuilds every instructor bundle, then the platform bundle from the freshly
 * built items. One failing identity is logged and skipped so it cannot block
 * the rest of the platform.
 */
export async function rebuildPlatform(): Promise<PlatformReindexResult> {
  const identityIds = await listIdentityIds();
  const allItems: BundleItem[] = [];
  const failedInstructors: string[] = [];
  let instructors = 0;

  for (const identityId of identityIds) {
    await purgeLegacyBundles(identityId);
    try {
      const bundle = await buildInstructorBundle(identityId);
      if (bundle.items.length === 0) continue;
      await writeS3JSON(
        instructorBundleKey(identityId),
        bundle,
      );
      allItems.push(...bundle.items);
      instructors++;
    } catch (err) {
      console.error(
        `[rebuildSearchBundle] Instructor bundle failed for ${identityId}:`,
        err,
      );
      failedInstructors.push(identityId);
    }
  }

  const platform = await writePlatformBundle(allItems);
  console.log(
    `[rebuildSearchBundle] Platform bundle: ${allItems.length} items from ${instructors} instructors (${platform?.index.strategy ?? "none written"})`,
  );

  return {
    instructors,
    failedInstructors,
    items: allItems.length,
    bundleSize: platform ? JSON.stringify(platform).length : 0,
    strategy: platform?.index.strategy,
  };
}

// --- Rebuild lock ---

/**
 * Full rebuilds overwrite bundles wholesale, which would silently discard
 * incremental updates applied while they run. Incremental updates therefore
 * wait (SQS redelivers them) while this lock is held.
 */
async function isRebuildLocked(): Promise<boolean> {
  const lock = await readS3JSONStrict(REBUILD_LOCK_KEY);
  return !!lock && Date.now() - (lock.data?.startedAt ?? 0) < REBUILD_LOCK_TTL_MS;
}

async function acquireRebuildLock(): Promise<void> {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: REBUILD_LOCK_KEY,
        Body: JSON.stringify({ startedAt: Date.now() }),
        ContentType: "application/json",
        IfNoneMatch: "*",
      }),
    );
    return;
  } catch (err) {
    if (!isWriteConflict(err)) throw err;
  }
  if (await isRebuildLocked()) {
    throw new Error("Another search bundle rebuild is already running");
  }
  await writeS3JSON(REBUILD_LOCK_KEY, { startedAt: Date.now() });
}

async function releaseRebuildLock(): Promise<void> {
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: REBUILD_LOCK_KEY }),
    );
  } catch (err) {
    console.warn("[rebuildSearchBundle] Failed to release rebuild lock:", err);
  }
}

async function withRebuildLock<T>(work: () => Promise<T>): Promise<T> {
  await acquireRebuildLock();
  try {
    return await work();
  } finally {
    await releaseRebuildLock();
  }
}

// --- Incremental updates ---

export interface EmbeddingChange {
  identityId: string;
  type: BundleItem["type"];
  itemId: string;
}

const baseItemId = (id: string) => id.replace(/-p\d+$/, "");

/** Distinct embedding-file changes carried by an SQS batch of S3 events. */
export function parseEmbeddingChanges(event: SQSEvent): EmbeddingChange[] {
  const unique = new Map<string, EmbeddingChange>();
  for (const record of event.Records || []) {
    let key: string | undefined;
    try {
      key = JSON.parse(record.body)?.detail?.object?.key;
    } catch {
      continue;
    }
    const match = key?.match(EMBEDDING_KEY_PATTERN);
    if (!match) continue;
    const [, identityId, type, itemId] = match;
    unique.set(`${identityId}/${type}/${itemId}`, {
      identityId,
      type: type as BundleItem["type"],
      itemId,
    });
  }
  return [...unique.values()];
}

/**
 * Reads a bundle, applies `delta`, and writes it back only if nobody else
 * changed it in between (ETag precondition); on a lost race it re-reads and
 * re-applies. A bundle that was never built is skipped: a partial one would be
 * mistaken for the full index.
 */
async function updateBundle(
  key: string,
  buildDelta: () => ItemDelta,
): Promise<DeltaResult | null> {
  for (let attempt = 1; attempt <= MAX_DELTA_ATTEMPTS; attempt++) {
    const existing = await readS3JSONStrict(key);
    if (!existing) return null;

    const result = applyItemDelta(existing.data as SearchBundle, buildDelta());
    if (result.indexAction === "unchanged") return result;

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: JSON.stringify(result.bundle),
          ContentType: "application/json",
          ...(existing.etag ? { IfMatch: existing.etag } : {}),
        }),
      );
      return result;
    } catch (err) {
      if (!isWriteConflict(err) || attempt === MAX_DELTA_ATTEMPTS) throw err;
    }
  }
  return null;
}

export interface DeltaSummary {
  changes: number;
  instructorBundlesUpdated: number;
  platformUpdated: boolean;
}

/**
 * Brings the instructor bundle(s) and the platform bundle in line with a set of
 * changed embedding files. The files' current state decides the outcome: a
 * present file replaces that item's entries, a missing one removes them. This
 * makes the result independent of event order and safe to replay.
 */
export async function applyEmbeddingChanges(
  changes: EmbeddingChange[],
): Promise<DeltaSummary> {
  const summary: DeltaSummary = {
    changes: changes.length,
    instructorBundlesUpdated: 0,
    platformUpdated: false,
  };
  if (changes.length === 0) return summary;

  const byIdentity = new Map<string, EmbeddingChange[]>();
  for (const change of changes) {
    byIdentity.set(change.identityId, [
      ...(byIdentity.get(change.identityId) || []),
      change,
    ]);
  }

  const touches = (item: BundleItem, list: EmbeddingChange[]) =>
    list.some(
      (c) => c.type === item.type && c.itemId === baseItemId(item.id),
    );

  const upsertsByIdentity = new Map<string, BundleItem[]>();
  for (const [identityId, list] of byIdentity) {
    const upserts: BundleItem[] = [];
    for (const change of list) {
      const key = `private/${identityId}/embeddings/${change.type}/${change.itemId}.json`;
      const file = await readS3JSONStrict(key);
      if (!file) continue;
      const items = await itemsFromEmbeddingFile(
        key,
        file.data,
        identityId,
        change.type,
        change.itemId,
      );
      upserts.push(
        ...items.map((item) => ({
          ...item,
          embedding: roundVector(l2Normalize(item.embedding)),
        })),
      );
    }
    upsertsByIdentity.set(identityId, upserts);

    const result = await updateBundle(
      instructorBundleKey(identityId),
      () => ({ isRemoved: (item) => touches(item, list), upserts }),
    );
    if (result) summary.instructorBundlesUpdated++;
  }

  const platformUpserts = [...upsertsByIdentity.values()].flat();
  const platform = await updateBundle(PLATFORM_BUNDLE_KEY, () => ({
    // Bundles built before ownership was recorded fall back to id-only matching.
    isRemoved: (item) =>
      [...byIdentity].some(
        ([identityId, list]) =>
          (item.meta?.identityId ?? identityId) === identityId &&
          touches(item, list),
      ),
    upserts: platformUpserts,
  }));
  summary.platformUpdated = platform !== null;

  console.log(
    `[rebuildSearchBundle] Applied ${changes.length} embedding change(s): ${summary.instructorBundlesUpdated} instructor bundle(s), platform ${platform ? platform.indexAction : "skipped"}`,
  );
  return summary;
}

// --- Handler ---

const isSqsEvent = (event: LambdaEvent | SQSEvent): event is SQSEvent =>
  Array.isArray((event as SQSEvent).Records);

export const handler: Handler<LambdaEvent | SQSEvent> = async (event) => {
  if (!BUCKET) throw new Error("AMPLIFY_STORAGE_BUCKET_NAME not set");

  if (isSqsEvent(event)) {
    // Throwing returns the whole batch to the queue, so changes are retried
    // after the lock clears or the transient failure passes.
    if (await isRebuildLocked()) {
      throw new Error("Full rebuild in progress; retrying embedding changes later");
    }
    await applyEmbeddingChanges(parseEmbeddingChanges(event));
    return { statusCode: 200 };
  }

  const { source, identityId, unitId, force } = event;

  console.log(
    `[rebuildSearchBundle] source=${source} identityId=${identityId} unitId=${unitId || "all"} force=${force}`,
  );

  if (source === "platform-reindex") {
    const result = await withRebuildLock(rebuildPlatform);
    return {
      statusCode: result.failedInstructors.length > 0 ? 207 : 200,
      body: {
        source,
        itemsProcessed: result.items,
        bundleSize: result.bundleSize,
        strategy: result.strategy,
        instructors: result.instructors,
        failedInstructors: result.failedInstructors,
      },
    };
  }

  if (!identityId) {
    throw new Error(`identityId is required for source "${source}"`);
  }

  let itemsProcessed = 0;
  let bundleSize = 0;
  let strategy: string | undefined;

  if (source === "unit-publish") {
    if (!unitId) throw new Error('unitId is required for source "unit-publish"');

    const bundle = await buildUnitBundle({
      identityId,
      unitId,
      unitName: event.unitName,
      members: event.members,
    });
    const bundleKey = unitBundleKey(unitId);
    await writeS3JSON(bundleKey, bundle);
    itemsProcessed = bundle.items.length;
    bundleSize = JSON.stringify(bundle).length;
    strategy = bundle.index.strategy;
    console.log(
      `[rebuildSearchBundle] Unit bundle written: ${bundleKey} (${bundle.items.length} items, ${bundle.index.strategy})`,
    );

    // Sections merge unit bundles, so they are built after this one exists.
    await writeSectionBundles(event.sections ?? []);
  } else if (source === "admin-reindex" || source === "content-update") {
    // Held so incremental updates cannot be overwritten mid-rebuild.
    await withRebuildLock(async () => {
      const bundle = await writeInstructorBundle(identityId);
      itemsProcessed = bundle.items.length;
      bundleSize = JSON.stringify(bundle).length;
      strategy = bundle.index.strategy;
      console.log(
        `[rebuildSearchBundle] Instructor bundle written for ${identityId} (${bundle.items.length} items, ${bundle.index.strategy})`,
      );
    });
  }

  return {
    statusCode: 200,
    body: {
      source,
      identityId,
      itemsProcessed,
      bundleSize,
      strategy,
    },
  };
};
