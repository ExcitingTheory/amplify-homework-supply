// This file has been automatically migrated to valid ESM format by Storybook.
import type { StorybookConfig } from "@storybook/nextjs-vite";
import path, { dirname } from "path";
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
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-vitest"),
    path.resolve(__dirname, "addons/translation-mode/preset.js"),
  ],
  framework: getAbsolutePath("@storybook/nextjs-vite"),
  features: {
    experimentalRSC: true,
  },
  staticDirs: [
    { from: "../public", to: "/" },
    { from: "../test/mocks", to: "/story-mocks" },
    { from: "../translation-cache", to: "/translation-cache" },
  ],

  // Force production mode for manager bundler so React 19's jsx-runtime
  // resolves to the production build (matching Storybook's bundled React).
  // Without this, the dev jsx-runtime is bundled and crashes because
  // Storybook's React globals don't expose dev-only internals.
  env: (config) => ({
    ...config,
    NODE_ENV: "production",
    STORYBOOK_BASE_PATH: process.env.STORYBOOK_BASE_PATH || "/",
  }),

  async viteFinal(config) {
    // Base path for GitHub Pages deployment (e.g. /amplify-homework-supply/).
    // Used by the rewrite plugin below. In local dev, defaults to '/' (no rewriting).
    const basePath = process.env.STORYBOOK_BASE_PATH || "/";

    // Disable Vite's publicDir to suppress "Assets in public directory cannot be imported
    // from JavaScript" warnings. Storybook's staticDirs already serves public files.
    config.publicDir = false;

    // Vite plugin to intercept CollaborationPlugin wrapper imports before pre-bundling
    const collabMockPath = path.resolve(
      __dirname,
      "./__mocks__/CollaborationPlugin.js",
    );

    config.plugins = config.plugins || [];

    // Rewrite absolute paths for static assets to include the base path for
    // GitHub Pages deployment. Without this, paths like /story-mocks/image.jpg
    // resolve to the domain root instead of the /amplify-homework-supply/ subpath.
    if (basePath !== "/") {
      const staticPrefixes = [
        "/story-mocks/",
        "/translation-cache/",
        "/locales/",
      ];
      config.plugins.push({
        name: "rewrite-static-asset-paths",
        enforce: "pre",
        transform(code, id) {
          if (id.includes("node_modules")) return null;
          if (!/\.(jsx?|tsx?|mjs|json)$/.test(id)) return null;
          let modified = code;
          for (const prefix of staticPrefixes) {
            if (modified.includes(prefix)) {
              modified = modified.replaceAll(
                prefix,
                `${basePath}${prefix.slice(1)}`,
              );
            }
          }
          return modified !== code ? modified : null;
        },
      });
    }

    // Strip "use client" / "use server" directives so Rollup never sees them.
    // This eliminates MODULE_LEVEL_DIRECTIVE warnings AND the associated
    // "Can't resolve original location" sourcemap errors.
    config.plugins.push({
      name: "strip-use-directives",
      enforce: "pre",
      transform(code, id) {
        if (id.includes("node_modules")) return null;
        if (!/\.(jsx?|tsx?|mjs)$/.test(id)) return null;
        // Match directive anywhere in first 500 chars (handles JSDoc, comments, whitespace)
        const directiveRe = /['"]use (client|server)['"];?[^\S\n]*\n?/;
        const idx = code.search(directiveRe);
        if (idx === -1 || idx > 500) return null;
        const match = code.match(directiveRe)!;
        // Replace directive with newlines to preserve line count for sourcemaps
        const replacement = "\n".repeat((match[0].match(/\n/g) || []).length);
        const newCode =
          code.slice(0, idx) + replacement + code.slice(idx + match[0].length);
        return newCode;
      },
    });

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

    // Mock all server actions (app/actions/*) to prevent OPENAI_API_KEY errors
    const serverActionsMockPath = path.resolve(
      __dirname,
      "./__mocks__/server-actions.js",
    );
    config.plugins.push({
      name: "mock-server-actions",
      enforce: "pre",
      resolveId(source, importer) {
        if (!importer) return null;
        // Match any import that resolves to app/actions/
        if (
          source.includes("app/actions/") ||
          source.includes("/actions/drill") ||
          source.includes("/actions/moderate") ||
          source.includes("/actions/grading") ||
          source.includes("/actions/generate") ||
          source.includes("/actions/chat") ||
          source.includes("/actions/feedback") ||
          source.includes("/actions/jobs") ||
          source.includes("/actions/section") ||
          source.includes("/actions/gamification") ||
          source.includes("/actions/embeddings") ||
          source.includes("/actions/storage") ||
          source.includes("/actions/peerReview") ||
          source.includes("/actions/moderation-notify")
        ) {
          return serverActionsMockPath;
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
      // Mock moderateContent utility to prevent OPENAI_API_KEY errors
      [path.resolve(__dirname, "../src/utils/moderateContent")]: path.resolve(
        __dirname,
        "./__mocks__/moderateContent.js",
      ),
      [path.resolve(__dirname, "../src/utils/moderateContent.jsx")]:
        path.resolve(__dirname, "./__mocks__/moderateContent.js"),
      "../utils/moderateContent": path.resolve(
        __dirname,
        "./__mocks__/moderateContent.js",
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
      // Mock server actions that import amplify_outputs.json (gitignored — missing in CI)
      [path.resolve(__dirname, "../app/actions/generate")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/generate.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/grading")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/grading.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/chat")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/chat.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/feedback")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/feedback.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/jobs")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/jobs.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/moderate")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/moderate.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/moderation-notify")]:
        path.resolve(__dirname, "./__mocks__/server-actions.js"),
      [path.resolve(__dirname, "../app/actions/moderation-notify.ts")]:
        path.resolve(__dirname, "./__mocks__/server-actions.js"),
      [path.resolve(__dirname, "../app/actions/drill")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/drill.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/embeddings")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/embeddings.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/storage")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/storage.ts")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/peerReview")]: path.resolve(
        __dirname,
        "./__mocks__/server-actions.js",
      ),
      [path.resolve(__dirname, "../app/actions/peerReview.ts")]: path.resolve(
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
      "@mui/material/Fade",
      "@mui/material/Collapse",
      "@mui/icons-material",
      "@mui/x-data-grid",
      "@mui/x-tree-view",
      "@emotion/react",
      "@emotion/styled",
      "react-pdf",
      "pdfjs-dist/build/pdf.worker.mjs",
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
          // "use client" in node_modules is expected (React, MUI, etc.)
          // Our own files are stripped by the plugin above.
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
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

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
