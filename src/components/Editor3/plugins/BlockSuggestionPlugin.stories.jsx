/**
 * @fileoverview Storybook stories for BlockSuggestionPlugin
 * Demonstrates AI-powered pedagogical block suggestions while typing
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Box, Paper, Typography } from '@mui/material';

import BlockSuggestionPlugin from './BlockSuggestionPlugin';
import QuizPlugin, { QuizNode } from './QuizPlugin';
import AnswerPlugin, { AnswerNode } from './AnswerPlugin';
import CustomAnswerPlugin, { CustomAnswerNode } from './CustomAnswerPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';

export default {
  title: '🔌 Editor Plugins/AI/Block Suggestion',
  component: BlockSuggestionPlugin,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

const Template = ({ editorState, instructions }) => {
  const initialConfig = {
    namespace: 'BlockSuggestionDemo',
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
      QuizNode, 
      AnswerNode, 
      CustomAnswerNode
    ],
  };

  const unitId = 'story-unit-id-' + Math.random();
  seedMockUnit({
    id: unitId,
    name: 'Block Suggestion Demo',
    description: 'Demonstrates pedagogical block suggestions',
    data: editorState ? JSON.stringify(editorState) : JSON.stringify({ root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } }),
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig}>
        <Box sx={{ p: 4, maxWidth: '900px', margin: '0 auto' }}>
          <Typography variant="h4" gutterBottom>
            Block Suggestion Plugin Demo
          </Typography>
          
          {instructions && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="body2">
                <strong>💡 How to test:</strong><br />
                {instructions}
              </Typography>
            </Paper>
          )}

          <Paper 
            elevation={3}
            sx={{ 
              border: '1px solid #ccc', 
              borderRadius: '8px',
              minHeight: '500px',
              p: 3
            }}
          >
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  style={{ 
                    outline: 'none', 
                    minHeight: '450px',
                    fontSize: '16px',
                    lineHeight: '1.6',
                  }} 
                />
              }
              placeholder={
                <div style={{ 
                  position: 'absolute', 
                  top: '24px', 
                  left: '24px', 
                  color: '#999',
                  pointerEvents: 'none',
                }}>
                  Start typing a heading, then press Enter on an empty line to see suggestions...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <QuizPlugin />
            <AnswerPlugin />
            <CustomAnswerPlugin />
            <BlockSuggestionPlugin />
          </Paper>

          <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Keyboard shortcuts:</strong><br />
              • ↑↓ Navigate suggestions<br />
              • Tab or Enter: Select suggestion<br />
              • Esc: Dismiss suggestions<br />
            </Typography>
          </Paper>
        </Box>
      </LexicalComposer>
    </UnitProvider>
  );
};

// Empty editor - test from scratch
export const EmptyEditor = {
  render: () => (
    <Template 
      editorState={null}
      instructions="1. Type '# Introduction' and press Enter twice. 2. You'll see suggestions for an explanation paragraph. 3. Type some text, press Enter twice, and see practice/quiz suggestions."
    />
  ),
};

// Editor with heading already - should suggest explanation
const headingState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Learning Japanese Greetings',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [],
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

export const AfterHeading = {
  render: () => (
    <Template 
      editorState={headingState}
      instructions="The cursor is positioned after a heading. Start typing or press Enter to see suggestion for adding an explanation."
    />
  ),
};

// Editor with explanation - should suggest practice/quiz
const explanationState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Basic Japanese Greetings',
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
            text: 'In Japanese culture, greetings are very important. The most common greeting is "こんにちは" (konnichiwa), which means "hello" and is used during the day. In the morning, you would use "おはようございます" (ohayou gozaimasu), and in the evening "こんばんは" (konbanwa).',
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
        children: [],
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

export const AfterExplanation = {
  render: () => (
    <Template 
      editorState={explanationState}
      instructions="After an explanation paragraph, the plugin suggests practice exercises or quizzes. Position cursor at the empty line and see the suggestions."
    />
  ),
};

// Full workflow test
const fullWorkflowState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Lesson 1: Japanese Numbers',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'heading',
        version: 1,
        tag: 'h1',
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Japanese numbers are fundamental to daily communication. The numbers 1-10 are: 一 (ichi), 二 (ni), 三 (san), 四 (shi/yon), 五 (go), 六 (roku), 七 (shichi/nana), 八 (hachi), 九 (kyuu/ku), 十 (juu).',
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
        type: 'quiz',
        version: 1,
        data: [
          {
            id: 'q1',
            answer: '三',
            question: 'How do you write the number 3?',
            correct: true,
          },
          {
            id: 'q2',
            answer: '五',
            question: 'How do you write the number 3?',
            correct: false,
          },
        ],
      },
      {
        children: [],
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

export const AfterQuiz = {
  render: () => (
    <Template 
      editorState={fullWorkflowState}
      instructions="After a quiz, the plugin suggests adding a summary or starting a new section. Click at the empty line to see suggestions."
    />
  ),
};
