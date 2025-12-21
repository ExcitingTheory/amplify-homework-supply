import React from 'react';
import { DisplayOrEditHint } from './DisplayOrEditHint';

export default {
  title: 'Components/DisplayOrEditHint',
  component: DisplayOrEditHint,
  parameters: {
    layout: 'padded',
  },
};

const mockQuestion = {
  id: '1',
  hint: 'This is a helpful hint',
  prompt: 'What is the capital of France?',
};

export const Default = {
  args: {
    hint: 'Think about the most populous city in France',
    prompt: 'What is the capital of France?',
    question: mockQuestion,
  },
};

export const ShortHint = {
  args: {
    hint: 'It starts with P',
    prompt: 'What is the capital of France?',
    question: mockQuestion,
  },
};

export const LongHint = {
  args: {
    hint: 'This is a longer hint that provides more detailed information. It might include multiple sentences to guide the user toward the correct answer without giving it away completely.',
    prompt: 'What is the capital of France?',
    question: mockQuestion,
  },
};

export const NoHint = {
  args: {
    hint: '',
    prompt: 'What is the capital of France?',
    question: mockQuestion,
  },
};
