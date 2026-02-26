/**
 * @fileoverview Storybook stories for AI-Powered BlockSuggestionPlugin (Phase 3)
 * Demonstrates AI suggestions with pedagogical reasoning
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
import { Box, Paper, Typography, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';

import BlockSuggestionPlugin from './BlockSuggestionPlugin';
import QuizPlugin, { QuizNode } from './QuizPlugin';
import AnswerPlugin, { AnswerNode } from './AnswerPlugin';
import CustomAnswerPlugin, { CustomAnswerNode } from './CustomAnswerPlugin';
import LanguageEditorTheme from '../components/LanguageEditorTheme';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-data';

export default {
  title: '🔌 Editor Plugins/AI/Block Suggestion (AI Mode)',
  component: BlockSuggestionPlugin,
  parameters: {
    layout: 'fullscreen',
    initializeMockData: false,
  },
};

const Template = ({ editorState, instructions, title, useAI = true }) => {
  const [aiMode, setAiMode] = React.useState(useAI);
  
  const initialConfig = {
    namespace: 'AIBlockSuggestionDemo',
    theme: LanguageEditorTheme,
    onError: (error) => console.error(error),
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
    name: 'AI Block Suggestion Demo',
    description: 'Japanese language learning with AI-powered pedagogical guidance',
    data: editorState ? JSON.stringify(editorState) : JSON.stringify({ root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } }),
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <UnitProvider id={unitId}>
      <LexicalComposer initialConfig={initialConfig} key={aiMode ? 'ai' : 'rules'}>
        <Box sx={{ p: 4, maxWidth: '1100px', margin: '0 auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4">
              {title || 'AI-Powered Block Suggestions'}
            </Typography>
            
            <ToggleButtonGroup
              value={aiMode ? 'ai' : 'rules'}
              exclusive
              onChange={(e, val) => val && setAiMode(val === 'ai')}
              size="small"
            >
              <ToggleButton value="rules">
                💡 Rule-Based
              </ToggleButton>
              <ToggleButton value="ai">
                🤖 AI-Powered
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Alert severity={aiMode ? "success" : "info"} sx={{ mb: 3 }}>
            <Typography variant="body2" component="div">
              <strong>{aiMode ? '🤖 AI Mode:' : '💡 Rule-Based Mode:'}</strong><br />
              {aiMode 
                ? 'GPT-4 analyzes your lesson structure and provides pedagogically sound suggestions with reasoning.'
                : 'Fast pattern-matching suggestions based on educational best practices.'}
              <br /><br />
              {instructions || 'Click at an empty line to see suggestions based on your content structure.'}
            </Typography>
          </Alert>

          <Paper 
            elevation={3}
            sx={{ 
              border: '2px solid',
              borderColor: aiMode ? 'primary.main' : 'divider',
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
                  Start writing content. Position cursor on empty line to see {aiMode ? 'AI-powered' : 'rule-based'} suggestions...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <QuizPlugin />
            <AnswerPlugin />
            <CustomAnswerPlugin />
            <BlockSuggestionPlugin useAI={aiMode} />
          </Paper>

          <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>💡 How it works:</strong><br />
              {aiMode ? (
                <>
                  • AI analyzes all blocks in your lesson<br />
                  • Suggests blocks with educational reasoning<br />
                  • Considers scaffolding, active learning, and assessment principles<br />
                  • Shows priority level (high/medium/low)<br />
                  • Waits 500ms before calling API (debounced)
                </>
              ) : (
                <>
                  • Instantly suggests blocks based on previous block type<br />
                  • Uses predefined pedagogical patterns<br />
                  • No API calls - completely free and fast<br />
                  • Great for quick authoring
                </>
              )}
            </Typography>
          </Paper>
        </Box>
      </LexicalComposer>
    </UnitProvider>
  );
};

// Story 1: Compare AI vs Rules
export const CompareAIvsRules = {
  render: () => (
    <Template 
      editorState={null}
      title="Compare AI vs Rule-Based Suggestions"
      instructions="Toggle between modes to see the difference. AI mode provides reasoning for each suggestion!"
    />
  ),
};

// Story 2: After Explanation - AI suggests next steps
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
            text: 'Japanese Verb Conjugation',
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
            text: 'Japanese verbs are classified into three groups based on their conjugation patterns. Group 1 verbs (五段動詞 godan doushi) are the most common and include verbs like 書く (kaku - to write) and 話す (hanasu - to speak). These verbs follow a predictable pattern when conjugating for different tenses and forms.',
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
      title="AI Suggestions After Explanation"
      instructions="Click on the empty line. AI will suggest practice or quiz blocks with reasoning about why learners need active recall after explanation."
      useAI={true}
    />
  ),
};

// Story 3: Complex lesson structure
const complexLessonState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Lesson 3: Particles は and を',
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
            text: 'Particles are essential elements of Japanese grammar that indicate the relationship between words in a sentence.',
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
            text: 'The Topic Particle は',
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
            text: 'は (pronounced "wa") marks the topic of the sentence. Example: 私は学生です (watashi wa gakusei desu) means "I am a student."',
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
            text: 'The Object Particle を',
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
            text: 'を (pronounced "o" or "wo") marks the direct object. Example: りんごを食べます (ringo wo tabemasu) means "I eat an apple."',
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

export const ComplexLessonStructure = {
  render: () => (
    <Template 
      editorState={complexLessonState}
      title="AI Analyzes Complex Lesson Structure"
      instructions="This lesson has explanations for two concepts. Click at empty line - AI will analyze the full structure and suggest whether to add practice (to reinforce both concepts) or continue teaching."
      useAI={true}
    />
  ),
};

// Story 4: After quiz - what's next?
const afterQuizState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Hiragana Practice',
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
            text: 'Hiragana is a syllabic script where each character represents a sound. There are 46 basic characters.',
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
            answer: 'あ',
            question: 'Which character represents "a"?',
            correct: true,
          },
          {
            id: 'q2',
            answer: 'か',
            question: 'Which character represents "a"?',
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
      editorState={afterQuizState}
      title="AI Suggests Post-Assessment Activities"
      instructions="After a quiz, what should come next? AI will suggest summary for reflection or new section, with reasoning about learning consolidation."
      useAI={true}
    />
  ),
};

// Story 5: Empty lesson - cold start
export const EmptyLesson = {
  render: () => (
    <Template 
      editorState={null}
      title="AI Helps Structure New Lesson"
      instructions="Starting a new lesson? AI suggests heading or explanation to begin, with pedagogical reasoning about lesson structure."
      useAI={true}
    />
  ),
};
