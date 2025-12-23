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
  decorators: [
    (Story, context) => {
      // Get dictionary from story args if available
      const dictionary = context.args?.dictionary || {};
      
      const mockDictionaryContext = {
        filteredDictionary: dictionary,
        dictionary: dictionary,
        setFilter: () => {},
        searching: false,
        setSearching: () => {},
        filter: '',
        filterWords: () => {},
        wordMapId: {},
        wordMapPhrase: {},
        wordRefs: {},
        questionBank: {},
      };

      const mockUnitContext = {
        unit: {
          id: 'unit-123',
          title: 'Vocabulary Unit',
        },
      };

      const mockFilesContext = {
        audioFiles: {},
        refreshAudioFiles: () => {},
        session: {
          identityId: 'mock-identity-id',
          idToken: 'mock-token',
        },
      };

      return (
        <DictionaryContext.Provider value={mockDictionaryContext}>
          <UnitContext.Provider value={mockUnitContext}>
            <FilesContext.Provider value={mockFilesContext}>
              <Story />
            </FilesContext.Provider>
          </UnitContext.Provider>
        </DictionaryContext.Provider>
      );
    },
  ],
};

export const Empty = {
  args: {
    dictionary: {},
  },
};

export const WithWords = {
  args: {
    dictionary: {
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
    },
  },
};
