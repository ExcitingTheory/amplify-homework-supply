import React from 'react';
import { DictionaryEditor } from './DictionaryEditor';

export default {
  title: 'Components/DictionaryEditor',
  component: DictionaryEditor,
  parameters: {
    layout: 'padded',
  },
};

export const Empty = {
  args: {
    dictionary: {},
  },
};

export const WithWords = {
  args: {
    dictionary: {
      'bonjour': {
        id: '1',
        phrase: 'bonjour',
        pronunciation: 'bohn-ZHOOR',
        definition: 'hello; good day',
        audio: [],
      },
      'merci': {
        id: '2',
        phrase: 'merci',
        pronunciation: 'mehr-SEE',
        definition: 'thank you',
        audio: [],
      },
      'au revoir': {
        id: '3',
        phrase: 'au revoir',
        pronunciation: 'oh ruh-VWAHR',
        definition: 'goodbye',
        audio: [],
      },
      // Japanese words
      'こんにちは': {
        id: '4',
        phrase: 'こんにちは',
        pronunciation: 'konnichiwa',
        definition: 'hello; good afternoon',
        audio: [],
      },
      'ありがとう': {
        id: '5',
        phrase: 'ありがとう',
        pronunciation: 'arigatou',
        definition: 'thank you',
        audio: [],
      },
    },
  },
};
