import { defineProject } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vitest configuration for @storybook/addon-vitest
 * 
 * This config is part of a Vitest workspace (see ../vitest.workspace.ts).
 * 
 * IMPORTANT: The storybookTest plugin automatically sets:
 * - test.name to `storybook` 
 * - setupFiles pointing to addon-vitest's setup file
 * - test file discovery based on story globs
 * 
 * We override setupFiles here to add our custom setup (vitest.setup.ts)
 * AFTER the addon's setup file.
 */
export default defineProject({
  plugins: [
    // React plugin must be first to handle JSX in .js files before import analysis
    react({
      include: /\.[jt]sx?$/,
    }),
    storybookTest({
      configDir: __dirname,
      // Ensure the test project name is exactly 'storybook' to match package.json script
      tags: {
        include: ['test', 'story'],
        exclude: ['skip-test'], // Exclude stories tagged with skip-test
      },
    }),
  ],
  test: {
    // NOTE: The storybookTest plugin automatically sets the test.name
    // Let the plugin handle it instead of overriding
    globals: true,
    testTimeout: 60000, // 60s for interactive tests
    hookTimeout: 60000,
    // Browser mode for component testing (Vitest 4+ syntax)
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      fileParallelism: false, // Disable parallel execution to avoid cache conflicts
      isolate: false, // Reuse browser context to avoid module cache invalidation
    },
    // Use relative path for setupFiles to work in browser mode
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.amplify/**',
      '**/.next/**',
      '**/src/stories/index.stories.jsx', // Temporarily exclude - qrcode/pngjs browser issue
      '**/src/stories/pages.stories.tsx', // Temporarily exclude - qrcode/pngjs browser issue
    ],
    deps: {
      optimizer: {
        web: {
          enabled: false, // Disable optimization for browser tests to prevent reloads
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@storybook/__mocks__': path.resolve(__dirname, './__mocks__'),
    },
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      'react-beautiful-dnd',
      'lodash',
    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
