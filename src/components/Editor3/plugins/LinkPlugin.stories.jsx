/**
 * @fileoverview Storybook stories for LinkPlugin and AutoLinkPlugin
 * Demonstrates hyperlink functionality in both editable and read-only modes
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin';

import LinkPlugin from './LinkPlugin';
import AutoLinkPlugin from './AutoLinkPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-datastore';

export default {
  title: 'Editor3/Plugins/LinkPlugin',
  component: LinkPlugin,
  parameters: {
    layout: 'fullscreen',
  },
};

const onError = (error) => {
  console.error(error);
};

const EditableTemplate = ({ editorState }) => {
  const unitId = 'link-demo-unit-editable';
  
  seedMockUnit({
    id: unitId,
    name: 'Link Plugin Demo',
    description: 'Demo for LinkPlugin',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });
  
  const initialConfig = {
    namespace: 'LinkPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode, AutoLinkNode],
  };

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Link Plugin - Editable Mode</h2>
          <p style={{ color: '#666', marginBottom: '10px' }}>
            Try typing a URL like https://example.com to see auto-linking in action!
          </p>
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
                  Enter text with URLs or email addresses...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <LinkPlugin />
            <AutoLinkPlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const unitId = 'link-demo-unit-readonly';
  
  seedMockUnit({
    id: unitId,
    name: 'Link Plugin Demo ReadOnly',
    description: 'Demo for LinkPlugin readonly',
    data: editorState || null,
    _version: 1,
    owner: 'mock-user-sub',
  });
  
  const initialConfig = {
    namespace: 'LinkPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, LinkNode, AutoLinkNode],
  };

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Link Plugin - Read-Only Mode</h2>
          <p style={{ color: '#666', marginBottom: '10px' }}>
            Links are clickable in read-only mode.
          </p>
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
            <LinkPlugin />
            <LexicalClickableLinkPlugin />
          </div>
        </div>
      </LexicalComposer>
    </UnitProvider>
  );
};

const sampleLinkState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Hyperlinks Example',
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
            text: 'This paragraph contains a ',
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
                text: 'link to example.com',
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
            url: 'https://example.com',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' and an email address: ',
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
                text: 'test@example.com',
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
            url: 'mailto:test@example.com',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '.',
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
  render: () => <EditableTemplate editorState={null} />,
  parameters: {
    docs: {
      description: {
        story: 'Try typing a URL like https://example.com to see auto-linking in action!',
      },
    },
  },
};

export const EditableWithLinks = {
  render: () => <EditableTemplate editorState={sampleLinkState} />,
};

export const ReadOnlyWithLinks = {
  render: () => <ReadOnlyTemplate editorState={sampleLinkState} />,
};
