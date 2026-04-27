import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Peer Review AI Lambda function resource
 *
 * Handles:
 * - handleAIMention: Responds to @AI mentions in peer review chat
 * - generateReviewSummary: Creates AI summary when a review room closes
 *
 * Authorization: Authenticated users via custom mutations
 */

export const peerReviewAIHandler = defineFunction({
  timeoutSeconds: 60,
  memoryMB: 512,
  resourceGroupName: 'data',
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});
