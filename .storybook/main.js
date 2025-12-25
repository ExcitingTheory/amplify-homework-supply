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
    
    // Fix React version conflicts
    // Force all react imports to use the same instance
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
    };
    
    // Don't let any package use its own React - force them all to use ours as externals
    config.externals = config.externals || {};
    
    // Remove existing React from bundle and force single shared instance
    const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;
    
    config.plugins.push(
      new ModuleFederationPlugin({
        name: 'storybook',
        shared: {
          react: {
            singleton: true,
            requiredVersion: false,
            eager: true,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: false,
            eager: true,
          },
          'react/jsx-runtime': {
            singleton: true,
            requiredVersion: false,
            eager: true,
          },
          'react/jsx-dev-runtime': {
            singleton: true,
            requiredVersion: false,
            eager: true,
          },
        },
      })
    );
    
    // Ensure symlinks are resolved properly
    config.resolve.symlinks = false;
    
    return config;
  },
};

module.exports = config;
