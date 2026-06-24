/**
 * Recycle Bin Handler
 *
 * Manages soft delete, restore, permanent delete (archive to S3),
 * and unarchive operations for instructor content models and their join tables.
 *
 * Supported models: Unit, Section, Question, Word, File, Document, AssistantChat
 * Join tables cascade: UnitFile, UnitWord, QuestionUnit, UnitDocument,
 *   QuestionFile, WordFile, QuestionWord, DocumentWord, DocumentQuestion, AssistantChatFile
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { gzipSync, gunzipSync } from "node:zlib";

// ============================================================================
// Configuration
// ============================================================================

const ARCHIVE_PREFIX = "private/archives/";

/**
 * Defines which join tables cascade for each primary model.
 * Key: primary model name
 * Value: array of { joinModel, foreignKey } indicating which join tables
 *        reference this model and should cascade on soft delete/restore/archive.
 */
const CASCADE_MAP: Record<
  string,
  Array<{ joinModel: string; foreignKey: string }>
> = {
  Unit: [
    { joinModel: "UnitFile", foreignKey: "unitID" },
    { joinModel: "UnitWord", foreignKey: "unitID" },
    { joinModel: "QuestionUnit", foreignKey: "unitID" },
    { joinModel: "UnitDocument", foreignKey: "unitID" },
  ],
  File: [
    { joinModel: "UnitFile", foreignKey: "fileID" },
    { joinModel: "WordFile", foreignKey: "fileID" },
    { joinModel: "QuestionFile", foreignKey: "fileID" },
    { joinModel: "AssistantChatFile", foreignKey: "fileID" },
  ],
  Document: [
    { joinModel: "UnitDocument", foreignKey: "documentID" },
    { joinModel: "DocumentWord", foreignKey: "documentID" },
    { joinModel: "DocumentQuestion", foreignKey: "documentID" },
  ],
  Question: [
    { joinModel: "QuestionUnit", foreignKey: "questionID" },
    { joinModel: "QuestionFile", foreignKey: "questionID" },
    { joinModel: "QuestionWord", foreignKey: "questionID" },
    { joinModel: "DocumentQuestion", foreignKey: "questionID" },
  ],
  Word: [
    { joinModel: "UnitWord", foreignKey: "wordID" },
    { joinModel: "WordFile", foreignKey: "wordID" },
    { joinModel: "QuestionWord", foreignKey: "wordID" },
    { joinModel: "DocumentWord", foreignKey: "wordID" },
  ],
  AssistantChat: [{ joinModel: "AssistantChatFile", foreignKey: "chatID" }],
  Section: [],
};

const SUPPORTED_MODELS = Object.keys(CASCADE_MAP);

// ============================================================================
// GraphQL Helpers
// ============================================================================

function getModelQuery(modelName: string): string {
  const lower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return `query Get${modelName}($id: ID!) {
    get${modelName}(id: $id) { id owner _version deletedAt deletedBy createdAt updatedAt }
  }`;
}

function getFullModelQuery(modelName: string): string {
  // For archiving we need ALL fields — use introspection-free approach
  // by selecting known common fields + relying on the full item from DynamoDB
  const lower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return `query Get${modelName}Full($id: ID!) {
    get${modelName}(id: $id) {
      id owner _version _lastChangedAt _deleted deletedAt deletedBy createdAt updatedAt
    }
  }`;
}

function updateDeletedAtMutation(modelName: string): string {
  return `mutation Update${modelName}DeletedAt($input: Update${modelName}Input!) {
    update${modelName}(input: $input) { id _version deletedAt deletedBy }
  }`;
}

function deleteModelMutation(modelName: string): string {
  return `mutation Delete${modelName}($input: Delete${modelName}Input!) {
    delete${modelName}(input: $input) { id }
  }`;
}

function createModelMutation(modelName: string): string {
  return `mutation Create${modelName}($input: Create${modelName}Input!) {
    create${modelName}(input: $input) { id _version }
  }`;
}

function listByForeignKeyQuery(joinModel: string, foreignKey: string): string {
  // Use list query with filter
  return `query List${joinModel}By${foreignKey}($filter: Model${joinModel}FilterInput) {
    list${joinModel}s(filter: $filter) {
      items { id _version deletedAt owner }
      nextToken
    }
  }`;
}

// ============================================================================
// Lambda Handler
// ============================================================================

let isConfigured = false;

