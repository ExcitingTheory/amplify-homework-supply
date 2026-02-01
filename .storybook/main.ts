import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "./TranslationMode.stories.tsx"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    { from: "../public", to: "/" },
    { from: "../mocks", to: "/story-mocks" }
  ],
  
  async viteFinal(config) {
    // Configure path aliases for component imports
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@storybook-components': path.resolve(__dirname, './components'),
      '@storybook-mocks': path.resolve(__dirname, './__mocks__'),
      // Mock AWS Amplify modules for Storybook
      'aws-amplify/data': path.resolve(__dirname, './__mocks__/aws-amplify-data.js'),
      'aws-amplify/auth': path.resolve(__dirname, './__mocks__/aws-amplify-auth.js'),
      'aws-amplify/storage': path.resolve(__dirname, './__mocks__/aws-amplify-storage.js'),
      'aws-amplify/api': path.resolve(__dirname, './__mocks__/aws-amplify-api.js'),
      'aws-amplify/utils': path.resolve(__dirname, './__mocks__/aws-amplify-utils.js'),
      // Mock Amplify utilities that use the real client
      '@/utils/amplifyClient': path.resolve(__dirname, './__mocks__/amplifyClient.js'),
      '../utils/amplifyClient': path.resolve(__dirname, './__mocks__/amplifyClient.js'),
      // Mock i18next to integrate with Translation Mode
      'next-i18next': path.resolve(__dirname, './__mocks__/next-i18next.js'),
    };
    
    // Define Node.js globals for browser environment to fix Next.js compatibility
    if (!config.define) {
      config.define = {};
    }
    config.define['__dirname'] = '"/app"';
    config.define['process.env.NODE_ENV'] = '"development"';
    
    // Add global polyfill
    if (!config.optimizeDeps) {
      config.optimizeDeps = {};
    }
    config.optimizeDeps.esbuildOptions = {
      ...config.optimizeDeps.esbuildOptions,
      define: {
        global: 'globalThis',
      },
    };
    
    return config;
  }
};
export default config;