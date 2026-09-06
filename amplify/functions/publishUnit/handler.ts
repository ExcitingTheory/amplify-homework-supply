/**
 * publishUnit Lambda handler
 *
 * Invoked via the `publishUnit(unitId: ID!)` AppSync mutation.
 * Copies audio and image assets to type-scoped paths under protected/units/,
 * rewrites Lexical JSON node paths, and writes published.json.
 *
 * IAM execution role is the only credential used here — Cognito identity
 * credentials are NOT used. This is intentional: the role is granted full
 * GetObject/PutObject/CopyObject on the Amplify S3 bucket by backend.ts.
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromEnv } from "@aws-sdk/credential-providers";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type { Schema } from "../../data/resource";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET = process.env.STORAGE_BUCKET!;

// ─── GraphQL helpers ─────────────────────────────────────────────────────────

const GET_UNIT = /* GraphQL */ `
  query GetUnit($id: ID!) {
    getUnit(id: $id) {
      id
      name
      number
      description
      identityId
      contentVersion
      _version
    }
  }
`;

const UPDATE_UNIT = /* GraphQL */ `
  mutation UpdateUnit($input: UpdateUnitInput!) {
    updateUnit(input: $input) {
      id
      _version
    }
  }
`;

const LIST_ASSIGNMENTS_BY_UNIT = /* GraphQL */ `
  query ListAssignmentsByUnit($unitID: ID!) {
    listAssignments(filter: { unitID: { eq: $unitID } }) {
      items {
        sectionID
      }
    }
  }
`;

const LIST_ASSIGNMENTS_BY_SECTION = /* GraphQL */ `
  query ListAssignmentsBySection($sectionID: ID!) {
    listAssignments(filter: { sectionID: { eq: $sectionID } }) {
      items {
        unitID
        unit {
          id
          name
          number
          summary
          status
          unitWords {
            items {
              wordID
            }
          }
          questionUnits {
            items {
              questionID
            }
          }
          unitFiles {
            items {
              fileID
            }
          }
          unitDocuments {
            items {
              documentID
            }
          }
        }
      }
    }
  }
`;

const UPDATE_SECTION = /* GraphQL */ `
  mutation UpdateSection($input: UpdateSectionInput!) {
    updateSection(input: $input) {
      id
      _version
    }
  }
`;

const GET_SECTION = /* GraphQL */ `
  query GetSection($id: ID!) {
    getSection(id: $id) {
      id
      _version
    }
  }
`;

const LIST_UNIT_WORDS = /* GraphQL */ `
  query ListUnitWords($unitID: ID!) {
    listUnitWords(filter: { unitID: { eq: $unitID } }) {
      items {
        word {
          phrase
          definition
        }
      }
    }
  }
`;

const LIST_QUESTION_UNITS = /* GraphQL */ `
  query ListQuestionUnits($unitID: ID!) {
    listQuestionUnits(filter: { unitID: { eq: $unitID } }) {
      items {
        questionID
      }
    }
  }
`;

const LIST_UNIT_FILES = /* GraphQL */ `
  query ListUnitFiles($unitID: ID!) {
    listUnitFiles(filter: { unitID: { eq: $unitID } }) {
      items {
        fileID
      }
    }
  }
`;

const LIST_UNIT_DOCUMENTS = /* GraphQL */ `
  query ListUnitDocuments($unitID: ID!) {
    listUnitDocuments(filter: { unitID: { eq: $unitID } }) {
      items {
        document {
          id
          filename
          parsedContent {
            items {
              summariesJSON
            }
          }
        }
      }
    }
  }
`;

function getClient() {
  Amplify.configure(
    {
      API: {
        GraphQL: {
          endpoint: process.env.API_ENDPOINT!,
          region: process.env.AWS_REGION!,
          defaultAuthMode: "iam",
        },
      },
    },
    {
      Auth: {
        credentialsProvider: {
          getCredentialsAndIdentityId: async () => ({
            credentials: await fromEnv()(),
          }),
          clearCredentialsAndIdentityId: () => {},
        },
      },
    },
  );
  return generateClient<Schema>({ authMode: "iam" });
}

// ─── S3 helpers ──────────────────────────────────────────────────────────────

async function readS3Object(key: string): Promise<string> {
  const result = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  if (!result.Body) throw new Error(`Empty body for key: ${key}`);
  return result.Body.transformToString("utf-8");
}