export const handler: Handler = async (event) => {
  if (!isConfigured) {
    const amplifyOutputs = JSON.parse(process.env.AMPLIFY_DATA_OUTPUTS || "{}");
    if (amplifyOutputs.data) {
      Amplify.configure(amplifyOutputs);
    }
    isConfigured = true;
  }

  const client = generateClient<any>();
  const s3 = new S3Client({});
  const bucketName = process.env.STORAGE_BUCKET;

  const { fieldName, arguments: args, identity } = event;
  const username = identity?.username || identity?.claims?.sub;

  if (!username) {
    return { success: false, message: "Unauthorized: no authenticated user" };
  }

  try {
    switch (fieldName) {
      case "softDelete":
        return await handleSoftDelete(client, args, username);

      case "restoreRecord":
        return await handleRestore(client, args, username);

      case "permanentDelete":
        return await handlePermanentDelete(
          client,
          s3,
          bucketName,
          args,
          username,
        );

      case "unarchiveRecord":
        return await handleUnarchive(client, s3, bucketName, args, username);

      case "listArchives":
        return await handleListArchives(s3, bucketName, args);

      case "getArchive":
        return await handleGetArchive(s3, bucketName, args);

      default:
        return { success: false, message: `Unknown operation: ${fieldName}` };
    }
  } catch (error: any) {
    console.error(`[recycleBin] Error in ${fieldName}:`, error);
    return {
      success: false,
      message: error.message || "Internal error",
    };
  }
};

// ============================================================================
// Operation Handlers
// ============================================================================

async function handleSoftDelete(
  client: any,
  args: { modelName: string; id: string },
  username: string,
) {
  const { modelName, id } = args;

  if (!SUPPORTED_MODELS.includes(modelName)) {
    return { success: false, message: `Unsupported model: ${modelName}` };
  }

  const now = new Date().toISOString();

  // Get current record to check ownership and get _version
  const { data } = await client.graphql({
    query: getModelQuery(modelName),
    variables: { id },
  });

  const record = data[`get${modelName}`];
  if (!record) {
    return { success: false, message: "Record not found" };
  }

  if (record.owner !== username) {
    return { success: false, message: "Unauthorized: not the record owner" };
  }

  if (record.deletedAt) {
    return { success: false, message: "Record is already soft-deleted" };
  }

  // Soft delete the primary record
  await client.graphql({
    query: updateDeletedAtMutation(modelName),
    variables: {
      input: {
        id,
        deletedAt: now,
        deletedBy: username,
        _version: record._version,
      },
    },
  });

  // Cascade to join tables
  const cascadeCount = await cascadeSoftDelete(client, modelName, id, now);

  return {
    success: true,
    id,
    modelName,
    deletedAt: now,
    cascadedJoinRecords: cascadeCount,
  };
}

async function handleRestore(
  client: any,
  args: { modelName: string; id: string },
  username: string,
) {
  const { modelName, id } = args;

  if (!SUPPORTED_MODELS.includes(modelName)) {
    return { success: false, message: `Unsupported model: ${modelName}` };
  }

  // Get current record
  const { data } = await client.graphql({
    query: getModelQuery(modelName),
    variables: { id },
  });

  const record = data[`get${modelName}`];
  if (!record) {
    return { success: false, message: "Record not found" };
  }

  if (record.owner !== username) {
    return { success: false, message: "Unauthorized: not the record owner" };
  }

  if (!record.deletedAt) {
    return { success: false, message: "Record is not soft-deleted" };
  }

  // Restore the primary record
  await client.graphql({
    query: updateDeletedAtMutation(modelName),
    variables: {
      input: {
        id,
        deletedAt: null,
        deletedBy: null,
        _version: record._version,
      },
    },
  });

  // Cascade restore to join tables
  const cascadeCount = await cascadeRestore(client, modelName, id);

  return {
    success: true,
    id,
    modelName,
    restoredAt: new Date().toISOString(),
    cascadedJoinRecords: cascadeCount,
  };
}

