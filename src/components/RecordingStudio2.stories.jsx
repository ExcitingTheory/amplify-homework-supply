import React from 'react';
import { RecordingStudio2 } from './RecordingStudio2';

export default {
  title: 'Components/RecordingStudio2',
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
const mockWaveformData = Array.from({ length: 600 }, (_, i) => {
  const position = i / 600;
  const envelope = Math.sin(position * Math.PI);
  const detail = Math.sin(i * 0.1) * 0.3 + Math.sin(i * 0.05) * 0.2;
  return Math.max(0, Math.min(1, envelope * (0.5 + detail)));
});

// Mock audio blob for demonstration
const createMockAudioBlob = () => {
  // Create a simple audio context with silent audio for demo
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
  const channelData = buffer.getChannelData(0);
  
  // Add some simple tone data
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = Math.sin(2 * Math.PI * 440 * i / audioContext.sampleRate) * 0.3;
  }
  
  return buffer;
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
  parameters: {
    docs: {
      description: {
        story: 'Shows RecordingStudio2 with a previously recorded answer. The waveform visualization displays below the audio controls, and feedback shows the AI verification result.',
      },
    },
  },
};
