import { defineFunction } from "@aws-amplify/backend";

/**
 * Recycle Bin Lambda function resource
 *
 * Handles soft delete, restore, permanent delete (archive to S3),
 * and unarchive operations for instructor content models.
 *
 * Operations:
 * - softDelete: Sets deletedAt on record + cascades to join tables
 * - restoreRecord: Clears deletedAt on record + cascades to join tables
 * - permanentDelete: Archives to S3 compressed, removes from DynamoDB
 * - unarchiveRecord: Reads from S3, recreates in DynamoDB (admin only)
 * - listArchives: Lists archived records from S3
 * - getArchive: Reads archive metadata without restoring
 *
 * Authorization: Called via custom mutations from authenticated users
 */

export const recycleBinHandler = defineFunction({
  timeoutSeconds: 120,
  memoryMB: 512,
  resourceGroupName: "data",
});
