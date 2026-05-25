"use server";

/**
 * Unit Content Server Actions
 *
 * Server-side access to unit content stored in S3.
 * Used by SSR pages (workbook) that need published content for rendering.
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
  // Fall back to amplify_outputs.json
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
 * Uses IAM role credentials (server-side) — no path prefix restrictions.
 * Falls back to null if content doesn't exist yet.
 */
export async function loadPublishedUnitContent(
  unitId: string,
): Promise<string | null> {
  const client = getServerClient();

  try {
    // Fetch unit metadata to get identityId and check if content exists in S3
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

    // Read published content from S3 using IAM (server-side has full access)
    const key = `protected/${unit.identityId}/units/${unitId}/published.json`;

    const resolvedBucket = getBucketName();
    if (!resolvedBucket) {
      console.warn("[unitContent] STORAGE_BUCKET_NAME not configured");
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
    console.warn("[unitContent] Failed to load published content:", error);
    return null;
  }
}
