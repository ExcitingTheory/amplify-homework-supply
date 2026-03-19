/**
 * @fileoverview Storybook stories for AnswerPlugin
 * Demonstrates vocabulary answer exercises in both editable and read-only modes
 */

import React from 'react';
import { within, userEvent, waitFor, expect } from '@storybook/test';
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

import AnswerPlugin, { INSERT_ANSWER_BLOCK_COMMAND, AnswerNode } from './AnswerPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';

export default {
  title: '🔌 Editor Plugins/Content Blocks/Answer',
  component: AnswerPlugin,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertAnswerButton() {
  const [editor] = useLexicalComposerContext();
  
  const handleClick = () => {
    editor.dispatchCommand(INSERT_ANSWER_BLOCK_COMMAND, {
      wordIDs: ['word-1', 'word-2'],
      requestDefinition: 'translation',
      allowedInput: ['text'],
      promptMethod: ['text'],
    });
  };
  
  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Answer Block
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: 'AnswerPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, AnswerNode],
  };

  // Use the preview's default unit ID
  seedMockUnit({
    id: 'mock-unit-id',
    name: 'Answer Story Unit',
    data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
    wordIDs: ['word-1', 'word-2', 'word-5', 'word-6'], // Link words used in the answer blocks
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Answer Plugin - Editable Mode</h2>
        {showInsertButton && <InsertAnswerButton />}
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
                Enter text or insert answer fields...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AnswerPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: 'AnswerPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, AnswerNode],
  };

  // Use the preview's default unit ID
  seedMockUnit({
    id: 'mock-unit-id',
    name: 'Answer Story Unit',
    data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
    wordIDs: ['word-1', 'word-2', 'word-5', 'word-6'], // Link words used in the answer blocks
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Answer Plugin - Read-Only Mode</h2>
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
          <AnswerPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const sampleAnswerState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Vocabulary Answer Exercise',
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
            text: 'Provide translations or definitions for the following:',
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
        wordIDs: ['word-5', 'word-6'],
        requestDefinition: 'translation',
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

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} showInsertButton={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify insert button is visible
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: /Insert Answer Block/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

export const EditableWithAnswer = {
  render: () => <EditableTemplate editorState={sampleAnswerState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for answer block to render
    await waitFor(() => {
      expect(canvas.getByText(/Vocabulary Answer Exercise/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify prompt is visible
    expect(canvas.getByText(/Provide translations or definitions/i)).toBeInTheDocument();
  },
};

export const ReadOnlyWithAnswer = {
  render: () => <ReadOnlyTemplate editorState={sampleAnswerState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for read-only view to render
    await waitFor(() => {
      expect(canvas.getByText(/Answer Plugin - Read-Only Mode/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify content is present
    expect(canvas.getByText(/Vocabulary Answer Exercise/i)).toBeInTheDocument();
  },
};
