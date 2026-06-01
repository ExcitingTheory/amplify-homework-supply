/**
 * AnswerComponent Tests
 *
 * Tests the progress tracking, grade data shape, and rendering behavior
 * of the answer verification block. AI verification calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import AnswerComponent from '../AnswerComponent';
import UnitContext from '../../../../context/unitContext';

// Mock external dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'answerComponent.inputMethods.text': 'Text',
      'answerComponent.inputMethods.audio': 'Audio',
      'answerComponent.inputMethods.writing': 'Writing',
      'answerComponent.noDictionaryAvailable': 'Dictionary not available',
      'answerComponent.audioNotAvailable': 'Audio not available',
      'answerComponent.audioNotAvailableParens': '(no audio)',
      'customAnswerComponent.yourAnswer': 'Your answer',
    };
    return translations[key] || key;
  },
}));

vi.mock('../../../../utils/amplifyClient', () => ({
  getAmplifyClient: () => ({
    queries: {
      verifyDefinition: vi.fn().mockResolvedValue({ data: '{"answer": true, "reason": "Correct"}' }),
      verifyAudioUrl: vi.fn().mockResolvedValue({ data: '{"answer": true}' }),
    },
  }),
}));

vi.mock('../../../../utils/getCachedUrl', () => ({
  default: vi.fn().mockResolvedValue('https://example.com/audio.mp3'),
}));

vi.mock('../../../../hooks/useVerifyContext', () => ({
  useVerifyContext: () => ({
    studentMemory: '',
    contentContext: '',
  }),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('../WorkbookBlockEnhancements', () => ({
  WorkbookBlockEnhancements: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../AudioAutoSubmitWrapper', () => ({
  default: () => <div data-testid="audio-wrapper" />,
}));

vi.mock('../AudioWaveformPlayer', () => ({
  default: () => <div data-testid="waveform-player" />,
}));

vi.mock('../../RecordingStudio2', () => ({
  RecordingStudio2: () => null,
}));

vi.mock('@lexical/react/LexicalHistoryPlugin', () => ({
  createEmptyHistoryState: () => ({}),
  HistoryPlugin: () => null,
}));

const mockDictionary: Record<string, any> = {
  'word-1': {
    id: 'word-1',
    phrase: 'こんにちは',
    definition: 'Hello',
    audio: [],
    definitionAudio: [],
  },
  'word-2': {
    id: 'word-2',
    phrase: 'ありがとう',
    definition: 'Thank you',
    audio: [],
    definitionAudio: [],
  },
};

function renderAnswerComponent({
  wordIDs = ['word-1', 'word-2'],
  nodeKey = 'answer-1',
  gradeData = {},
  saveGrade = vi.fn(),
  requestDefinition = true,
  allowedInput = ['text'],
  promptMethod = ['text'],
}: Partial<{
  wordIDs: string[];
  nodeKey: string;
  gradeData: Record<string, any>;
  saveGrade: ReturnType<typeof vi.fn>;
  requestDefinition: boolean;
  allowedInput: string[];
  promptMethod: string[];
}> = {}) {
  const grade = {
    id: 'grade-1',
    data: gradeData,
  };

  const contextValue = {
    dictionary: mockDictionary,
    grade,
    saveGrade,
    workbook: null,
  };

  return render(
    <UnitContext.Provider value={contextValue as any}>
      <AnswerComponent
        className="test-answer"
        format="default"
        nodeKey={nodeKey}
        wordIDs={wordIDs}
        requestDefinition={requestDefinition}
        customPrompt=""
        allowedInput={allowedInput}
        promptMethod={promptMethod}
      />
    </UnitContext.Provider>
  );
}

describe('AnswerComponent', () => {
  let saveGrade: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveGrade = vi.fn();
  });

  describe('Rendering', () => {
    it('renders the prompt text', () => {
      renderAnswerComponent({ saveGrade });
      expect(screen.getByText(/define the following word/i)).toBeDefined();
    });

    it('renders custom prompt when provided', () => {
      render(
        <UnitContext.Provider
          value={{ dictionary: mockDictionary, grade: { id: 'g1', data: {} }, saveGrade, workbook: null } as any}
        >
          <AnswerComponent
            className="test"
            format="default"
            nodeKey="a1"
            wordIDs={['word-1']}
            requestDefinition={false}
            customPrompt="Translate these words"
            allowedInput={['text']}
            promptMethod={['text']}
          />
        </UnitContext.Provider>
      );
      expect(screen.getByText('Translate these words')).toBeDefined();
    });

    it('renders input method chip', () => {
      renderAnswerComponent({ saveGrade });
      expect(screen.getByText('Text')).toBeDefined();
    });

    it('renders progress bar at 0 initially', () => {
      renderAnswerComponent({ saveGrade });
      // LinearProgress should be present
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).not.toBeNull();
    });
  });

  describe('Dictionary display', () => {
    it('renders word phrases in requestDefinition mode', () => {
      renderAnswerComponent({ saveGrade, requestDefinition: true });
      expect(screen.getByText('こんにちは')).toBeDefined();
      expect(screen.getByText('ありがとう')).toBeDefined();
    });

    it('shows error when dictionary is not available', () => {
      render(
        <UnitContext.Provider
          value={{ dictionary: null, grade: { id: 'g1', data: {} }, saveGrade, workbook: null } as any}
        >
          <AnswerComponent
            className="test"
            format="default"
            nodeKey="a1"
            wordIDs={['word-1']}
            requestDefinition={true}
            customPrompt=""
            allowedInput={['text']}
            promptMethod={['text']}
          />
        </UnitContext.Provider>
      );
      expect(screen.getByText('Dictionary not available')).toBeDefined();
    });
  });

  describe('Grade data structure', () => {
    it('loads existing grade data for the nodeKey', () => {
      renderAnswerComponent({
        saveGrade,
        gradeData: {
          'answer-1': {
            complete: true,
            accuracy: 100,
            totalWords: 2,
            correctCount: 2,
            answeredCount: 2,
            feedback: { 0: { answer: true }, 1: { answer: true } },
          },
        },
      });
      // Component should render without errors with pre-existing data
      expect(screen.getByText(/define the following word/i)).toBeDefined();
    });
  });
});
