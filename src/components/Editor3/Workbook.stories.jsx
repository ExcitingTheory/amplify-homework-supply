import React from 'react';
import { Workbook } from './index';
import { seedMockUnit, seedMockGrade } from '../../../.storybook/__mocks__/aws-amplify-datastore';
import { MOCK_IMAGE_URL_1 } from '../../../.storybook/__mocks__/media';
import { userEvent, within, waitFor, expect } from 'storybook/test';

export default {
  title: '📚 Creating Lessons/Workbook',
  component: Workbook,
  parameters: {
    layout: 'fullscreen',
  },
};

const sampleWorkbookState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Lesson 1: Introduction',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Welcome to this interactive workbook. Complete the exercises below to test your knowledge.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Key Concepts',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Concept 1: Understanding the basics',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Concept 2: Applying knowledge',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 2,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Concept 3: Advanced topics',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 3,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'list',
            version: 1,
            listType: 'number',
            start: 1,
            tag: 'ol',
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const EmptyWorkbook = {
  loaders: [
    async () => {
      const { clearMockData } = await import('../../../.storybook/__mocks__/aws-amplify-datastore');
      clearMockData();
      
      seedMockUnit({
        id: 'empty-workbook-id',
        name: 'Empty Workbook',
        description: 'A blank workbook to start learning',
        data: null,
        _version: 1,
        owner: 'mock-user-sub',
      });
      
      seedMockGrade({
        id: 'grade-empty-1',
        unitID: 'empty-workbook-id',
        owner: 'mock-user-sub',
        unitVersion: 1,
        percentComplete: 0,
        accuracy: 0,
        complete: false,
        timerStarted: false,
        data: {},
        _version: 1,
      });
    },
  ],
  render: () => <Workbook />,
  parameters: {
    unitId: 'empty-workbook-id',
    initializeMockData: false,
  },
};

export const WorkbookWithContent = {
  loaders: [
    async () => {
      const { clearMockData } = await import('../../../.storybook/__mocks__/aws-amplify-datastore');
      clearMockData();
      
      seedMockUnit({
        id: 'workbook-with-content-id',
        name: 'Sample Workbook Lesson',
        description: 'This is a sample workbook with interactive content',
        data: JSON.stringify(sampleWorkbookState),
        _version: 1,
        owner: 'mock-user-sub',
      });
      
      seedMockGrade({
        id: 'grade-content-1',
        unitID: 'workbook-with-content-id',
        owner: 'mock-user-sub',
        unitVersion: 1,
        percentComplete: 0,
        accuracy: 0,
        complete: false,
        timerStarted: false,
        data: {},
        _version: 1,
      });
    },
  ],
  render: () => <Workbook />,
  parameters: {
    unitId: 'workbook-with-content-id',
    initializeMockData: false,
  },
};

