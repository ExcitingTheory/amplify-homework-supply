/**
 * @fileoverview Storybook stories for QuizPlugin
 * Demonstrates interactive quizzes in both editable and read-only modes
 */

import React from 'react';
import { within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Button } from '@mui/material';

import QuizPlugin, { INSERT_QUIZ_COMMAND, QuizNode } from './QuizPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';

export default {
  title: '🔌 Editor Plugins/Content Blocks/Quiz',
  component: QuizPlugin,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertQuizButton() {
  const [editor] = useLexicalComposerContext();
  
  const handleClick = () => {
    editor.dispatchCommand(INSERT_QUIZ_COMMAND, null);
  };
  
  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Quiz Block
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: 'QuizPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, QuizNode],
  };

  const unitId = 'story-unit-id-' + Math.random();
  seedMockUnit({
    id: unitId,
    name: 'Quiz Story Unit',
    data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Quiz Plugin - Editable Mode</h2>
          {showInsertButton && <InsertQuizButton />}
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minHeight: '400px',
            padding: '20px'
          }}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ outline: 'none', minHeight: '350px' }} />}
              placeholder={
                <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#999' }}>
                  Enter text or insert quizzes...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <QuizPlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: 'QuizPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, QuizNode],
  };

  const unitId = 'story-unit-id-' + Math.random();
  seedMockUnit({
    id: unitId,
    name: 'Quiz Story Unit',
    data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Quiz Plugin - Read-Only Mode</h2>
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minHeight: '400px',
            padding: '20px',
            backgroundColor: '#f5f5f5'
          }}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ outline: 'none', minHeight: '350px' }} />}
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <QuizPlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const sampleQuizState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Multiple Choice Quiz',
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
            text: 'Answer the following questions:',
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
            id: 'q1',
            answer: 'Paris',
            question: 'What is the capital of France?',
            correct: true,
          },
          {
            id: 'q2',
            answer: 'London',
            question: 'What is the capital of France?',
            correct: false,
          },
          {
            id: 'q3',
            answer: 'Berlin',
            question: 'What is the capital of France?',
            correct: false,
          },
          {
            id: 'q4',
            answer: 'Madrid',
            question: 'What is the capital of France?',
            correct: false,
          },
        ],
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
};

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} showInsertButton={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { expect } = await import('storybook/test');
    
    // Wait for insert button to be visible
    await waitFor(() => {
      const insertButton = canvas.getByRole('button', { name: /insert.*quiz/i });
      expect(insertButton).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

export const EditableWithQuiz = {
  render: () => <EditableTemplate editorState={sampleQuizState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { expect } = await import('storybook/test');
    
    // Wait for quiz block to render
    await waitFor(() => {
      expect(canvas.getByText('Paris')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify all 4 answer options are visible
    expect(canvas.getByText('London')).toBeInTheDocument();
    expect(canvas.getByText('Berlin')).toBeInTheDocument();
    expect(canvas.getByText('Madrid')).toBeInTheDocument();
  },
};

export const ReadOnlyWithQuiz = {
  render: () => <ReadOnlyTemplate editorState={sampleQuizState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { expect } = await import('storybook/test');
    
    // Wait for quiz in read-only mode
    await waitFor(() => {
      expect(canvas.getByText('Paris')).toBeInTheDocument();
    }, { timeout: 5000 });
  },
};
