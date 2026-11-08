import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PARSED_CONTENT_LIST_FIELDS,
  type ParsedContentListField,
} from "../../amplify/functions/shared/parsedContentChunks";

/** Capture output before scoring, without marking it as a validated snapshot. */
export async function saveExtractionRun(
  directory: string,
  sourceSha256: string,
  content: Partial<Record<ParsedContentListField, unknown>>,
): Promise<string> {
  const lists = Object.fromEntries(
    PARSED_CONTENT_LIST_FIELDS.map((field) => {
      const entries = content[field] ?? [];
      if (!Array.isArray(entries)) {
        throw new Error(`Cannot capture extraction: ${field} must be an array`);
      }
      return [field, entries];
    }),
  );
  const capturedAt = new Date().toISOString();
  const path = join(
    directory,
    `${capturedAt.replace(/:/g, "-")}-${randomUUID()}.json`,
  );
  await mkdir(directory, { recursive: true });
  await writeFile(
    path,
    `${JSON.stringify({ sourceSha256, capturedAt, ...lists }, null, 2)}\n`,
    { flag: "wx" },
  );
  return path;
}

/** Replay the latest capture for these source bytes, still subject to the gate. */
export async function loadLatestExtractionRun(
  directory: string,
  sourceSha256: string,
): Promise<{ path: string; text: string } | null> {
  let names: string[];
  try {
    names = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  for (const name of names.filter((name) => name.endsWith(".json")).sort().reverse()) {
    const path = join(directory, name);
    const text = await readFile(path, "utf8");
    const run: unknown = JSON.parse(text);
    if (run === null || typeof run !== "object" || !("sourceSha256" in run)) {
      throw new Error(`Invalid extraction capture: ${path}`);
    }
    if (run.sourceSha256 !== sourceSha256) continue;
    if (
      !PARSED_CONTENT_LIST_FIELDS.every(
        (field) => field in run && Array.isArray(Reflect.get(run, field)),
      )
    ) {
      throw new Error(`Invalid extraction lists in capture: ${path}`);
    }
    return { path, text };
  }
  return null;
}
