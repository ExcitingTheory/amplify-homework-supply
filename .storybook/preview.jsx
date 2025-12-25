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
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Try to get unitId from story args or parameters
      const unitId = context?.args?.unitId || context?.parameters?.unitId || 'mock-unit-id';
      
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
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
        </ThemeProvider>
      );
    },
  ],
  loaders: [
    async ({ parameters }) => {
      // Clear previous mock data before each story
      clearMockUnits();
      console.log('[Preview] Cleared mock data for story');
      return {};
    },
  ],
};

export default preview;
