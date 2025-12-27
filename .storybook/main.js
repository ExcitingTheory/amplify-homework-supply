/** @type { import('@storybook/nextjs').StorybookConfig } */
const config = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs"
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
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
    const reactPath = path.resolve(__dirname, '../node_modules/react');
    const reactDomPath = path.resolve(__dirname, '../node_modules/react-dom');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': reactPath,
      'react-dom': reactDomPath,
    };
    
    return config;
  },

  webpackFinal: async (config) => {
    const path = require('path');
    const webpack = require('webpack');
    
    // Force all react imports to use the same instance via aliases
    const reactPath = path.resolve(__dirname, '../node_modules/react');
    const reactDomPath = path.resolve(__dirname, '../node_modules/react-dom');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'aws-amplify/datastore': require.resolve('./__mocks__/aws-amplify-datastore.js'),
      'aws-amplify/auth': require.resolve('./__mocks__/aws-amplify-auth.js'),
      'aws-amplify/storage': require.resolve('./__mocks__/aws-amplify-storage.js'),
      'aws-amplify/utils': require.resolve('./__mocks__/aws-amplify-utils.js'),
      'aws-amplify/api': require.resolve('./__mocks__/aws-amplify-api.js'),
      '@aws-amplify/datastore': require.resolve('./__mocks__/aws-amplify-datastore.js'),
      // Use real getCachedUrl to test caching logic
    };
    
    // Ensure symlinks are resolved properly
    config.resolve.symlinks = false;
    
    // Add Module Federation plugin to share React modules
    const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;
    
    config.plugins.push(
      new ModuleFederationPlugin({
        name: 'amplify-homework-supply',
        shared: {
          react: {
            singleton: true,
            requiredVersion: '18.3.1',
            version: '18.3.1',
            strictVersion: false,
            eager: true,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '18.3.1',
            version: '18.3.1',
            strictVersion: false,
            eager: true,
          },
          'react/jsx-runtime': {
            singleton: true,
            requiredVersion: '18.3.1',
            version: '18.3.1',
            strictVersion: false,
            eager: true,
          },
          'react/jsx-dev-runtime': {
            singleton: true,
            requiredVersion: '18.3.1',
            version: '18.3.1',
            strictVersion: false,
            eager: true,
          },
        },
      })
    );
    
    return config;
  },
};

module.exports = config;
