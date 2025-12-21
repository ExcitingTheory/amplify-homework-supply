import React from 'react';
import { DisplayOrEditPrompt } from './DisplayOrEditPrompt';

export default {
  title: 'Components/DisplayOrEditPrompt',
  component: DisplayOrEditPrompt,
  parameters: {
    layout: 'padded',
  },
};

const mockQuestion = {
  id: '1',
  prompt: 'What is the capital of France?',
  hint: 'Think about the largest city',
};

export const Default = {
  args: {
    prompt: 'What is the capital of France?',
    hint: 'Think about the largest city',
    question: mockQuestion,
  },
};

export const ShortPrompt = {
  args: {
    prompt: 'Capital of France?',
    hint: '',
    question: mockQuestion,
  },
};

export const LongPrompt = {
  args: {
    prompt: 'What is the capital and largest city of France, known for the Eiffel Tower and as a major center of art, fashion, and culture?',
    hint: 'It is located in northern France',
    question: mockQuestion,
  },
};

export const EmptyPrompt = {
  args: {
    prompt: '',
    hint: '',
    question: mockQuestion,
  },
};
