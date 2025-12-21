import React from 'react';
import { DisplayOrEditAnswer } from './DisplayOrEditAnswer';

export default {
  title: 'Components/DisplayOrEditAnswer',
  component: DisplayOrEditAnswer,
  parameters: {
    layout: 'padded',
  },
};

const mockQuestion = {
  id: '1',
  answer: 'This is a sample answer',
  prompt: 'What is the capital of France?',
};

export const Default = {
  args: {
    answer: 'This is a sample answer that can be edited by clicking on it.',
    question: mockQuestion,
  },
};

export const ShortAnswer = {
  args: {
    answer: 'Paris',
    question: mockQuestion,
  },
};

export const LongAnswer = {
  args: {
    answer: 'This is a much longer answer that spans multiple lines. It demonstrates how the component handles larger amounts of text. The answer can still be edited by clicking on it, and the textarea will expand to accommodate the content.',
    question: mockQuestion,
  },
};

export const EmptyAnswer = {
  args: {
    answer: '',
    question: mockQuestion,
  },
};
