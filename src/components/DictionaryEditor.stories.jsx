import React from 'react';
import { DictionaryEditor } from './DictionaryEditor';
import DictionaryContext from '../context/dictionaryContext';
import UnitContext from '../context/unitContext';
import FilesContext from '../context/fileContext';

export default {
  title: 'Components/DictionaryEditor',
  component: DictionaryEditor,
  parameters: {
    layout: 'padded',
  },
};

// Mock context providers
const MockProviders = ({ children, dictionary = {} }) => {
  const mockDictionaryContext = React.useMemo(() => ({
    filteredDictionary: dictionary,
    setFilter: () => {},
    searching: false,
    setSearching: () => {},
  }), [dictionary]);

  const mockUnitContext = React.useMemo(() => ({
    unit: {
      id: 'unit-123',
      title: 'Vocabulary Unit',
    },
  }), []);

  const mockFilesContext = React.useMemo(() => ({
    audioFiles: {},
    refreshAudioFiles: () => {},
    session: {
      identityId: 'mock-identity-id',
      idToken: 'mock-token',
    },
  }), []);

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
  render: () => (
    <MockProviders>
      <DictionaryEditor />
    </MockProviders>
  ),
};

export const WithWords = {
  render: () => {
    const mockDictionary = {
      'bonjour': {
        id: '1',
        phrase: 'bonjour',
        pronunciation: 'bohn-ZHOOR',
        definition: 'hello; good day',
        audio: [],
      },
      'merci': {
        id: '2',
        phrase: 'merci',
        pronunciation: 'mehr-SEE',
        definition: 'thank you',
        audio: [],
      },
      'au revoir': {
        id: '3',
        phrase: 'au revoir',
        pronunciation: 'oh ruh-VWAHR',
        definition: 'goodbye',
        audio: [],
      },
    };

    return (
      <MockProviders dictionary={mockDictionary}>
        <DictionaryEditor />
      </MockProviders>
    );
  },
};