const workbookWithProgressState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Vocabulary Practice',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Complete these exercises to test your vocabulary knowledge.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Meaning Association Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Match words with their meanings:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'meaning-association',
        version: 1,
        wordIDs: ['vocab-word-1', 'vocab-word-2', 'vocab-word-3', 'vocab-word-4', 'vocab-word-5'],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Multiple Choice Questions',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        type: 'quiz',
        version: 1,
        data: [
          {
            id: 'progress-quiz-q1',
            answer: 'Hello',
            correct: true,
          },
          {
            id: 'progress-quiz-q2',
            answer: 'Goodbye',
            correct: false,
          },
          {
            id: 'progress-quiz-q3',
            answer: 'Thank you',
            correct: false,
          },
          {
            id: 'progress-quiz-q4',
            answer: 'Please',
            correct: false,
          },
          {
            id: 'progress-quiz-q5',
            answer: '犬 (inu)',
            correct: false,
          },
          {
            id: 'progress-quiz-q6',
            answer: '猫 (neko)',
            correct: true,
          },
          {
            id: 'progress-quiz-q7',
            answer: '本 (hon)',
            correct: false,
          },
          {
            id: 'progress-quiz-q8',
            answer: '水 (mizu)',
            correct: false,
          },
          {
            id: 'progress-quiz-q9',
            answer: 'さようなら',
            correct: false,
          },
          {
            id: 'progress-quiz-q10',
            answer: 'こんにちは',
            correct: false,
          },
          {
            id: 'progress-quiz-q11',
            answer: 'ありがとう',
            correct: true,
          },
          {
            id: 'progress-quiz-q12',
            answer: 'すみません',
            correct: false,
          },
          {
            id: 'progress-quiz-q13',
            answer: 'いぬ',
            correct: true,
          },
          {
            id: 'progress-quiz-q14',
            answer: 'ねこ',
            correct: false,
          },
          {
            id: 'progress-quiz-q15',
            answer: 'ほん',
            correct: false,
          },
          {
            id: 'progress-quiz-q16',
            answer: 'みず',
            correct: false,
          },
        ],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Custom Questions',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        type: 'custom-answer',
        version: 1,
        key: 'custom-q-1',
        ids: ['question-1'],
        allowedInput: ['text'],
        promptMethod: ['text'],
      },
      {
        type: 'custom-answer',
        version: 1,
        key: 'custom-q-2',
        ids: ['question-2'],
        allowedInput: ['text', 'audio'],
        promptMethod: ['text'],
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const WorkbookWithProgress = {
  loaders: [
    async () => {
      const { seedMockWords, clearMockData } = await import('../../../.storybook/__mocks__/aws-amplify-datastore');
      const { MOCK_AUDIO_BASE64, mockWaveformData } = await import('../../../.storybook/__mocks__/media');
      
      clearMockData();
      
      seedMockUnit({
        id: 'workbook-with-progress-id',
        name: 'Sample Workbook with Progress',
        description: 'This workbook shows progress tracking with partial completion',
        data: JSON.stringify(workbookWithProgressState),
        wordIDs: ['vocab-word-1', 'vocab-word-2', 'vocab-word-3'],
        _version: 1,
        owner: 'student-alice-sub',
      });
      
      // Seed empty grade - will be populated by StoryProgressPlugin after editor loads
      seedMockGrade({
        id: 'grade-progress-1',
        unitID: 'workbook-with-progress-id',
        owner: 'student-alice-sub',
        percentComplete: 0,
        accuracy: 0,
        complete: false,
        timerStarted: false,
        data: {},
        _version: 1,
      });
      
      // Seed vocabulary words
      seedMockWords([
        {
          id: 'vocab-word-1',
          phrase: 'こんにちは',
          pronunciation: 'kon-ni-chi-wa',
          definition: 'Hello (Japanese)',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(0, 20)),
          definitionAudio: [MOCK_AUDIO_BASE64],
          definitionWaveformData: JSON.stringify(mockWaveformData.slice(20, 40)),
          owner: 'student-alice-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-2',
          phrase: '猫',
          pronunciation: 'neko',
          definition: 'Cat (Japanese)',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(40, 60)),
          definitionAudio: [MOCK_AUDIO_BASE64],
          definitionWaveformData: JSON.stringify(mockWaveformData.slice(60, 80)),
          owner: 'student-alice-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-3',
          phrase: 'ありがとう',
          pronunciation: 'a-ri-ga-tou',
          definition: 'Thank you (Japanese)',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(80, 100)),
          definitionAudio: [MOCK_AUDIO_BASE64],
          definitionWaveformData: JSON.stringify(mockWaveformData.slice(100, 120)),
          owner: 'student-alice-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-4',
          phrase: '犬',
          pronunciation: 'inu',
          definition: 'Dog (Japanese)',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(120, 140)),
          definitionAudio: [MOCK_AUDIO_BASE64],
          definitionWaveformData: JSON.stringify(mockWaveformData.slice(140, 160)),
          owner: 'student-alice-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-5',
          phrase: 'さようなら',
          pronunciation: 'sa-you-na-ra',
          definition: 'Goodbye (Japanese)',
          audio: [MOCK_AUDIO_BASE64],
          waveformData: JSON.stringify(mockWaveformData.slice(160, 180)),
          definitionAudio: [MOCK_AUDIO_BASE64],
          definitionWaveformData: JSON.stringify(mockWaveformData.slice(180, 200)),
          owner: 'student-alice-sub',
          _version: 1,
        },
      ]);
    },
  ],
  render: () => <Workbook />,
  parameters: {
    unitId: 'workbook-with-progress-id',
    initializeMockData: false,
  },
};

