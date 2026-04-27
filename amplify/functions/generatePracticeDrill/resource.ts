import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Generate Practice Drill Lambda function
 *
 * Generates AI practice drill blocks from a unit's vocabulary, questions,
 * documents, and text content. Includes TTS audio pre-generation for all
 * pronounceable text and pronunciation drill metadata for Whisper verification.
 *
 * Authorization: Authenticated users
 */

export const generatePracticeDrillHandler = defineFunction({
  timeoutSeconds: 120,
  memoryMB: 512,
  resourceGroupName: 'data',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});
