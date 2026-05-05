import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Moderation Lambda function resource
 * 
 * Handles:
 * - moderateContent: Text moderation via omni-moderation-latest
 * - moderateImage: Image moderation via omni-moderation-latest (multi-modal)
 * - moderateAudio: Audio transcription (Whisper) → text moderation
 * 
 * Authorization: All authenticated users
 */

export const moderationHandler = defineFunction({
  timeoutSeconds: 60, // Audio: fetch + Whisper transcription + moderation
  memoryMB: 512, // Audio buffers can be large
  resourceGroupName: 'data',  // Assign to data stack - used as GraphQL resolver
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },

});
