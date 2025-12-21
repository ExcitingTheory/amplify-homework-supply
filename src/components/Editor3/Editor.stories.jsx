import React from 'react';
import Editor, { Workbook } from './index';
import { MockUnitProvider } from './mocks/MockUnitProvider';

export default {
  title: 'Editor/Editor',
  component: Editor,
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

const sampleEditorState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Welcome to the Language Editor',
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
            text: 'This is a sample paragraph. You can edit, format, and add various types of content here.',
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

export const EmptyEditor = {
  args: {},
};

export const EditorWithContent = {
  decorators: [
    (Story) => (
      <MockUnitProvider
        mockValue={{
          unit: {
            id: 'mock-unit-id',
            name: 'Sample Unit with Content',
            description: 'This unit has some sample content',
            data: sampleEditorState,
            _version: 1,
            owner: 'mock-owner',
          },
          editorStateRef: { current: sampleEditorState },
        }}
      >
        <Story />
      </MockUnitProvider>
    ),
  ],
};
