/**
 * @fileoverview Storybook stories for FloatingLinkEditorPlugin
 * Demonstrates floating link editor toolbar functionality
 */

import React, { useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';

import FloatingLinkEditorPlugin from './FloatingLinkEditorPlugin';
import LinkPlugin from './LinkPlugin';
import AutoLinkPlugin from './AutoLinkPlugin';
import YouTubePlugin from './YouTubePlugin';
import { YouTubeNode } from './YouTubePlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';

export default {
  title: '🔌 Editor Plugins/Formatting/Floating Link Editor',
  component: FloatingLinkEditorPlugin,
  parameters: {
    layout: 'fullscreen',
  },
};

const onError = (error) => {
  console.error(error);
};

const EditableTemplate = ({ editorState }) => {
  const unitId = 'floating-link-demo-editable';
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);

  const initialConfig = {
    namespace: 'FloatingLinkEditorPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode, AutoLinkNode, YouTubeNode],
  };

  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  seedMockUnit({
    id: unitId,
    name: 'Floating Link Editor Plugin Demo',
    description: 'Demo for Floating Link Editor Plugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Floating Link Editor Plugin - Editable Mode</h2>
          <p style={{ color: '#666', marginBottom: '10px' }}>
            Type a URL to auto-link it, then click the link to see the floating editor.
            For YouTube URLs, a YouTube icon button will appear to convert the link to an embedded video.
          </p>
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minHeight: '400px',
            padding: '20px',
            position: 'relative'
          }}>
            <div ref={onRef}>
              <RichTextPlugin
                contentEditable={<ContentEditable style={{ outline: 'none', minHeight: '350px' }} />}
                placeholder={
                  <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#999' }}>
                    Try typing: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
            <HistoryPlugin />
            <LinkPlugin />
            <AutoLinkPlugin />
            <YouTubePlugin />
            {floatingAnchorElem && (
              <FloatingLinkEditorPlugin 
                anchorElem={floatingAnchorElem} 
                isSidebarOpen={false}
              />
            )}
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const sampleFloatingLinkState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Floating Link Editor Demo',
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
            text: 'Click on any of these links to see the floating editor toolbar:',
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
            text: 'Visit ',
            type: 'text',
            version: 1,
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'GitHub',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'link',
            version: 1,
            rel: null,
            target: null,
            title: null,
            url: 'https://github.com',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' or check out ',
            type: 'text',
            version: 1,
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Lexical Editor',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'link',
            version: 1,
            rel: null,
            target: null,
            title: null,
            url: 'https://lexical.dev',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' for more information.',
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
            text: 'The floating toolbar allows you to:',
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
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Edit the URL',
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
                    text: 'Remove the link',
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
                    text: 'Open the link in a new tab',
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
            listType: 'bullet',
            start: 1,
            tag: 'ul',
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

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} />,
  parameters: {
    docs: {
      description: {
        story: 'Type a URL and press Space/Enter, or select text and use Cmd+K (Mac) or Ctrl+K (Windows) to create a link.',
      },
    },
  },
};

export const EditableWithLinks = {
  render: () => <EditableTemplate editorState={sampleFloatingLinkState} />,
};
