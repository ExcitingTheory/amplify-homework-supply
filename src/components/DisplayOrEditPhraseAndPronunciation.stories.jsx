import React from 'react';
import { DisplayOrEditPhraseAndPronunciation } from './DisplayOrEditPhraseAndPronunciation';

export default {
  title: 'Components/DisplayOrEditPhraseAndPronunciation',
  component: DisplayOrEditPhraseAndPronunciation,
  parameters: {
    layout: 'padded',
  },
};

const mockWord = {
  id: '1',
  phrase: 'bonjour',
  pronunciation: 'bohn-ZHOOR',
  definition: 'hello; good day',
};

export const Default = {
  args: {
    phrase: 'bonjour',
    pronunciation: 'bohn-ZHOOR',
    word: mockWord,
  },
};

export const LongPhrase = {
  args: {
    phrase: 'Comment allez-vous?',
    pronunciation: 'koh-mahn tah-lay-VOO',
    word: {
      ...mockWord,
      phrase: 'Comment allez-vous?',
      pronunciation: 'koh-mahn tah-lay-VOO',
    },
  },
};

export const ShortPhrase = {
  args: {
    phrase: 'oui',
    pronunciation: 'wee',
    word: {
      ...mockWord,
      phrase: 'oui',
      pronunciation: 'wee',
    },
  },
};

export const JapaneseExample = {
  args: {
    phrase: 'こんにちは',
    pronunciation: 'konnichiwa',
    word: {
      id: '2',
      phrase: 'こんにちは',
      pronunciation: 'konnichiwa',
      definition: 'hello; good afternoon',
    },
  },
};
