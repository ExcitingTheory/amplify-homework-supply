import { createReadStream } from "node:fs";
import { copyFile, lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import {
  hashFile, MANIFEST_LIMIT, modelLanguage, modelPrefix, parseModelManifest, releaseName,
  RESOURCES_VERSION, sha256, STANZA_VERSION, type ModelFile, type ModelManifest,
} from "../amplify/functions/nativeVocabulary/modelAssets.js";
import { NATIVE_LANGUAGES, type VocabularyLanguage } from "../amplify/functions/nativeVocabulary/protocol.js";

async function filesUnder(directory: string, prefix = ""): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) paths.push(...await filesUnder(join(directory, entry.name), `${path}/`));
    else if (entry.isFile()) paths.push(path);
    else throw new Error("Model source contains a symlink or special file");
  }
  return paths;
}

export async function packageModels(source: string, output: string) {
  const catalog: Record<string, string> = {};
  for (const language of NATIVE_LANGUAGES) {
    const directory = join(output, releaseName(language));
    await mkdir(directory, { recursive: true });
    const paths = ["resources.json", ...(await filesUnder(join(source, modelLanguage(language))))
      .map((path) => `${modelLanguage(language)}/${path}`)].sort();
    const files: ModelFile[] = [];
    for (const path of paths) {
      const info = await hashFile(join(source, path));
      files.push({ ...info, path });
    }
    const manifest: ModelManifest = {
      formatVersion: 1, release: releaseName(language), language,
      stanzaVersion: STANZA_VERSION, resourcesVersion: RESOURCES_VERSION, files,
    };
    const bytes = JSON.stringify(manifest, null, 2) + "\n";
    catalog[language] = sha256(bytes);
    parseModelManifest(Buffer.from(bytes), language, catalog[language]);
    // Local packages are immutable too: do not replace an already prepared release.
    try {
      const existing = await readFile(join(directory, "manifest.json"));
      if (sha256(existing) !== catalog[language]) throw new Error(`Local release ${language} already differs`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    for (const file of files) {
      try {
        const existing = await hashFile(join(directory, file.path));
        if (existing.bytes !== file.bytes || existing.sha256 !== file.sha256) {
          throw new Error(`Local release asset already differs: ${file.path}`);
        }
        continue;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      await mkdir(join(directory, file.path, ".."), { recursive: true });
      await copyFile(join(source, file.path), join(directory, file.path));
    }
    await writeFile(join(directory, "manifest.json"), bytes);
  }
  return catalog;
}

const missing = (error: unknown) =>
  (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404;

export function resolveModelStorage(outputs: unknown, bucket?: string) {
  if (!outputs || typeof outputs !== "object" || !("storage" in outputs) ||
      !outputs.storage || typeof outputs.storage !== "object") {
    throw new Error("Amplify outputs are missing storage configuration");
  }
  const storage = outputs.storage;
  const resolvedBucket = bucket ?? ("bucket_name" in storage ? storage.bucket_name : undefined);
  const region = "aws_region" in storage ? storage.aws_region : undefined;
  if (typeof resolvedBucket !== "string" || !resolvedBucket.trim() ||
      typeof region !== "string" || !region.trim()) {
    throw new Error("Amplify storage requires bucket_name and aws_region");
  }
  return { bucket: resolvedBucket, region };
}

async function sameObject(s3: Pick<S3Client, "send">, Bucket: string, Key: string, file: ModelFile) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key, ChecksumMode: "ENABLED" }));
    if (head.ContentLength !== file.bytes) throw new Error(`Immutable S3 release differs: ${Key}`);
    const expected = Buffer.from(file.sha256, "hex").toString("base64");
    if (head.ChecksumSHA256 === expected) return true;
    const { Body } = await s3.send(new GetObjectCommand({ Bucket, Key }));
    if (!Body) throw new Error(`Missing S3 body: ${Key}`);
    let bytes = 0;
    const hash = createHash("sha256");
    for await (const chunk of Body as AsyncIterable<Uint8Array>) {
      bytes += chunk.length;
      if (bytes > file.bytes) {
        (Body as unknown as { destroy(): void }).destroy();
        throw new Error(`Immutable S3 release differs: ${Key}`);
      }
      hash.update(chunk);
    }
    if (bytes !== file.bytes || hash.digest("hex") !== file.sha256) {
      throw new Error(`Immutable S3 release differs: ${Key}`);
    }
    return true;
  } catch (error) {
    if (missing(error)) return false;
    throw error;
  }
}

