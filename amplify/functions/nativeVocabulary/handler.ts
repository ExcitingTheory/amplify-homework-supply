import type { Context } from "aws-lambda";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { vocabularyLanguage } from "./protocol.js";
import { runNativeSelection } from "./pythonBridge.js";
import { ensureStanzaModels } from "./modelAssets.js";

const s3 = new S3Client({});
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid native vocabulary manifest");
  return value as Record<string, unknown>;
};

export async function handler(event: { manifestKey: string }, context: Context) {
  const Bucket = process.env.STORAGE_BUCKET;
  if (!Bucket) throw new Error("STORAGE_BUCKET is not configured");
  if (typeof event.manifestKey !== "string" ||
      !/^private\/[^/]+\/documents\/[^/]+\/analysis\/[^/]+\/native-vocabulary\/[^/]+\/manifest\.json$/.test(event.manifestKey)) {
    throw new Error("Invalid native vocabulary artifact key");
  }
  const prefix = event.manifestKey.slice(0, -"manifest.json".length);
  const read = async (Key: string) => {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket, Key }));
    if (!Body) throw new Error("Missing native vocabulary artifact");
    const text = await Body.transformToString();
    if (Buffer.byteLength(text) > 16 * 1024 * 1024) throw new Error("Native vocabulary artifact exceeds byte limit");
    return record(JSON.parse(text));
  };
  const manifest = await read(event.manifestKey);
  const language = vocabularyLanguage(manifest.language);
  if (!Array.isArray(manifest.pages)) throw new Error("Missing native vocabulary source pages");
  const seen = new Set<number>();
  const pages = manifest.pages.map((value: unknown) => {
    const page = record(value);
    if (typeof page.key !== "string" || !page.key.startsWith(prefix) ||
        !Number.isInteger(page.pageNumber) || Number(page.pageNumber) < 1 || seen.has(Number(page.pageNumber))) {
      throw new Error("Invalid native vocabulary page reference");
    }
    seen.add(Number(page.pageNumber));
    return { key: page.key, pageNumber: Number(page.pageNumber) };
  });
  async function* sourcePages() {
    for (const page of pages) {
      const source = await read(page.key);
      if (source.pageNumber !== page.pageNumber || typeof source.text !== "string") {
        throw new Error("Invalid native vocabulary source page");
      }
      yield { pageNumber: Number(page.pageNumber), text: source.text };
    }
  }
  const remainingTime = () => context.getRemainingTimeInMillis() - 15_000;
  if (remainingTime() < 1_000) throw new Error("Insufficient time to start native vocabulary processing");
  const modelDirectory = await ensureStanzaModels(s3, Bucket, language, {
    signal: AbortSignal.timeout(remainingTime()),
  });
  const timeoutMs = remainingTime();
  if (timeoutMs < 1_000) throw new Error("Insufficient time after loading native vocabulary models");
  const result = await runNativeSelection(sourcePages(), language, { timeoutMs, modelDirectory });
  const outputKey = `${prefix}result.json`;
  await s3.send(new PutObjectCommand({
    Bucket, Key: outputKey, Body: JSON.stringify(result), ContentType: "application/json",
    Tagging: "analysis-run=true",
  }));
  console.info(`[nativeVocabulary] Completed ${result.chunks} chunks; ${result.candidates.length} candidates; ${result.splitSentences} oversized sentence splits`);
  return { outputKey };
}
