import React from 'react';
import { expect } from 'storybook/test';
import { within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for exercise to load
    await waitFor(() => {
      expect(canvas.getByText('Hello')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify all words are visible
    expect(canvas.getByText('Goodbye')).toBeInTheDocument();
    expect(canvas.getByText('Thank you')).toBeInTheDocument();
    expect(canvas.getByText('Please')).toBeInTheDocument();
  },
};

export const EasyExerciseCompleted = {
  decorators: [
    (Story) => {
      const completedGradeData = JSON.stringify({
        'easy-2': {
          complete: true,
          tabIndex: 0,
          easy: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
          },
          hard: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
          },
          learn: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
            droppedPairs: { '1': '1', '2': '2', '3': '3', '4': '4' },
          },
        },
      });

      const mockUnitContext = React.useMemo(() => ({
        unit: { id: 'test-unit' },
        name: 'Test Unit',
        description: 'Test Description',
        rubric: [],
        grade: { data: completedGradeData },
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
        saveGrade: async (data) => console.log('Mock saveGrade:', data),
        createGrade: async () => console.log('Mock createGrade'),
        session: { username: 'test-user' },
      }), []);

      return (
        <UnitContext.Provider value={mockUnitContext}>
          <Story />
        </UnitContext.Provider>
      );
    },
  ],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for hard mode exercise to load
    await waitFor(() => {
      // Hard mode typically shows definitions without phrases initially
      expect(canvas.getByText(/A greeting|A farewell|Expression of gratitude|Polite request/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify hard mode UI elements
    const definitions = canvas.getAllByText(/A greeting|A farewell|Expression of gratitude|Polite request/i);
    expect(definitions.length).toBeGreaterThan(0);
  },
};

export const HardExerciseCompleted = {
  decorators: [
    (Story) => {
      const completedGradeData = JSON.stringify({
        'hard-2': {
          complete: true,
          tabIndex: 1,
          easy: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
          },
          hard: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
          },
          learn: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
            droppedPairs: { '1': '1', '2': '2', '3': '3', '4': '4' },
          },
        },
      });

      const mockUnitContext = React.useMemo(() => ({
        unit: { id: 'test-unit' },
        name: 'Test Unit',
        description: 'Test Description',
        rubric: [],
        grade: { data: completedGradeData },
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
        saveGrade: async (data) => console.log('Mock saveGrade:', data),
        createGrade: async () => console.log('Mock createGrade'),
        session: { username: 'test-user' },
      }), []);

      return (
        <UnitContext.Provider value={mockUnitContext}>
          <Story />
        </UnitContext.Provider>
      );
    },
  ],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for learn mode to load
    await waitFor(() => {
      expect(canvas.getByText('Hello')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify vocabulary words are visible in learn mode
    expect(canvas.getByText('Goodbye')).toBeInTheDocument();
    expect(canvas.getByText('Thank you')).toBeInTheDocument();
    expect(canvas.getByText('Please')).toBeInTheDocument();
    
    // Learn mode shows both phrases and definitions
    expect(canvas.getByText('A greeting')).toBeInTheDocument();
  },
};

export const LearnExerciseCompleted = {
  decorators: [
    (Story) => {
      const completedGradeData = JSON.stringify({
        'learn-2': {
          complete: true,
          tabIndex: 2,
          easy: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
          },
          hard: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
          },
          learn: {
            verifiedAnswers: ['1', '2', '3', '4'],
            attemptedAnswers: { '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'] },
            attemptsCount: 4,
            accuracy: 1.0,
            percentComplete: 1.0,
            complete: true,
            droppedPairs: { '1': '1', '2': '2', '3': '3', '4': '4' },
          },
        },
      });

      const mockUnitContext = React.useMemo(() => ({
        unit: { id: 'test-unit' },
        name: 'Test Unit',
        description: 'Test Description',
        rubric: [],
        grade: { data: completedGradeData },
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
        saveGrade: async (data) => console.log('Mock saveGrade:', data),
        createGrade: async () => console.log('Mock createGrade'),
        session: { username: 'test-user' },
      }), []);

      return (
        <UnitContext.Provider value={mockUnitContext}>
          <Story />
        </UnitContext.Provider>
      );
    },
  ],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for completion screen to render
    await waitFor(() => {
      expect(canvas.getByText(/Learn Mode/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify accuracy percentage is displayed
    expect(canvas.getByText(/95%/)).toBeInTheDocument();
    
    // Verify attempts count
    expect(canvas.getByText(/10/)).toBeInTheDocument();
    
    // Verify continue button is present
    const continueButton = canvas.getByRole('button', { name: /continue|next/i });
    expect(continueButton).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for completion screen
    await waitFor(() => {
      expect(canvas.getByText(/Easy Mode/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify accuracy (88%)
    expect(canvas.getByText(/88%/)).toBeInTheDocument();
    
    // Verify attempts
    expect(canvas.getByText(/15/)).toBeInTheDocument();
    
    // Verify next level name is shown
    expect(canvas.getByRole('button', { name: /Hard Mode/i })).toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for final completion screen
    await waitFor(() => {
      expect(canvas.getByText(/Hard Mode/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify accuracy (75%)
    expect(canvas.getByText(/75%/)).toBeInTheDocument();
    
    // Verify attempts
    expect(canvas.getByText(/20/)).toBeInTheDocument();
    
    // Verify final completion state (isLastLevel)
    const continueButton = canvas.getByRole('button', { name: /finish|done|complete/i });
    expect(continueButton).toBeInTheDocument();
  },
};
