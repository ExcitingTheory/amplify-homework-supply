import { defineConfig, defineProject } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storybookConfigDir = path.resolve(__dirname, ".storybook");

/**
 * Vitest Configuration for Vitest 4+ with @storybook/addon-vitest
 *
 * Uses test.projects to define separate test configurations:
 * - Unit tests (happy-dom environment)
 * - Storybook component tests (browser mode with Playwright)
 *
 * This is the recommended approach for Vitest ≥ 4.0.
 */
export default defineConfig({
  test: {
    projects: [
      // Unit test project
      defineProject({
        plugins: [
          react({
            include: /\.[jt]sx?$/,
          }),
        ],
        test: {
          name: "unit",
          globals: true,
          environment: "happy-dom",
          setupFiles: ["./test/setup.ts"],
          testTimeout: 30000,
          hookTimeout: 30000,
          include: [
            "test/**/*.test.ts",
            "test/**/*.test.tsx",
            "src/**/*.test.ts",
            "src/**/*.test.tsx",
            "amplify/functions/**/*.test.ts",
            ".github/skills/**/*.test.ts",
          ],
          exclude: [
            "node_modules",
            "dist",
            ".amplify",
            ".next",
            "out",
            "build",
            "test/integration/**",
            "test/performance/**",
            "test/storybook/smoke-test-all-stories.test.tsx",
          ],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
            "@storybook/__mocks__": path.resolve(
              storybookConfigDir,
              "./__mocks__",
            ),
          },
          conditions: ["import", "module", "browser", "default"],
          mainFields: ["module", "jsnext:main", "jsnext", "main"],
        },
        optimizeDeps: {
          include: [
            "@mui/material",
            "@mui/icons-material",
            "react-beautiful-dnd",
            "lodash",
            "@lexical/rich-text",
            "@lexical/list",
            "@lexical/code",
            "@lexical/link",
            "@lexical/table",
            "@lexical/hashtag",
            "@lexical/markdown",
            "lexical",
          ],
        },
      }),
      // Integration test project (requires running backend)
      defineProject({
        plugins: [
          react({
            include: /\.[jt]sx?$/,
          }),
        ],
        test: {
          name: "integration",
          globals: true,
          environment: "happy-dom",
          setupFiles: ["./test/setup.ts"],
          testTimeout: 60000,
          hookTimeout: 60000,
          include: [
            "test/integration/**/*.test.ts",
            "test/integration/**/*.test.tsx",
          ],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
          },
        },
      }),
      // Storybook component test project
      defineProject({
        plugins: [
          react({
            include: /\.[jt]sx?$/,
          }),
          storybookTest({
            configDir: storybookConfigDir,
            storybookScript: "npx storybook dev --ci --port 6006",
          }),
        ],
        test: {
          name: "storybook",
          globals: true,
          testTimeout: 120000, // 120s for interactive tests
          hookTimeout: 120000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            fileParallelism: false, // Disable parallel execution to avoid cache conflicts
          },
          // Use relative path for setupFiles so Vite can serve it in browser mode
          setupFiles: [".storybook/vitest.setup.ts"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.amplify/**",
            "**/.next/**",
            "**/src/stories/index.stories.jsx", // Temporarily exclude - qrcode/pngjs browser issue
            "**/src/stories/pages-*.stories.tsx", // Temporarily exclude - qrcode/pngjs browser issue (split from pages.stories.tsx)
          ],
          deps: {
            optimizer: {
              web: {
                enabled: false, // Disable optimization for browser tests to prevent reloads
              },
            },
          },
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
            "@storybook/__mocks__": path.resolve(
              storybookConfigDir,
              "./__mocks__",
            ),
            // Mock CollaborationPlugin wrapper to avoid "splice: could not find collab element node" errors
            // NOTE: Do NOT mock @lexical/react packages — LexicalNestedComposer depends on them
            [path.resolve(
              __dirname,
              "src/components/Editor3/plugins/CollaborationPlugin",
            )]: path.resolve(
              storybookConfigDir,
              "./__mocks__/CollaborationPlugin.js",
            ),
            [path.resolve(
              __dirname,
              "src/components/Editor3/plugins/CollaborationPlugin.tsx",
            )]: path.resolve(
              storybookConfigDir,
              "./__mocks__/CollaborationPlugin.js",
            ),
            // Mock moderateContent utility to prevent OPENAI_API_KEY errors
            [path.resolve(__dirname, "src/utils/moderateContent")]:
              path.resolve(
                storybookConfigDir,
                "./__mocks__/moderateContent.js",
              ),
            [path.resolve(__dirname, "src/utils/moderateContent.jsx")]:
              path.resolve(
                storybookConfigDir,
                "./__mocks__/moderateContent.js",
              ),
            // Mock ALL server actions that require API keys or server environment
            [path.resolve(__dirname, "app/actions/moderate")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/moderate.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/moderation-notify")]:
              path.resolve(storybookConfigDir, "./__mocks__/server-actions.js"),
            [path.resolve(__dirname, "app/actions/moderation-notify.ts")]:
              path.resolve(storybookConfigDir, "./__mocks__/server-actions.js"),
            [path.resolve(__dirname, "app/actions/drill")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/drill.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/section")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/section.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/gamification")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/gamification.ts")]:
              path.resolve(storybookConfigDir, "./__mocks__/server-actions.js"),
            [path.resolve(__dirname, "app/actions/generate")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/generate.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/grading")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/grading.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/chat")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/chat.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/feedback")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/feedback.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/jobs")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/jobs.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/embeddings")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/embeddings.ts")]:
              path.resolve(storybookConfigDir, "./__mocks__/server-actions.js"),
            [path.resolve(__dirname, "app/actions/storage")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/storage.ts")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/peerReview")]: path.resolve(
              storybookConfigDir,
              "./__mocks__/server-actions.js",
            ),
            [path.resolve(__dirname, "app/actions/peerReview.ts")]:
              path.resolve(storybookConfigDir, "./__mocks__/server-actions.js"),
            // Workaround for Lexical packages that don't have "." export
            "@lexical/react$": "@lexical/react/LexicalComposer",
            // Stub native canvas module (pulled in by linkedom) to prevent .node loader error
            canvas: path.resolve(storybookConfigDir, "./__mocks__/canvas.js"),
          },
          conditions: ["import", "module", "browser", "default"],
          mainFields: ["module", "jsnext:main", "jsnext", "main"],
        },
        optimizeDeps: {
          include: [
            "@mui/material",
            "@mui/icons-material",
            "react-beautiful-dnd",
            "lodash",
            "@lexical/rich-text",
            "@lexical/list",
            "@lexical/code",
            "@lexical/link",
            "@lexical/table",
            "@lexical/hashtag",
            "@lexical/markdown",
            "lexical",
            "zod",
            "@ai-sdk/openai",
            "ai",
          ],
          exclude: [
            "qrcode", // Exclude qrcode to prevent Node.js module issues in browser
            "canvas", // Exclude canvas to prevent .node native module loader error
          ],
        },
        server: {
          hmr: false, // Disable HMR during tests to prevent cache corruption
          watch: {
            ignored: ["**/node_modules/**", "**/.git/**"],
          },
          fs: {
            strict: false, // Allow serving files outside root
          },
        },
        cacheDir: path.resolve(__dirname, "node_modules/.vite/storybook"),
        clearScreen: false,
      }),
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        ".storybook/",
        "**/*.test.ts",
        "**/*.test.js",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@storybook/__mocks__": path.resolve(__dirname, "./.storybook/__mocks__"),
    },
  },
});
