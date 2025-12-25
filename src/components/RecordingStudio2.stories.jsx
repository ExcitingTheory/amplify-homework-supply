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
