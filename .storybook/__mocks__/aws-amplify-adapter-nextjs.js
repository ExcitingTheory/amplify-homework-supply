/**
 * Mock @aws-amplify/adapter-nextjs for Storybook
 * Returns the in-memory mock data client so RSC pre-fetches read seeded data.
 */
import { generateClient } from 'aws-amplify/data';

export const createServerRunner = () => ({
  runWithAmplifyServerContext: async ({ operation }) => operation({}),
});

export const generateServerClientUsingCookies = () => generateClient();

export const createCookieStorageAdapterFromNextServerContext = () => ({});
