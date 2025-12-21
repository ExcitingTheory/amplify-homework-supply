import React from 'react';
import { RecordingStudio2 } from './RecordingStudio2';
import UnitContext from '../context/unitContext';
import FilesContext from '../context/fileContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export default {
  title: 'Components/RecordingStudio2',
  component: RecordingStudio2,
  parameters: {
    layout: 'centered',
  },
};

// Mock context providers
const MockProviders = ({ children }) => {
  const mockUnitContext = {
    grade: {},
    createGrade: () => {},
    saveGrade: () => {},
  };

  const mockFilesContext = {
    audioFiles: {},
    session: {
      identityId: 'mock-identity-id',
    },
  };

  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
      <UnitContext.Provider value={mockUnitContext}>
        <FilesContext.Provider value={mockFilesContext}>
          {children}
        </FilesContext.Provider>
      </UnitContext.Provider>
    </ThemeProvider>
  );
};

const mockWord = {
  id: '1',
  phrase: 'bonjour',
  pronunciation: 'bohn-ZHOOR',
  definition: 'hello; good day',
};

const mockQuestion = {
  id: 'q1',
  prompt: 'What is the capital of France?',
  answer: 'Paris',
  hint: 'Largest city in France',
};

export const ForWord = {
  decorators: [
    (Story) => (
      <MockProviders>
        <Story />
      </MockProviders>
    ),
  ],
  args: {
    word: mockWord,
    item: mockWord,
    qk: 'word-1',
    setFeedback: (feedback) => console.log('Feedback:', feedback),
    setFileOperations: (ops) => console.log('File operations:', ops),
    requestDefinition: () => console.log('Request definition'),
    feedback: null,
    isCorrect: false,
  },
};

export const ForQuestion = {
  decorators: [
    (Story) => (
      <MockProviders>
        <Story />
      </MockProviders>
    ),
  ],
  args: {
    word: null,
    item: mockQuestion,
    qk: 'question-1',
    setFeedback: (feedback) => console.log('Feedback:', feedback),
    setFileOperations: (ops) => console.log('File operations:', ops),
    requestDefinition: () => console.log('Request definition'),
    feedback: null,
    isCorrect: false,
  },
};

export const WithFeedback = {
  decorators: [
    (Story) => (
      <MockProviders>
        <Story />
      </MockProviders>
    ),
  ],
  args: {
    word: mockWord,
    item: mockWord,
    qk: 'word-1',
    setFeedback: (feedback) => console.log('Feedback:', feedback),
    setFileOperations: (ops) => console.log('File operations:', ops),
    requestDefinition: () => console.log('Request definition'),
    feedback: 'Great pronunciation!',
    isCorrect: true,
  },
};