async function copyS3Object(sourceKey: string, destKey: string): Promise<void> {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${sourceKey}`,
      Key: destKey,
    }),
  );
}

async function writeS3Object(
  key: string,
  body: string,
  contentType = "application/json",
  cacheControl?: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(cacheControl ? { CacheControl: cacheControl } : {}),
    }),
  );
}

async function listS3Objects(prefix: string): Promise<string[]> {
  const result = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }),
  );
  return (result.Contents || []).map((o) => o.Key!).filter(Boolean);
}

// ─── Summary extraction from Lexical JSON ────────────────────────────────────

interface HeadingInfo {
  level: number; // 1-6 (from h1-h6)
  text: string;
}

/**
 * Extract headings from a Lexical JSON tree to build a structural summary.
 * Returns a concise outline string suitable for AI context.
 */
function extractHeadings(node: any): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  if (!node || typeof node !== "object") return headings;

  if (node.type === "heading" && node.tag) {
    const level = parseInt(node.tag.replace("h", ""), 10) || 1;
    const text = extractTextContent(node);
    if (text.trim()) {
      headings.push({ level, text: text.trim() });
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      headings.push(...extractHeadings(child));
    }
  }

  return headings;
}

/** Recursively extract plain text from a Lexical node */
function extractTextContent(node: any): string {
  if (!node || typeof node !== "object") return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextContent).join("");
  }
  return "";
}

/**
 * Build an enriched summary string from unit metadata, headings, and attached content.
 * Format includes headings hierarchy + vocabulary/question/file/document counts.
 */
function buildUnitSummary(
  name: string,
  description: string | null,
  headings: HeadingInfo[],
  enrichment?: {
    vocabularyCount?: number;
    vocabularyHighlights?: string[];
    questionCount?: number;
    fileCount?: number;
    documentSummaries?: string[];
  },
): string {
  const parts: string[] = [];
  if (description) {
    parts.push(`${name} — ${description}`);
  } else {
    parts.push(name);
  }

  if (headings.length > 0) {
    const indent = "  ";
    for (const h of headings) {
      const prefix = h.level === 1 ? "•" : h.level === 2 ? "  ◦" : "    ▪";
      parts.push(`${indent}${prefix} ${h.text}`);
    }
  }

  if (enrichment) {
    const meta: string[] = [];
    if (enrichment.vocabularyCount && enrichment.vocabularyCount > 0) {
      let vocabLine = `Vocabulary: ${enrichment.vocabularyCount} words`;
      if (
        enrichment.vocabularyHighlights &&
        enrichment.vocabularyHighlights.length > 0
      ) {
        vocabLine += ` (${enrichment.vocabularyHighlights.slice(0, 5).join(", ")}${enrichment.vocabularyHighlights.length > 5 ? ", ..." : ""})`;
      }
      meta.push(vocabLine);
    }
    if (enrichment.questionCount && enrichment.questionCount > 0) {
      meta.push(`Questions: ${enrichment.questionCount} practice questions`);
    }
    if (enrichment.fileCount && enrichment.fileCount > 0) {
      meta.push(`Files: ${enrichment.fileCount}`);
    }
    if (
      enrichment.documentSummaries &&
      enrichment.documentSummaries.length > 0
    ) {
      meta.push(
        `Documents: ${enrichment.documentSummaries.map((s) => `"${s}"`).join(", ")}`,
      );
    }
    if (meta.length > 0) {
      parts.push(meta.join("\n"));
    }
  }

  return parts.join("\n");
}

// ─── Course outline rebuild ──────────────────────────────────────────────────

interface CourseOutlineEntry {
  unitId: string;
  name: string;
  number: number | null;
  summary: string | null;
  vocabularyCount: number | null;
  questionCount: number | null;
  fileCount: number | null;
  documentSummaries: string | null;
}

/**
 * After publishing, rebuild the courseOutline JSON for all sections that
 * include this unit. This gives typeahead full course progression context.
 */
async function rebuildSectionCourseOutlines(
  client: any,
  unitId: string,
): Promise<void> {
  // 1. Find all sections that have an assignment referencing this unit
  const { data: assignmentData } = (await client.graphql({
    query: LIST_ASSIGNMENTS_BY_UNIT,
    variables: { unitID: unitId },
  } as any)) as any;

  const sectionIds = new Set<string>();
  for (const item of assignmentData?.listAssignments?.items ?? []) {
    if (item?.sectionID) sectionIds.add(item.sectionID);
  }

  if (sectionIds.size === 0) {
    console.log(
      "[publishUnit] No sections reference this unit, skipping outline rebuild",
    );
    return;
  }

  // 2. For each section, fetch all assignments with their units
  for (const sectionId of sectionIds) {
    try {
      const { data: sectionAssignments } = (await client.graphql({
        query: LIST_ASSIGNMENTS_BY_SECTION,
        variables: { sectionID: sectionId },
      } as any)) as any;

      const outline: CourseOutlineEntry[] = [];
      for (const assignment of sectionAssignments?.listAssignments?.items ??
        []) {
        const unit = assignment?.unit;
        if (!unit || unit.status !== "PUBLISHED") continue;

        const vocabCount = unit.unitWords?.items?.length ?? 0;
        const questionCount = unit.questionUnits?.items?.length ?? 0;
        const fileCount = unit.unitFiles?.items?.length ?? 0;
        const docCount = unit.unitDocuments?.items?.length ?? 0;

        outline.push({
          unitId: unit.id,
          name: unit.name || "Untitled",
          number: unit.number ?? null,
          summary: unit.summary ?? null,
          vocabularyCount: vocabCount > 0 ? vocabCount : null,
          questionCount: questionCount > 0 ? questionCount : null,
          fileCount: fileCount > 0 ? fileCount : null,
          documentSummaries:
            docCount > 0
              ? `${docCount} document${docCount > 1 ? "s" : ""}`
              : null,
        });
      }

      // Sort by unit number (nulls last)
      outline.sort((a, b) => {
        if (a.number == null && b.number == null) return 0;
        if (a.number == null) return 1;
        if (b.number == null) return -1;
        return a.number - b.number;
      });

      // 3. Get current section _version for optimistic locking
      const { data: sectionData } = (await client.graphql({
        query: GET_SECTION,
        variables: { id: sectionId },
      } as any)) as any;

      const section = sectionData?.getSection;
      if (!section) {
        console.warn("[publishUnit] Section not found:", sectionId);
        continue;
      }

      // 4. Update section courseOutline
      const { errors: sectionErrors } = (await client.graphql({
        query: UPDATE_SECTION,
        variables: {
          input: {
            id: sectionId,
            courseOutline: JSON.stringify(outline),
            _version: section._version,
          },
        },
      } as any)) as any;

      if (sectionErrors?.length) {
        console.error(
          "[publishUnit] Section outline update failed:",
          sectionId,
          sectionErrors,
        );
      } else {
        console.log(
          "[publishUnit] Updated course outline for section:",
          sectionId,
          "entries:",
          outline.length,
        );
      }
    } catch (err) {
      console.error(
        "[publishUnit] Failed to rebuild outline for section:",
        sectionId,
        err,
      );
    }
  }
}

// ─── Section-Wide Search Bundle Rebuild ──────────────────────────────────────

/**
 * Rebuild section-wide search bundles by merging all unit bundles.
 * Loads each unit's search index from S3, merges items, and writes
 * a combined section bundle. Uses linear index strategy for simplicity.
 */
async function rebuildSectionSearchBundles(
  client: any,
  unitId: string,
  identityId: string,
): Promise<void> {
  // Find all sections that reference this unit
  const { data: assignmentData } = (await client.graphql({
    query: LIST_ASSIGNMENTS_BY_UNIT,
    variables: { unitID: unitId },
  } as any)) as any;

  const sectionIds = new Set<string>();
  for (const item of assignmentData?.listAssignments?.items ?? []) {
    if (item?.sectionID) sectionIds.add(item.sectionID);
  }

  if (sectionIds.size === 0) return;

  for (const sectionId of sectionIds) {
    try {
      // Get all unit IDs in this section
      const { data: sectionAssignments } = (await client.graphql({
        query: LIST_ASSIGNMENTS_BY_SECTION,
        variables: { sectionID: sectionId },
      } as any)) as any;

      const unitIds: string[] = [];
      for (const assignment of sectionAssignments?.listAssignments?.items ??
        []) {
        if (assignment?.unitID) unitIds.push(assignment.unitID);
      }

      if (unitIds.length === 0) continue;

      // Load and merge unit bundles
      const mergedItems: any[] = [];
      let dimensions = 384;
      let model = "Xenova/all-MiniLM-L6-v2";

      for (const uid of unitIds) {
        const bundleKey = `protected/${identityId}/search-index/unit/${uid}.json`;
        try {
          const response = await s3.send(
            new GetObjectCommand({ Bucket: BUCKET, Key: bundleKey }),
          );
          const text = await response.Body?.transformToString();
          if (!text) continue;
          const bundle = JSON.parse(text);
          if (bundle.dimensions) dimensions = bundle.dimensions;
          if (bundle.model) model = bundle.model;
          if (Array.isArray(bundle.items)) {
            mergedItems.push(...bundle.items);
          }
        } catch (err: any) {
          if (
            err?.name === "NoSuchKey" ||
            err?.$metadata?.httpStatusCode === 404
          ) {
            continue; // Bundle doesn't exist for this unit yet
          }
          console.warn(
            `[publishUnit] Failed to load bundle for unit ${uid}:`,
            err,
          );
        }
      }

      if (mergedItems.length === 0) continue;

      // Deduplicate by item id
      const seen = new Set<string>();
      const deduped = mergedItems.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      // Build section bundle with linear index
      const sectionBundle = {
        version: 1,
        dimensions,
        model,
        index: { strategy: "linear" },
        items: deduped,
      };

      const sectionBundleKey = `protected/${identityId}/search-index/section/${sectionId}.json`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: sectionBundleKey,
          Body: JSON.stringify(sectionBundle),
          ContentType: "application/json",
        }),
      );

      console.log(
        `[publishUnit] Section search bundle rebuilt: ${sectionId} (${deduped.length} items from ${unitIds.length} units)`,
      );
    } catch (err) {
      console.error(
        `[publishUnit] Failed to rebuild search bundle for section ${sectionId}:`,
        err,
      );
    }
  }

  // Rebuild instructor-wide bundle (merges all unit bundles for this instructor)
  try {
    const allUnitKeys = await listS3Objects(
      `protected/${identityId}/search-index/unit/`,
    );
    if (allUnitKeys.length > 0) {
      const allItems: any[] = [];
      let dimensions = 384;
      let model = "Xenova/all-MiniLM-L6-v2";

      for (const key of allUnitKeys) {
        try {
          const response = await s3.send(
            new GetObjectCommand({ Bucket: BUCKET, Key: key }),
          );
          const text = await response.Body?.transformToString();
          if (!text) continue;
          const bundle = JSON.parse(text);
          if (bundle.dimensions) dimensions = bundle.dimensions;
          if (bundle.model) model = bundle.model;
          if (bundle.items) allItems.push(...bundle.items);
        } catch {
          // skip unreadable bundles
        }
      }

      if (allItems.length > 0) {
        // Deduplicate by item id
        const seen = new Set<string>();
        const deduped = allItems.filter((item: any) => {
          if (!item?.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });

        const instructorBundle = {
          version: 1,
          dimensions,
          model,
          index: { strategy: "linear" as const }, // IVF/HNSW built by rebuildSearchBundle Lambda on admin-reindex
          items: deduped,
        };

        const instructorBundleKey = `private/${identityId}/search-index/instructor.json`;
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: instructorBundleKey,
            Body: JSON.stringify(instructorBundle),
            ContentType: "application/json",
          }),
        );

        console.log(
          `[publishUnit] Instructor search bundle rebuilt: ${deduped.length} items from ${allUnitKeys.length} units`,
        );
      }
    }
  } catch (err) {
    console.error(
      `[publishUnit] Failed to rebuild instructor search bundle:`,
      err,
    );
  }
}

// ─── Lexical JSON node transformation ────────────────────────────────────────

const IMAGE_VARIANTS = ["thumbnail", "small", "medium", "large"] as const;

/**
 * Recursively walk a Lexical JSON node tree and transform media references in-place.
 * Returns the set of S3 copy operations needed (deduplicated by source key).
 */
function transformNodes(
  node: any,
  copies: Map<string, string>, // sourceKey → destKey
): void {
  if (!node || typeof node !== "object") return;

  if (node.type === "image" && node.fileId && node.identityId) {
    // Image node: copy WebP variants to flat type-scoped path
    const { identityId, fileId } = node;
    for (const variant of IMAGE_VARIANTS) {
      const src = `protected/${identityId}/${fileId}/${variant}.webp`;
      const dest = `protected/units/images/${fileId}/${variant}.webp`;
      copies.set(src, dest);
    }
    // Rewrite paths; clear identityId so CDN paths are used by the client
    node.path = `protected/units/images/${fileId}`;
    node.identityId = "";
    // src is a runtime-computed CDN URL — clear it so client recomputes
    node.src = "";
  } else if (node.type === "file-metadata" && node.file?.path) {
    const file = node.file as Record<string, any>;
    const originalPath: string = file.path;
    const fileId: string | undefined = file.id;

    if (!fileId) {
      // No fileId — nothing to transform
    } else if (
      file.type === "VIDEO" ||
      originalPath.includes("hlsOutput") ||
      originalPath.endsWith(".m3u8")
    ) {
      // HLS video — leave S3 path as-is; /api/hls proxy handles auth.
      // The proxy already generates per-request CloudFront signed URLs.
    } else if (
      file.type === "AUDIO" ||
      /\.(mp3|wav|m4a|ogg|aac)$/i.test(originalPath)
    ) {
      // Audio file — copy to flat audio prefix
      const ext = originalPath.split(".").pop() ?? "mp3";
      const destPath = `protected/units/audio/${fileId}.${ext}`;
      copies.set(originalPath, destPath);
      file.path = destPath;
      file.identityId = "";
    }
  }

  // Recurse into children
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      transformNodes(child, copies);
    }
  }
}

// ─── Lambda handler ───────────────────────────────────────────────────────────

export const handler: Handler = async (event) => {
  const args = event.arguments ?? event;
  const unitId: string | undefined = args.unitId;

  if (!unitId) throw new Error("unitId is required");

  console.log("[publishUnit] Starting publish for unitId:", unitId);

  // 1. Fetch unit record from DynamoDB
  const client = getClient();
  const { data: unitData, errors: unitErrors } = (await client.graphql({
    query: GET_UNIT,
    variables: { id: unitId },
  } as any)) as any;

  if (unitErrors?.length || !(unitData as any)?.getUnit) {
    console.error("[publishUnit] Unit not found:", unitErrors);
    throw new Error(`Unit not found: ${unitId}`);
  }

  const unit = (unitData as any).getUnit;
  const { identityId, contentVersion, _version } = unit;

  if (!identityId)
    throw new Error("Unit.identityId is required for publishing");

  // 2. Read draft from S3
  const draftKey = `protected/${identityId}/units/${unitId}/draft.json`;
  let draftJson: string;
  try {
    draftJson = await readS3Object(draftKey);
  } catch (err) {
    // Fall back to DynamoDB data field if S3 draft doesn't exist yet
    console.warn(
      "[publishUnit] Draft not found in S3, will skip media copy:",
      draftKey,
    );
    throw new Error(`Draft not found in S3: ${draftKey}`);
  }

  // 3. Parse and transform Lexical JSON
  const lexical = JSON.parse(draftJson);
  const copies = new Map<string, string>(); // sourceKey → destKey
  transformNodes(lexical?.root ?? lexical, copies);

  // 4. Execute S3 copies (skip if source doesn't exist — e.g. image not yet processed)
  const copyResults = await Promise.allSettled(
    Array.from(copies.entries()).map(async ([src, dest]) => {
      try {
        await copyS3Object(src, dest);
        console.log("[publishUnit] Copied:", src, "→", dest);
      } catch (err: any) {
        // Skip missing variants gracefully (e.g. large.webp for a small image)
        if (err?.Code === "NoSuchKey" || err?.name === "NoSuchKey") {
          console.warn("[publishUnit] Source not found, skipping:", src);
        } else {
          throw err;
        }
      }
    }),
  );

  const copyFailures = copyResults.filter((r) => r.status === "rejected");
  if (copyFailures.length) {
    console.error(
      "[publishUnit] Some copies failed:",
      copyFailures.map((f) => (f as PromiseRejectedResult).reason),
    );
  }

  // 5. Write rewritten Lexical JSON to protected/units/{unitId}/published.json
  const publishedKey = `protected/units/${unitId}/published.json`;
  const newContentVersion = (contentVersion ?? 0) + 1;

  await writeS3Object(
    publishedKey,
    JSON.stringify(lexical),
    "application/json",
    "public, max-age=3600, stale-while-revalidate=300",
  );
  console.log("[publishUnit] Wrote published.json:", publishedKey);

  // Also save a history snapshot
  const historyKey = `private/${identityId}/units/${unitId}/history/v${newContentVersion}.json`;
  await writeS3Object(historyKey, draftJson, "application/json");

  // 6. Extract headings and fetch enrichment data for summary
  const headings = extractHeadings(lexical?.root ?? lexical);

  // Fetch vocabulary, questions, files, and document summaries in parallel
  const [vocabResult, questionsResult, filesResult, docsResult] =
    await Promise.allSettled([
      client.graphql({
        query: LIST_UNIT_WORDS,
        variables: { unitID: unitId },
      } as any),
      client.graphql({
        query: LIST_QUESTION_UNITS,
        variables: { unitID: unitId },
      } as any),
      client.graphql({
        query: LIST_UNIT_FILES,
        variables: { unitID: unitId },
      } as any),
      client.graphql({
        query: LIST_UNIT_DOCUMENTS,
        variables: { unitID: unitId },
      } as any),
    ]);

  // Extract enrichment data from results
  const vocabItems =
    vocabResult.status === "fulfilled"
      ? ((vocabResult.value as any)?.data?.listUnitWords?.items ?? [])
      : [];
  const questionItems =
    questionsResult.status === "fulfilled"
      ? ((questionsResult.value as any)?.data?.listQuestionUnits?.items ?? [])
      : [];
  const fileItems =
    filesResult.status === "fulfilled"
      ? ((filesResult.value as any)?.data?.listUnitFiles?.items ?? [])
      : [];
  const docItems =
    docsResult.status === "fulfilled"
      ? ((docsResult.value as any)?.data?.listUnitDocuments?.items ?? [])
      : [];

  // Extract vocabulary highlights (first 8 phrases)
  const vocabularyHighlights = vocabItems
    .filter((item: any) => item?.word?.phrase)
    .map((item: any) => item.word.phrase)
    .slice(0, 8);

  // Extract document summary titles from ParsedContent
  const documentSummaries: string[] = [];
  for (const docItem of docItems) {
    const doc = docItem?.document;
    if (!doc) continue;
    // Add filename as a document reference
    if (doc.filename)
      documentSummaries.push(doc.filename.replace(/\.[^.]+$/, ""));
    // Also extract summary titles from parsed content
    for (const pc of doc.parsedContent?.items ?? []) {
      if (pc?.summariesJSON) {
        for (const entry of pc.summariesJSON) {
          if (entry?.title && documentSummaries.length < 10) {
            documentSummaries.push(entry.title);
          }
        }
      }
    }
  }

  const summary = buildUnitSummary(
    unit.name || "Untitled",
    unit.description || null,
    headings,
    {
      vocabularyCount: vocabItems.length,
      vocabularyHighlights,
      questionCount: questionItems.length,
      fileCount: fileItems.length,
      documentSummaries:
        documentSummaries.length > 0 ? documentSummaries : undefined,
    },
  );
  console.log(
    "[publishUnit] Generated enriched summary:",
    summary.slice(0, 300),
  );

  // 7. Update Unit: publishedContentVersion, publishedAt, summary
  const { data: updatedUnit, errors: updateErrors } = (await client.graphql({
    query: UPDATE_UNIT,
    variables: {
      input: {
        id: unitId,
        publishedContentVersion: newContentVersion,
        publishedAt: Date.now(),
        summary,
        _version,
      },
    },
  } as any)) as any;

  if (updateErrors?.length) {
    console.error("[publishUnit] Unit update errors:", updateErrors);
    // Non-fatal: published.json was written successfully
  }

  // 8. Rebuild course outline for all sections that include this unit
  try {
    await rebuildSectionCourseOutlines(client, unitId);
  } catch (err) {
    // Non-fatal — outline rebuild is best-effort
    console.error("[publishUnit] Course outline rebuild failed:", err);
  }

  // 9. Rebuild section-wide search bundles (merge all unit bundles per section)
  try {
    await rebuildSectionSearchBundles(client, unitId, identityId);
  } catch (err) {
    // Non-fatal — bundle rebuild is best-effort
    console.error("[publishUnit] Section search bundle rebuild failed:", err);
  }

  console.log(
    "[publishUnit] Completed publish for unitId:",
    unitId,
    "version:",
    newContentVersion,
  );
  return { success: true, unitId, publishedContentVersion: newContentVersion };
};
