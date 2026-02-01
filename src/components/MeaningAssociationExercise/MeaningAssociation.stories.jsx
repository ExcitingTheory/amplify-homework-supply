import React from 'react';
import { Easy } from './Easy';
import { Hard } from './Hard';
import { Learn } from './Learn';
import { DndWrapper } from './DndWrapper';
import { CompletionScreen } from './CompletionScreen';
import DictionaryContext from '../../context/dictionaryContext';
import UnitContext from '../../context/unitContext';

// Sample word data for exercises
const sampleWords = [
  { id: '1', phrase: 'Hello', definition: 'A greeting' },
  { id: '2', phrase: 'Goodbye', definition: 'A farewell' },
  { id: '3', phrase: 'Thank you', definition: 'Expression of gratitude' },
  { id: '4', phrase: 'Please', definition: 'Polite request' },
];

// Create dictionary lookup objects
const wordMapId = sampleWords.reduce((acc, word) => {
  acc[word.id] = word;
  return acc;
}, {});

const wordMapPhrase = sampleWords.reduce((acc, word) => {
  acc[word.phrase.toLowerCase()] = word;
  return acc;
}, {});

export default {
  title: '🧩 Components/Meaning Association Exercise',
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => {
      // Mock DictionaryContext - useMemo to prevent recreation
      const mockDictionaryContext = React.useMemo(() => ({
        dictionary: sampleWords,
        filteredDictionary: sampleWords,
        wordMapId,
        wordMapPhrase,
        wordRefs: {},
        questionBank: {},
        filter: '',
        setFilter: () => {},
        filterWords: () => {},
        searching: false,
        setSearching: () => {},
      }), []);

      // Mock UnitContext - useMemo to prevent recreation
      const mockUnitContext = React.useMemo(() => ({
        unit: { id: 'test-unit' },
        name: 'Test Unit',
        description: 'Test Description',
        rubric: [],
        grade: { data: null }, // null so `|| {}` in Learn.jsx works correctly
        recentGrades: [],
        dictionary: wordMapId,
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
        saveGrade: async (data) => {
          console.log('Mock saveGrade:', data);
        },
        createGrade: async () => {
          console.log('Mock createGrade');
        },
        session: { username: 'test-user' },
      }), []);

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

// Completion Screen Stories
export const CompletionScreenLearn = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const handleContinue = React.useCallback(() => {
      console.log('Continue to Easy');
    }, []);

    return (
      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        <CompletionScreen
          levelName="Learn Mode"
          accuracy={0.95}
          attempts={10}
          onContinue={handleContinue}
          nextLevelName="Easy Mode"
          isLastLevel={false}
        />
      </div>
    );
  },
};

export const CompletionScreenEasy = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const handleContinue = React.useCallback(() => {
      console.log('Continue to Hard');
    }, []);

    return (
      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        <CompletionScreen
          levelName="Easy Mode"
          accuracy={0.88}
          attempts={15}
          onContinue={handleContinue}
          nextLevelName="Hard Mode"
          isLastLevel={false}
        />
      </div>
    );
  },
};

export const CompletionScreenHard = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const handleContinue = React.useCallback(() => {
      console.log('Finish exercise');
    }, []);

    return (
      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        <CompletionScreen
          levelName="Hard Mode"
          accuracy={0.75}
          attempts={20}
          onContinue={handleContinue}
          nextLevelName="Learn Mode"
          isLastLevel={true}
        />
      </div>
    );
  },
};
