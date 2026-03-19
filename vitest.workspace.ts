import { defineWorkspace } from 'vitest/config';

/**
 * Vitest Workspace Configuration
 * 
 * The main vitest.config.ts already contains both test projects:
 * - Unit tests (happy-dom environment)
 * - Storybook component tests (browser mode with Playwright)
 * 
 * This workspace file simply references the main config.
 */
export default defineWorkspace([
  './vitest.config.ts',
]);
