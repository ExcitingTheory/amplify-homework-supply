import { defineFunction } from "@aws-amplify/backend";

/**
 * Document Thumbnail Lambda function resource
 *
 * Uses a LibreOffice Lambda layer to convert documents (Word, Excel, PowerPoint,
 * ODF, etc.) to PDF, then renders page 1 as a WebP thumbnail via Sharp.
 *
 * Handles:
 * - processDocumentThumbnail(fileID) GraphQL mutation — explicit document processing
 * - S3 EventBridge events — auto-triggers on document uploads
 *
 * Output: protected/{identityId}/{fileId}/thumbnail.webp
 *
 * LibreOffice layer: shelfio/libreoffice-lambda-layer (public ARN)
 * Requires arm64 runtime for layer compatibility.
 */
export const documentThumbnailHandler = defineFunction({
  name: "documentThumbnail",
  timeoutSeconds: 300, // LibreOffice conversion can be slow for large docs
  memoryMB: 1536, // LibreOffice needs memory for rendering
  resourceGroupName: "data",
  runtime: 20, // Node.js 20 (matches layer compatibility)
  layers: {
    libreoffice:
      "arn:aws:lambda:us-east-1:764866452798:layer:libreoffice-brotli:1",
  },
});
