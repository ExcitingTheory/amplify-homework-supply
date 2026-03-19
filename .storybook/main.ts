import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  "stories": [
    // "../src/**/*.mdx", // Temporarily disabled - vitest plugin excludes ../**/*.mdx causing no tests to run
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "./TranslationMode.stories.tsx"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    { from: "../public", to: "/" },
    { from: "../mocks", to: "/story-mocks" }
  ],
  
  async viteFinal(config) {
    // Add custom plugin to intercept YJS imports before alias resolution
    if (!config.plugins) {
      config.plugins = [];
    }
    
    config.plugins.push({
      name: 'mock-yjs-imports',
      enforce: 'pre', // Run before other plugins
      resolveId(source, importer) {
        // Intercept any import that references yjs directory
        const yjsPatterns = [
          /\/yjs\//,
          /^yjs\//,
          /^\.\.\/yjs\//,
          /^\.\.\/\.\.\/yjs\//,
          /@\/yjs\//,
        ];
        
        const isYjsImport = yjsPatterns.some(pattern => pattern.test(source));
        
        if (isYjsImport) {
          const mockPath = path.resolve(__dirname, './__mocks__');
          
          console.log('[mock-yjs-imports] Intercepting:', source, 'from', importer);
          
          // Map YJS imports to mocks
          if (source.includes('workbookHooks')) {
            console.log('[mock-yjs-imports] -> workbookHooks.js');
            return path.resolve(mockPath, 'workbookHooks.js');
          }
          if (source.includes('YjsProvider')) {
            console.log('[mock-yjs-imports] -> YjsProvider.js');
            return path.resolve(mockPath, 'YjsProvider.js');
          }
          if (source.includes('WorkbookCollaborationProvider')) {
            console.log('[mock-yjs-imports] -> WorkbookCollaborationProvider.js');
            return path.resolve(mockPath, 'WorkbookCollaborationProvider.js');
          }
          if (source.includes('/hooks') || source.endsWith('/hooks') || source.endsWith('yjs/hooks')) {
            console.log('[mock-yjs-imports] -> yjs-hooks.js');
            return path.resolve(mockPath, 'yjs-hooks.js');
          }
          if (source.includes('useYjsUnit')) {
            console.log('[mock-yjs-imports] -> useYjsUnit.js');
            return path.resolve(mockPath, 'useYjsUnit.js');
          }
          if (source.includes('CollaborationPlugin')) {
            console.log('[mock-yjs-imports] -> CollaborationPlugin.js');
            return path.resolve(mockPath, 'CollaborationPlugin.js');
          }
          if (source.match(/yjs\/(index)?$/)) {
            console.log('[mock-yjs-imports] -> yjs-index.js');
            return path.resolve(mockPath, 'yjs-index.js');
          }
          
          // Default: return yjs-index for bare yjs imports
          console.log('[mock-yjs-imports] -> yjs-index.js (default)');
          return path.resolve(mockPath, 'yjs-index.js');
        }
        return null; // Let other plugins handle it
      },
    });
    
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
      // Mock AuthContext for Storybook
      '@/context/authContext': path.resolve(__dirname, './__mocks__/authContext.js'),
      '../context/authContext': path.resolve(__dirname, './__mocks__/authContext.js'),
      '../../context/authContext': path.resolve(__dirname, './__mocks__/authContext.js'),
      // Alias the absolute path to the production authContext file
      [path.resolve(__dirname, '../src/context/authContext.jsx')]: path.resolve(__dirname, './__mocks__/authContext.js'),
      [path.resolve(__dirname, '../src/context/authContext')]: path.resolve(__dirname, './__mocks__/authContext.js'),
      // Mock YJS workbook hooks - now in src/yjs/
      [path.resolve(__dirname, '../src/yjs/workbookHooks')]: path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      [path.resolve(__dirname, '../src/yjs/workbookHooks.ts')]: path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      '@/yjs/workbookHooks': path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      '@/yjs/workbookHooks.ts': path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      '../yjs/workbookHooks': path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      '../yjs/workbookHooks.ts': path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      // Mock YJS provider files
      [path.resolve(__dirname, '../src/yjs/YjsProvider')]: path.resolve(__dirname, './__mocks__/YjsProvider.js'),
      [path.resolve(__dirname, '../src/yjs/YjsProvider.ts')]: path.resolve(__dirname, './__mocks__/YjsProvider.js'),
      [path.resolve(__dirname, '../src/yjs/WorkbookCollaborationProvider')]: path.resolve(__dirname, './__mocks__/WorkbookCollaborationProvider.js'),
      [path.resolve(__dirname, '../src/yjs/WorkbookCollaborationProvider.ts')]: path.resolve(__dirname, './__mocks__/WorkbookCollaborationProvider.js'),
      [path.resolve(__dirname, '../src/yjs/hooks')]: path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      [path.resolve(__dirname, '../src/yjs/hooks.ts')]: path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      [path.resolve(__dirname, '../src/yjs')]: path.resolve(__dirname, './__mocks__/yjs-index.js'),
      [path.resolve(__dirname, '../src/yjs/index')]: path.resolve(__dirname, './__mocks__/yjs-index.js'),
      [path.resolve(__dirname, '../src/yjs/index.ts')]: path.resolve(__dirname, './__mocks__/yjs-index.js'),
      // Mock entire YJS directory for Storybook (prevents loading real YJS dependencies)
      'yjs/workbookHooks': path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      'yjs/workbookHooks.js': path.resolve(__dirname, './__mocks__/workbookHooks.js'),
      'yjs/YjsProvider': path.resolve(__dirname, './__mocks__/YjsProvider.js'),
      'yjs/WorkbookCollaborationProvider': path.resolve(__dirname, './__mocks__/WorkbookCollaborationProvider.js'),
      'yjs/hooks': path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      // Mock YJS hooks
      '@/yjs/hooks': path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      '@/yjs/hooks.ts': path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      '../yjs/hooks': path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      '../yjs/hooks.ts': path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      '../../yjs/hooks': path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      '../../yjs/hooks.ts': path.resolve(__dirname, './__mocks__/yjs-hooks.js'),
      // Mock useYjsUnit hook
      '@/hooks/useYjsUnit': path.resolve(__dirname, './__mocks__/useYjsUnit.js'),
      '@/hooks/useYjsUnit.ts': path.resolve(__dirname, './__mocks__/useYjsUnit.js'),
      '../hooks/useYjsUnit': path.resolve(__dirname, './__mocks__/useYjsUnit.js'),
      '../hooks/useYjsUnit.ts': path.resolve(__dirname, './__mocks__/useYjsUnit.js'),
      '../../hooks/useYjsUnit': path.resolve(__dirname, './__mocks__/useYjsUnit.js'),
      '../../hooks/useYjsUnit.ts': path.resolve(__dirname, './__mocks__/useYjsUnit.js'),
      // Mock CollaborationPlugin
      '@/components/Editor3/plugins/CollaborationPlugin': path.resolve(__dirname, './__mocks__/CollaborationPlugin.js'),
      '@/components/Editor3/plugins/CollaborationPlugin.tsx': path.resolve(__dirname, './__mocks__/CollaborationPlugin.js'),
      './plugins/CollaborationPlugin': path.resolve(__dirname, './__mocks__/CollaborationPlugin.js'),
      './plugins/CollaborationPlugin.tsx': path.resolve(__dirname, './__mocks__/CollaborationPlugin.js'),
      '../plugins/CollaborationPlugin': path.resolve(__dirname, './__mocks__/CollaborationPlugin.js'),
      '../plugins/CollaborationPlugin.tsx': path.resolve(__dirname, './__mocks__/CollaborationPlugin.js'),
      // Mock YJS index (directory imports)
      '@/yjs': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '@/yjs/index': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '@/yjs/index.ts': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '../yjs': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '../yjs/index': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '../yjs/index.ts': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '../../yjs': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '../../yjs/index': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      '../../yjs/index.ts': path.resolve(__dirname, './__mocks__/yjs-index.js'),
      // Mock vector store modules for Storybook
      '../components/Editor3/components/FileManager2': path.resolve(__dirname, './__mocks__/FileManager2.js'),
      '../components/Editor3/components/FileManager2.jsx': path.resolve(__dirname, './__mocks__/FileManager2.js'),
      '@/components/Editor3/components/FileManager2': path.resolve(__dirname, './__mocks__/FileManager2.js'),
      '@/components/Editor3/components/FileManager2.jsx': path.resolve(__dirname, './__mocks__/FileManager2.js'),
      '../utils/vectorStoreDB': path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
      '../utils/vectorStoreDB.jsx': path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
      '@/utils/vectorStoreDB': path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
      '@/utils/vectorStoreDB.jsx': path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
      '../../utils/vectorStoreDB': path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
      '../../utils/vectorStoreDB.jsx': path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
      // Absolute path mocks for vector store
      [path.resolve(__dirname, '../src/components/Editor3/components/FileManager2')]: path.resolve(__dirname, './__mocks__/FileManager2.js'),
      [path.resolve(__dirname, '../src/components/Editor3/components/FileManager2.jsx')]: path.resolve(__dirname, './__mocks__/FileManager2.js'),
      [path.resolve(__dirname, '../src/utils/vectorStoreDB')]: path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
      [path.resolve(__dirname, '../src/utils/vectorStoreDB.jsx')]: path.resolve(__dirname, './__mocks__/vectorStoreDB.js'),
    };
    
    // Exclude YJS folder from being processed to prevent loading real files
    if (!config.optimizeDeps) {
      config.optimizeDeps = {};
    }
    config.optimizeDeps.exclude = config.optimizeDeps.exclude || [];
    config.optimizeDeps.exclude.push('yjs', 'y-websocket', 'y-indexeddb', 'y-protocols');
    
    // Define Node.js globals for browser environment to fix Next.js compatibility
    if (!config.define) {
      config.define = {};
    }
    config.define['__dirname'] = '"/app"';
    config.define['process.env.NODE_ENV'] = '"development"';
    
    // Add global polyfill and JSX loader for .js files
    config.optimizeDeps.esbuildOptions = {
      ...config.optimizeDeps.esbuildOptions,
      loader: {
        '.js': 'jsx',  // Handle JSX syntax in .js files
      },
      define: {
        global: 'globalThis',
      },
    };
    
    return config;
  }
};
export default config;