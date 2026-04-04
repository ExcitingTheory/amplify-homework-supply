import { defineConfig, defineProject } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

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
 */
export default defineConfig({
  test: {
    projects: [
      // Unit test project
      defineProject({
        plugins: [
          react({
            include: /\.[jt]sx?$/,
          }),
        ],
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
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
            '@storybook/__mocks__': path.resolve(storybookConfigDir, './__mocks__'),
          },
          conditions: ['import', 'module', 'browser', 'default'],
          mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
        },
        optimizeDeps: {
          include: [
            '@mui/material',
            '@mui/icons-material',
            'react-beautiful-dnd',
            'lodash',
            '@lexical/rich-text',
            '@lexical/list',
            '@lexical/code',
            '@lexical/link',
            '@lexical/table',
            '@lexical/hashtag',
            '@lexical/markdown',
            'lexical',
          ],
        },
      }),
      // Storybook component test project
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
          name: 'storybook',
          globals: true,
          testTimeout: 120000, // 120s for interactive tests
          hookTimeout: 120000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            fileParallelism: false, // Disable parallel execution to avoid cache conflicts
            isolate: false, // Reuse browser context to avoid module cache invalidation
          },
          // Use relative path for setupFiles so Vite can serve it in browser mode
          setupFiles: ['.storybook/vitest.setup.ts'],
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
            '@': path.resolve(__dirname, './src'),
            '@storybook/__mocks__': path.resolve(storybookConfigDir, './__mocks__'),
            // Workaround for Lexical packages that don't have "." export
            '@lexical/react$': '@lexical/react/LexicalComposer',
          },
          conditions: ['import', 'module', 'browser', 'default'],
          mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
        },
        optimizeDeps: {
          include: [
            '@mui/material',
            '@mui/icons-material',
            'react-beautiful-dnd',
            'lodash',
            '@lexical/rich-text',
            '@lexical/list',
            '@lexical/code',
            '@lexical/link',
            '@lexical/table',
            '@lexical/hashtag',
            '@lexical/markdown',
            'lexical',
          ],
          exclude: [
            'qrcode', // Exclude qrcode to prevent Node.js module issues in browser
          ],
        },
        server: {
          hmr: false, // Disable HMR during tests to prevent cache corruption
          watch: {
            ignored: ['**/node_modules/**', '**/.git/**'],
          },
          fs: {
            strict: false, // Allow serving files outside root
          },
        },
        cacheDir: path.resolve(__dirname, 'node_modules/.vite/storybook'),
        clearScreen: false,
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
