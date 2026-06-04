import { defineFunction } from "@aws-amplify/backend";

/**
 * rebuildNgramIndex Lambda function resource
 *
 * Handles the `rebuildNgramIndex()` mutation (Admin-only):
 *  1. Lists all published units from DynamoDB
 *  2. For each unit reads its published Lexical JSON from S3
 *  3. Extracts node type sequences and builds bigram/trigram frequency tables
 *  4. Writes the completed index to protected/units/ngrams/v1.json with a
 *     1-hour CloudFront CacheControl header
 *
 * The index is served via CloudFront behind the protected/units/* signed cookie
 * (issued by getUnitsCdnCookie at app load) — no separate auth call is needed.
 */
export const rebuildNgramIndexHandler = defineFunction({
  timeoutSeconds: 300,
  memoryMB: 512,
  resourceGroupName: "data",
});