async function handlePermanentDelete(
  client: any,
  s3: S3Client,
  bucketName: string | undefined,
  args: { modelName: string; id: string },
  username: string,
) {
  const { modelName, id } = args;

  if (!SUPPORTED_MODELS.includes(modelName)) {
    return { success: false, message: `Unsupported model: ${modelName}` };
  }

  if (!bucketName) {
    return { success: false, message: "Storage bucket not configured" };
  }

  // Get full record for archiving
  const { data } = await client.graphql({
    query: getFullModelQuery(modelName),
    variables: { id },
  });

  const record = data[`get${modelName}`];
  if (!record) {
    return { success: false, message: "Record not found" };
  }

  if (record.owner !== username) {
    return { success: false, message: "Unauthorized: not the record owner" };
  }

  // Collect related join table records
  const relatedRecords: Record<string, any[]> = {};
  const cascades = CASCADE_MAP[modelName] || [];

  for (const { joinModel, foreignKey } of cascades) {
    const joinRecords = await listJoinRecords(
      client,
      joinModel,
      foreignKey,
      id,
    );
    if (joinRecords.length > 0) {
      relatedRecords[joinModel] = joinRecords;
    }
  }

  // Archive to S3
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveKey = `${ARCHIVE_PREFIX}${modelName}/${id}/${timestamp}.json.gz`;

  const archivePayload = {
    model: modelName,
    id,
    archivedAt: new Date().toISOString(),
    archivedBy: username,
    record,
    relatedRecords,
  };

  const compressed = gzipSync(JSON.stringify(archivePayload));

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: archiveKey,
      Body: compressed,
      ContentType: "application/gzip",
      ContentEncoding: "gzip",
    }),
  );

  // Delete join table records from DynamoDB
  for (const { joinModel } of cascades) {
    const joinRecords = relatedRecords[joinModel] || [];
    for (const jr of joinRecords) {
      try {
        await client.graphql({
          query: deleteModelMutation(joinModel),
          variables: { input: { id: jr.id, _version: jr._version } },
        });
      } catch (err: any) {
        console.warn(
          `[recycleBin] Failed to delete ${joinModel}/${jr.id}:`,
          err.message,
        );
      }
    }
  }

  // Delete the primary record
  await client.graphql({
    query: deleteModelMutation(modelName),
    variables: { input: { id, _version: record._version } },
  });

  return {
    success: true,
    id,
    modelName,
    archiveKey,
    archivedAt: archivePayload.archivedAt,
    relatedRecordCount: Object.values(relatedRecords).reduce(
      (sum, arr) => sum + arr.length,
      0,
    ),
  };
}

async function handleUnarchive(
  client: any,
  s3: S3Client,
  bucketName: string | undefined,
  args: { archiveKey: string },
  username: string,
) {
  const { archiveKey } = args;

  if (!bucketName) {
    return { success: false, message: "Storage bucket not configured" };
  }

  // Read archive from S3
  let archivePayload: any;
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: archiveKey }),
    );
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return { success: false, message: "Archive file is empty" };
    }
    const decompressed = gunzipSync(Buffer.from(body));
    archivePayload = JSON.parse(decompressed.toString("utf-8"));
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to read archive: ${err.message}`,
    };
  }

  const { model: modelName, id, record, relatedRecords } = archivePayload;

  // Check if ID already exists (conflict detection)
  try {
    const { data } = await client.graphql({
      query: getModelQuery(modelName),
      variables: { id },
    });
    if (data[`get${modelName}`]) {
      return {
        success: false,
        message: `Record with ID ${id} already exists in ${modelName}`,
      };
    }
  } catch {
    // Record doesn't exist — safe to proceed
  }

  // Recreate primary record (strip internal fields, clear deletedAt)
  const cleanedRecord = { ...record };
  delete cleanedRecord._version;
  delete cleanedRecord._lastChangedAt;
  delete cleanedRecord._deleted;
  cleanedRecord.deletedAt = null;
  cleanedRecord.deletedBy = null;

  await client.graphql({
    query: createModelMutation(modelName),
    variables: { input: cleanedRecord },
  });

  // Recreate join table records
  let restoredJoinCount = 0;
  for (const [joinModel, records] of Object.entries(relatedRecords || {})) {
    for (const jr of records as any[]) {
      const cleanedJoin = { ...jr };
      delete cleanedJoin._version;
      delete cleanedJoin._lastChangedAt;
      delete cleanedJoin._deleted;
      cleanedJoin.deletedAt = null;

      try {
        await client.graphql({
          query: createModelMutation(joinModel),
          variables: { input: cleanedJoin },
        });
        restoredJoinCount++;
      } catch (err: any) {
        console.warn(
          `[recycleBin] Failed to recreate ${joinModel}/${jr.id}:`,
          err.message,
        );
      }
    }
  }

  return {
    success: true,
    id,
    modelName,
    unarchivedAt: new Date().toISOString(),
    unarchivedBy: username,
    restoredJoinRecords: restoredJoinCount,
  };
}

async function handleListArchives(
  s3: S3Client,
  bucketName: string | undefined,
  args: { modelName?: string; limit?: number; continuationToken?: string },
) {
  if (!bucketName) {
    return { success: false, message: "Storage bucket not configured" };
  }

  const prefix = args.modelName
    ? `${ARCHIVE_PREFIX}${args.modelName}/`
    : ARCHIVE_PREFIX;

  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: args.limit || 50,
      ContinuationToken: args.continuationToken || undefined,
    }),
  );

  const archives = (response.Contents || []).map((obj) => ({
    key: obj.Key,
    lastModified: obj.LastModified?.toISOString(),
    size: obj.Size,
    // Extract model name and ID from key
    modelName: obj.Key?.split("/")[2],
    recordId: obj.Key?.split("/")[3],
  }));

  return {
    success: true,
    archives,
    nextToken: response.NextContinuationToken || null,
    totalCount: archives.length,
  };
}

async function handleGetArchive(
  s3: S3Client,
  bucketName: string | undefined,
  args: { archiveKey: string },
) {
  if (!bucketName) {
    return { success: false, message: "Storage bucket not configured" };
  }

  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: args.archiveKey }),
    );
    const body = await response.Body?.transformToByteArray();
    if (!body) {
      return { success: false, message: "Archive file is empty" };
    }
    const decompressed = gunzipSync(Buffer.from(body));
    const payload = JSON.parse(decompressed.toString("utf-8"));

    return {
      success: true,
      model: payload.model,
      id: payload.id,
      archivedAt: payload.archivedAt,
      archivedBy: payload.archivedBy,
      record: payload.record,
      relatedRecordCount: Object.values(payload.relatedRecords || {}).reduce(
        (sum: number, arr: any) => sum + arr.length,
        0,
      ),
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to read archive: ${err.message}`,
    };
  }
}

