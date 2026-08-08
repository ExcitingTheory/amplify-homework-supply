/**
 * @fileoverview Storybook stories for AIContentCompletionPlugin
 * Demonstrates AI-powered content completion
 */

import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { Box, Paper, Typography, Alert } from "@mui/material";

import AIContentCompletionPlugin from "./AIContentCompletionPlugin";
import {
  AIContentSuggestionNode,
  AILoadingNode,
} from "../components/AIContentSuggestionNode";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import {
  seedMockUnit,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";
import { expect } from 'storybook/test'

export default {
  title: "✏️ Lesson Editor/AI Suggestions/Content Completion",
  component: AIContentCompletionPlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit({
        id: "ai-completion-story-unit",
        name: "AI Content Completion Demo",
        data: JSON.stringify({
          root: {
            children: [],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        }),
        _version: 1,
        owner: "mock-user-sub",
      });
    },
  ],
  parameters: {
    layout: "fullscreen",
    unitId: "ai-completion-story-unit",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

const Template = ({ editorState, instructions, title }) => {
  const initialConfig = {
    namespace: "AIContentCompletionDemo",
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
      AIContentSuggestionNode,
      AILoadingNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Box sx={{ p: 4, maxWidth: "900px", margin: "0 auto" }}>
        <Typography variant="h4" gutterBottom>
          {title || "AI Content Completion Demo"}
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" component="div">
            <strong>✨ How it works:</strong>
            <br />
            {instructions ||
              "Type a sentence ending with punctuation (. ! ? 。). After a brief pause, AI will suggest the next sentence."}
            <br />
            <br />
            <strong>Keyboard shortcuts:</strong> Tab or → Accept | Esc Dismiss |
            Continue typing to reject
          </Typography>
        </Alert>

        <Paper
          elevation={3}
          sx={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            minHeight: "500px",
            p: 3,
            position: "relative",
          }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{
                  outline: "none",
                  minHeight: "450px",
                  fontSize: "16px",
                  lineHeight: "1.8",
                }}
              />
            }
            placeholder={
              <div
                style={{
                  position: "absolute",
                  top: "24px",
                  left: "24px",
                  color: "#999",
                  pointerEvents: "none",
                }}
              >
                Start typing an explanation or description. End with punctuation
                and wait for AI suggestions...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AIContentCompletionPlugin />
        </Paper>

        <Paper sx={{ p: 2, mt: 3, bgcolor: "grey.100" }}>
          <Typography variant="body2" color="text.secondary">
            <strong>💡 Tips:</strong>
            <br />
            • Write at least 50 characters before suggestions appear
            <br />
            • End sentences with punctuation (. ! ? 。)
            <br />
            • Wait ~1 second after typing for the AI to respond
            <br />
            • Suggestions are context-aware based on your unit's content
            <br />
          </Typography>
        </Paper>
      </Box>
    </LexicalComposer>
  );
};

// Empty editor - start from scratch
export const EmptyEditor = {
  render: () => (
    <Template
      editorState={null}
      title="Start Writing with AI Assistance"
      instructions="Type a complete sentence about Japanese language learning and end with a period. The AI will suggest what comes next!"
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

// Partial explanation - AI completes it
const partialExplanationState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Introduction to Hiragana",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Hiragana is one of the three writing systems used in Japanese.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

export const PartialExplanation = {
  render: () => (
    <Template
      editorState={partialExplanationState}
      title="AI Completes Your Explanation"
      instructions="Click at the end of the paragraph and type another sentence (end with period). AI will suggest the next logical sentence based on the topic."
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

// Mid-lesson content
const midLessonState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Japanese Particles",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        version: 1,
        tag: "h1",
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: 'Particles are small words that indicate grammatical relationships between words in Japanese sentences. The particle は (wa) marks the topic of the sentence. For example, in "私は学生です" (watashi wa gakusei desu), は indicates that "I" is the topic.',
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "The Particle を (o/wo)",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        version: 1,
        tag: "h3",
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "The particle を marks the direct object of a verb.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

export const MidLesson = {
  render: () => (
    <Template
      editorState={midLessonState}
      title="Context-Aware Completions"
      instructions="Position cursor at the end of the last paragraph. Type another sentence about を particle. Notice how AI understands the grammatical context and suggests relevant continuations."
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

// Testing streaming behavior


// Testing streaming behavior
export const StreamingDemo = {
  render: () => {
    return (
      <Box sx={{ p: 4, maxWidth: "900px", margin: "0 auto" }}>
        <Typography variant="h4" gutterBottom>
          Streaming AI Suggestions Demo
        </Typography>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2" component="div">
            <strong>🌊 Watch the suggestion stream in:</strong>
            <br />
            As the AI generates text, you'll see it appear word-by-word in gray
            italic text. This provides instant feedback while maintaining high
            quality suggestions.
          </Typography>
        </Alert>

        <Template
          editorState={null}
          instructions="Type: 'Japanese verbs are classified into three groups.' and watch the AI suggestion stream in character by character!"
        />
      </Box>
    );
  },
};