const kitchenSinkWorkbookState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Kitchen Sink: All Workbook Block Types',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Complete your vocabulary exercises below. This workbook includes all available interactive exercise types.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This workbook demonstrates ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'bold',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 2,
            mode: 'normal',
            style: '',
            text: 'italic',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 8,
            mode: 'normal',
            style: '',
            text: 'underline',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 4,
            mode: 'normal',
            style: '',
            text: 'strikethrough',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 32,
            mode: 'normal',
            style: '',
            text: 'subscript',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 64,
            mode: 'normal',
            style: '',
            text: 'superscript',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'color: rgb(46, 170, 220);',
            text: 'text colors',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'background-color: rgb(250, 222, 201);',
            text: 'background colors',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'font-size: 20px;',
            text: 'font sizes',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ', and ',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: 'font-family: Courier New;',
            text: 'custom fonts',
            type: 'text',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'horizontalrule',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Text Alignment Examples',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Left-aligned text (default)',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'left',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Center-aligned text',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'center',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Right-aligned text',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'right',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Justified text stretches across the full width of the container for a clean, professional appearance in workbook materials.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: 'justify',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'horizontalrule',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Section 1: Vocabulary Exercises',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Word Display Block',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This block displays vocabulary information from the dictionary:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'word-block',
        version: 1,
        wordID: 'vocab-word-1',
        format: '',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Answer Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Provide the translation or definition for the following words:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'answer',
        version: 1,
        wordIDs: ['vocab-word-1', 'vocab-word-2', 'vocab-word-3'],
        requestDefinition: 'translation',
        allowedInput: ['text', 'audio'],
        promptMethod: ['text'],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Custom Answer Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Custom answer field with advanced validation:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'custom-answer',
        version: 1,
        key: 'custom-q-kitchen-1',
        ids: ['question-1', 'question-2'],
        allowedInput: ['text', 'audio', 'writing'],
        promptMethod: ['text', 'audio'],
      },
      {
        type: 'horizontalrule',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Section 2: Interactive Exercises',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Meaning Association Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Match words with their meanings. This exercise has Easy, Hard, and Learn modes:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'meaning-association',
        version: 1,
        wordIDs: ['vocab-word-1', 'vocab-word-2', 'vocab-word-3', 'vocab-word-4', 'vocab-word-5'],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Quiz Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Complete the quiz below with automatic grading:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'quiz',
        version: 1,
        data: [
          {
            id: 'quiz-q1',
            answer: 'Hello',
            correct: true,
          },
          {
            id: 'quiz-q2',
            answer: 'Goodbye',
            correct: false,
          },
          {
            id: 'quiz-q3',
            answer: 'Thank you',
            correct: false,
          },
          {
            id: 'quiz-q4',
            answer: 'Please',
            correct: false,
          },
          {
            id: 'quiz-q5',
            answer: '犬 (inu)',
            correct: false,
          },
          {
            id: 'quiz-q6',
            answer: '猫 (neko)',
            correct: true,
          },
          {
            id: 'quiz-q7',
            answer: '本 (hon)',
            correct: false,
          },
          {
            id: 'quiz-q8',
            answer: '水 (mizu)',
            correct: false,
          },
          {
            id: 'quiz-q9',
            answer: 'さようなら',
            correct: false,
          },
          {
            id: 'quiz-q10',
            answer: 'こんにちは',
            correct: false,
          },
          {
            id: 'quiz-q11',
            answer: 'ありがとう',
            correct: true,
          },
          {
            id: 'quiz-q12',
            answer: 'すみません',
            correct: false,
          },
          {
            id: 'quiz-q13',
            answer: 'いぬ',
            correct: true,
          },
          {
            id: 'quiz-q14',
            answer: 'ねこ',
            correct: false,
          },
          {
            id: 'quiz-q15',
            answer: 'ほん',
            correct: false,
          },
          {
            id: 'quiz-q16',
            answer: 'みず',
            correct: false,
          },
        ],
      },
      {
        type: 'horizontalrule',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Section 3: Media and Rich Content',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'YouTube Video',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Watch this instructional video:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'youtube',
        version: 1,
        videoID: 'jNQXAC9IVRw',
        format: '',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Audio Playlist',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Listen to these pronunciation examples:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'playlist',
        version: 1,
        fileIDs: ['file-3', 'file-4', 'file-8'],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Image with Caption',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'image',
        version: 1,
        src: MOCK_IMAGE_URL_1,
        altText: 'Example diagram for learning',
        width: 600,
        height: 400,
        maxWidth: 600,
        showCaption: true,
        caption: {
          editorState: {
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 2,
                      mode: 'normal',
                      style: '',
                      text: 'Figure 1: Vocabulary structure diagram',
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
        },
      },
      {
        type: 'horizontalrule',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Section 4: Formatting and Layout',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Two-Column Layout',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'layout-container',
        version: 1,
        templateColumns: '1fr 1fr',
        children: [
          {
            type: 'layout-item',
            version: 1,
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'Japanese',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'heading',
                version: 1,
                tag: 'h4',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'こんにちは',
                            type: 'text',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'listitem',
                        version: 1,
                        value: 1,
                      },
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'ありがとう',
                            type: 'text',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'listitem',
                        version: 1,
                        value: 2,
                      },
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'さようなら',
                            type: 'text',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'listitem',
                        version: 1,
                        value: 3,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'list',
                    version: 1,
                    listType: 'bullet',
                    start: 1,
                    tag: 'ul',
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
          },
          {
            type: 'layout-item',
            version: 1,
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'English',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'heading',
                version: 1,
                tag: 'h4',
              },
              {
                children: [
                  {
                    children: [
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'Hello',
                            type: 'text',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'listitem',
                        version: 1,
                        value: 1,
                      },
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'Thank you',
                            type: 'text',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'listitem',
                        version: 1,
                        value: 2,
                      },
                      {
                        children: [
                          {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'Goodbye',
                            type: 'text',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        type: 'listitem',
                        version: 1,
                        value: 3,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'list',
                    version: 1,
                    listType: 'bullet',
                    start: 1,
                    tag: 'ul',
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
          },
        ],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Reference Table',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        type: 'table',
        version: 1,
        children: [
          {
            type: 'tablerow',
            version: 1,
            children: [
              {
                type: 'tablecell',
                version: 1,
                headerState: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'Word',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'Reading',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 1,
                        mode: 'normal',
                        style: '',
                        text: 'Meaning',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
            ],
          },
          {
            type: 'tablerow',
            version: 1,
            children: [
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '犬',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'いぬ (inu)',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'dog',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
            ],
          },
          {
            type: 'tablerow',
            version: 1,
            children: [
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '猫',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'ねこ (neko)',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
              {
                type: 'tablecell',
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'cat',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Code Example',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Example vocabulary data structure:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '{\n  "word": "こんにちは",\n  "reading": "konnichiwa",\n  "meaning": "hello",\n  "type": "greeting"\n}',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'code',
        version: 1,
        language: 'json',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Quote',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h3',
      },
      {
        children: [
          {
            detail: 0,
            format: 2,
            mode: 'normal',
            style: '',
            text: '"Language learning is not a spectator sport. You must practice regularly to achieve fluency."',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'quote',
        version: 1,
      },
      {
        type: 'horizontalrule',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: 'normal',
            style: '',
            text: 'Completion',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Great work! You have completed all sections of this comprehensive workbook. Review any exercises marked for improvement and practice regularly.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const KitchenSink = {
  loaders: [
    async () => {
      const { seedMockWords, seedMockFiles, seedMockGrade, clearMockData } = await import('../../../.storybook/__mocks__/aws-amplify-datastore');
      
      // Clear any existing mock data to ensure clean state
      clearMockData();
      
      seedMockUnit({
        id: 'kitchen-sink-workbook-id',
        name: 'Kitchen Sink - All Workbook Blocks',
        description: 'Comprehensive workbook showing all available interactive exercise types',
        data: JSON.stringify(kitchenSinkWorkbookState),
        wordIDs: ['vocab-word-1', 'vocab-word-2', 'vocab-word-3'],
        _version: 1,
        owner: 'mock-user-sub',
      });
      
      seedMockGrade({
        id: 'grade-kitchen-sink-1',
        unitID: 'kitchen-sink-workbook-id',
        owner: 'mock-user-sub',
        unitVersion: 1,
        percentComplete: 0,
        accuracy: 0,
        complete: false,
        timerStarted: false,
        data: {},
        _version: 1,
      });
      
      // Seed vocabulary words
      seedMockWords([
        {
          id: 'vocab-word-1',
          phrase: 'こんにちは',
          pronunciation: 'kon-ni-chi-wa',
          definition: 'Hello (Japanese)',
          owner: 'mock-user-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-2',
          phrase: '猫',
          pronunciation: 'neko',
          definition: 'Cat (Japanese)',
          owner: 'mock-user-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-3',
          phrase: 'ありがとう',
          pronunciation: 'a-ri-ga-tou',
          definition: 'Thank you (Japanese)',
          owner: 'mock-user-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-4',
          phrase: '犬',
          pronunciation: 'inu',
          definition: 'Dog (Japanese)',
          owner: 'mock-user-sub',
          _version: 1,
        },
        {
          id: 'vocab-word-5',
          phrase: 'さようなら',
          pronunciation: 'sa-you-na-ra',
          definition: 'Goodbye (Japanese)',
          owner: 'mock-user-sub',
          _version: 1,
        },
      ]);
      
      // Import the proper mock audio base64 data
      const { MOCK_AUDIO_BASE64, mockWaveformData } = await import('../../../.storybook/__mocks__/media');
      
      // Seed audio files for playlist
      seedMockFiles([
        {
          id: 'file-3',
          name: 'vocabulary-lesson.mp3',
          path: MOCK_AUDIO_BASE64,
          mimeType: 'audio/mpeg',
          size: 1048576,
          identityId: 'mock-identity-id',
          owner: 'mock-user-sub',
          createdAt: new Date('2024-01-17T14:00:00Z').toISOString(),
          waveformData: JSON.stringify(mockWaveformData),
          _version: 1,
        },
        {
          id: 'file-4',
          name: 'pronunciation-guide.mp3',
          path: MOCK_AUDIO_BASE64,
          mimeType: 'audio/mpeg',
          size: 892416,
          identityId: 'mock-identity-id',
          owner: 'mock-user-sub',
          createdAt: new Date('2024-01-18T09:15:00Z').toISOString(),
          waveformData: JSON.stringify(mockWaveformData),
          _version: 1,
        },
        {
          id: 'file-8',
          name: 'listening-exercise.mp3',
          path: MOCK_AUDIO_BASE64,
          mimeType: 'audio/mpeg',
          size: 1310720,
          identityId: 'mock-identity-id',
          owner: 'mock-user-sub',
          createdAt: new Date('2024-01-22T15:10:00Z').toISOString(),
          waveformData: JSON.stringify(mockWaveformData),
          _version: 1,
        },
      ]);
    },
  ],
  render: () => <Workbook />,
  parameters: {
    unitId: 'kitchen-sink-workbook-id',
    initializeMockData: false, // Story provides its own complete mock data
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for workbook to load
    await waitFor(() => {
      return canvasElement.querySelector('[data-lexical-editor=\"true\"]') !== null;
    }, { timeout: 3000 });

    // Scroll through and interact with different components
    // 1. Interact with Meaning Association Exercise
    await waitFor(async () => {
      const meaningCards = canvasElement.querySelectorAll('[draggable=\"true\"]');
      if (meaningCards.length >= 2) {
        // Drag first card
        const firstCard = meaningCards[0];
        const secondCard = meaningCards[1];
        
        // Simulate drag and drop by clicking
        await userEvent.click(firstCard);
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Meaning association cards not found') });

    // 2. Scroll to find and interact with Quiz questions
    await waitFor(async () => {
      const quizCheckboxes = canvasElement.querySelectorAll('input[type=\"checkbox\"]');
      if (quizCheckboxes.length > 0) {
        // Check first quiz answer
        await userEvent.click(quizCheckboxes[0]);
        // Check second quiz answer after delay
        setTimeout(async () => {
          if (quizCheckboxes[1]) {
            await userEvent.click(quizCheckboxes[1]);
          }
        }, 500);
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Quiz checkboxes not found') });

    // 3. Interact with Custom Answer components (text inputs)
    await waitFor(async () => {
      const textInputs = canvasElement.querySelectorAll('textarea, input[type=\"text\"]');
      if (textInputs.length > 0) {
        // Type into first custom answer field
        await userEvent.click(textInputs[0]);
        await userEvent.keyboard('This is my answer to the question');
        
        // Type into second field if exists
        if (textInputs[1]) {
          setTimeout(async () => {
            await userEvent.click(textInputs[1]);
            await userEvent.keyboard('Another practice answer');
          }, 500);
        }
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Text inputs not found') });

    // 4. Look for and interact with audio players if present
    await waitFor(async () => {
      const playButtons = canvasElement.querySelectorAll('[aria-label=\"Play\"], [title*=\"play\" i]');
      if (playButtons.length > 0) {
        // Click first play button
        await userEvent.click(playButtons[0]);
        
        // Pause after a moment
        setTimeout(async () => {
          const pauseButtons = canvasElement.querySelectorAll('[aria-label=\"Pause\"], [title*=\"pause\" i]');
          if (pauseButtons[0]) {
            await userEvent.click(pauseButtons[0]);
          }
        }, 1000);
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Play buttons not found') });

    // 5. Test radio buttons for multiple choice if present
    await waitFor(async () => {
      const radioButtons = canvasElement.querySelectorAll('input[type=\"radio\"]');
      if (radioButtons.length > 0) {
        // Select first radio option
        await userEvent.click(radioButtons[0]);
        
        // Select a different option after delay
        setTimeout(async () => {
          if (radioButtons[2]) {
            await userEvent.click(radioButtons[2]);
          }
        }, 500);
        return true;
      }
      return false;
    }, { timeout: 2000, onTimeout: () => console.log('Radio buttons not found') });

    // 6. Scroll through the workbook
    const workbookContainer = canvasElement.querySelector('[data-lexical-editor=\"true\"]')?.parentElement;
    if (workbookContainer) {
      workbookContainer.scrollTop = 300;
      await waitFor(() => true, { timeout: 500 });
      workbookContainer.scrollTop = 600;
      await waitFor(() => true, { timeout: 500 });
      workbookContainer.scrollTop = 900;
    }
  },
};

const dataPluginWorkbookState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'DataPlugin in Workbook Mode',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'In read-only workbook mode, the DataPlugin loads student-facing content from unit.data while maintaining exercise state in grade.data.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'DataPlugin Responsibilities:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'Content Loading:',
                    type: 'text',
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' Loads lesson content, exercises, and interactive elements',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'State Preservation:',
                    type: 'text',
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' Maintains student progress between page reloads',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 2,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'Version Tracking:',
                    type: 'text',
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' Prevents redundant updates using unit._version',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 3,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'Data Validation:',
                    type: 'text',
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: ' Validates editor state has proper structure before loading',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'listitem',
                version: 1,
                value: 4,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'list',
            version: 1,
            listType: 'bullet',
            start: 1,
            tag: 'ul',
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Sample Vocabulary Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Below is an example vocabulary word block loaded by DataPlugin:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'word-block',
        version: 1,
        id: 'sample-word-1',
      },
      {
        children: [
          {
            detail: 0,
            format: 2,
            mode: 'normal',
            style: '',
            text: 'The DataPlugin ensures this content is loaded from the database and synchronized across all instances of the workbook.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const DataPluginDemo = {
  loaders: [
    async () => {
      const { clearMockData } = await import('../../../.storybook/__mocks__/aws-amplify-datastore');
      clearMockData();
      
      seedMockUnit({
        id: 'data-plugin-workbook-demo-id',
        name: 'DataPlugin Workbook Demo',
        description: 'Shows how DataPlugin loads workbook content and preserves student state',
        data: dataPluginWorkbookState,
        _version: 1,
        owner: 'mock-user-sub',
      });
    },
  ],
  render: () => <Workbook />,
  parameters: {
    unitId: 'data-plugin-workbook-demo-id',
    initializeMockData: false,
  },
};
