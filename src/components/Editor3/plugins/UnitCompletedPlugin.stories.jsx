/**
 * @fileoverview Storybook stories for UnitCompletedPlugin
 * Demonstrates the unit completion modal
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Button } from '@mui/material';

import UnitCompletedPlugin from './UnitCompletedPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { MockUnitProvider } from '../../../../.storybook/__mocks__/MockUnitProvider';

export default {
  title: 'Editor3/Plugins/UnitCompletedPlugin',
  component: UnitCompletedPlugin,
  parameters: {
    layout: 'fullscreen',
  },
};

const onError = (error) => {
  console.error(error);
};

const ControlledTemplate = () => {
  const [showComplete, setShowComplete] = React.useState(false);

  const mockGrades = [
    { createdAt: new Date().toISOString(), accuracy: 95.5 },
    { createdAt: new Date(Date.now() - 86400000).toISOString(), accuracy: 88.2 },
    { createdAt: new Date(Date.now() - 172800000).toISOString(), accuracy: 92.0 },
    { createdAt: new Date(Date.now() - 259200000).toISOString(), accuracy: 85.7 },
    { createdAt: new Date(Date.now() - 345600000).toISOString(), accuracy: 90.3 },
  ];

  const initialConfig = {
    namespace: 'UnitCompletedPluginDemo',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, AutoLinkNode, LinkNode],
  };

  return (
    <MockUnitProvider
      mockValue={{
        unit: {
          id: 'demo-unit',
          name: 'Advanced Japanese Vocabulary',
          description: 'Master essential Japanese vocabulary for daily conversation',
          _version: 1,
        },
        name: 'Advanced Japanese Vocabulary',
        showUnitComplete: showComplete,
        setShowUnitComplete: setShowComplete,
        recentGrades: mockGrades,
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Unit Completed Plugin</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            This plugin displays a modal when a student completes all exercises in a unit.
            It shows the unit name and their top grades.
          </p>
          
          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowComplete(true)}
            >
              Trigger Unit Completion Modal
            </Button>
            
            <div style={{ marginTop: '30px', color: '#666', fontSize: '14px' }}>
              <p>The modal includes:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '10px' }}>
                <li>Unit name</li>
                <li>Top 5 recent grades with timestamps</li>
                <li>Accuracy percentages</li>
                <li>Congratulatory message</li>
              </ul>
            </div>
          </div>

          <div style={{ 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            minHeight: '200px',
            padding: '20px',
            marginTop: '20px',
            backgroundColor: '#fff'
          }}>
            <RichTextPlugin
              contentEditable={<ContentEditable style={{ outline: 'none', minHeight: '150px' }} />}
              placeholder={
                <div style={{ position: 'absolute', top: '20px', left: '20px', color: '#999' }}>
                  Editor content (read-only)...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          <UnitCompletedPlugin />
        </div>
      </LexicalComposer>
    </MockUnitProvider>
  );
};

export const Interactive = {
  render: () => <ControlledTemplate />,
};
