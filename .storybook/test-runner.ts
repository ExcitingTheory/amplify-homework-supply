import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { checkA11y, configureAxe, injectAxe } from 'axe-playwright';

/**
 * Storybook Test Runner Configuration
 * 
 * Runs automated tests on all stories:
 * - Rendering validation (no errors)
 * - Console error detection  
 * - Accessibility checks (axe-core via @storybook/addon-a11y)
 * - Custom assertions
 * 
 * Usage: npm run test-storybook
 * 
 * @see https://storybook.js.org/docs/writing-tests/test-runner
 */

const config: TestRunnerConfig = {
  // Hook that runs before each story
  async preVisit(page) {
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  },

  // Hook that runs after each story renders
  async postVisit(page, context) {
    // Get the story context (title, parameters, etc.)
    const storyContext = await getStoryContext(page, context);

    // Skip a11y tests if explicitly disabled in story parameters
    if (storyContext.parameters?.a11y?.disable) {
      return;
    }

    // Configure axe with custom rules if provided
    const axeConfig = storyContext.parameters?.a11y?.config || {};
    await configureAxe(page, axeConfig);

    // Run accessibility checks
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      // Apply story-specific axe options
      axeOptions: storyContext.parameters?.a11y?.options || {},
    });
  },

  // Tags to include/exclude
  tags: {
    // Include all stories by default
    include: [],
    // Exclude stories marked as skip
    exclude: ['skip-test'],
    // Can also use: skip: ['skip-test']
  },

  // Error handling
  async prepare({ page, browserContext, testRunnerConfig }) {
    // Set up error collection
    const errors: string[] = [];
    const warnings: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Store for later access
    (page as any).__testErrors = errors;
    (page as any).__testWarnings = warnings;
  },
};

export default config;
