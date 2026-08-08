/**
 * Mock for @/utils/amplifyServerClient and @/utils/amplifyServerUtils
 * Used in Storybook so RSC pages can pre-fetch from the in-memory mock store.
 */
import { generateClient } from 'aws-amplify/data';

export function getServerClient() {
  return generateClient();
}

export async function runWithAmplifyServerContext({ operation }) {
  return operation({});
}
