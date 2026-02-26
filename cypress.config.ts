import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:6006",
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
    },
    
    setupNodeEvents(on, config) {
      // Custom task for console logging in tests
      on('task', {
        log(message: string) {
          console.log(message);
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
    runMode: 2,
    openMode: 0,
  },
});
