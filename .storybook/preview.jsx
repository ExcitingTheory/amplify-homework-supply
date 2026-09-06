/**
 * Storybook Preview Configuration
 *
 * Global Mocking Strategy:
 * - AWS Amplify modules (api, auth, storage, datastore, utils) are mocked via webpack aliases in main.js
 * - Mock implementations are in .storybook/__mocks__/ directory
 * - getCachedUrl utility is  also mocked for safe file URL generation
 * - All mocks are global and work across all stories without needing jest.mock()
 *
 * Mock Features:
 * - AI generation (text-to-image, text-to-speech) with realistic delays
 * - File storage and retrieval with placeholder data URLs
 * - Authentication with mock credentials
 * - DataStore operations with in-memory storage
 */

// Polyfill for Node.js modules needed by qrcode/pngjs in browser environment
if (typeof window !== "undefined") {
  // Adding global polyfill
  window.global = window;

  // Polyfill vitest/chai expect context for Storybook dev server.
  // Vitest 4.x's JestChaiExpect plugin calls getCustomEqualityTesters() which reads
  // globalThis[Symbol.for("$$jest-matchers-object")].customEqualityTesters.
  // In the vitest runner this is initialized by setupGlobalExpect(), but in the
  // Storybook dev server UI (viewing interactions) that setup hasn't run.
  const JEST_MATCHERS_OBJECT = Symbol.for("$$jest-matchers-object");
  if (!globalThis[JEST_MATCHERS_OBJECT]) {
    Object.defineProperty(globalThis, JEST_MATCHERS_OBJECT, {
      configurable: true,
      value: {
        state: new WeakMap(),
        matchers: Object.create(null),
        customEqualityTesters: [],
      },
    });
  }

  // Mock util module for pngjs which expects Node.js util
  if (!window.util) {
    window.util = {
      inherits: function (ctor, superCtor) {
        if (!ctor || !superCtor) return;
        try {
          ctor.super_ = superCtor;
          // Only create prototype if it doesn't exist or is not already set up
          if (
            !ctor.prototype ||
            Object.getPrototypeOf(ctor.prototype) !== superCtor.prototype
          ) {
            ctor.prototype = Object.create(superCtor.prototype, {
              constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true,
              },
            });
          }
        } catch (e) {
          // Silently fail if prototype setup fails
          console.warn("[preview] Failed to set up prototype inheritance:", e);
        }
      },
    };
  }

  // Mock stream module basics that pngjs might need
  if (!window.stream && !window.require) {
    window.stream = { Writable: class {}, Readable: class {} };
  }
}

