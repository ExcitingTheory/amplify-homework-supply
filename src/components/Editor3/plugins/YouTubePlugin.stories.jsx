/**
 * @fileoverview Storybook stories for YouTubePlugin
 * Demonstrates YouTube video embedding in both editable and read-only modes
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

import YouTubePlugin, { INSERT_YOUTUBE_COMMAND, YouTubeNode } from './YouTubePlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';

export default {
  title: '🔌 Editor Plugins/Media/YouTube',
  component: YouTubePlugin,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertYouTubeButton() {
  const [editor] = useLexicalComposerContext();
  
  const handleClick = () => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, 'dQw4w9WgXcQ');
  };
  
  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Sample YouTube Video
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const unitId = 'youtube-demo-editable';
  
  const initialConfig = {
    namespace: 'YouTubePluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, YouTubeNode],
  };

  seedMockUnit({
    id: unitId,
    name: 'YouTube Plugin Demo',
    description: 'Demo for YouTube Plugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>YouTube Plugin - Editable Mode</h2>
          {showInsertButton && <InsertYouTubeButton />}
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
                  Enter text or insert a YouTube video...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <YouTubePlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const unitId = 'youtube-demo-readonly';
  
  const initialConfig = {
    namespace: 'YouTubePluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode, YouTubeNode],
  };

  seedMockUnit({
    id: unitId,
    name: 'YouTube Plugin Demo (Read-Only)',
    description: 'Demo for YouTube Plugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>YouTube Plugin - Read-Only Mode</h2>
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
            <YouTubePlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const sampleYouTubeState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Sample YouTube Video Embed',
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
            text: 'Below is an embedded YouTube video:',
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
        videoID: 'dQw4w9WgXcQ',
        format: '',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'The video is embedded using privacy-enhanced mode (youtube-nocookie.com).',
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
  render: () => <EditableTemplate editorState={null} showInsertButton={true} />,
};

export const EditableWithVideo = {
  render: () => <EditableTemplate editorState={sampleYouTubeState} />,
};

export const ReadOnlyWithVideo = {
  render: () => <ReadOnlyTemplate editorState={sampleYouTubeState} />,
};
