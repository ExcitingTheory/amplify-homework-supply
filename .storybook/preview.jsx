/**
 * Storybook Preview Configuration
 * 
 * Global Mocking Strategy:
 * - AWS Amplify modules (api, auth, storage, datastore, utils) are mocked via webpack aliases in main.js
 * - Mock implementations are in .storybook/__mocks__/ directory
 * - getCachedUrl utility is also mocked for safe file URL generation
 * - All mocks are global and work across all stories without needing jest.mock()
 * 
 * Mock Features:
 * - AI generation (text-to-image, text-to-speech) with realistic delays
 * - File storage and retrieval with placeholder data URLs
 * - Authentication with mock credentials
 * - DataStore operations with in-memory storage
 */

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import '../src/components/Editor3/theme.css';
import '../src/components/Editor3/components/LanguageEditorTheme.css';

// Import real context providers
import { FilesProvider } from '../src/context/fileContext';
import { DictionaryProvider } from '../src/context/dictionaryContext';
import { SectionProvider } from '../src/context/sectionContext';
import { UnitProvider } from '../src/context/unitContext';
import { AudioPlayerProvider } from '../src/components/Editor3/context/AudioPlayerContext';

// Import mock helpers
import { clearMockUnits } from './__mocks__/aws-amplify-datastore';
import { mockChatAPI } from './__mocks__/chat-api';

// Mock fetch for /api/chat endpoint
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
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

// Create a basic theme - you can customize this to match your app's theme
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

/** @type { import('@storybook/nextjs').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: false,
    },
    // Add viewport configuration for better responsive testing
    viewport: {
      defaultViewport: 'responsive',
    },
    // Configure layout settings for scrolling
    layout: {
      padded: false,
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Try to get unitId from story args or parameters
      const unitId = context?.args?.unitId || context?.parameters?.unitId || 'mock-unit-id';
      
      // Check if this is a fullscreen layout story (like pages)
      const isFullscreen = context?.parameters?.layout === 'fullscreen';
      
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div 
            className="storybook-wrapper"
            style={{
              height: isFullscreen ? '100vh' : 'auto',
              width: '100%',
              overflow: isFullscreen ? 'auto' : 'visible',
              position: 'relative',
              // Ensure proper scrolling for fullscreen layouts
              ...(isFullscreen && {
                overflowX: 'auto',
                overflowY: 'auto',
              })
            }}
          >
            <AudioPlayerProvider>
              <FilesProvider>
                <DictionaryProvider>
                  <UnitProvider id={unitId}>
                    <SectionProvider unitId={unitId}>
                      <Story />
                    </SectionProvider>
                  </UnitProvider>
                </DictionaryProvider>
              </FilesProvider>
            </AudioPlayerProvider>
          </div>
        </ThemeProvider>
      );
    },
  ],
  loaders: [
    async ({ parameters }) => {
      // Clear previous mock data before each story
      clearMockUnits();
      console.log('[Preview] Cleared mock data for story');
      return null; // Return null instead of empty object to avoid extra div
    },
  ],
};

export default preview;
