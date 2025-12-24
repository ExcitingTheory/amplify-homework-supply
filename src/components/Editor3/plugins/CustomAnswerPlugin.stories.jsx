/**
 * @fileoverview Storybook stories for CustomAnswerPlugin
 * Demonstrates custom Q&A exercises in both editable and read-only modes
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Button } from '@mui/material';

import CustomAnswerPlugin, { INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, CustomAnswerNode } from './CustomAnswerPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { MockUnitProvider } from '../../../../.storybook/__mocks__/MockUnitProvider';
import { DictionaryProvider } from '../../../context/dictionaryContext';

export default {
  title: 'Editor3/Plugins/CustomAnswerPlugin',
  component: CustomAnswerPlugin,
  parameters: {
    layout: 'fullscreen',
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertCustomAnswerButton() {
  const [editor] = useLexicalComposerContext();
  
  const handleClick = () => {
    editor.dispatchCommand(INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, null);
  };
  
  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Custom Answer Block
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: 'CustomAnswerPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, CustomAnswerNode],
  };

  return (
    <MockUnitProvider>
      <DictionaryProvider>
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Custom Answer Plugin - Editable Mode</h2>
            {showInsertButton && <InsertCustomAnswerButton />}
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
                    Enter text or insert custom answer fields...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <CustomAnswerPlugin />
            </div>
          </div>
        </LexicalComposer>
      </DictionaryProvider>
    </MockUnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: 'CustomAnswerPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, CustomAnswerNode],
  };

  return (
    <MockUnitProvider>
      <DictionaryProvider>
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Custom Answer Plugin - Read-Only Mode</h2>
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
              <CustomAnswerPlugin />
            </div>
          </div>
        </LexicalComposer>
      </DictionaryProvider>
    </MockUnitProvider>
  );
};

const sampleCustomAnswerState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Custom Question Exercise',
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
            text: 'Answer the following question:',
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
        data: {
          prompt: 'Describe your learning experience',
          wordIDs: [],
        },
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
};

export const EditableWithCustomAnswer = {
  render: () => <EditableTemplate editorState={sampleCustomAnswerState} />,
};

export const ReadOnlyWithCustomAnswer = {
  render: () => <ReadOnlyTemplate editorState={sampleCustomAnswerState} />,
};
