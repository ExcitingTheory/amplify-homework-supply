/**
 * Seed analysis snapshots — save a document's successful analysis and replay it
 * on later seeds so unchanged files are not re-analyzed (slow and billed).
 *
 * One JSON file per seeded file in test/fixtures/seed-analysis/, valid only
 * while the source file's SHA-256 matches. Refresh with SEED_ANALYSIS_MODE=live.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** auto: replay a valid snapshot, else analyze live. live: always analyze and refresh. off: no analysis. */
export type SeedAnalysisMode = "auto" | "live" | "off";

export function resolveSeedAnalysisMode(
  requested: string | undefined,
): SeedAnalysisMode {
  if (requested === undefined || requested === "") return "auto";
  if (requested === "auto" || requested === "live" || requested === "off") {
    return requested;
  }
  throw new Error(
    `Invalid SEED_ANALYSIS_MODE "${requested}"; expected auto, live, or off`,
  );
}

const ANALYZABLE_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".txt",
  ".md",
  ".csv",
  ".rtf",
  ".epub",
  ".imscc",
  ".qti",
  ".gift",
  ".zip",
];

/** Whether the document-analysis pipeline processes a file with this name. */
export function isAnalyzableSeedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ANALYZABLE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export interface AnalysisSnapshot {
  sourceSha256: string;
  capturedAt: string;
  sourceFormat?: string;
  pageCount?: number;
  vocabularyJSON: unknown[];
  summariesJSON: unknown[];
  objectivesJSON: unknown[];
  conceptsJSON: unknown[];
  questionsJSON: unknown[];
  pendingMediaJSON?: unknown[];
}

const LIST_KEYS = [
  "vocabularyJSON",
  "summariesJSON",
  "objectivesJSON",
  "conceptsJSON",
  "questionsJSON",
] as const;

/** A run that produced nothing is not worth replaying. */
export function snapshotHasContent(snapshot: AnalysisSnapshot): boolean {
  return LIST_KEYS.some((key) => snapshot[key].length > 0);
}

export function snapshotFilePath(directory: string, fileName: string): string {
  const safeName = fileName.replace(/[^\w.-]+/g, "_");
  return join(directory, `${safeName}.snapshot.json`);
}

function isSnapshot(value: unknown): value is AnalysisSnapshot {
  if (value === null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sourceSha256 === "string" &&
    LIST_KEYS.every((key) => Array.isArray(record[key])) &&
    (record.pendingMediaJSON === undefined ||
      Array.isArray(record.pendingMediaJSON))
  );
}

/**
 * Read a file's snapshot. Returns null when there is none, when it is not
 * valid, or when it was captured from different source bytes.
 */
export async function loadAnalysisSnapshot(
  directory: string,
  fileName: string,
  sourceSha256: string,
): Promise<AnalysisSnapshot | null> {
  let raw: string;
  try {
    raw = await readFile(snapshotFilePath(directory, fileName), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isSnapshot(parsed) || parsed.sourceSha256 !== sourceSha256) return null;
  return parsed;
}

/** Drop the null entries and null fields AppSync reads return for unset values. */
export function stripNulls<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => stripNulls(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== null && entry !== undefined)
        .map(([key, entry]) => [key, stripNulls(entry)]),
    ) as T;
  }
  return value;
}

/** Save a snapshot; refuses to store an empty analysis. Returns whether it was written. */
export async function saveAnalysisSnapshot(
  directory: string,
  fileName: string,
  snapshot: AnalysisSnapshot,
): Promise<boolean> {
  const cleaned = stripNulls(snapshot);
  const complete: AnalysisSnapshot = {
    ...cleaned,
    vocabularyJSON: cleaned.vocabularyJSON ?? [],
    summariesJSON: cleaned.summariesJSON ?? [],
    objectivesJSON: cleaned.objectivesJSON ?? [],
    conceptsJSON: cleaned.conceptsJSON ?? [],
    questionsJSON: cleaned.questionsJSON ?? [],
  };
  if (!snapshotHasContent(complete)) return false;
  await mkdir(directory, { recursive: true });
  await writeFile(
    snapshotFilePath(directory, fileName),
    `${JSON.stringify(complete, null, 2)}\n`,
  );
  return true;
}
