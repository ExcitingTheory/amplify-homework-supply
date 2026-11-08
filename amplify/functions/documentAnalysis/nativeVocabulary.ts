import { randomUUID } from "node:crypto";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NATIVE_SELECTOR_VERSION, parseCandidates, vocabularyLanguage } from "../nativeVocabulary/protocol.js";
import type { VocabularySourcePage } from "./vocabularySelection.js";

const s3 = new S3Client({});
const lambda = new LambdaClient({
  maxAttempts: 1,
  requestHandler: { connectionTimeout: 10_000, requestTimeout: 850_000 },
});

export function resolveVocabularyLanguage(settings: unknown) {
  const parsed: unknown = typeof settings === "string" ? JSON.parse(settings) : settings;
  return vocabularyLanguage(parsed && typeof parsed === "object" && "vocabularyLanguage" in parsed
    ? parsed.vocabularyLanguage : undefined);
}

export async function selectNativeVocabulary(
  pages: VocabularySourcePage[], language: string, baseKey: string,
) {
  const selectedLanguage = vocabularyLanguage(language);
  const FunctionName = process.env.NATIVE_VOCABULARY_FUNCTION_NAME;
  const Bucket = process.env.STORAGE_BUCKET;
  if (!FunctionName || !Bucket) throw new Error("Native vocabulary Lambda and storage must be configured");
  const prefix = `${baseKey}/native-vocabulary/${randomUUID()}/`;
  const put = async (Key: string, value: unknown) => {
    await s3.send(new PutObjectCommand({
      Bucket, Key, Body: JSON.stringify(value), ContentType: "application/json", Tagging: "analysis-run=true",
    }));
  };
  const references = [];
  for (const [index, page] of pages.entries()) {
    const key = `${prefix}page-${index}.json`;
    await put(key, page);
    references.push({ key, pageNumber: page.pageNumber });
  }
  const manifestKey = `${prefix}manifest.json`;
  await put(manifestKey, { language: selectedLanguage, pages: references });
  const response = await lambda.send(new InvokeCommand({
    FunctionName, Payload: Buffer.from(JSON.stringify({ manifestKey })),
  }));
  if (response.FunctionError || !response.Payload) throw new Error("Native vocabulary Lambda processing failed");
  const result: unknown = JSON.parse(Buffer.from(response.Payload).toString("utf8"));
  if (!result || typeof result !== "object" || !("outputKey" in result) || result.outputKey !== `${prefix}result.json`) {
    throw new Error("Native vocabulary Lambda returned an invalid result reference");
  }
  const { Body } = await s3.send(new GetObjectCommand({ Bucket, Key: result.outputKey }));
  if (!Body) throw new Error("Native vocabulary result artifact is missing");
  const output: unknown = JSON.parse(await Body.transformToString());
  if (!output || typeof output !== "object" || !("version" in output) || output.version !== NATIVE_SELECTOR_VERSION ||
      !("language" in output) || output.language !== selectedLanguage || !("candidates" in output) ||
      !("splitSentences" in output) || !Number.isInteger(output.splitSentences) || Number(output.splitSentences) < 0) {
    throw new Error("Native vocabulary result version or language mismatch");
  }
  const candidates = parseCandidates(output.candidates);
  for (const candidate of candidates) {
    if (!pages.some((page) => page.pageNumber === candidate.page && page.text.includes(candidate.sourceText))) {
      throw new Error("Native vocabulary source quote is not present on its page");
    }
  }
  return {
    candidates,
    reviewWarnings: Number(output.splitSentences) > 0
      ? ["Oversized source sentences were split for native NLP; review vocabulary near chunk boundaries."] : [],
  };
}
