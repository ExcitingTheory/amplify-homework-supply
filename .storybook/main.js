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

  webpackFinal: async (config) => {
    const path = require('path');
    const webpack = require('webpack');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'aws-amplify/datastore': require.resolve('./__mocks__/aws-amplify-datastore.js'),
      'aws-amplify/auth': require.resolve('./__mocks__/aws-amplify-auth.js'),
      'aws-amplify/storage': require.resolve('./__mocks__/aws-amplify-storage.js'),
      'aws-amplify/utils': require.resolve('./__mocks__/aws-amplify-utils.js'),
      'aws-amplify/api': require.resolve('./__mocks__/aws-amplify-api.js'),
      '@aws-amplify/datastore': require.resolve('./__mocks__/aws-amplify-datastore.js'),
    };
    
    // Replace any imports to src/models with the consolidated mock index
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /src\/models$/,
        require.resolve('./__mocks__/index.js')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\/models$/,
        (resource) => {
          // Only replace if it's from the src directory, not node_modules
          if (resource.context.includes('/src/') && !resource.context.includes('node_modules')) {
            resource.request = require.resolve('./__mocks__/index.js');
          }
        }
      )
    );
    
    return config;
  },
};

module.exports = config;
