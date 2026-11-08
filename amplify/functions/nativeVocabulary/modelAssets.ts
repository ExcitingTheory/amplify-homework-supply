import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { lstat, mkdir, mkdtemp, readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import releases from "./modelReleases.json";
import { vocabularyLanguage, type VocabularyLanguage } from "./protocol.js";

export const STANZA_VERSION = "1.15.0";
export const RESOURCES_VERSION = "1.15.0";
export const MANIFEST_LIMIT = 64 * 1024;
export const MODEL_LIMIT = 768 * 1024 * 1024;
export const releaseName = (language: VocabularyLanguage) => `stanza-${language}-v1`;
export const modelLanguage = (language: VocabularyLanguage) => language === "zh" ? "zh-hans" : language;
export const modelPrefix = (language: VocabularyLanguage) => `protected/models/${releaseName(language)}/`;
export const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

export interface ModelFile { path: string; bytes: number; sha256: string }
export interface ModelManifest {
  formatVersion: 1;
  release: string;
  language: VocabularyLanguage;
  stanzaVersion: string;
  resourcesVersion: string;
  files: ModelFile[];
}

export function parseModelManifest(bytes: Uint8Array, language: VocabularyLanguage, digest: string): ModelManifest {
  vocabularyLanguage(language);
  if (bytes.byteLength > MANIFEST_LIMIT || !/^[a-f0-9]{64}$/.test(digest) || sha256(bytes) !== digest) {
    throw new Error("Stanza model manifest checksum/size mismatch");
  }
  const value = JSON.parse(Buffer.from(bytes).toString("utf8")) as ModelManifest;
  if (!value || value.formatVersion !== 1 || value.release !== releaseName(language) ||
      value.language !== language || value.stanzaVersion !== STANZA_VERSION ||
      value.resourcesVersion !== RESOURCES_VERSION || !Array.isArray(value.files) ||
      value.files.length < 2 || value.files.length > 16) {
    throw new Error("Stanza model manifest version/language mismatch");
  }
  const paths = new Set<string>();
  const pattern = new RegExp(`^${modelLanguage(language)}/(tokenize|mwt|pos|lemma|pretrain)/[a-zA-Z0-9_-]+\\.pt$`);
  let total = 0;
  for (const file of value.files) {
    if (!file || typeof file.path !== "string" ||
        (file.path !== "resources.json" && !pattern.test(file.path)) || paths.has(file.path) ||
        !Number.isSafeInteger(file.bytes) || file.bytes < 1 ||
        !/^[a-f0-9]{64}$/.test(file.sha256)) {
      throw new Error("Invalid Stanza model file entry");
    }
    paths.add(file.path);
    total += file.bytes;
  }
  if (!paths.has("resources.json") || total > MODEL_LIMIT ||
      !["tokenize", "pos", "lemma"].every((processor) =>
        value.files.some((file) => file.path.startsWith(`${modelLanguage(language)}/${processor}/`)))) {
    throw new Error("Incomplete or oversized Stanza model manifest");
  }
  return value;
}

export async function hashFile(path: string): Promise<ModelFile> {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error("Stanza asset is not a regular file");
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    bytes += chunk.length;
    hash.update(chunk);
  }
  return { path, bytes, sha256: hash.digest("hex") };
}

async function verifiedDirectory(directory: string, language: VocabularyLanguage, digest: string) {
  const info = await lstat(join(directory, "manifest.json"));
  if (!info.isFile() || info.isSymbolicLink() || info.size > MANIFEST_LIMIT) {
    throw new Error("Invalid Stanza cached manifest");
  }
  const manifest = parseModelManifest(await readFile(join(directory, "manifest.json")), language, digest);
  for (const file of manifest.files) {
    const actual = await hashFile(join(directory, file.path));
    if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256) {
      throw new Error("Stanza cached model checksum mismatch");
    }
  }
  return directory;
}

/** Downloads are bounded while streaming; only a fully verified directory becomes visible. */
export async function ensureStanzaModels(
  s3: Pick<S3Client, "send">,
  bucket: string,
  language: VocabularyLanguage,
  options: { cacheRoot?: string; signal?: AbortSignal } = {},
): Promise<string> {
  vocabularyLanguage(language);
  const digest = releases[language];
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error("Stanza model release is not pinned");
  const root = options.cacheRoot ?? "/tmp/stanza-models";
  const directory = join(root, `${releaseName(language)}-${digest}`);
  await mkdir(root, { recursive: true });
  let exists = false;
  try {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Invalid Stanza cache directory");
    exists = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (exists) {
    try {
      return await verifiedDirectory(directory, language, digest);
    } catch (error) {
      throw new Error(`Stanza ${language} cached release is corrupt; refusing inference`, { cause: error });
    }
  }
  const staging = await mkdtemp(join(root, `.${releaseName(language)}-`));
  const download = async (path: string, limit: number, expected?: ModelFile) => {
    const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: modelPrefix(language) + path }),
      { abortSignal: options.signal });
    if (!result.Body) throw new Error("Missing Stanza model object body");
    const body = result.Body as Readable;
    if (result.ContentLength !== undefined && result.ContentLength > limit) {
      body.destroy();
      throw new Error("Stanza model object exceeds byte limit");
    }
    let bytes = 0;
    const hash = createHash("sha256");
    const bounded = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > limit) return callback(new Error("Stanza model object exceeds byte limit"));
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    const destination = join(staging, path);
    await mkdir(join(destination, ".."), { recursive: true });
    await pipeline(body, bounded, createWriteStream(destination, { flags: "wx" }), { signal: options.signal });
    if (expected && (bytes !== expected.bytes || hash.digest("hex") !== expected.sha256)) {
      throw new Error("Stanza model file checksum/size mismatch");
    }
  };
  try {
    await download("manifest.json", MANIFEST_LIMIT);
    const manifest = parseModelManifest(await readFile(join(staging, "manifest.json")), language, digest);
    for (const file of manifest.files) await download(file.path, file.bytes, file);
    try {
      await rename(staging, directory);
    } catch (error) {
      if (!["EEXIST", "ENOTEMPTY"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
      await verifiedDirectory(directory, language, digest);
    }
    return directory;
  } catch (error) {
    throw new Error(`Stanza ${language} model release unavailable or invalid`, { cause: error });
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
