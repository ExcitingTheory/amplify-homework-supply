import React from 'react';
import { Workbook } from './index';
import { MockUnitProvider } from './mocks/MockUnitProvider';

export default {
  title: 'Workbook/Workbook',
  component: Workbook,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MockUnitProvider>
        <Story />
      </MockUnitProvider>
    ),
  ],
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
  args: {},
};

export const WorkbookWithContent = {
  decorators: [
    (Story) => (
      <MockUnitProvider
        mockValue={{
          unit: {
            id: 'mock-workbook-id',
            name: 'Sample Workbook Lesson',
            description: 'This is a sample workbook with interactive content',
            data: sampleWorkbookState,
            _version: 1,
            owner: 'mock-owner',
          },
          editorStateRef: { current: sampleWorkbookState },
        }}
      >
        <Story />
      </MockUnitProvider>
    ),
  ],
};

export const WorkbookWithProgress = {
  decorators: [
    (Story) => (
      <MockUnitProvider
        mockValue={{
          unit: {
            id: 'mock-workbook-id',
            name: 'Sample Workbook with Progress',
            description: 'This workbook shows progress tracking',
            data: sampleWorkbookState,
            _version: 1,
            owner: 'mock-owner',
          },
          editorStateRef: { current: sampleWorkbookState },
          finishedQuestions: 3,
          rubric: ['q1', 'q2', 'q3', 'q4', 'q5'],
          grade: {
            id: 'mock-grade-id',
            accuracy: 85,
            complete: false,
            data: {
              q1: { complete: true, accuracy: 100 },
              q2: { complete: true, accuracy: 80 },
              q3: { complete: true, accuracy: 75 },
            },
          },
        }}
      >
        <Story />
      </MockUnitProvider>
    ),
  ],
};
