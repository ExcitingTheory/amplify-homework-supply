/**
 * Amplify Gen 2 Client Singleton
 * 
 * Provides a centralized GraphQL client for all data operations.
 * Replaces Gen 1 DataStore across the application.
 * 
 * Usage:
 * ```typescript
 * import { getAmplifyClient } from '@/utils/amplifyClient';
 * 
 * const client = getAmplifyClient();
 * const { data, errors } = await client.models.Unit.list();
 * ```
 * 
 * @see https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Singleton client instance - created once and reused
let client: ReturnType<typeof generateClient<Schema>> | null = null;

/**
 * Get or create the Amplify Gen 2 GraphQL client
 * 
 * @returns GraphQL client with typed models based on schema
 */
export const getAmplifyClient = () => {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
};

/**
 * Reset the client singleton (useful for testing)
 */
export const resetAmplifyClient = () => {
  client = null;
};

// Re-export type for convenience
export type { Schema };
export type AmplifyClient = ReturnType<typeof generateClient<Schema>>;
