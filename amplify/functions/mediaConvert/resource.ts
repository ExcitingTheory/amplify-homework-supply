import { defineFunction } from '@aws-amplify/backend';

/**
 * MediaConvert Lambda function resource
 *
 * Handles:
 * - transcodeMedia(fileID) GraphQL mutation — explicit HLS transcoding
 * - S3 upload events — auto-triggers on video uploads
 * - EventBridge events — MediaConvert job completion/error callbacks
 *
 * Creates AWS MediaConvert jobs that produce HLS (.m3u8) chunked output
 * at protected/{identityId}/{fileId}/{fileId}.m3u8
 */
export const mediaConvertHandler = defineFunction({
  timeoutSeconds: 120,
  memoryMB: 256,
  resourceGroupName: 'data', // Must be in data stack — used as GraphQL resolver
});
