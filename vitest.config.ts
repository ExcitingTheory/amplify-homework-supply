import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: [
      'amplify/functions/__tests__/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.test.{ts,tsx}',
      'test/**/*.test.{ts,tsx}',
      '.storybook/__tests__/**/*.test.{js,ts}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/cypress/**',
      'amplify/#current-cloud-backend/**',
      '**/*.stories.{js,jsx,ts,tsx}'
    ],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/*.stories.{js,jsx,ts,tsx}',
        '**/.storybook/**',
        '**/dist/**',
        '**/.next/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@amplify': path.resolve(__dirname, './amplify')
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  }
});