export async function publishModels(
  s3: Pick<S3Client, "send">, bucket: string, source: string,
  catalog: Record<string, string>,
) {
  for (const language of NATIVE_LANGUAGES) {
    const directory = join(source, releaseName(language));
    const manifestPath = join(directory, "manifest.json");
    if ((await lstat(manifestPath)).size > MANIFEST_LIMIT) throw new Error("Manifest too large");
    const bytes = await readFile(manifestPath);
    const manifest = parseModelManifest(bytes, language, catalog[language]);
    const manifestFile = { path: "manifest.json", bytes: bytes.length, sha256: sha256(bytes) };
    // Detect a conflicting published release before sending any of its assets.
    await sameObject(s3, bucket, modelPrefix(language) + "manifest.json", manifestFile);
    for (const file of [...manifest.files, manifestFile]) {
      const path = join(directory, file.path);
      const actual = await hashFile(path);
      if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256) throw new Error("Local model checksum mismatch");
      const Key = modelPrefix(language) + file.path;
      if (await sameObject(s3, bucket, Key, file)) continue;
      for (let attempt = 0; ; attempt++) {
        const Body = createReadStream(path);
        try {
          await s3.send(new PutObjectCommand({
            Bucket: bucket, Key, Body, ContentLength: file.bytes, IfNoneMatch: "*",
            ChecksumSHA256: Buffer.from(file.sha256, "hex").toString("base64"),
            ContentType: file.path.endsWith(".json") ? "application/json" : "application/octet-stream",
          }));
          break;
        } catch (error) {
          const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
          if (status === 412 && await sameObject(s3, bucket, Key, file)) break;
          const failure = error as { code?: string; name?: string };
          const retryable = status === 409 || status === 429 || (status !== undefined && status >= 500) ||
            failure.name === "TimeoutError" ||
            ["EPIPE", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"].includes(failure.code ?? "");
          if (retryable && attempt < 3) {
            Body.destroy();
            console.warn(`Retrying ${Key} after ${failure.code ?? failure.name ?? status} (${attempt + 1}/3)`);
            await delay(250 * 2 ** attempt);
            if (await sameObject(s3, bucket, Key, file)) break;
            continue;
          }
          throw error;
        } finally {
          Body.destroy();
        }
      }
    }
    console.info(`Published verified ${modelPrefix(language)} (manifest last)`);
  }
  const Body = Buffer.from(JSON.stringify({
    formatVersion: 1,
    releases: Object.fromEntries(NATIVE_LANGUAGES.map((language) => [
      language, { manifestKey: modelPrefix(language) + "manifest.json", sha256: catalog[language] },
    ])),
  }, null, 2) + "\n");
  await s3.send(new PutObjectCommand({
    Bucket: bucket, Key: "protected/models/live/manifest.json", Body,
    ContentLength: Body.length, ContentType: "application/json",
    CacheControl: "no-cache", ChecksumSHA256: Buffer.from(sha256(Body), "hex").toString("base64"),
  }));
  console.info("Updated protected/models/live/manifest.json; runtime remains pinned.");
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { source: { type: "string" }, output: { type: "string" },
      catalog: { type: "string" }, bucket: { type: "string" }, outputs: { type: "string" },
      "confirm-upload": { type: "boolean" } },
  });
  if (!values.source) throw new Error("--source is required");
  if (positionals[0] === "package") {
    if (!values.output || !values.catalog) throw new Error("package requires --output and --catalog");
    const catalog = await packageModels(resolve(values.source), resolve(values.output));
    await writeFile(values.catalog, JSON.stringify(catalog, null, 2) + "\n");
    console.info("Prepared eight language releases; review and commit catalog pins before deployment.");
  } else if (positionals[0] === "publish") {
    if (!values["confirm-upload"]) throw new Error("publish requires --confirm-upload");
    const storage = resolveModelStorage(JSON.parse(await readFile(
      values.outputs ?? "amplify_outputs.json", "utf8",
    )), values.bucket);
    const catalog = JSON.parse(await readFile(values.catalog ??
      "amplify/functions/nativeVocabulary/modelReleases.json", "utf8")) as Record<VocabularyLanguage, string>;
    await publishModels(new S3Client({ region: storage.region }), storage.bucket, resolve(values.source), catalog);
  } else throw new Error("Expected package or publish");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
