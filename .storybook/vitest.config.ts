import { defineConfig } from 'vitest/config';
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
 * This config is invoked by the Storybook addon-vitest preset.
 * The addon runs vitest with --project filter matching this config's name.
 * 
 * IMPORTANT: The storybookTest plugin automatically sets:
 * - test.name to `storybook:{configDir}` 
 * - setupFiles pointing to addon-vitest's setup file
 * - test file discovery based on story globs
 */
export default defineConfig({
  plugins: [
    // React plugin must be first to handle JSX in .js files before import analysis
    react({
      include: /\.[jt]sx?$/,
    }),
    storybookTest({
      configDir: __dirname,
    }),
  ],
  test: {
    globals: true,
    // Browser mode for component testing (Vitest 4+ syntax)
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: [path.resolve(__dirname, './vitest.setup.ts')],
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
