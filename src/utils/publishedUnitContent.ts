/**
 * Server-side loader for published unit content stored in S3.
 *
 * Plain util (NOT a `"use server"` Server Action) so it can be safely called
 * from within a `"use cache"` render path (the workbook SSR HTML cache).
 * Uses IAM role credentials — no request/cookie access — so it is cacheable.
 */

import { getServerClient } from "@/utils/amplifyServerClient";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

function getBucketName(): string | undefined {
  if (process.env.AMPLIFY_STORAGE_BUCKET_NAME) {
    return process.env.AMPLIFY_STORAGE_BUCKET_NAME;
  }
  if (process.env.STORAGE_BUCKET_NAME) {
    return process.env.STORAGE_BUCKET_NAME;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require("../../amplify_outputs.json");
    return outputs?.storage?.bucket_name;
  } catch {
    return undefined;
  }
}

/**
 * Load published unit content from S3 for SSR rendering.
 * Falls back to null if content doesn't exist yet.
 */
export async function loadPublishedUnitContent(
  unitId: string,
): Promise<string | null> {
  const client = getServerClient();

  try {
    const { data: unit } = await (client as any).models.Unit.get(
      { id: unitId },
      {
        selectionSet: [
          "id",
          "identityId",
          "contentVersion",
          "publishedContentVersion",
        ],
      },
    );

    if (!unit?.identityId || !unit.publishedContentVersion) {
      return null;
    }

    const key = `protected/${unit.identityId}/units/${unitId}/published.json`;

    const resolvedBucket = getBucketName();
    if (!resolvedBucket) {
      console.warn("[publishedUnitContent] STORAGE_BUCKET_NAME not configured");
      return null;
    }

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: resolvedBucket,
        Key: key,
      }),
    );

    return (await response.Body?.transformToString()) ?? null;
  } catch (error) {
    console.warn(
      "[publishedUnitContent] Failed to load published content:",
      error,
    );
    return null;
  }
}
