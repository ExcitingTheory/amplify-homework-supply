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
  const draftKey = `private/${identityId}/units/${unitId}/draft.json`;
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

  // 6. Update Unit.publishedContentVersion + publishedAt in DynamoDB
  const { errors: updateErrors } = (await client.graphql({
    query: UPDATE_UNIT,
    variables: {
      input: {
        id: unitId,
        publishedContentVersion: newContentVersion,
        publishedAt: Date.now(),
        _version,
      },
    },
  } as any)) as any;

  if (updateErrors?.length) {
    console.error("[publishUnit] Unit update errors:", updateErrors);
    // Non-fatal: published.json was written successfully
  }

  console.log(
    "[publishUnit] Completed publish for unitId:",
    unitId,
    "version:",
    newContentVersion,
  );
  return { success: true, unitId, publishedContentVersion: newContentVersion };
};
