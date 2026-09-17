/**
 * @fileoverview Stories for EditableBlockPreview — the editable variant of the
 * chat block preview. Renders an AI-generated editor block inside a live
 * MiniEditor with a framed "dialogue" (header + copy/regenerate, insert/reject
 * footer). The edited Lexical state is handed back through `onInsert` so the
 * host chat can transfer the nodes into the lesson editor.
 */

import React from "react";
import EditableBlockPreview from "./EditableBlockPreview";
import {
  seedMockWords,
  seedMockQuestions,
} from "@storybook-mocks/aws-amplify-data";

export default {
  title: "💬 AI Assistant/Components/Editable Block Preview",
  component: EditableBlockPreview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
# Editable Block Preview

The editable counterpart to **Block Insert Preview**. The AI-generated block is
rendered inside a live \`MiniEditor\` so the block can be tweaked before it is
inserted into the lesson. On **Insert into lesson**, the edited serialized
Lexical state is passed to \`onInsert(editorState, blockType)\`; the host chat
transfers those nodes into the lesson editor via its \`editorRef\`.
        `,
      },
    },
  },
  argTypes: {
    onInsert: { action: "insert block" },
    onReject: { action: "rejected" },
    onRegenerate: { action: "regenerate" },
  },
};

export const QuizBlock = {
  args: {
    toolOutput: {
      success: true,
      action: "insert_editor_block",
      blockType: "quiz",
      blockData: [
        {
          id: "q1-a",
          answer: "き (ki)",
          question: 'Which hiragana character represents the sound "ka"?',
          correct: false,
        },
        {
          id: "q1-b",
          answer: "か (ka)",
          question: 'Which hiragana character represents the sound "ka"?',
          correct: true,
        },
        {
          id: "q1-c",
          answer: "く (ku)",
          question: 'Which hiragana character represents the sound "ka"?',
          correct: false,
        },
      ],
      preview: { title: "Hiragana Characters Quiz", questionCount: 1 },
      message: "Quiz block ready to insert",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive quiz rendered inside the live editor — edit the question or answers, then insert.",
      },
    },
  },
};

export const AnswerBlock = {
  decorators: [
    (Story) => {
      seedMockWords([
        {
          id: "word-1",
          phrase: "こんにちは",
          phonetic: "konnichiwa",
          definition: "Hello/Good afternoon",
          owner: "mock-user",
        },
        {
          id: "word-2",
          phrase: "ありがとう",
          phonetic: "arigatou",
          definition: "Thank you",
          owner: "mock-user",
        },
      ]);
      return <Story />;
    },
  ],
  args: {
    toolOutput: {
      success: true,
      action: "insert_editor_block",
      blockType: "answer",
      blockData: {
        wordIDs: ["word-1", "word-2"],
        requestDefinition: "definition",
        allowedInput: ["text", "audio"],
        promptMethod: ["word"],
      },
      preview: { wordCount: 2, mode: "practice" },
      message: "Answer block ready to insert",
    },
  },
};

export const MeaningAssociationBlock = {
  decorators: [
    (Story) => {
      seedMockWords([
        {
          id: "word-1",
          phrase: "食べる",
          phonetic: "taberu",
          definition: "to eat",
          owner: "mock-user",
        },
        {
          id: "word-2",
          phrase: "飲む",
          phonetic: "nomu",
          definition: "to drink",
          owner: "mock-user",
        },
      ]);
      return <Story />;
    },
  ],
  args: {
    toolOutput: {
      success: true,
      action: "insert_editor_block",
      blockType: "meaning-association",
      blockData: {
        wordIDs: ["word-1", "word-2"],
        enabledModes: ["learn", "easy", "hard"],
      },
      preview: { wordCount: 2 },
      message: "Meaning-association block ready to insert",
    },
  },
};

export const CustomAnswerBlock = {
  decorators: [
    (Story) => {
      seedMockQuestions([
        {
          id: "question-1",
          prompt: "How do you say 'hello' formally?",
          answer: "こんにちは",
          owner: "mock-user",
        },
      ]);
      return <Story />;
    },
  ],
  args: {
    toolOutput: {
      success: true,
      action: "insert_editor_block",
      blockType: "custom-answer",
      blockData: {
        questionIDs: ["question-1"],
        allowedInput: ["text"],
        promptMethod: ["text"],
        format: "default",
      },
      preview: { questionCount: 1 },
      message: "Custom-answer block ready to insert",
    },
  },
};

export const WithRegenerate = {
  args: {
    ...QuizBlock.args,
    onRegenerate: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "When an `onRegenerate` handler is provided, a regenerate action appears in the header.",
      },
    },
  },
};