// ============================================================================
// Cascade Helpers
// ============================================================================

async function cascadeSoftDelete(
  client: any,
  modelName: string,
  id: string,
  deletedAt: string,
): Promise<number> {
  const cascades = CASCADE_MAP[modelName] || [];
  let count = 0;

  for (const { joinModel, foreignKey } of cascades) {
    const joinRecords = await listJoinRecords(
      client,
      joinModel,
      foreignKey,
      id,
    );
    for (const jr of joinRecords) {
      if (jr.deletedAt) continue; // Already soft-deleted
      try {
        await client.graphql({
          query: updateDeletedAtMutation(joinModel),
          variables: {
            input: { id: jr.id, deletedAt, _version: jr._version },
          },
        });
        count++;
      } catch (err: any) {
        console.warn(
          `[recycleBin] Failed to cascade soft-delete ${joinModel}/${jr.id}:`,
          err.message,
        );
      }
    }
  }

  return count;
}

async function cascadeRestore(
  client: any,
  modelName: string,
  id: string,
): Promise<number> {
  const cascades = CASCADE_MAP[modelName] || [];
  let count = 0;

  for (const { joinModel, foreignKey } of cascades) {
    const joinRecords = await listJoinRecords(
      client,
      joinModel,
      foreignKey,
      id,
    );
    for (const jr of joinRecords) {
      if (!jr.deletedAt) continue; // Not soft-deleted
      try {
        await client.graphql({
          query: updateDeletedAtMutation(joinModel),
          variables: {
            input: { id: jr.id, deletedAt: null, _version: jr._version },
          },
        });
        count++;
      } catch (err: any) {
        console.warn(
          `[recycleBin] Failed to cascade restore ${joinModel}/${jr.id}:`,
          err.message,
        );
      }
    }
  }

  return count;
}

async function listJoinRecords(
  client: any,
  joinModel: string,
  foreignKey: string,
  foreignKeyValue: string,
): Promise<
  Array<{
    id: string;
    _version: number;
    deletedAt: string | null;
    owner: string;
  }>
> {
  const allItems: any[] = [];
  let nextToken: string | null = null;

  do {
    const filter = { [foreignKey]: { eq: foreignKeyValue } };
    const query = listByForeignKeyQuery(joinModel, foreignKey);

    const { data }: { data: any } = await client.graphql({
      query,
      variables: { filter, nextToken },
    });

    const result: any = data[`list${joinModel}s`];
    const items = result?.items || [];
    allItems.push(...items.filter((item: any) => item != null));
    nextToken = result?.nextToken || null;
  } while (nextToken);

  return allItems;
}
