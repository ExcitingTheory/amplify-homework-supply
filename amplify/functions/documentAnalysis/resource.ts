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
  memoryMB: 512,
  resourceGroupName: 'data',  // Must be in data stack - used as GraphQL resolver
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    PHOENIX_COLLECTOR_ENDPOINT: secret('PHOENIX_COLLECTOR_ENDPOINT'),
    // PHOENIX_API_KEY: secret('PHOENIX_API_KEY'),
  },

});
