/**
 * @fileoverview Storybook stories for MeaningAssociationPlugin
 * Demonstrates vocabulary matching exercises in both editable and read-only modes
 */

import React from 'react';
import { within, userEvent, waitFor } from '@storybook/test';
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

import MeaningAssociationPlugin, { INSERT_MEANING_ASSOCIATION_BLOCK_COMMAND, MeaningAssociationNode } from './MeaningAssociationPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';
import DictionaryContext from '../../../context/dictionaryContext';
import { DndWrapper } from '../../MeaningAssociationExercise/DndWrapper';
import { MOCK_AUDIO_URL_1, MOCK_AUDIO_URL_2, MOCK_AUDIO_URL_3 } from '../../../../.storybook/__mocks__/media';

export default {
  title: '🔌 Editor Plugins/Content Blocks/Meaning Association',
  component: MeaningAssociationPlugin,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

// Sample dictionary data with audio
const mockDictionary = {
  'word-1': {
    id: 'word-1',
    phrase: 'hello',
    pronunciation: 'heh-LOH',
    definition: 'a greeting or expression of goodwill',
    audio: [MOCK_AUDIO_URL_1],
  },
  'word-2': {
    id: 'word-2',
    phrase: 'goodbye',
    pronunciation: 'good-BYE',
    definition: 'a parting phrase',
    audio: [MOCK_AUDIO_URL_2],
  },
  'word-3': {
    id: 'word-3',
    phrase: 'thank you',
    pronunciation: 'THANK yoo',
    definition: 'an expression of gratitude',
    audio: [MOCK_AUDIO_URL_3],
  },
  'word-4': {
    id: 'word-4',
    phrase: 'please',
    pronunciation: 'PLEEZ',
    definition: 'used to make a polite request',
    audio: [MOCK_AUDIO_URL_1],
  },
};

const mockDictionaryContext = {
  filteredDictionary: mockDictionary,
  dictionary: mockDictionary,
  wordMapId: mockDictionary,
  wordMapPhrase: {
    'hello': mockDictionary['word-1'],
    'goodbye': mockDictionary['word-2'],
    'thank you': mockDictionary['word-3'],
    'please': mockDictionary['word-4'],
  },
  setFilter: () => {},
  searching: false,
  setSearching: () => {},
  filter: '',
  filterWords: () => {},
  wordRefs: {},
  questionBank: {},
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
  const unitId = 'meaning-association-demo-editable';
  
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

  seedMockUnit({
    id: unitId,
    name: 'Meaning Association Plugin Demo',
    description: 'Demo for Meaning Association Plugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <DictionaryContext.Provider value={mockDictionaryContext}>
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
      </DictionaryContext.Provider>
    </UnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const unitId = 'meaning-association-demo-readonly';
  
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

  seedMockUnit({
    id: unitId,
    name: 'Meaning Association Plugin Demo (Read-Only)',
    description: 'Demo for Meaning Association Plugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <DictionaryContext.Provider value={mockDictionaryContext}>
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
      </DictionaryContext.Provider>
    </UnitProvider>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { expect } = await import('@storybook/test');
    
    // Wait for insert button
    await waitFor(() => {
      const insertButton = canvas.getByRole('button', { name: /insert.*meaning|match/i });
      expect(insertButton).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

export const EditableWithExercise = {
  render: () => <EditableTemplate editorState={sampleMeaningAssociationState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { expect } = await import('@storybook/test');
    
    // Wait for meaning association exercise to render
    await waitFor(() => {
      expect(canvas.getByText(/Vocabulary Matching Exercise/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify exercise instruction text
    expect(canvas.getByText(/Match the words with their definitions/i)).toBeInTheDocument();
  },
};

export const ReadOnlyWithExercise = {
  render: () => <ReadOnlyTemplate editorState={sampleMeaningAssociationState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { expect } = await import('@storybook/test');
    
    // Wait for read-only meaning association
    await waitFor(() => {
      expect(canvas.getByText(/Vocabulary Matching Exercise/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  },
};
