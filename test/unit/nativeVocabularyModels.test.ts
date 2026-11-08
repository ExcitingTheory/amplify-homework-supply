// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { Readable } from "node:stream";
import type { S3Client } from "@aws-sdk/client-s3";
import {
  ensureStanzaModels, MANIFEST_LIMIT, MODEL_LIMIT, modelLanguage, modelPrefix,
  parseModelManifest, releaseName, sha256, type ModelManifest,
} from "../../amplify/functions/nativeVocabulary/modelAssets";
import { NATIVE_LANGUAGES } from "../../amplify/functions/nativeVocabulary/protocol";
import { packageModels, publishModels, resolveModelStorage } from "../../scripts/native-vocabulary-models";

const pins = vi.hoisted(() => ({} as Record<string, string>));
vi.mock("../../amplify/functions/nativeVocabulary/modelReleases.json", () => ({ default: pins }));

let root: string;
let manifest: ModelManifest;
let objects: Map<string, Buffer>;
interface FixtureCommand {
  input: { Key: string; Body: AsyncIterable<Uint8Array>; IfNoneMatch?: string };
}
let send: Mock<(command: FixtureCommand) => Promise<Record<string, unknown>>>;
const client = () => ({ send }) as unknown as Pick<S3Client, "send">;
const cache = () => ({ cacheRoot: join(root, "cache") });

