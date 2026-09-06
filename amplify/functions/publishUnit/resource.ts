import { defineFunction } from "@aws-amplify/backend";

/**
 * publishUnit Lambda function resource
 *
 * Handles the `publishUnit(unitId)` mutation:
 *  1. Reads the unit's draft from S3 (protected/{identityId}/units/{unitId}/draft.json)
 *  2. Walks Lexical JSON nodes to find media references
 *  3. Copies audio files to protected/units/audio/{fileId}.ext
 *  4. Copies image WebP variants to protected/units/images/{fileId}/{size}.webp
 *  5. Rewrites node paths in the Lexical JSON
 *  6. Writes rewritten content to protected/units/{unitId}/published.json
 *  7. Updates Unit.publishedContentVersion + publishedAt in DynamoDB
 *
 * Authorization: Instructors + Admins only (enforced via AppSync @auth)
 * The Lambda uses its IAM execution role for direct S3 access
 * (not Cognito identity credentials), which allows reading from private/ paths.
 */
export const publishUnitHandler = defineFunction({
  timeoutSeconds: 120,
  memoryMB: 512,
  resourceGroupName: "data",
});
