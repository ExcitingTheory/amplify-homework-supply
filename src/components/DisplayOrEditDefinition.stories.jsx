import React from 'react';
import { DisplayOrEditDefinition } from './DisplayOrEditDefinition';

export default {
  title: 'Components/DisplayOrEditDefinition',
  component: DisplayOrEditDefinition,
  parameters: {
    layout: 'padded',
  },
};

const mockWord = {
  id: '1',
  phrase: 'bonjour',
  definition: 'hello; good day',
  pronunciation: 'bohn-ZHOOR',
};

export const Default = {
  args: {
    definition: 'hello; good day',
    word: mockWord,
  },
};

export const LongDefinition = {
  args: {
    definition: 'A French greeting used throughout the day, literally meaning "good day". It is the most common way to say hello in French and is appropriate in both formal and informal settings.',
    word: mockWord,
  },
};

export const ShortDefinition = {
  args: {
    definition: 'hello',
    word: mockWord,
  },
};

export const EmptyDefinition = {
  args: {
    definition: '',
    word: mockWord,
  },
};
