import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import '../src/components/Editor3/theme.css';
import '../src/components/Editor3/components/LanguageEditorTheme.css';

// Import real contexts
import FilesContext from '../src/context/fileContext';
import UnitContext from '../src/context/unitContext';
import DictionaryContext from '../src/context/dictionaryContext';

// Mock AWS Amplify modules for Storybook
if (typeof window !== 'undefined') {
  // Mock Word data
  const mockWords = {
    '1': { id: '1', phrase: 'Hello', pronunciation: 'heh-LOH', definition: 'A greeting' },
    '2': { id: '2', phrase: 'Goodbye', pronunciation: 'good-BYE', definition: 'A farewell' },
    '3': { id: '3', phrase: 'Thank you', pronunciation: 'thank-YOO', definition: 'Expression of gratitude' },
    '4': { id: '4', phrase: 'Please', pronunciation: 'PLEEZ', definition: 'Polite request' },
  };

  // Mock DataStore
  window.mockDataStore = {
    save: async () => Promise.resolve({}),
    query: async (model, id) => {
      // If id is provided, return the specific word
      if (typeof id === 'string') {
        return Promise.resolve(mockWords[id] || {});
      }
      // Otherwise return all words as array
      return Promise.resolve(Object.values(mockWords));
    },
    delete: async () => Promise.resolve({}),
    observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    observeQuery: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  };

  // Mock Storage
  window.mockStorage = {
    get: async () => Promise.resolve({ url: 'mock-url' }),
    put: async () => Promise.resolve({ key: 'mock-key' }),
    remove: async () => Promise.resolve({}),
  };

  // Mock Auth
  window.mockAuth = {
    fetchAuthSession: async () => Promise.resolve({
      tokens: { idToken: { toString: () => 'mock-token' } },
      identityId: 'mock-identity-id'
    }),
  };
}

// Mock Context Providers
const MockFilesProvider = ({ children }) => {
  const mockValue = {
    audioFiles: {},
    refreshAudioFiles: async () => {},
    files: [],
    myFiles: [],
    myPlaylistFiles: {},
    myPlaylistUrls: {},
    session: {
      error: undefined,
      identityId: 'mock-identity-id',
      idToken: 'mock-token',
    },
  };

  return (
    <FilesContext.Provider value={mockValue}>
      {children}
    </FilesContext.Provider>
  );
};

const MockUnitProvider = ({ children }) => {
  const mockValue = {
    unit: {},
    name: 'Mock Unit',
    rubric: [],
    grade: {},
    recentGrades: [],
    dictionary: {},
    files: {},
    questionBank: {},
    playlistUrls: {},
    description: 'Mock description',
    editorStateRef: { current: null },
    editorSelectionRef: { current: null },
    versionRef: { current: 0 },
    finishedQuestions: 0,
    showUnitComplete: false,
    handleBeforeUnload: () => {},
    setShowUnitComplete: () => {},
    setFinishedQuestions: () => {},
    saveName: async () => {},
    saveDescription: async () => {},
    handleDelete: async () => {},
    handleStatusChange: async () => {},
    saveEditorContent: async () => {},
    saveGrade: async () => {},
    createGrade: async () => {},
    session: {
      error: undefined,
      username: 'mock-user',
    },
  };

  return (
    <UnitContext.Provider value={mockValue}>
      {children}
    </UnitContext.Provider>
  );
};

const MockDictionaryProvider = ({ children }) => {
  const mockValue = {
    dictionary: {},
    filteredDictionary: {},
    wordMapId: {},
    wordMapPhrase: {},
    wordRefs: {},
    questionBank: {},
    filter: '',
    setFilter: () => {},
    filterWords: async () => {},
    searching: false,
    setSearching: () => {},
  };

  return (
    <DictionaryContext.Provider value={mockValue}>
      {children}
    </DictionaryContext.Provider>
  );
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
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MockFilesProvider>
          <MockUnitProvider>
            <MockDictionaryProvider>
              <Story />
            </MockDictionaryProvider>
          </MockUnitProvider>
        </MockFilesProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
