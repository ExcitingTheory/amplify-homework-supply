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
if (typeof window !== 'undefined') {
  // Adding global polyfill
  window.global = window;
  
  // Mock util module for pngjs which expects Node.js util
  if (!window.util) {
    window.util = {
      inherits: function(ctor, superCtor) {
        if (!ctor || !superCtor) return;
        try {
          ctor.super_ = superCtor;
          // Only create prototype if it doesn't exist or is not already set up
          if (!ctor.prototype || Object.getPrototypeOf(ctor.prototype) !== superCtor.prototype) {
            ctor.prototype = Object.create(superCtor.prototype, {
              constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true
              }
            });
          }
        } catch (e) {
          // Silently fail if prototype setup fails
          console.warn('[preview] Failed to set up prototype inheritance:', e);
        }
      }
    };
  }
  
  // Mock stream module basics that pngjs might need
  if (!window.stream && !window.require) {
    window.stream = { Writable: class {}, Readable: class {} };
  }
}

import React from 'react';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { fn } from 'storybook/test';

// PDF.js worker configuration removed from preview.jsx — it was eagerly
// pulling 36MB of pdfjs-dist into every story's bundle. Components that
// use react-pdf (PdfThumbnail, PdfViewerComponent) already configure
// the worker with their own guard: `if (!pdfjs.GlobalWorkerOptions.workerSrc)`.
import { useGlobals } from 'storybook/preview-api';
import '../src/components/Editor3/theme.css';
import '../src/components/Editor3/components/LanguageEditorTheme.css';
import './storybook.css';

// Import the app's shared theme (with cssVariables + colorSchemes)
import theme from '../src/theme';

// Import action tracking
import { createTrackableActions } from './code/action-tracker';
import { getStoryId } from './code/route-map';
import { initializeTaskCompletion } from './code/task-completion';

// Import real context providers
import { AuthProvider } from './__mocks__/authContext';
import { FilesProvider } from '../src/context/fileContext';
import { DictionaryProvider } from '../src/context/dictionaryContext';
import { SectionProvider } from '../src/context/sectionContext';
import { UnitProvider } from '../src/context/unitContext';
import { AudioPlayerProvider } from '../src/components/Editor3/context/AudioPlayerContext';
import { ChatContextProvider } from '../src/context/chatContext';
import { SettingsProvider } from '../src/context/settingsContext';

// Import mock helpers
import { clearMockData, initializeMockData } from './__mocks__/aws-amplify-data';
import { initializeMockData as initializeGen2MockData } from './__mocks__/aws-amplify-data';
import { mockChatAPI } from './__mocks__/chat-api';

// Import Next.js router mock
import { RouterContext, createMockRouter } from './__mocks__/next-router';

// Import translation mode addon
import { withTranslationMode } from './addons/translation-mode';
import { globalTypes as translationGlobalTypes } from './addons/translation-mode/globalTypes';

// Import custom docs page template
import DocsPageWithPanel from './components/DocsPageWithPanel';

// Import i18n for Storybook
import i18n from './i18next';

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
function StoryLoadingFallback({ title, component }) {
  const displayName = component || title?.split('/').pop() || 'Story';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 240,
        gap: 2,
        p: 4,
      }}
    >
      <CircularProgress size={44} thickness={4} />
      <Typography variant="body2" color="text.secondary">
        Loading {displayName}…
      </Typography>
    </Box>
  );
}

/**
 * Deferred rendering wrapper — shows loading fallback on first frame,
 * then renders the actual story on the next animation frame.
 * Keeps the fallback visible as an overlay until the children are committed to the DOM,
 * preventing a blank gap between the fallback disappearing and the story rendering.
 */
function DeferredStory({ children, title, component }) {
  const [renderChildren, setRenderChildren] = React.useState(false);
  const [showFallback, setShowFallback] = React.useState(true);

  // Start rendering children after the loading fallback has painted
  React.useEffect(() => {
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setRenderChildren(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

  // Once children are committed to the DOM, hide the fallback overlay after next paint
  const onChildrenMount = React.useCallback((node) => {
    if (node) {
      requestAnimationFrame(() => setShowFallback(false));
    }
  }, []);

  if (!renderChildren) {
    return <StoryLoadingFallback title={title} component={component} />;
  }

  return (
    <div style={{ position: 'relative', minHeight: showFallback ? 240 : undefined }}>
      {showFallback && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--mui-palette-background-default, #fafafa)',
        }}>
          <StoryLoadingFallback title={title} component={component} />
        </div>
      )}
      <div ref={onChildrenMount}>
        {children}
      </div>
    </div>
  );
}

// Mock fetch for /api/chat endpoint
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  // Intercept chat API calls
  if (typeof url === 'string' && url.includes('/api/chat')) {
    console.log('[Mock Fetch] Intercepted /api/chat');
    
    const body = JSON.parse(options?.body || '{}');
    const { messages, context } = body;
    
    // Generate mock response
    const responseText = await mockChatAPI(messages, context);
    
    // Create a readable stream that simulates streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Simulate streaming by sending chunks
        const words = responseText.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          controller.enqueue(encoder.encode(`0:"${chunk}"\n`));
        }
        controller.close();
      }
    });
    
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
  
  // Pass through other requests
  return originalFetch(url, options);
};

