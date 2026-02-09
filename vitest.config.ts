import { defineConfig, defineProject, mergeConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storybookConfigDir = path.resolve(__dirname, '.storybook');

/**
 * Vitest Configuration for Vitest 4+ with @storybook/addon-vitest
 * 
 * Uses test.projects to define separate test configurations:
 * - Unit tests (happy-dom environment)
 * - Storybook component tests (browser mode with Playwright)
 * 
 * This is the recommended approach for Vitest ≥ 4.0.
 * See: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
 */
export default defineConfig({
  test: {
    projects: [
      // Unit test project
      defineProject({
        test: {
          name: 'unit',
          globals: true,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          testTimeout: 30000,
          hookTimeout: 30000,
          include: [
            'test/**/*.test.ts',
            'test/**/*.test.tsx',
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            'amplify/functions/**/*.test.ts',
            '.github/skills/**/*.test.ts',
          ],
          exclude: [
            'node_modules',
            'dist',
            '.amplify',
            '.next',
            'out',
            'build',
          ],
        },
      }),
      // Storybook component test project (inline to avoid file reference issues)
      defineProject({
        plugins: [
          react({
            include: /\.[jt]sx?$/,
          }),
          storybookTest({
            configDir: storybookConfigDir,
          }),
        ],
        test: {
          globals: true,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: [path.resolve(storybookConfigDir, './vitest.setup.ts')],
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
            '@storybook/__mocks__': path.resolve(storybookConfigDir, './__mocks__'),
          },
        },
        optimizeDeps: {
          include: [
            '@mui/material',
            '@mui/icons-material',
            'react-beautiful-dnd',
            'lodash',
          ],
        },
      }),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '.storybook/',
        '**/*.test.ts',
        '**/*.test.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@storybook/__mocks__': path.resolve(__dirname, './.storybook/__mocks__'),
    },
  },
});