import React from "react";
import {
  ThemeProvider,
  useColorScheme,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import CircularProgress from "@mui/material/CircularProgress";
import { fn } from "storybook/test";

// PDF.js worker configuration removed from preview.jsx — it was eagerly
// pulling 36MB of pdfjs-dist into every story's bundle. Components that
// use react-pdf (PdfThumbnail, PdfViewerComponent) already configure
// the worker with their own guard: `if (!pdfjs.GlobalWorkerOptions.workerSrc)`.
import { useGlobals } from "storybook/preview-api";
import "../src/components/Editor3/theme.css";
import "../src/components/Editor3/components/LanguageEditorTheme.css";
import "./storybook.css";

// Import the app's shared theme (with cssVariables + colorSchemes)
import appTheme from "../src/theme";

// Keep portal-based overlays inside the Storybook canvas
const theme = createTheme(appTheme, {
  components: {
    MuiModal: { defaultProps: { disablePortal: true } },
  },
});

// Import action tracking
import { createTrackableActions } from "./code/action-tracker";
import { getStoryId } from "./code/route-map";
import { initializeTaskCompletion } from "./code/task-completion";

// Import real context providers
import { AuthProvider } from "./__mocks__/authContext";
import { FilesProvider } from "../src/context/fileContext";
import { DictionaryProvider } from "../src/context/dictionaryContext";
import { SectionProvider } from "../src/context/sectionContext";
import { UnitProvider } from "../src/context/unitContext";
import { AudioPlayerProvider } from "../src/components/Editor3/context/AudioPlayerContext";
import { ChatContextProvider } from "../src/context/chatContext";
import { SettingsProvider } from "../src/context/settingsContext";
import { GamificationProvider } from "../src/context/gamificationContext";

// Import mock helpers
import {
  clearMockData,
  initializeMockData,
  generateClient,
} from "./__mocks__/aws-amplify-data";
import { initializeMockData as initializeGen2MockData } from "./__mocks__/aws-amplify-data";

// Mock client instance for GamificationProvider
const mockGamificationClient = generateClient();
import { mockChatAPI } from "./__mocks__/chat-api";

// Import Next.js router mock
import { RouterContext, createMockRouter } from "./__mocks__/next-router";
import { setNavigationState } from "@storybook-mocks/next-navigation";

// Import translation mode addon
import { withTranslationMode } from "./addons/translation-mode";
import { globalTypes as translationGlobalTypes } from "./addons/translation-mode/globalTypes";

// Import custom docs page template
import DocsPageWithPanel from "./components/DocsPageWithPanel";

// Import i18n for Storybook
import i18n from "./i18next";

// Import setLocale from the next-intl mock to sync language switching
import { setLocale } from "./__mocks__/next-intl";

/**
 * Synchronizes MUI's internal color scheme mode with the Storybook toolbar selection.
 * Must be rendered inside ThemeProvider. Prevents child components'
 * useColorScheme/useColorMode calls from overriding the Storybook-selected scheme.
 */
function ColorSchemeSynchronizer({ scheme }) {
  const { setMode } = useColorScheme();
  React.useEffect(() => {
    setMode(scheme);
  }, [scheme, setMode]);
  return null;
}

/** Loading screen shown while a story's component tree mounts */
function StoryLoadingFallback({ title, component, phase, isDark }) {
  // Prefer the last segment of the story title (e.g. "Editor" from "📚 Creating Lessons/Editor")
  // over context.component.name which often resolves to generic names like "ComponentType"
  const displayName = title?.split("/").pop() || component || "Story";

  const phaseLabel =
    {
      init: "Initializing mock data…",
      providers: "Setting up context providers…",
      render: `Rendering ${displayName}…`,
    }[phase] || `Loading ${displayName}…`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        gap: 16,
        padding: 32,
        backgroundColor: isDark ? "#121212" : "#fafafa",
        color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
      }}
    >
      <CircularProgress
        size={44}
        thickness={4}
        sx={{ color: isDark ? "#90caf9" : undefined }}
      />
      <span style={{ fontSize: "0.875rem", fontFamily: "Roboto, sans-serif" }}>
        {phaseLabel}
      </span>
    </div>
  );
}

/**
 * Deferred rendering wrapper — shows loading fallback on first frame,
 * then renders the actual story on the next animation frame.
 * Keeps the fallback visible as an overlay until the children are committed to the DOM,
 * preventing a blank gap between the fallback disappearing and the story rendering.
 */
function DeferredStory({ children, title, component, isDark }) {
  const [showFallback, setShowFallback] = React.useState(true);

  // Hide the fallback overlay after children commit to the DOM
  const onChildrenMount = React.useCallback((node) => {
    if (node) {
      requestAnimationFrame(() => setShowFallback(false));
    }
  }, []);

  return (
    <div
      style={{
        position: "relative",
        minHeight: showFallback ? 240 : undefined,
      }}
    >
      {showFallback && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#121212" : "#fafafa",
          }}
        >
          <StoryLoadingFallback
            title={title}
            component={component}
            phase="render"
            isDark={isDark}
          />
        </div>
      )}
      <div ref={onChildrenMount}>{children}</div>
    </div>
  );
}

// Mock navigator.sendBeacon (used by analytics/vitals — no-op in Storybook)
if (typeof navigator !== "undefined") {
  navigator.sendBeacon = () => true;
}

