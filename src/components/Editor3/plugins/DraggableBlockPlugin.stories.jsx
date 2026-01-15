/**
 * @fileoverview Storybook stories for DraggableBlockPlugin
 * Demonstrates block drag-and-drop functionality in editable mode
 */

import React, { useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import DraggableBlockPlugin from './DraggableBlockPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-datastore';
import { GutterProvider } from '../../../context/gutterContext';
import '../theme.css';

export default {
  title: '🔌 Editor Plugins/Draggable Block',
  component: DraggableBlockPlugin,
  parameters: {
    layout: 'fullscreen',
  },
};

const onError = (error) => {
  console.error(error);
};

const EditableTemplate = ({ editorState }) => {
  const unitId = 'draggable-block-demo';
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  
  seedMockUnit({
    id: unitId,
    name: 'DraggableBlock Demo',
    description: 'Demo for DraggableBlockPlugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  const initialConfig = {
    namespace: 'DraggableBlockPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode],
  };

  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <UnitProvider id={unitId}>
      <GutterProvider>
        <LexicalComposer
            initialConfig={initialConfig}
            >
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
                <AutoFocusPlugin />
                <RichTextPlugin
                contentEditable={
                  <div className="editor" ref={onRef}>
                    <ContentEditable className="TableNode__contentEditable" />
                  </div>
                }
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
                />
              <HistoryPlugin />
              <ListPlugin />
            {!floatingAnchorElem ? null : (
              <>
                {/* <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isSidebarOpen={openTab}
                /> */}

                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
              </>
            )}

        </LexicalComposer>
      </GutterProvider>
    </UnitProvider>
  );
};

const sampleDraggableState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Draggable Blocks Demo',
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
            text: 'This is paragraph 1. Try hovering over this to see the drag handle.',
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
            text: 'This is paragraph 2. You can drag it above or below other blocks.',
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
            text: 'This is a quote block that can also be dragged.',
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
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This is paragraph 3. Drag and drop to reorder!',
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

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={undefined} />,
  parameters: {
    docs: {
      description: {
        story: 'Type multiple paragraphs, headings, or lists, then hover over them to see the drag handle.',
      },
    },
  },
};

export const EditableWithDraggableBlocks = {
  render: () => <EditableTemplate editorState={JSON.stringify(sampleDraggableState)} />,
};