beforeEach(async () => {
  await mkdir(".native-vocabulary-models", { recursive: true });
  root = await mkdtemp(resolve(".native-vocabulary-models/test-"));
  manifest = { formatVersion: 1, release: "stanza-es-v1", language: "es",
    stanzaVersion: "1.15.0", resourcesVersion: "1.15.0", files: [] };
  objects = new Map();
  for (const path of ["resources.json", "es/tokenize/test.pt", "es/pos/test.pt", "es/lemma/test.pt"]) {
    const bytes = Buffer.from(`fixture ${path}`);
    objects.set(modelPrefix("es") + path, bytes);
    manifest.files.push({ path, bytes: bytes.length, sha256: sha256(bytes) });
  }
  const bytes = Buffer.from(JSON.stringify(manifest));
  pins.es = sha256(bytes);
  objects.set(modelPrefix("es") + "manifest.json", bytes);
  send = vi.fn(async (command) => {
    const bytes = objects.get(command.input.Key);
    if (!bytes) throw Object.assign(new Error("missing"), { $metadata: { httpStatusCode: 404 } });
    return { Body: Readable.from([bytes]), ContentLength: bytes.length };
  });
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

describe("pinned model manifests", () => {
  it("uses Amplify storage bucket and region with an optional bucket override", () => {
    const outputs = { storage: { bucket_name: "sandbox", aws_region: "us-east-1" } };
    expect(resolveModelStorage(outputs)).toEqual({ bucket: "sandbox", region: "us-east-1" });
    expect(resolveModelStorage(outputs, "other")).toEqual({ bucket: "other", region: "us-east-1" });
    expect(() => resolveModelStorage({})).toThrow("storage");
    expect(() => resolveModelStorage({ storage: { bucket_name: "sandbox" } })).toThrow("aws_region");
  });
  it("maps Chinese resources without changing the configured language or S3 prefix", () => {
    expect(modelLanguage("zh")).toBe("zh-hans");
    expect(modelPrefix("zh")).toBe("protected/models/stanza-zh-v1/");
  });
  it("requires the trusted digest and bounds raw manifest bytes", () => {
    expect(() => parseModelManifest(Buffer.from("{}"), "es", pins.es)).toThrow("checksum");
    expect(() => parseModelManifest(Buffer.alloc(MANIFEST_LIMIT + 1), "es", pins.es)).toThrow("size");
  });
  it.each([
    ["format", (m: ModelManifest) => { m.formatVersion = 2 as 1; }],
    ["release", (m: ModelManifest) => { m.release = "stanza-es-v2"; }],
    ["language", (m: ModelManifest) => { m.language = "fr"; }],
    ["stanza", (m: ModelManifest) => { m.stanzaVersion = "1.14.0"; }],
    ["resources", (m: ModelManifest) => { m.resourcesVersion = "1.14.0"; }],
    ["traversal", (m: ModelManifest) => { m.files[1].path = "../outside.pt"; }],
    ["absolute", (m: ModelManifest) => { m.files[1].path = "/es/tokenize/test.pt"; }],
    ["other language", (m: ModelManifest) => { m.files[1].path = "fr/tokenize/test.pt"; }],
    ["duplicate", (m: ModelManifest) => { m.files.push(m.files[0]); }],
    ["missing resources", (m: ModelManifest) => { m.files.shift(); }],
    ["missing processor", (m: ModelManifest) => { m.files.pop(); }],
    ["negative size", (m: ModelManifest) => { m.files[0].bytes = -1; }],
    ["total size", (m: ModelManifest) => { m.files[0].bytes = MODEL_LIMIT; }],
    ["checksum", (m: ModelManifest) => { m.files[0].sha256 = "bad"; }],
    ["file count", (m: ModelManifest) => { m.files = Array(17).fill(m.files[0]); }],
  ])("rejects malformed %s even with a matching digest", (_name, change) => {
    change(manifest);
    const bytes = Buffer.from(JSON.stringify(manifest));
    expect(() => parseModelManifest(bytes, "es", sha256(bytes))).toThrow();
  });
});

describe("atomic model cache", () => {
  it("downloads only the configured language and re-verifies warm cache without S3", async () => {
    const directory = await ensureStanzaModels(client(), "bucket", "es", cache());
    expect(send).toHaveBeenCalledTimes(5);
    expect(send.mock.calls.every(([command]) => command.input.Key.startsWith(modelPrefix("es")))).toBe(true);
    expect(await ensureStanzaModels(client(), "bucket", "es", cache())).toBe(directory);
    expect(send).toHaveBeenCalledTimes(5);
    await writeFile(join(directory, "es/pos/test.pt"), "corrupted");
    await expect(ensureStanzaModels(client(), "bucket", "es", cache())).rejects.toThrow("corrupt");
  });
  it.each(["missing", "corrupt", "oversized", "interrupted", "manifest"])("rejects %s and removes staging files", async (failure) => {
    const key = modelPrefix("es") + "es/pos/test.pt";
    if (failure === "missing") objects.delete(key);
    if (failure === "corrupt") objects.set(key, Buffer.from("wrong checksum"));
    if (failure === "manifest") objects.set(modelPrefix("es") + "manifest.json", Buffer.from("{}"));
    if (failure === "oversized") send.mockImplementation(async () => ({
      Body: Readable.from([Buffer.alloc(MANIFEST_LIMIT), Buffer.from("x")]),
    }));
    if (failure === "interrupted") send.mockImplementation(async () => ({
      Body: Readable.from((async function* () { yield Buffer.from("{"); throw new Error("interrupted"); })()),
    }));
    await expect(ensureStanzaModels(client(), "bucket", "es", cache())).rejects.toThrow("unavailable or invalid");
    expect(await readdir(cache().cacheRoot)).toEqual([]);
  });
  it("cancels downloads on the invocation deadline", async () => {
    await expect(ensureStanzaModels(client(), "bucket", "es", {
      ...cache(), signal: AbortSignal.abort(),
    })).rejects.toThrow("unavailable or invalid");
    expect(await readdir(cache().cacheRoot)).toEqual([]);
  });
  it("handles concurrent identical cold downloads atomically", async () => {
    const directories = await Promise.all([1, 2].map(() => ensureStanzaModels(client(), "bucket", "es", cache())));
    expect(directories[0]).toBe(directories[1]);
    expect(await readdir(cache().cacheRoot)).toHaveLength(1);
  });
});

describe("model release packaging and publishing", () => {
  async function prepare() {
    const source = join(root, "source");
    await mkdir(source);
    await writeFile(join(source, "resources.json"), "{}");
    for (const language of NATIVE_LANGUAGES) {
      for (const processor of ["tokenize", "pos", "lemma"]) {
        const directory = join(source, modelLanguage(language), processor);
        await mkdir(directory, { recursive: true });
        await writeFile(join(directory, "test.pt"), `${language}-${processor}`);
      }
    }
    const output = join(root, "releases");
    return { source, output, catalog: await packageModels(source, output) };
  }
  function fakePublisher() {
    const stored = new Map<string, Buffer>();
    const writes: string[] = [];
    send = vi.fn(async (command) => {
      const { Key } = command.input;
      const body = stored.get(Key);
      if (command.constructor.name === "HeadObjectCommand") {
        if (!body) throw Object.assign(new Error("missing"), { $metadata: { httpStatusCode: 404 } });
        return { ContentLength: body.length, ChecksumSHA256: Buffer.from(sha256(body), "hex").toString("base64") };
      }
      if (command.constructor.name === "GetObjectCommand") return { Body: Readable.from([body]) };
      if (Key === "protected/models/live/manifest.json") {
        if (!Buffer.isBuffer(command.input.Body)) throw new Error("Live manifest must be a buffer");
        stored.set(Key, command.input.Body);
        writes.push(Key);
        return {};
      }
      expect(command.input.IfNoneMatch).toBe("*");
      if (body) throw Object.assign(new Error("exists"), { $metadata: { httpStatusCode: 412 } });
      const chunks = [];
      for await (const chunk of command.input.Body) chunks.push(chunk);
      stored.set(Key, Buffer.concat(chunks));
      writes.push(Key);
      return {};
    });
    return { stored, writes };
  }
  it("packages deterministically and refuses a different local release", async () => {
    const { source, output, catalog } = await prepare();
    expect(await packageModels(source, output)).toEqual(catalog);
    expect(Object.keys(catalog)).toEqual([...NATIVE_LANGUAGES]);
    await writeFile(join(source, "es/pos/test.pt"), "different");
    await expect(packageModels(source, output)).rejects.toThrow("already differs");
  });
  it("publishes checksummed immutable assets with manifest last and safely retries", async () => {
    const { output, catalog } = await prepare();
    const { writes } = fakePublisher();
    await publishModels(client(), "bucket", output, catalog);
    for (const language of NATIVE_LANGUAGES) {
      expect(writes.filter((key) => key.startsWith(modelPrefix(language))).at(-1))
        .toBe(modelPrefix(language) + "manifest.json");
    }
    const count = writes.length;
    await publishModels(client(), "bucket", output, catalog);
    expect(writes).toHaveLength(count + 1);
    expect(writes.at(-1)).toBe("protected/models/live/manifest.json");
    const liveWrite = send.mock.calls.filter(([command]) =>
      command.input.Key === "protected/models/live/manifest.json").at(-1)![0];
    if (!Buffer.isBuffer(liveWrite.input.Body)) throw new Error("Live manifest must be a buffer");
    expect(JSON.parse(liveWrite.input.Body.toString()).releases.es)
      .toEqual({ manifestKey: modelPrefix("es") + "manifest.json", sha256: catalog.es });
  });
  it("refuses a mismatched published release before uploading files", async () => {
    const { output, catalog } = await prepare();
    const { stored, writes } = fakePublisher();
    stored.set(modelPrefix("es") + "manifest.json", Buffer.from("different release"));
    await expect(publishModels(client(), "bucket", output, catalog)).rejects.toThrow("Immutable S3 release differs");
    expect(writes).toEqual([]);
  });
  it("refuses mismatched assets from an interrupted release without overwriting them", async () => {
    const { output, catalog } = await prepare();
    const { stored } = fakePublisher();
    const key = modelPrefix("es") + "es/lemma/test.pt";
    stored.set(key, Buffer.from("wrong model"));
    await expect(publishModels(client(), "bucket", output, catalog)).rejects.toThrow("Immutable S3 release differs");
    expect(stored.get(key)?.toString()).toBe("wrong model");
    expect(stored.has(modelPrefix("es") + "manifest.json")).toBe(false);
    expect(stored.has("protected/models/live/manifest.json")).toBe(false);
  });
  it("resumes a partial upload without making a manifest visible early", async () => {
    const { output, catalog } = await prepare();
    const { stored } = fakePublisher();
    const implementation = send.getMockImplementation()!;
    let interrupted = false;
    send.mockImplementation(async (command) => {
      if (command.constructor.name === "PutObjectCommand" &&
          command.input.Key.endsWith("resources.json") && !interrupted) {
        interrupted = true;
        throw new Error("upload interrupted");
      }
      return implementation(command);
    });
    await expect(publishModels(client(), "bucket", output, catalog)).rejects.toThrow("upload interrupted");
    expect(stored.has(modelPrefix("es") + "manifest.json")).toBe(false);
    await publishModels(client(), "bucket", output, catalog);
    expect(stored.has(modelPrefix("es") + "manifest.json")).toBe(true);
  });
  it.each([409, 412])("handles a concurrent conditional write (%s) safely", async (status) => {
    const { output, catalog } = await prepare();
    const { stored } = fakePublisher();
    const implementation = send.getMockImplementation()!;
    let conflict = false;
    send.mockImplementation(async (command) => {
      if (command.constructor.name === "PutObjectCommand" && !conflict) {
        conflict = true;
        if (status === 412) await implementation(command);
        throw Object.assign(new Error("conflict"), { $metadata: { httpStatusCode: status } });
      }
      return implementation(command);
    });
    await publishModels(client(), "bucket", output, catalog);
    expect(stored.has(modelPrefix("ar") + "manifest.json")).toBe(true);
  });
  it("recreates a consumed stream after EPIPE and completes publication", async () => {
    const { output, catalog } = await prepare();
    const { stored } = fakePublisher();
    const implementation = send.getMockImplementation()!;
    let failed = false;
    send.mockImplementation(async (command) => {
      if (command.constructor.name === "PutObjectCommand" && !failed) {
        failed = true;
        for await (const chunk of command.input.Body) expect(chunk.length).toBeGreaterThan(0);
        throw Object.assign(new Error("broken pipe"), { code: "EPIPE", name: "TimeoutError" });
      }
      return implementation(command);
    });
    await publishModels(client(), "bucket", output, catalog);
    expect(stored.has("protected/models/live/manifest.json")).toBe(true);
  });
  it("bounds transient retries and never promotes a failed release", async () => {
    const { output, catalog } = await prepare();
    const { stored } = fakePublisher();
    const implementation = send.getMockImplementation()!;
    let attempts = 0;
    send.mockImplementation(async (command) => {
      if (command.constructor.name === "PutObjectCommand") {
        attempts++;
        throw Object.assign(new Error("broken pipe"), { code: "EPIPE" });
      }
      return implementation(command);
    });
    await expect(publishModels(client(), "bucket", output, catalog)).rejects.toThrow("broken pipe");
    expect(attempts).toBe(4);
    expect(stored.has("protected/models/live/manifest.json")).toBe(false);
  });
  it("rejects a tampered local model before uploading it", async () => {
    const { output, catalog } = await prepare();
    fakePublisher();
    await writeFile(join(output, releaseName("es"), "es/lemma/test.pt"), "tampered");
    await expect(publishModels(client(), "bucket", output, catalog)).rejects.toThrow("Local model checksum mismatch");
    expect(await readFile(join(output, releaseName("es"), "manifest.json"))).toBeTruthy();
  });
});
