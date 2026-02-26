import React from 'react';
import { RecordingStudio2 } from './RecordingStudio2';
import FilesContext from '../context/fileContext';
import UnitContext from '../context/unitContext';
import { seedMockFiles } from '../../.storybook/__mocks__/aws-amplify-data';

// Helper function to generate realistic waveform data
const generateWaveformData = (length = 100) => {
  return Array.from({ length }, (_, i) => {
    const position = i / length;
    const envelope = Math.sin(position * Math.PI);
    const detail = Math.sin(i * 0.3) * 0.3 + Math.sin(i * 0.15) * 0.2;
    return Math.max(0, Math.min(1, envelope * (0.5 + detail)));
  });
};

export default {
  title: '🎙️ Recording Audio/Recording Studio (Legacy)',
  component: RecordingStudio2,
  parameters: {
    layout: 'centered',
  },
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

// Mock waveform data (simulates an audio waveform)
const mockWaveformData = generateWaveformData(200);

// Mock file data for DataStore
const mockFileData = {
  id: 'audio-1',
  name: 'bonjour_recording.mp3',
  path: 'protected/audio/bonjour-recording.mp3',
  mimeType: 'audio/mpeg',
  waveformData: JSON.stringify(generateWaveformData(200)),
  createdAt: new Date().toISOString(),
  owner: 'mock-user-sub',
  identityId: 'us-east-1:mock-identity-123',
};

// Mock audio files for FilesContext (keyed by lookupWord)
const mockAudioFiles = {
  'bonjourbohn-ZHOOR': {
    key: 'audio/bonjour-recording.mp3',
    lastModified: new Date(),
    size: 12345,
  },
};

export const WithRecordedAnswer = {
  args: {
    word: mockWord,
    item: mockWord,
    qk: 'word-recorded',
    setFeedback: (feedback) => console.log('Feedback:', feedback),
    setFileOperations: (ops) => console.log('File operations:', ops),
    requestDefinition: () => console.log('Request definition'),
    feedback: {
      answer: true,
      reason: 'Excellent pronunciation! Your accent is very clear.',
      transcription: 'bonjour',
    },
    isCorrect: true,
  },
  decorators: [
    (Story) => {
      React.useEffect(() => {
        // Seed the mock DataStore with file data
        seedMockFiles([mockFileData]);
      }, []);
      
      // Memoize context values to prevent recreation on every render
      const mockUnitContextValue = React.useMemo(() => ({
        grade: null,
        createGrade: async () => ({ id: 'mock-grade-1', createdAt: new Date().toISOString() }),
        saveGrade: async (data) => console.log('Mock saveGrade called with:', data),
      }), []);
      
      const mockFilesContextValue = React.useMemo(() => ({
        audioFiles: mockAudioFiles,
        myFiles: [mockFileData],
        myPlaylistFiles: { [mockFileData.id]: mockFileData },
        myPlaylistUrls: {},
        session: {
          identityId: 'us-east-1:mock-identity-123',
        },
        refreshAudioFiles: () => console.log('Mock refreshAudioFiles called'),
      }), []);
      
      return (
        <UnitContext.Provider value={mockUnitContextValue}>
          <FilesContext.Provider value={mockFilesContextValue}>
            <Story />
          </FilesContext.Provider>
        </UnitContext.Provider>
      );
    },
  ],
  parameters: {
    initializeMockData: false,
    docs: {
      description: {
        story: 'Shows RecordingStudio2 with a previously recorded answer displayed in an interactive AudioWaveformPlayer. Click play to hear the recording and see the waveform animate. Feedback shows the AI verification result.',
      },
    },
  },
};
