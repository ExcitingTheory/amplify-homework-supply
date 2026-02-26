/**
 * @fileoverview Storybook stories for LayoutPlugin
 * Demonstrates multi-column layouts in both editable and read-only modes
 */

import React from 'react';
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

import { LayoutPlugin, INSERT_LAYOUT_COMMAND } from './LayoutPlugin';
import { LayoutContainerNode } from '../components/LayoutContainerNode';
import { LayoutItemNode } from '../components/LayoutItemNode';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';

export default {
  title: '🔌 Editor Plugins/Formatting/Layout',
  component: LayoutPlugin,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertLayoutButton() {
  const [editor] = useLexicalComposerContext();
  
  const handleClick = () => {
    editor.dispatchCommand(INSERT_LAYOUT_COMMAND, '1fr 1fr');
  };
  
  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert 2-Column Layout
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const unitId = 'layout-demo-editable';
  
  const initialConfig = {
    namespace: 'LayoutPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, LayoutContainerNode, LayoutItemNode],
  };

  seedMockUnit({
    id: unitId,
    name: 'Layout Plugin Demo',
    description: 'Demo for Layout Plugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <style jsx global>{`
          .layout-container {
            display: grid;
          }
          .layout-container > div {
            margin: 0.25rem;
            padding: 0.25rem;
            border: 1px dashed #ccc;
          }
        `}</style>
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
          <h2>Layout Plugin - Editable Mode</h2>
          {showInsertButton && <InsertLayoutButton />}
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
                  Enter text or create multi-column layouts...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <LayoutPlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const unitId = 'layout-demo-readonly';
  
  const initialConfig = {
    namespace: 'LayoutPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, LayoutContainerNode, LayoutItemNode],
  };

  seedMockUnit({
    id: unitId,
    name: 'Layout Plugin Demo (Read-Only)',
    description: 'Demo for Layout Plugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <style jsx global>{`
          .layout-container {
            display: grid;
          }
          .layout-container > div {
            margin: 0.25rem;
            padding: 0.25rem;
          }
        `}</style>
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
          <h2>Layout Plugin - Read-Only Mode</h2>
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
            <LayoutPlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const sampleLayoutState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Multi-Column Layout',
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
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Left column content goes here. You can add any type of content in columns.',
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
            type: 'layout-item',
            version: 1,
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Right column content goes here. Layouts help organize content side-by-side.',
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

export const EditableWithLayout = {
  render: () => <EditableTemplate editorState={sampleLayoutState} />,
};

export const ReadOnlyWithLayout = {
  render: () => <ReadOnlyTemplate editorState={sampleLayoutState} />,
};
