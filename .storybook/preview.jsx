import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import '../src/components/Editor3/theme.css';

// Mock AWS Amplify modules for Storybook
if (typeof window !== 'undefined') {
  // Mock DataStore
  window.mockDataStore = {
    save: async () => Promise.resolve({}),
    query: async () => Promise.resolve([]),
    delete: async () => Promise.resolve({}),
    observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
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
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
