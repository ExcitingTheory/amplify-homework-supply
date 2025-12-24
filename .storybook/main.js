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
    config.resolve.alias = {
      ...config.resolve.alias,
      'aws-amplify/storage': require.resolve('./__mocks__/aws-amplify-storage.js'),
      'aws-amplify/utils': require.resolve('./__mocks__/aws-amplify-utils.js'),
      'aws-amplify/api': require.resolve('./__mocks__/aws-amplify-api.js'),
      '@aws-amplify/datastore': require.resolve('./__mocks__/aws-amplify-datastore.js'),
    };
    return config;
  },
};

module.exports = config;
