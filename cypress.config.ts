import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000", // Dev server for E2E tests (Storybook tests use env.storybookUrl)
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,

    // Support multiple test environments
    env: {
      storybookUrl: "http://localhost:6006",
      devServerUrl: "http://localhost:3000",
      // Test user credentials (set via environment variables or use defaults)
      TEACHER_USERNAME: process.env.TEACHER_USERNAME || 'instructor1@example.com',
      TEACHER_PASSWORD: process.env.TEACHER_PASSWORD || 'TestPassword123!',
      LEARNER_USERNAME: process.env.LEARNER_USERNAME || 'student1@example.com',
      LEARNER_PASSWORD: process.env.LEARNER_PASSWORD || 'TestPassword123!',
    },

    setupNodeEvents(on, config) {
      // Custom task for console logging in tests
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });

      // Automatically print browser console logs to terminal
      on('task', {
        consoleLog(message: any) {
          console.log('🔵 CONSOLE:', message);
          return null;
        },
        consoleWarn(message: any) {
          console.warn('⚠️  WARN:', message);
          return null;
        },
        consoleError(message: any) {
          console.error('🔴 ERROR:', message);
          return null;
        },
      });

      return config;
    },
  },

  // Configure reports directory
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',

  // Retry configuration for flaky tests
  retries: {
    runMode: 0,
    openMode: 0,
  },
});