// Initialize automatic task completion detection
if (typeof window !== 'undefined') {
  let taskCompletionUnsubscribe = null;
  
  // Initialize once when preview loads
  setTimeout(() => {
    if (!taskCompletionUnsubscribe) {
      taskCompletionUnsubscribe = initializeTaskCompletion();
      console.log('[Preview] Task completion detector initialized');
    }
  }, 1000);
  
  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
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
      description: 'Color scheme',
      defaultValue: 'light',
      toolbar: {
        title: 'Color Scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'settings' },
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
      } 
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: 'requiredFirst',
    },

    nextjs: {
      appDirectory: false,
    },

    // Add viewport configuration for better responsive testing
    viewport: {
      defaultViewport: 'responsive',
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop',
        },
      },
    },

    // Configure layout settings
    layout: 'padded',

    // Better docs display with toolbar support
    docs: {
      toc: true,
      source: {
        state: 'open',
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
        height: 'auto',
      },
    },

    // Enable toolbar and panel by default for all stories and docs
    options: {
      showPanel: true,
      showToolbar: true,
      storySort: {
        order: [
          'Getting Started',
          ['Welcome', 'Onboarding', '*'],
          'Introduction',
          '📚 Creating Lessons',
          ['Editor', 'Workbook', 'Suggested Content'],
          '🎙️ Recording Audio',
          ['Recording Studio'],
          '📁 Managing Content', 
          ['File Manager', 'Dictionary', 'Questions'],
          '💬 AI Tools',
          ['Chat Assistant'],
          '📄 Pages',
          ['Application Pages', 'Index', 'Units', 'Sections', 'Profile', 'Workbook', 'Grades'],
          '🧩 Components',
          ['Header', 'Button', 'Nodes', 'Meaning Association'],
          '🔌 Editor Plugins',
          'WIP',
          '*',
        ],
      },
    },

    // Background managed by CSS variables via colorScheme toolbar — no hardcoded backgrounds
    backgrounds: { disable: true },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  tags: ['autodocs'],
  decorators: [
    // Deferred rendering — shows loading screen while heavy component trees mount
    (Story, context) => (
      <DeferredStory
        key={context.id}
        title={context.title}
        component={context.component?.name}
      >
        <Story />
      </DeferredStory>
    ),
    withTranslationMode,
    // Action tracking decorator - wraps actions with onboarding event tracking
    (Story, context) => {
      // Get story ID for tracking
      const storyId = getStoryId(context);
      const componentName = context.component?.name || context.title?.split('/').pop();
      
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
        }
      });
      
      // Merge tracked actions into context args
      React.useEffect(() => {
        if (context.args) {
          Object.assign(context.args, trackableActions);
        }
      }, [context.args]);
      
      return <Story />;
    },
    // Language switcher decorator - syncs with translation mode addon
    (Story, context) => {
      const [globals] = useGlobals();
      const language = globals?.translationLanguage || 'en';
      
      // Update i18n language when global changes
      React.useEffect(() => {
        if (i18n.language !== language) {
          i18n.changeLanguage(language);
        }
      }, [language]);
      
      return <Story />;
    },
    (Story, context) => {
      // Try to get unitId from story args or parameters
      const unitId = context?.args?.unitId || context?.parameters?.unitId || 'mock-unit-id';
      
      // Check if this is a fullscreen layout story (like pages)
      const isFullscreen = context?.parameters?.layout === 'fullscreen';
      
      // Check if contexts should be disabled (for page-level stories)
      const disableUnitContext = context?.parameters?.disableUnitContext || false;
      const disableSectionContext = context?.parameters?.disableSectionContext || false;
      const disableDictionaryContext = context?.parameters?.disableDictionaryContext || false;
      
      // Get router configuration from story parameters
      // Support both nextRouter and nextjs.router for compatibility
      let routerParams = context?.parameters?.nextRouter;
      if (!routerParams && context?.parameters?.nextjs?.router) {
        routerParams = context.parameters.nextjs.router;
      }
      routerParams = routerParams || {};
      const mockRouter = createMockRouter(routerParams);
      
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
      const colorScheme = globals?.colorScheme || 'light';
      
      // Resolve 'system' to actual OS preference — computed synchronously to avoid flash
      const resolvedFromPref = React.useMemo(() => {
        if (colorScheme !== 'system') return colorScheme;
        return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }, [colorScheme]);
      
      const [resolvedScheme, setResolvedScheme] = React.useState(resolvedFromPref);
      
      // Keep resolvedScheme in sync when colorScheme or system pref changes
      React.useEffect(() => {
        setResolvedScheme(resolvedFromPref);
      }, [resolvedFromPref]);
      
      React.useEffect(() => {
        if (colorScheme !== 'system') return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => setResolvedScheme(e.matches ? 'dark' : 'light');
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
      }, [colorScheme]);
      
      // Apply color scheme attribute synchronously during render to prevent FOUC.
      // useEffect runs after paint, causing a flash of wrong colors on navigation.
      const schemeToApply = colorScheme === 'system' ? resolvedScheme : resolvedFromPref;
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-mui-color-scheme', schemeToApply);
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
                height: isFullscreen ? '100vh' : 'auto',
                width: '100%',
                overflow: isFullscreen ? 'auto' : 'visible',
                position: 'relative',
                backgroundColor: 'var(--mui-palette-background-default, #fafafa)',
                // Ensure proper scrolling for fullscreen layouts
                ...(isFullscreen && {
                  overflowX: 'auto',
                  overflowY: 'auto',
                })
              }}
            >
              <AuthProvider {...authProps}>
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
        console.log('[Preview] Skipped clearing mock data (clearMockData=false)');
      } else {
        clearMockData();
        console.log('[Preview] Cleared mock data for story');
      }

      // Initialize default mock data (unless explicitly disabled)
      if (parameters?.initializeMockData === false) {
        console.log('[Preview] Skipped initializing default mock data (initializeMockData=false)');
      } else {
        initializeMockData();  // DataStore mock (old Gen 1)
        initializeGen2MockData();  // Gen 2 client mock
        console.log('[Preview] Initialized default mock data for story');
      }
      return null; // Return null instead of empty object to avoid extra div
    },
  ],
};

export default preview;