// Mock fetch for API endpoints that would call external services
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  // Intercept chat API calls
  if (typeof url === "string" && url.includes("/api/chat")) {
    console.log("[Mock Fetch] Intercepted /api/chat");

    const body = JSON.parse(options?.body || "{}");
    const { messages, context } = body;

    // Generate mock response
    const responseText = await mockChatAPI(messages, context);

    // Create a readable stream using AI SDK "data" stream protocol format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Simulate streaming by sending chunks
        const words = responseText.split(" ");
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          const chunk = words[i] + (i < words.length - 1 ? " " : "");
          // AI SDK data stream protocol: 0:JSON_STRING\n for text chunks
          controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
        }
        // Send finish event
        controller.enqueue(
          encoder.encode(`d:${JSON.stringify({ finishReason: "stop" })}\n`),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Intercept suggest-blocks API calls
  if (typeof url === "string" && url.includes("/api/suggest-blocks")) {
    console.log("[Mock Fetch] Intercepted /api/suggest-blocks");

    const body = JSON.parse(options?.body || "{}");
    const { unitStructure, currentContext } = body;

    // Select mock suggestion data based on lesson structure
    const suggestBlocksMocks =
      await import("../test/mocks/responses/suggestBlocks.js");
    const blockCount = unitStructure?.length || 0;
    const lastBlock = unitStructure?.[blockCount - 1];
    let mockData;

    if (blockCount === 0) {
      mockData = suggestBlocksMocks.emptyLesson;
    } else if (lastBlock?.type === "heading") {
      mockData = suggestBlocksMocks.afterHeading;
    } else if (lastBlock?.type === "paragraph" && blockCount <= 2) {
      mockData = suggestBlocksMocks.afterExplanation;
    } else if (lastBlock?.type === "paragraph" && blockCount > 2) {
      mockData = suggestBlocksMocks.afterMultipleExplanations;
    } else if (lastBlock?.type === "quiz") {
      mockData = suggestBlocksMocks.afterQuiz;
    } else if (lastBlock?.type?.includes("answer")) {
      mockData = suggestBlocksMocks.afterPractice;
    } else {
      mockData = suggestBlocksMocks.afterExplanation;
    }

    // Fallback if import doesn't have the key
    if (!mockData) {
      mockData = {
        suggestions: [
          {
            type: "paragraph",
            label: "Add Explanation",
            icon: "📝",
            reasoning: "Mock suggestion for Storybook",
            priority: "high",
          },
        ],
        overallAssessment: "Mock assessment",
      };
    }

    // Transform legacy mock data (type/label/icon format) into the production
    // tool result format that toDataStreamResponse() emits from the route's
    // insert_* tools: { success, action, blockType, blockData, preview, reasoning, message }
    const suggestions = (mockData.suggestions || []).map((s) => ({
      success: true,
      action: "insert_editor_block",
      blockType: s.type,
      blockData:
        s.type === "heading"
          ? { level: "h2", text: s.label }
          : s.type === "paragraph"
            ? { markdown: s.reasoning }
            : s.type === "quiz"
              ? { questionIDs: ["mock-q-1", "mock-q-2"] }
              : s.type === "answer"
                ? { wordIDs: ["mock-w-1", "mock-w-2"] }
                : s.type === "meaning-association"
                  ? { wordIDs: ["mock-w-1", "mock-w-2", "mock-w-3"] }
                  : s.type === "custom-answer"
                    ? { questionIDs: ["mock-q-1"] }
                    : {},
      preview: { text: s.label },
      reasoning: s.reasoning,
      message: `${s.label} (${s.type})`,
    }));

    // Emit AI SDK data stream protocol — one tool result per suggestion
    // Matches production: each insert_* tool returns independently via 9: prefix
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        await new Promise((resolve) => setTimeout(resolve, 300));

        for (let i = 0; i < suggestions.length; i++) {
          const toolCallId = `call_mock_${Date.now()}_${i}`;
          const toolName = `insert_${suggestions[i].blockType}`;

          // Emit tool call start (b: prefix)
          controller.enqueue(
            encoder.encode(`b:${JSON.stringify({ toolCallId, toolName })}\n`),
          );

          // Emit tool result (9: prefix)
          const toolResult = {
            toolCallId,
            toolName,
            args: {},
            result: suggestions[i],
          };
          controller.enqueue(
            encoder.encode(`9:${JSON.stringify(toolResult)}\n`),
          );
        }

        // Send finish event
        controller.enqueue(
          encoder.encode(`d:${JSON.stringify({ finishReason: "stop" })}\n`),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Intercept content-completion API calls
  if (typeof url === "string" && url.includes("/api/content-completion")) {
    console.log("[Mock Fetch] Intercepted /api/content-completion");

    const body = JSON.parse(options?.body || "{}");
    const { prompt } = body;

    // Generate contextual mock completion based on prompt
    let completionText =
      "This is a sample paragraph about Japanese language. " +
      "The hiragana writing system consists of 46 basic characters. " +
      "Each character represents a syllable, making it a syllabary rather than an alphabet.";

    if (prompt?.includes("verb") || prompt?.includes("動詞")) {
      completionText =
        "Japanese verbs conjugate based on tense, politeness level, and mood. " +
        "The dictionary form (辞書形) is the base form used in casual speech. " +
        "For polite speech, verbs take the -ます form.";
    } else if (prompt?.includes("hiragana") || prompt?.includes("ひらがな")) {
      completionText =
        "Hiragana (ひらがな) is one of three Japanese writing systems. " +
        "It is used for native Japanese words and grammatical elements. " +
        "Children learn hiragana first before moving to katakana and kanji.";
    }

    // Stream text chunks using AI SDK data stream protocol
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = completionText.split(" ");
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          const chunk = words[i] + (i < words.length - 1 ? " " : "");
          controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
        }
        controller.enqueue(
          encoder.encode(`d:${JSON.stringify({ finishReason: "stop" })}\n`),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Intercept grade-ai API calls (CustomAINode grading)
  if (typeof url === "string" && url.includes("/api/grade-ai")) {
    console.log("[Mock Fetch] Intercepted /api/grade-ai");

    // Return a mock AI grading JSON response (not streaming)
    const mockGrading = {
      correct: true,
      score: 75,
      feedback:
        "Good understanding of the concept. The answer addresses key points but could benefit from more specific examples.",
    };

    return new Response(JSON.stringify(mockGrading), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Intercept analytics API calls (no-op in Storybook)
  if (typeof url === "string" && url.includes("/api/analytics")) {
    console.log("[Mock Fetch] Intercepted /api/analytics");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Intercept vitals API calls (no-op in Storybook)
  if (typeof url === "string" && url.includes("/api/vitals")) {
    console.log("[Mock Fetch] Intercepted /api/vitals");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Intercept HLS API calls (return valid test manifest)
  if (typeof url === "string" && url.includes("/api/hls")) {
    console.log("[Mock Fetch] Intercepted /api/hls");
    // Apple's public bipbop test stream — valid master playlist with multiple variants
    const manifest = [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      "#EXT-X-STREAM-INF:BANDWIDTH=200000,RESOLUTION=960x540",
      "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/gear1/prog_index.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=311111,RESOLUTION=480x270",
      "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/gear2/prog_index.m3u8",
      "#EXT-X-STREAM-INF:BANDWIDTH=484444,RESOLUTION=640x360",
      "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/gear3/prog_index.m3u8",
      "",
    ].join("\n");
    return new Response(manifest, {
      status: 200,
      headers: { "Content-Type": "application/vnd.apple.mpegurl" },
    });
  }

  // Pass through other requests
  return originalFetch(url, options);
};

// Lazy-initialize task completion detection — defer to idle callback so it
// doesn't compete with the first story render.
if (typeof window !== "undefined") {
  let taskCompletionUnsubscribe = null;

  const initTaskCompletion = () => {
    if (!taskCompletionUnsubscribe) {
      taskCompletionUnsubscribe = initializeTaskCompletion();
      console.log("[Preview] Task completion detector initialized");
    }
  };

  // Use requestIdleCallback (with setTimeout fallback) to defer initialization
  if ("requestIdleCallback" in window) {
    requestIdleCallback(initTaskCompletion, { timeout: 3000 });
  } else {
    setTimeout(initTaskCompletion, 2000);
  }

  // Cleanup on unload
  window.addEventListener("beforeunload", () => {
    if (taskCompletionUnsubscribe) {
      taskCompletionUnsubscribe();
    }
  });
}

// Use the app's shared theme with CSS variables and dark mode support
// The theme is imported from src/theme.js

/** @type { import('@storybook/nextjs').Preview } */
const preview = {
  globalTypes: {
    ...translationGlobalTypes,
    colorScheme: {
      description: "Color scheme",
      defaultValue: "light",
      toolbar: {
        title: "Color Scheme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "system", title: "System", icon: "settings" },
        ],
        dynamicTitle: true,
      },
    },
  },

  parameters: {
    // Disable onboarding addon
    onboarding: {
      disabled: true,
    },

    // Note: Base action handlers are defined here but will be wrapped
    // with tracking in the decorator below based on story context
    actions: {
      args: {
        onClick: fn(),
        onChange: fn(),
        onSubmit: fn(),
        onClose: fn(),
        onOpen: fn(),
        onSelect: fn(),
        onDelete: fn(),
        onAdd: fn(),
        onRemove: fn(),
        onToggle: fn(),
        onHover: fn(),
        onFocus: fn(),
        onBlur: fn(),
        onSave: fn(),
        onCancel: fn(),
        onEdit: fn(),
        onUpdate: fn(),
        onCreate: fn(),
      },
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: "requiredFirst",
    },

    nextjs: {
      appDirectory: true,
    },

    // Add viewport configuration for better responsive testing
    viewport: {
      options: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
          type: "mobile",
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
      },
    },

    // Configure layout settings
    layout: "padded",

    // Better docs display with toolbar support
    docs: {
      toc: true,
      source: {
        state: "open",
      },
      // Use custom docs page template with embedded controls panel
      page: DocsPageWithPanel,
      // Render stories in canvas mode within docs to show toolbar & addons
      canvas: {
        withToolbar: true,
      },
      // Keep stories inline but with full canvas features
      story: {
        inline: true,
        height: "auto",
      },
    },

    // Enable toolbar and panel by default for all stories and docs
    options: {
      showPanel: true,
      showToolbar: true,
      storySort: {
        order: [
          "🏠 Getting Started",
          [
            "Welcome",
            "Introduction",
            "Why Homework Supply",
            "Quick Tour",
            ["Instructor Workflow", "Student Workflow", "AI Assistant", "*"],
            "Core Concepts",
            "For Developers",
            ["Architecture", "Dev Setup", "*"],
            "Onboarding",
            "Keyboard Shortcuts",
            "*",
          ],
          "✏️ Lesson Editor",
          [
            "Editor",
            "Workbook",
            "Narrative Reader",
            "Toolbar",
            "Metadata",
            "Editor Components",
            "Configuration",
            ["Manager", "Assignment", "*"],
            "AI Suggestions",
            [
              "Content Suggestion",
              "Content Completion",
              "Block Suggestion",
              "Block Suggestion (AI Mode)",
              "*",
            ],
            "Content Blocks",
            [
              "Quiz",
              "Meaning Association",
              "Answer",
              "Answer (Audio & Drawing)",
              "Custom Answer",
              "Custom Answer (Audio & Drawing)",
              "Word Block",
              "*",
            ],
            "Media",
            [
              "Images",
              "YouTube",
              "Playlist",
              "Audio Waveform Player",
              "PDF Viewer",
              "*",
            ],
            "Formatting",
            [
              "Color Picker",
              "Floating Link Editor",
              "Layout",
              "Link",
              "Table",
              "*",
            ],
            "Interactions",
            [
              "Autocomplete",
              "Drag Drop Paste",
              "Draggable Block",
              "Search Highlight",
              "*",
            ],
            "Workflow",
            ["Auto Embed", "Unit Completed", "*"],
            "Nodes",
            ["File Metadata", "*"],
            "*",
          ],
          "📁 Content Management",
          [
            "File Manager",
            "Dictionary Editor",
            "Question Editor",
            "Vocabulary Review",
            "Questions Review",
            "PDF Thumbnail",
            "*",
          ],
          "💬 AI Assistant",
          [
            "Chat Sidebar",
            "AI Feedback Widget",
            "Content Generation",
            "Search Results",
            "Components",
            "*",
          ],
          "🎙️ Recording Studio",
          [
            "Recording Studio",
            "Recording Studio (Legacy)",
            "Recording Studio Modal",
            "Screenplay Editor",
            "Horizontal Timeline",
            "*",
          ],
          "📓 Workbook",
          [
            "Progress",
            "Connection Status",
            "AI Feedback Snackbar",
            "Tutor Cursor Overlay",
            "Tutor Presence Banner",
            "Block History Timeline",
            "Comment Gutter Icon",
            "Comment Thread Drawer",
            "Presence Bar",
            "*",
          ],
          "🏆 Gamification",
          [
            "XP & Progression",
            [
              "Animated XP Counter",
              "XP Toast",
              "Homework XP Summary",
              "Level Badge",
              "Progress Rings",
              "Rank Change Toast",
              "Personal Best Banner",
              "Skill Tree",
              "Content Lock Card",
              "Content Unlock Animation",
              "*",
            ],
            "Badges & Celebrations",
            [
              "Badge Icon",
              "Badge Shelf",
              "Badge Coin Flip",
              "Nailed-It Badge",
              "Nailed-It Celebration",
              "Nailed-It Wall",
              "*",
            ],
            "Streaks",
            ["Streak Calendar", "Streak Indicator", "Streak Shield", "*"],
            "Avatars & Cosmetics",
            [
              "DiceBear Avatar",
              "Avatar Customizer",
              "Avatar Editor",
              "Armor Editor",
              "Cosmetic Selector",
              "Armoria Shield",
              "*",
            ],
            "Squads & Teams",
            [
              "Squad Crest",
              "Squad Editor",
              "Squad Join Panel",
              "Squad Leaderboard",
              "Squad Post Editor",
              "Squad Post Feed",
              "Group Challenge Card",
              "Boss Battle Card",
              "Campaign Briefing",
              "*",
            ],
            "Easter Eggs",
            [
              "Easter Egg Toast",
              "Hidden Easter Egg",
              "Pixel Sprite Mascot",
              "*",
            ],
            "Toasts",
            ["Gamification Toast Layer", "*"],
            "Instructor",
            ["Instructor Gamification Panel", "Storybook Promo Panel", "*"],
            "*",
          ],
          "🤝 Peer Review",
          [
            "Chat",
            "Feedback Prompt",
            "Join By Code",
            "Join Dialog",
            "Open Button",
            "Room Invite",
            "Invitations",
            "*",
          ],
          "🎯 Practice Drills",
          ["Dialog", "Workbook", "Progress", "Config Popup", "*"],
          "📊 Instructor Tools",
          [
            "Dashboard",
            "Graded Workbook Viewer",
            "Inline Grade Cell",
            "Leaderboard",
            "*",
          ],
          "🌐 Internationalization",
          ["Translation Mode", "*"],
          "🔌 Offline & Sync",
          [
            "Offline Banner",
            "Prefetch Badge",
            "Storage Management",
            "Sync Status Indicator",
            "*",
          ],
          "🧩 UI Components",
          [
            "Global Chat Button",
            "Global Chat Drawer",
            "Sortable Answers",
            "Section Assigner",
            "Meaning Association Exercise",
            "Question Block",
            "Moderation Badge",
            "Moderation Panel",
            "User Avatar",
            "Permission Error Overlay",
            "Safe Hydrate",
            "*",
          ],
          "🛠️ Developer Tools",
          ["Debug Panel", "Auth Context Mock", "*"],
          "Example",
          ["Button", "Header", "Page", "*"],
          "📄 Pages",
          ["Application Pages", "Index", "*"],
          "📖 Documentation",
          ["*"],
          "*",
        ],
      },
    },

    // Background managed by CSS variables via colorScheme toolbar — no hardcoded backgrounds
    backgrounds: { disabled: true },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },

  tags: [],

  decorators: [
    // Deferred rendering — shows loading screen while heavy component trees mount
    (Story, context) => {
      const [globals] = useGlobals();
      const colorScheme = globals?.colorScheme || "light";
      const isDark =
        colorScheme === "dark" ||
        (colorScheme === "system" &&
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      return (
        <DeferredStory
          key={context.id}
          title={context.title}
          component={context.component?.name}
          isDark={isDark}
        >
          <Story />
        </DeferredStory>
      );
    },
    withTranslationMode,
    // Action tracking decorator - wraps actions with onboarding event tracking
    (Story, context) => {
      // Get story ID for tracking
      const storyId = getStoryId(context);
      const componentName =
        context.component?.name || context.title?.split("/").pop();

      // Create trackable versions of all action handlers
      const trackableActions = createTrackableActions({
        storyId,
        componentName,
        baseHandlers: {
          onClick: fn(),
          onChange: fn(),
          onSubmit: fn(),
          onClose: fn(),
          onOpen: fn(),
          onSelect: fn(),
          onDelete: fn(),
          onAdd: fn(),
          onRemove: fn(),
          onToggle: fn(),
          onHover: fn(),
          onFocus: fn(),
          onBlur: fn(),
          onSave: fn(),
          onCancel: fn(),
          onEdit: fn(),
          onUpdate: fn(),
          onCreate: fn(),
        },
      });

      // Merge tracked actions into context args — only for args NOT already defined
      // by the story (preserves fn() spies needed by play() interaction tests)
      React.useEffect(() => {
        if (context.args) {
          for (const [key, value] of Object.entries(trackableActions)) {
            if (!(key in context.args) || context.args[key] === undefined) {
              context.args[key] = value;
            }
          }
        }
      }, [context.args]);

      return <Story />;
    },
    // Language switcher decorator - syncs with translation mode addon
    (Story, context) => {
      const [globals] = useGlobals();
      const language = globals?.translationLanguage || "en";

      // Update both i18n instances when global changes
      React.useEffect(() => {
        // Sync the next-intl mock (used by components via useTranslations)
        setLocale(language);
        // Sync the i18next instance (used by translation-mode addon)
        if (i18n.language !== language) {
          i18n.changeLanguage(language);
        }
      }, [language]);

      return <Story />;
    },
    (Story, context) => {
      // Try to get unitId from story args or parameters
      const unitId =
        context?.args?.unitId || context?.parameters?.unitId || "mock-unit-id";

      // Check if this is a fullscreen layout story (like pages)
      const isFullscreen = context?.parameters?.layout === "fullscreen";

      // Check if contexts should be disabled (for page-level stories)
      const disableUnitContext =
        context?.parameters?.disableUnitContext || false;
      const disableSectionContext =
        context?.parameters?.disableSectionContext || false;
      const disableDictionaryContext =
        context?.parameters?.disableDictionaryContext || false;

      // Get router configuration from story parameters
      // Support both nextRouter and nextjs.router for compatibility
      let routerParams = context?.parameters?.nextRouter;
      if (!routerParams && context?.parameters?.nextjs?.router) {
        routerParams = context.parameters.nextjs.router;
      }
      routerParams = routerParams || {};
      const mockRouter = createMockRouter(routerParams);

      // Configure next/navigation mock state from story parameters
      const navParams = context?.parameters?.nextjs?.navigation || {};
      console.log(
        "[Preview] setNavigationState called, params:",
        JSON.stringify(navParams.params),
        "story:",
        context?.name,
      );
      setNavigationState({
        pathname: navParams.pathname || routerParams.pathname || "/",
        params: navParams.params || routerParams.query || {},
        searchParams: navParams.searchParams || {},
      });

      // Get auth configuration from story parameters
      const mockAuth = context?.parameters?.mockAuth || {};
      const authProps = {
        mockUser: mockAuth.user,
        mockSession: mockAuth.session,
        isLoading: mockAuth.isLoading || false,
        error: mockAuth.error,
      };

      // Get color scheme from Storybook globals
      const [globals] = useGlobals();
      const colorScheme = globals?.colorScheme || "light";

      // Resolve 'system' to actual OS preference — computed synchronously to avoid flash
      const resolvedFromPref = React.useMemo(() => {
        if (colorScheme !== "system") return colorScheme;
        return typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }, [colorScheme]);

      const [resolvedScheme, setResolvedScheme] =
        React.useState(resolvedFromPref);

      // Keep resolvedScheme in sync when colorScheme or system pref changes
      React.useEffect(() => {
        setResolvedScheme(resolvedFromPref);
      }, [resolvedFromPref]);

      React.useEffect(() => {
        if (colorScheme !== "system") return;
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e) => setResolvedScheme(e.matches ? "dark" : "light");
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
      }, [colorScheme]);

      // Apply color scheme attribute synchronously during render to prevent FOUC.
      // useEffect runs after paint, causing a flash of wrong colors on navigation.
      const schemeToApply =
        colorScheme === "system" ? resolvedScheme : resolvedFromPref;
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute(
          "data-mui-color-scheme",
          schemeToApply,
        );
      }

      return (
        <RouterContext.Provider value={mockRouter}>
          <ThemeProvider theme={theme}>
            <ColorSchemeSynchronizer scheme={schemeToApply} />
            <CssBaseline />
            <div
              className="storybook-wrapper"
              data-mui-color-scheme={schemeToApply}
              style={{
                height: isFullscreen ? "100vh" : "auto",
                width: "100%",
                overflow: isFullscreen ? "auto" : "visible",
                position: "relative",
                backgroundColor:
                  "var(--mui-palette-background-default, #fafafa)",
                // Ensure proper scrolling for fullscreen layouts
                ...(isFullscreen && {
                  overflowX: "auto",
                  overflowY: "auto",
                }),
              }}
            >
              <AuthProvider {...authProps}>
                <GamificationProvider
                  client={mockGamificationClient}
                  studentId="mock-user-sub"
                >
                  <SettingsProvider>
                    <ChatContextProvider>
                      <AudioPlayerProvider>
                        <FilesProvider>
                          {disableDictionaryContext ? (
                            disableUnitContext ? (
                              disableSectionContext ? (
                                <Story />
                              ) : (
                                <SectionProvider unitId={unitId}>
                                  <Story />
                                </SectionProvider>
                              )
                            ) : (
                              <UnitProvider id={unitId}>
                                {disableSectionContext ? (
                                  <Story />
                                ) : (
                                  <SectionProvider unitId={unitId}>
                                    <Story />
                                  </SectionProvider>
                                )}
                              </UnitProvider>
                            )
                          ) : (
                            <DictionaryProvider>
                              {disableUnitContext ? (
                                disableSectionContext ? (
                                  <Story />
                                ) : (
                                  <SectionProvider unitId={unitId}>
                                    <Story />
                                  </SectionProvider>
                                )
                              ) : (
                                <UnitProvider id={unitId}>
                                  {disableSectionContext ? (
                                    <Story />
                                  ) : (
                                    <SectionProvider unitId={unitId}>
                                      <Story />
                                    </SectionProvider>
                                  )}
                                </UnitProvider>
                              )}
                            </DictionaryProvider>
                          )}
                        </FilesProvider>
                      </AudioPlayerProvider>
                    </ChatContextProvider>
                  </SettingsProvider>
                </GamificationProvider>
              </AuthProvider>
            </div>
          </ThemeProvider>
        </RouterContext.Provider>
      );
    },
  ],

  loaders: [
    async ({ parameters }) => {
      // Clear previous mock data before each story (unless explicitly disabled)
      if (parameters?.clearMockData === false) {
        console.log(
          "[Preview] Skipped clearing mock data (clearMockData=false)",
        );
      } else {
        clearMockData();
        console.log("[Preview] Cleared mock data for story");
      }

      // Initialize default mock data (unless explicitly disabled)
      if (parameters?.initializeMockData === false) {
        console.log(
          "[Preview] Skipped initializing default mock data (initializeMockData=false)",
        );
      } else {
        initializeMockData(); // DataStore mock (old Gen 1)
        initializeGen2MockData(); // Gen 2 client mock
        console.log("[Preview] Initialized default mock data for story");
      }
      return null; // Return null instead of empty object to avoid extra div
    },
  ],

  initialGlobals: {
    viewport: {
      value: "responsive",
      isRotated: false,
    },
  },
};

export default preview;
