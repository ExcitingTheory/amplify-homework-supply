import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  "stories": [
    "../src/stories/Welcome.mdx", 
    "../src/stories/GettingStarted.mdx",
    "../src/stories/Onboarding.mdx",
    "../src/stories/TechnicalOverview.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../pages/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
    "@storybook/addon-docs",
    // "@storybook/addon-onboarding" // Disabled - using custom branding instead
    './.storybook/code/myOnboarding/preset.js'
  ],
  "framework": {
    name: "@storybook/nextjs",
    options: {},
  },
  "staticDirs": [
    "../public",
    { from: "../mocks", to: "/story-mocks" }
  ],
  
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
    
    // Configure externals to prevent bundling Node.js built-in modules and server-side dependencies
    config.externals = {
      // ...config.externals,
      'child_process': 'commonjs child_process',
      'worker_threads': 'commonjs worker_threads',
      'inspector': 'commonjs inspector',
      '@swc/wasm': 'commonjs @swc/wasm',
      'uglify-js': 'commonjs uglify-js',
      'esbuild': 'commonjs esbuild',
      'webpack': 'commonjs webpack',
      'terser-webpack-plugin': 'commonjs terser-webpack-plugin',
      'jest-worker': 'commonjs jest-worker',
    };
    
    // Add AWS Amplify mock aliases
    const mockAliases = {
      'aws-amplify$': path.join(mocksDir, 'aws-amplify.js'),
      'aws-amplify/data': path.join(mocksDir, 'aws-amplify-data.js'),
      'aws-amplify/datastore': path.join(mocksDir, 'aws-amplify-datastore.js'),
      'aws-amplify/auth': path.join(mocksDir, 'aws-amplify-auth.js'),
      'aws-amplify/storage': path.join(mocksDir, 'aws-amplify-storage.js'),
      'aws-amplify/utils': path.join(mocksDir, 'aws-amplify-utils.js'),
      'aws-amplify/api': path.join(mocksDir, 'aws-amplify-api.js'),
      'ai/react': path.join(mocksDir, 'ai-react.js'),
      '../amplifyconfiguration.json': path.join(mocksDir, 'amplifyconfig.js'),
      './amplifyconfiguration.json': path.join(mocksDir, 'amplifyconfig.js'),
      'next/router': path.join(mocksDir, 'next-router.js'),
      // Mock the amplifyClient singleton utility
      '@/utils/amplifyClient': path.join(mocksDir, 'amplifyClient.js'),
      '../utils/amplifyClient': path.join(mocksDir, 'amplifyClient.js'),
      '../../utils/amplifyClient': path.join(mocksDir, 'amplifyClient.js'),
      '../../../utils/amplifyClient': path.join(mocksDir, 'amplifyClient.js'),
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
    
    // Add fallback for Node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      child_process: false,
      worker_threads: false,
      inspector: false,
      module: false,
    };
    
    // Ensure node_modules are resolved
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
      path.resolve(process.cwd(), 'node_modules'),
    ];
    
    // Add ignore plugin to suppress warnings about optional dependencies
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Can't resolve '(child_process|worker_threads|inspector)'/,
      /Can't resolve '@swc/,
      /Can't resolve 'uglify-js'/,
      /Module not found.*@swc/,
    ];
    
    console.log('[Storybook Config] Mock aliases configured:', Object.keys(mockAliases));
    console.log('[Storybook Config] Mocks directory:', mocksDir);
    console.log('[Storybook Config] Storybook components:', storybookComponentsDir);
    
    return config;
  }
};
export default config;