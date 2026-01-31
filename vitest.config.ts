import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,
    include: [
      'test/**/*.test.ts',
      'src/**/*.test.ts',
      'amplify/functions/**/*.test.ts',
      '.storybook/**/*.test.js',
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
