"use server";

/**
 * Fork Unit Server Action
 *
 * Creates a copy of a published community unit for the current user.
 * Copies unit metadata and S3 content; does NOT copy grades, assignments, or sections.
 */

import { getServerClient } from "@/utils/amplifyServerClient";
import {
  S3Client,
  CopyObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

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

interface ForkUnitResult {
  success: boolean;
  unitId?: string;
  error?: string;
}

/**
 * Fork a published unit — creates an independent copy owned by the current user.
 *
 * @param sourceUnitId - The ID of the published unit to fork
 * @param currentUsername - The authenticated user's username (owner of the fork)
 * @param currentIdentityId - The authenticated user's Cognito identity ID
 */
export async function forkUnit(
  sourceUnitId: string,
  currentUsername: string,
  currentIdentityId: string,
): Promise<ForkUnitResult> {
  if (!sourceUnitId || !currentUsername || !currentIdentityId) {
    return { success: false, error: "Missing required parameters" };
  }

  const client = getServerClient();

  try {
    // 1. Fetch the source unit
    const { data: sourceUnit } = await (client as any).models.Unit.get(
      { id: sourceUnitId },
      {
        selectionSet: [
          "id",
          "name",
          "description",
          "owner",
          "identityId",
          "status",
          "featuredImage",
          "thumbnail",
          "contentVersion",
          "publishedContentVersion",
          "timeLimitSeconds",
          "retryEnabled",
        ],
      },
    );

    if (!sourceUnit) {
      return { success: false, error: "Source unit not found" };
    }

    // Only allow forking published units
    if (sourceUnit.status !== "PUBLISHED") {
      return { success: false, error: "Can only fork published units" };
    }

    // Cannot fork your own unit
    if (sourceUnit.owner === currentUsername) {
      return { success: false, error: "Cannot fork your own unit" };
    }

    // 2. Create the forked unit
    const { data: newUnit, errors } = await (client as any).models.Unit.create({
      name: `Copy of ${sourceUnit.name || "Untitled"}`,
      description: sourceUnit.description || "",
      status: "DRAFT",
      identityId: currentIdentityId,
      timeLimitSeconds: sourceUnit.timeLimitSeconds,
      retryEnabled: sourceUnit.retryEnabled,
    });

    if (errors?.length > 0 || !newUnit) {
      return {
        success: false,
        error: errors?.[0]?.message || "Failed to create forked unit",
      };
    }

    // 3. Copy S3 content if applicable
    const bucketName = getBucketName();
    if (
      bucketName &&
      sourceUnit.identityId &&
      sourceUnit.publishedContentVersion
    ) {
      try {
        // Copy published content JSON
        const sourceKey = `protected/${sourceUnit.identityId}/units/${sourceUnitId}/published/content-v${sourceUnit.publishedContentVersion}.json`;
        const destKey = `protected/${currentIdentityId}/units/${newUnit.id}/drafts/content-v1.json`;

        await s3.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourceKey}`,
            Key: destKey,
          }),
        );

        // Update the new unit's content version
        await (client as any).models.Unit.update({
          id: newUnit.id,
          contentVersion: 1,
          _version: newUnit._version,
        });

        // Copy associated files (images, audio, etc.)
        const filesPrefix = `protected/${sourceUnit.identityId}/units/${sourceUnitId}/files/`;
        const listResponse = await s3.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: filesPrefix,
          }),
        );

        if (listResponse.Contents) {
          for (const obj of listResponse.Contents) {
            if (!obj.Key) continue;
            const fileName = obj.Key.replace(filesPrefix, "");
            const newFileKey = `protected/${currentIdentityId}/units/${newUnit.id}/files/${fileName}`;
            await s3.send(
              new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: `${bucketName}/${obj.Key}`,
                Key: newFileKey,
              }),
            );
          }
        }
      } catch (s3Error) {
        // S3 copy failure is non-fatal — unit was created successfully
        console.error("[forkUnit] S3 copy error:", s3Error);
      }
    }

    return { success: true, unitId: newUnit.id };
  } catch (error) {
    console.error("[forkUnit] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
