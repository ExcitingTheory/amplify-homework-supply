import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

/** Published unit content is type-scoped (no identityId) under protected/. */
export const publishedUnitContentKey = (unitId: string): string =>
  `protected/units/${unitId}/published.json`;

interface UnitContentOptions {
  s3?: Pick<S3Client, "send">;
  bucket?: string;
}

let defaultS3: S3Client | undefined;

/**
 * Read a unit's published Lexical JSON from S3. Returns null when the bucket is
 * not configured or the object cannot be read, so callers can carry on without
 * the content. The Lambda role needs s3:GetObject on the bucket.
 */
export async function readPublishedUnitContent(
  unitId: string,
  options: UnitContentOptions = {},
): Promise<string | null> {
  const bucket = options.bucket ?? process.env.STORAGE_BUCKET;
  if (!bucket) return null;
  const s3 = options.s3 ?? (defaultS3 ??= new S3Client({}));
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: publishedUnitContentKey(unitId) }),
    );
    return (await response.Body?.transformToString()) ?? null;
  } catch {
    return null;
  }
}

/** Text runs of a Lexical document, skipping very short fragments. */
export function extractTextBlocks(lexicalData: any): string[] {
  const texts: string[] = [];
  function walk(node: any) {
    if (node.type === "text" && node.text) texts.push(node.text);
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }
  if (lexicalData?.root) walk(lexicalData.root);
  return texts.filter((text) => text.trim().length > 10);
}

/**
 * Plain text of published unit content, one block per line and cut at a word
 * boundary near maxChars. Returns "" for missing or unparseable content.
 */
export function summarizeUnitText(
  content: string | null | undefined,
  maxChars: number,
): string {
  if (!content) return "";
  let lexical: unknown;
  try {
    lexical = JSON.parse(content);
  } catch {
    return "";
  }
  const text = extractTextBlocks(lexical).join("\n");
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const boundary = cut.lastIndexOf(" ");
  return `${boundary > maxChars * 0.8 ? cut.slice(0, boundary) : cut}…`;
}
