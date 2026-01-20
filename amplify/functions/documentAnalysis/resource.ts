import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Document Analysis Lambda function resource
 * 
 * Handles:
 * - PDF document analysis and text extraction
 * - Vocabulary extraction from documents
 * - Document status tracking (uploading, extracting, analyzing, completed)
 * 
 * Authorization: All authenticated users (own documents only)
 * Cognito Operations: getUser
 */

export const documentAnalysisHandler = defineFunction({
  // entry: './handler.ts',
  timeoutSeconds: 900,
  memoryMB: 3008,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});
