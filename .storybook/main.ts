import type { StorybookConfig } from "@storybook/nextjs-vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: [
    // Welcome page first so Storybook defaults to it on fresh visits
    "./components/Welcome.stories.tsx",
    // Documentation pages (intro, quick tour, concepts)
    "./docs/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    // "../src/**/*.mdx", // Temporarily disabled - vitest plugin excludes ../**/*.mdx causing no tests to run
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "./TranslationMode.stories.tsx",
    "./components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    path.resolve(__dirname, "addons/translation-mode/preset.js"),
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: [
    { from: "../public", to: "/" },
    { from: "../mocks", to: "/story-mocks" },
    { from: "../translation-cache", to: "/translation-cache" },
  ],

  async viteFinal(config) {
    // Disable Vite's publicDir to suppress "Assets in public directory cannot be imported
    // from JavaScript" warnings. Storybook's staticDirs already serves public files.
    config.publicDir = false;

    // Vite plugin to intercept CollaborationPlugin wrapper imports before pre-bundling
    const collabMockPath = path.resolve(
      __dirname,
      "./__mocks__/CollaborationPlugin.js",
    );

    config.plugins = config.plugins || [];
    config.plugins.push({
      name: "mock-collaboration-plugin",
      enforce: "pre",
      resolveId(source) {
        // Only mock our wrapper — NOT @lexical/react packages (LexicalNestedComposer depends on them)
        if (
          source.endsWith("/plugins/CollaborationPlugin") ||
          source.endsWith("/plugins/CollaborationPlugin.tsx")
        ) {
          return collabMockPath;
        }
        return null;
      },
    });

    // Configure path aliases for component imports
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@storybook-components": path.resolve(__dirname, "./components"),
      "@storybook-mocks": path.resolve(__dirname, "./__mocks__"),
      // General @/ → src/ alias matching Next.js tsconfig paths
      "@/": path.resolve(__dirname, "../src") + "/",
      // Mock AWS Amplify modules for Storybook
      // IMPORTANT: More specific sub-paths MUST come before shorter paths
      // to prevent esbuild from prefix-matching the shorter alias first
      "@aws-amplify/ui-react/styles.css": path.resolve(
        __dirname,
        "./__mocks__/empty.js",
      ),
      "@aws-amplify/ui-react": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-ui-react.js",
      ),
      "@aws-amplify/adapter-nextjs/data": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-adapter-nextjs.js",
      ),
      "@aws-amplify/adapter-nextjs": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-adapter-nextjs.js",
      ),
      "aws-amplify/api/internals": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-api-internals.js",
      ),
      "aws-amplify/api/server": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-api-server.js",
      ),
      "aws-amplify/auth/server": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-auth-server.js",
      ),
      "aws-amplify/data": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-data.js",
      ),
      "aws-amplify/auth": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-auth.js",
      ),
      "aws-amplify/storage": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-storage.js",
      ),
      "aws-amplify/api": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-api.js",
      ),
      "aws-amplify/utils": path.resolve(
        __dirname,
        "./__mocks__/aws-amplify-utils.js",
      ),
      // Mock Amplify utilities that use the real client
      "@/utils/amplifyClient": path.resolve(
        __dirname,
        "./__mocks__/amplifyClient.js",
      ),
      "../utils/amplifyClient": path.resolve(
        __dirname,
        "./__mocks__/amplifyClient.js",
      ),
      "../../utils/amplifyClient": path.resolve(
        __dirname,
        "./__mocks__/amplifyClient.js",
      ),
      // Mock next/navigation for App Router components
      "next/navigation": path.resolve(
        __dirname,
        "./__mocks__/next-navigation.js",
      ),
      // Mock next/server for server-only imports (used by @aws-amplify/adapter-nextjs)
      "next/server": path.resolve(__dirname, "./__mocks__/next-server.js"),
      // Mock i18next to integrate with Translation Mode
      "next-i18next": path.resolve(__dirname, "./__mocks__/next-i18next.js"),
      "next-intl": path.resolve(__dirname, "./__mocks__/next-intl.js"),
      "react-i18next": path.resolve(__dirname, "./__mocks__/react-i18next.js"),
      i18next: path.resolve(__dirname, "./__mocks__/i18next.js"),
      "i18next-resources-to-backend": path.resolve(
        __dirname,
        "./__mocks__/i18next-resources-to-backend.js",
      ),
      // Mock AuthContext for Storybook
      "@/context/authContext": path.resolve(
        __dirname,
        "./__mocks__/authContext.js",
      ),
      "../context/authContext": path.resolve(
        __dirname,
        "./__mocks__/authContext.js",
      ),
      "../../context/authContext": path.resolve(
        __dirname,
        "./__mocks__/authContext.js",
      ),
      // Alias the absolute path to the production authContext file
      [path.resolve(__dirname, "../src/context/authContext.jsx")]: path.resolve(
        __dirname,
        "./__mocks__/authContext.js",
      ),
      [path.resolve(__dirname, "../src/context/authContext")]: path.resolve(
        __dirname,
        "./__mocks__/authContext.js",
      ),
      // YJS: mock YjsProvider and y-websocket to prevent WebSocket connection attempts in Storybook
      [path.resolve(__dirname, "../src/yjs/YjsProvider")]: path.resolve(
        __dirname,
        "./__mocks__/YjsProvider.js",
      ),
      [path.resolve(__dirname, "../src/yjs/YjsProvider.ts")]: path.resolve(
        __dirname,
        "./__mocks__/YjsProvider.js",
      ),
      [path.resolve(__dirname, "../src/yjs/peerReviewHooks")]: path.resolve(
        __dirname,
        "./__mocks__/peerReviewHooks.js",
      ),
      [path.resolve(__dirname, "../src/yjs/peerReviewHooks.ts")]: path.resolve(
        __dirname,
        "./__mocks__/peerReviewHooks.js",
      ),
      "../../src/yjs/peerReviewHooks": path.resolve(
        __dirname,
        "./__mocks__/peerReviewHooks.js",
      ),
      "y-websocket": path.resolve(__dirname, "./__mocks__/y-websocket.js"),
      // Mock CollaborationPlugin wrapper to prevent Yjs sync errors during rapid test interactions
      // NOTE: Do NOT mock @lexical/react packages — LexicalNestedComposer depends on them
      [path.resolve(
        __dirname,
        "../src/components/Editor3/plugins/CollaborationPlugin",
      )]: path.resolve(__dirname, "./__mocks__/CollaborationPlugin.js"),
      [path.resolve(
        __dirname,
        "../src/components/Editor3/plugins/CollaborationPlugin.tsx",
      )]: path.resolve(__dirname, "./__mocks__/CollaborationPlugin.js"),
      // Mock vector store modules for Storybook
      "../components/Editor3/components/FileManager2": path.resolve(
        __dirname,
        "./__mocks__/FileManager2.js",
      ),
      "../components/Editor3/components/FileManager2.jsx": path.resolve(
        __dirname,
        "./__mocks__/FileManager2.js",
      ),
      "@/components/Editor3/components/FileManager2": path.resolve(
        __dirname,
        "./__mocks__/FileManager2.js",
      ),
      "@/components/Editor3/components/FileManager2.jsx": path.resolve(
        __dirname,
        "./__mocks__/FileManager2.js",
      ),
      "../utils/vectorStoreDB": path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),
      "../utils/vectorStoreDB.jsx": path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),
      "@/utils/vectorStoreDB": path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),
      "@/utils/vectorStoreDB.jsx": path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),
      "../../utils/vectorStoreDB": path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),
      "../../utils/vectorStoreDB.jsx": path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),

      // Absolute path mocks for vector store
      [path.resolve(
        __dirname,
        "../src/components/Editor3/components/FileManager2",
      )]: path.resolve(__dirname, "./__mocks__/FileManager2.js"),
      [path.resolve(
        __dirname,
        "../src/components/Editor3/components/FileManager2.jsx",
      )]: path.resolve(__dirname, "./__mocks__/FileManager2.js"),
      [path.resolve(__dirname, "../src/utils/vectorStoreDB")]: path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),
      [path.resolve(__dirname, "../src/utils/vectorStoreDB.jsx")]: path.resolve(
        __dirname,
        "./__mocks__/vectorStoreDB.js",
      ),
      // Mock server actions (marked "use server") that cannot run in Storybook
      [path.resolve(__dirname, "../app/actions/section")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/section.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      "../../../actions/section": path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/gamification")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/gamification.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      "../../../actions/gamification": path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
    };

    // Deduplicate React to prevent multiple instances
    if (!config.resolve) {
      config.resolve = {};
    }
    config.resolve.dedupe = [
      ...(config.resolve.dedupe || []),
      "react",
      "react-dom",
      "react/jsx-runtime",
    ];

    // Enable lazy compilation for faster initial load
    config.server = config.server || {};
    config.server.warmup = { clientFiles: [] };

    // Exclude YJS folder from being processed to prevent loading real files
    if (!config.optimizeDeps) {
      config.optimizeDeps = {};
    }
    config.optimizeDeps.exclude = config.optimizeDeps.exclude || [];
    config.optimizeDeps.exclude.push(
      "yjs",
      "y-websocket",
      "y-indexeddb",
      "y-protocols",
      "i18next",
      "i18next-resources-to-backend",
      "react-i18next",
      "@aws-amplify/adapter-nextjs",
    );

    // Pre-bundle heavy dependencies so they don't block story loading
    config.optimizeDeps.include = config.optimizeDeps.include || [];
    config.optimizeDeps.include.push(
      "lexical",
      "@lexical/react/LexicalComposer",
      "@lexical/react/LexicalRichTextPlugin",
      "@lexical/react/LexicalContentEditable",
      "@lexical/react/LexicalErrorBoundary",
      "@lexical/react/LexicalHistoryPlugin",
      "@lexical/react/LexicalListPlugin",
      "@lexical/react/LexicalTablePlugin",
      "@lexical/react/LexicalMarkdownShortcutPlugin",
      "@lexical/rich-text",
      "@lexical/list",
      "@lexical/table",
      "@lexical/code",
      "@lexical/link",
      "@lexical/utils",
      "@lexical/selection",
      "@lexical/markdown",
      "@mui/material",
      "@mui/icons-material",
      "@mui/x-data-grid",
      "@mui/x-tree-view",
      "@emotion/react",
      "@emotion/styled",
      "react-pdf",
      "framer-motion",
      "@ai-sdk/react",
    );

    // Define Node.js globals for browser environment to fix Next.js compatibility
    if (!config.define) {
      config.define = {};
    }
    config.define["__dirname"] = '"/app"';
    config.define["process.env.NODE_ENV"] = '"development"';

    // Suppress "use client" directive warnings from node_modules
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
          // Locale JSON files live in public/ for Next.js serving but are
          // legitimately imported in Storybook mocks for translation support.
          if (
            typeof warning.message === "string" &&
            warning.message.includes("public directory cannot be imported")
          )
            return;
          warn(warning);
        },
      },
    };

    // Add global polyfill and JSX loader for .js files
    config.optimizeDeps.esbuildOptions = {
      ...config.optimizeDeps.esbuildOptions,
      // es2022 required for @excalidraw/excalidraw ESM locales ("Arbitrary module namespace identifier names")
      target: "es2022",
      loader: {
        ".js": "jsx", // Handle JSX syntax in .js files
      },
      define: {
        global: "globalThis",
      },
    };

    return config;
  },
};
export default config;
