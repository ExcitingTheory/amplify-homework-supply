/**
 * Consolidated mock exports for backwards compatibility
 * Re-exports everything from the modular mock files
 * 
 * This file is used to replace imports from '../models' in Storybook
 */

// Re-export the initSchema function and all DataStore functionality
export * from './aws-amplify-datastore.js';

// Re-export auth, storage, utils, and api mocks
export * from './aws-amplify-auth.js';
export * from './aws-amplify-storage.js';
export * from './aws-amplify-utils.js';
export * from './aws-amplify-api.js';
