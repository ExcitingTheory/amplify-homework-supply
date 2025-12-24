import React from 'react';
import { Easy } from './Easy';
import { Hard } from './Hard';
import { Learn } from './Learn';
import { DndWrapper } from './DndWrapper';
import DictionaryContext from '../../context/dictionaryContext';
import UnitContext from '../../context/unitContext';

export default {
  title: 'Exercises/MeaningAssociation',
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => {
      // Mock DictionaryContext
      const mockDictionaryContext = {
        dictionary: {},
        filteredDictionary: {},
        wordMapId: {},
        wordMapPhrase: {},
        wordRefs: {},
        questionBank: {},
        filter: '',
        setFilter: () => {},
        filterWords: () => {},
        searching: false,
        setSearching: () => {},
      };

      // Mock UnitContext
      const mockUnitContext = {
        unit: { id: 'test-unit' },
        name: 'Test Unit',
        description: 'Test Description',
        rubric: [],
        grade: { data: {} },
        recentGrades: [],
        dictionary: {},
        files: {},
        questionBank: {},
        playlistUrls: {},
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
        session: { username: 'test-user' },
      };

      return (
        <DictionaryContext.Provider value={mockDictionaryContext}>
          <UnitContext.Provider value={mockUnitContext}>
            <DndWrapper>
              <Story />
            </DndWrapper>
          </UnitContext.Provider>
        </DictionaryContext.Provider>
      );
    },
  ],
};

const sampleWords = [
  { id: '1', phrase: 'Hello', definition: 'A greeting' },
  { id: '2', phrase: 'Goodbye', definition: 'A farewell' },
  { id: '3', phrase: 'Thank you', definition: 'Expression of gratitude' },
  { id: '4', phrase: 'Please', definition: 'Polite request' },
];


// Easy Exercise Stories
export const EasyExercise = {
  render: () => {
    const [tabIndex, setTabIndex] = React.useState(0);
    return (
      <Easy
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        nodeKey="easy-1"
        wordIDs={['1', '2', '3', '4']}
      />
    );
  },
};

export const EasyExerciseCompleted = {
  render: () => {
    const [tabIndex, setTabIndex] = React.useState(0);
    return (
      <Easy
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        nodeKey="easy-2"
        wordIDs={['1', '2', '3', '4']}
      />
    );
  },
};

// Hard Exercise Stories
export const HardExercise = {
  render: () => {
    const [tabIndex, setTabIndex] = React.useState(0);
    return (
      <Hard
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        nodeKey="hard-1"
        wordIDs={['1', '2', '3', '4']}
      />
    );
  },
};

export const HardExerciseCompleted = {
  render: () => {
    const [tabIndex, setTabIndex] = React.useState(0);
    return (
      <Hard
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        nodeKey="hard-2"
        wordIDs={['1', '2', '3', '4']}
      />
    );
  },
};

// Learn Exercise Stories
export const LearnExercise = {
  render: () => {
    const [tabIndex, setTabIndex] = React.useState(0);
    return (
      <Learn
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        nodeKey="learn-1"
        wordIDs={['1', '2', '3', '4']}
      />
    );
  },
};

export const LearnExerciseCompleted = {
  render: () => {
    const [tabIndex, setTabIndex] = React.useState(0);
    return (
      <Learn
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        nodeKey="learn-2"
        wordIDs={['1', '2', '3', '4']}
      />
    );
  },
};
