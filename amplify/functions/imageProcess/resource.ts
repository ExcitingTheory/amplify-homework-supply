import { defineFunction } from "@aws-amplify/backend";

/**
 * Image Processing Lambda function resource
 *
 * Handles:
 * - processFileImage(fileID) GraphQL mutation — explicit image processing
 * - S3 EventBridge events — auto-triggers on image uploads
 *
 * Generates responsive image variants using Sharp:
 * - thumbnail (150px wide, WebP)
 * - small (320px wide, WebP)
 * - medium (640px wide, WebP)
 * - large (1280px wide, WebP)
 *
 * Output path: protected/{identityId}/{fileId}/thumbnail.webp
 * Also handles PDF first-page thumbnail generation.
 */
export const imageProcessHandler = defineFunction({
  name: "imageProcess",
  timeoutSeconds: 120,
  memoryMB: 1024, // Sharp needs more memory for large images
  resourceGroupName: "data", // Must be in data stack — used as GraphQL resolver
});
