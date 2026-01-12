/** @type { import('@storybook/nextjs').StorybookConfig } */
const config = {
  stories: [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../pages/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs"
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  reactOptions: {
    strictMode: false,
  },

  docs: {
    autodocs: "tag",
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },

  // Explicitly define React version to avoid warnings
  refs: {},
  
  env: (config) => ({
    ...config,
    REACT_VERSION: '18.3.1',
  }),

  staticDirs: ['../public'],
  
  core: {
    disableTelemetry: true,
  },

  // Configure manager build to use same React instance
  managerWebpack: async (config) => {
    const path = require('path');
    
    // Don't alias React - let npm overrides handle it
    
    return config;
  },

  webpackFinal: async (config) => {
    const path = require('path');
    const webpack = require('webpack');
    
    // Get absolute path to storybook mocks directory
    const mocksDir = path.resolve(__dirname, '__mocks__');
    
    // Add AWS Amplify mock aliases BEFORE any existing aliases
    const mockAliases = {
      'aws-amplify$': path.join(mocksDir, 'aws-amplify.js'),
      'aws-amplify/datastore': path.join(mocksDir, 'aws-amplify-datastore.js'),
      'aws-amplify/auth': path.join(mocksDir, 'aws-amplify-auth.js'),
      'aws-amplify/storage': path.join(mocksDir, 'aws-amplify-storage.js'),
      'aws-amplify/utils': path.join(mocksDir, 'aws-amplify-utils.js'),
      'aws-amplify/api': path.join(mocksDir, 'aws-amplify-api.js'),
      '@aws-amplify/datastore': path.join(mocksDir, 'aws-amplify-datastore.js'),
      'ai/react': path.join(mocksDir, 'ai-react.js'),
    };
    
    // Initialize resolve.alias if it doesn't exist
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Merge aliases - our mocks FIRST to take precedence
    // Don't alias React - let npm overrides and Storybook handle it
    config.resolve.alias = {
      ...mockAliases,
      ...config.resolve.alias,
    };
    
    console.log('[Storybook Config] Mock aliases configured:', Object.keys(mockAliases));
    console.log('[Storybook Config] Mocks directory:', mocksDir);
    
    // Ensure symlinks are resolved properly
    config.resolve.symlinks = false;
    
    return config;
  },
};

module.exports = config;
