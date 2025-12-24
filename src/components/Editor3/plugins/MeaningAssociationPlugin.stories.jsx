/**
 * @fileoverview Storybook stories for MeaningAssociationPlugin
 * Demonstrates vocabulary matching exercises in both editable and read-only modes
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

import MeaningAssociationPlugin, { INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND, MeaningAssociationNode } from './MeaningAssociationPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { MockUnitProvider } from '../../../../.storybook/__mocks__/MockUnitProvider';
import { DictionaryProvider } from '../../../context/dictionaryContext';
import { DndWrapper } from '../../MeaningAssociationExercise/DndWrapper';

export default {
  title: 'Editor3/Plugins/MeaningAssociationPlugin',
  component: MeaningAssociationPlugin,
  parameters: {
    layout: 'fullscreen',
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertMeaningAssociationButton() {
  const [editor] = useLexicalComposerContext();
  
  const handleClick = () => {
    editor.dispatchCommand(INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND, ['word1', 'word2']);
  };
  
  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Meaning Association Block
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: 'MeaningAssociationPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      MeaningAssociationNode,
    ],
  };

  return (
    <MockUnitProvider>
      <DictionaryProvider>
        <DndWrapper>
          <LexicalComposer initialConfig={initialConfig}>
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <h2>Meaning Association Plugin - Editable Mode</h2>
              {showInsertButton && <InsertMeaningAssociationButton />}
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
                      Enter text or insert matching exercises...
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <MeaningAssociationPlugin />
              </div>
            </div>
          </LexicalComposer>
        </DndWrapper>
      </DictionaryProvider>
    </MockUnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: 'MeaningAssociationPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      MeaningAssociationNode,
    ],
  };

  return (
    <MockUnitProvider>
      <DictionaryProvider>
        <DndWrapper>
          <LexicalComposer initialConfig={initialConfig}>
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
              <h2>Meaning Association Plugin - Read-Only Mode</h2>
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
                <MeaningAssociationPlugin />
              </div>
            </div>
          </LexicalComposer>
        </DndWrapper>
      </DictionaryProvider>
    </MockUnitProvider>
  );
};

const sampleMeaningAssociationState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Vocabulary Matching Exercise',
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
            text: 'Match the words with their definitions:',
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
        wordIDs: ['word-1', 'word-2', 'word-3', 'word-4'],
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

export const EditableWithExercise = {
  render: () => <EditableTemplate editorState={sampleMeaningAssociationState} />,
};

export const ReadOnlyWithExercise = {
  render: () => <ReadOnlyTemplate editorState={sampleMeaningAssociationState} />,
};
