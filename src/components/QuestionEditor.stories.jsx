import React from 'react';
import { QuestionEditor } from './QuestionEditor';
import DictionaryContext from '../context/dictionaryContext';
import UnitContext from '../context/unitContext';
import FilesContext from '../context/fileContext';

export default {
  title: 'Components/QuestionEditor',
  component: QuestionEditor,
  parameters: {
    layout: 'padded',
  },
};

// Mock context providers
const MockProviders = ({ children, questionBank = {} }) => {
  const mockDictionaryContext = {
    questionBank,
    setFilter: () => {},
    searching: false,
    setSearching: () => {},
  };

  const mockUnitContext = {
    unit: {
      id: 'unit-123',
      title: 'Question Bank',
    },
  };

  const mockFilesContext = {
    audioFiles: {},
    refreshAudioFiles: () => {},
    session: {
      identityId: 'mock-identity-id',
      idToken: {
        toString: () => 'mock-token-string',
      },
    },
  };

  return (
    <DictionaryContext.Provider value={mockDictionaryContext}>
      <UnitContext.Provider value={mockUnitContext}>
        <FilesContext.Provider value={mockFilesContext}>
          {children}
        </FilesContext.Provider>
      </UnitContext.Provider>
    </DictionaryContext.Provider>
  );
};

export const Empty = {
  decorators: [
    (Story) => (
      <MockProviders>
        <Story />
      </MockProviders>
    ),
  ],
};

export const WithQuestions = {
  decorators: [
    (Story) => {
      const mockQuestionBank = {
        'q1': {
          id: 'q1',
          prompt: 'What is the capital of France?',
          answer: 'Paris',
          hint: 'It is the largest city in France',
          audio: [],
        },
        'q2': {
          id: 'q2',
          prompt: 'How do you say "hello" in French?',
          answer: 'Bonjour',
          hint: 'It literally means "good day"',
          audio: [],
        },
        'q3': {
          id: 'q3',
          prompt: 'What color is the French flag?',
          answer: 'Blue, white, and red',
          hint: 'Three vertical stripes',
          audio: [],
        },
      };

      return (
        <MockProviders questionBank={mockQuestionBank}>
          <Story />
        </MockProviders>
      );
    },
  ],
};
