/**
 * Mock for src/utils/amplifyClient.ts
 * Used in Storybook to provide a fully functional Gen2 client without requiring Amplify configuration
 */

import { generateClient } from 'aws-amplify/data';

/**
 * Get or create the mock Amplify Gen 2 GraphQL client
 * This will use the mocked generateClient from aws-amplify/data
 */
export const getAmplifyClient = () => {
  const client = generateClient();
  console.log('[Mock amplifyClient] getAmplifyClient() called - returning mock client');
  return client;
};

/**
 * Reset the client singleton (for testing)
 */
export const resetAmplifyClient = () => {
  console.log('[Mock amplifyClient] resetAmplifyClient() called');
  // No-op in mock - each call to getAmplifyClient returns the same mock
};

// Re-export type for convenience (no-op in JS mock)
export const Schema = {};
export const AmplifyClient = {};
