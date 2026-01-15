import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';

const config: StorybookConfig = {
  "stories": [
    "../src/stories/Welcome.mdx", 
    "../src/stories/GettingStarted.mdx",
    "../src/stories/Onboarding.mdx",
    "../src/stories/TechnicalOverview.mdx",
    "../src/stories/Configure.mdx",
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../pages/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
    "@storybook/addon-docs"
    // "@storybook/addon-onboarding" // Disabled - using custom branding instead
  ],
  "framework": {
    name: "@storybook/nextjs",
    options: {},
  },
  "staticDirs": [
    "../public"
  ],
  
  // docs: {
  //   autodocs: "tag",
  // },
  
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  
  core: {
    disableTelemetry: true,
  },
  
  async webpackFinal(config) {
    // Get absolute path to storybook mocks directory  
    const mocksDir = path.resolve(process.cwd(), '.storybook/__mocks__');
    const storybookComponentsDir = path.resolve(process.cwd(), '.storybook/components');
    
    // Add AWS Amplify mock aliases
    const mockAliases = {
      'aws-amplify$': path.join(mocksDir, 'aws-amplify.js'),
      'aws-amplify/datastore': path.join(mocksDir, 'aws-amplify-datastore.js'),
      'aws-amplify/auth': path.join(mocksDir, 'aws-amplify-auth.js'),
      'aws-amplify/storage': path.join(mocksDir, 'aws-amplify-storage.js'),
      'aws-amplify/utils': path.join(mocksDir, 'aws-amplify-utils.js'),
      'aws-amplify/api': path.join(mocksDir, 'aws-amplify-api.js'),
      'ai/react': path.join(mocksDir, 'ai-react.js'),
      '../amplifyconfiguration.json': path.join(mocksDir, 'amplifyconfig.js'),
      './amplifyconfiguration.json': path.join(mocksDir, 'amplifyconfig.js'),
      'next/router': path.join(mocksDir, 'next-router.js'),
    };
    
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Add alias for .storybook/components directory
    config.resolve.alias = {
      ...mockAliases,
      '../.storybook/components': storybookComponentsDir,
      ...config.resolve.alias,
    };
    
    // Ensure node_modules are resolved
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
      path.resolve(process.cwd(), 'node_modules'),
    ];
    
    console.log('[Storybook Config] Mock aliases configured:', Object.keys(mockAliases));
    console.log('[Storybook Config] Mocks directory:', mocksDir);
    console.log('[Storybook Config] Storybook components:', storybookComponentsDir);
    
    return config;
  }
};
export default config;