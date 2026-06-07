/**
 * @fileoverview Stories for BlockInsertPreview - the component that renders
 * actual editor blocks (Quiz, Answer, MeaningAssociation, CustomAnswer, Content)
 * as previews in the AI chat before insertion into the Lexical editor.
 *
 * These demonstrate how AI-generated content appears as interactive editor
 * components, NOT as plain markdown.
 */

import React from "react";
import BlockInsertPreview from "./BlockInsertPreview";
import {
  seedMockWords,
  seedMockQuestions,
} from "@storybook-mocks/aws-amplify-data";

export default {
  title: "💬 AI Assistant/Components/Block Insert Preview",
  component: BlockInsertPreview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
# Block Insert Preview

Renders AI-generated editor blocks as interactive previews before insertion into the Lexical editor.

**Block Types:**
- **Quiz** — Multiple choice questions with interactive checkboxes
- **Answer Block** — Free-form answer input with multiple methods (text/audio/writing)
- **Meaning Association** — Drag-and-drop vocabulary matching with Learn/Easy/Hard modes
- **Custom Answer** — Specific answer validation with configurable prompts
- **Content Block** — Rich text content rendered in a read-only Lexical editor

These are the actual editor components students interact with — NOT markdown.
        `,
      },
    },
  },
  argTypes: {
    onInsertBlock: { action: "insert block" },
    onReject: { action: "rejected" },
  },
};

export const QuizBlock = {
  decorators: [
    (Story) => {
      return <Story />;
    },
  ],
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
        {
          id: "q1-d",
          answer: "け (ke)",
          question: 'Which hiragana character represents the sound "ka"?',
          correct: false,
        },
        {
          id: "q2-a",
          answer: "shi",
          question: 'What sound does the hiragana "す" make?',
          correct: false,
        },
        {
          id: "q2-b",
          answer: "su",
          question: 'What sound does the hiragana "す" make?',
          correct: true,
        },
        {
          id: "q2-c",
          answer: "sa",
          question: 'What sound does the hiragana "す" make?',
          correct: false,
        },
        {
          id: "q2-d",
          answer: "se",
          question: 'What sound does the hiragana "す" make?',
          correct: false,
        },
        {
          id: "q3-a",
          answer: "ん",
          question: 'Which of these is the correct hiragana for "n"?',
          correct: true,
        },
        {
          id: "q3-b",
          answer: "を",
          question: 'Which of these is the correct hiragana for "n"?',
          correct: false,
        },
        {
          id: "q3-c",
          answer: "ね",
          question: 'Which of these is the correct hiragana for "n"?',
          correct: false,
        },
        {
          id: "q3-d",
          answer: "に",
          question: 'Which of these is the correct hiragana for "n"?',
          correct: false,
        },
      ],
      preview: {
        title: "Hiragana Characters Quiz",
        questionCount: 3,
        totalPoints: 3,
        questions: [
          {
            prompt: 'Which hiragana character represents the sound "ka"?',
            type: "multiple_choice",
          },
          {
            prompt: 'What sound does the hiragana "す" make?',
            type: "multiple_choice",
          },
          {
            prompt: 'Which of these is the correct hiragana for "n"?',
            type: "multiple_choice",
          },
        ],
      },
      message: "Quiz block ready to insert",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive quiz with multiple choice questions. Students click to select answers. Uses the actual QuizComponent from the editor.",
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
        {
          id: "word-3",
          phrase: "さようなら",
          phonetic: "sayounara",
          definition: "Goodbye",
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
      blockData: ["word-1", "word-2", "word-3"],
      preview: {
        wordCount: 3,
        mode: "translate",
        inputMethods: ["text", "audio", "writing"],
      },
      message: "Answer block ready to insert",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Answer input block where students can type, record audio, or write answers. Uses the actual AnswerComponent from the editor.",
      },
    },
  },
};

export const MeaningAssociationBlock = {
  decorators: [
    (Story) => {
      seedMockWords([
        {
          id: "word-aka",
          phrase: "赤",
          phonetic: "aka",
          definition: "red",
          owner: "mock-user",
        },
        {
          id: "word-ao",
          phrase: "青",
          phonetic: "ao",
          definition: "blue",
          owner: "mock-user",
        },
        {
          id: "word-midori",
          phrase: "緑",
          phonetic: "midori",
          definition: "green",
          owner: "mock-user",
        },
        {
          id: "word-kiiro",
          phrase: "黄色",
          phonetic: "kiiro",
          definition: "yellow",
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
      blockData: ["word-aka", "word-ao", "word-midori", "word-kiiro"],
      preview: {
        wordCount: 4,
        instructions: "Match each Japanese color word with its English meaning",
        modes: ["learn", "easy", "hard"],
      },
      message: "Meaning association block ready to insert",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Drag-and-drop vocabulary matching with Learn, Easy, and Hard modes. Uses the actual MeaningAssociationExercise component.",
      },
    },
  },
};

export const CustomAnswerBlock = {
  decorators: [
    (Story) => {
      seedMockQuestions([
        {
          id: "q-1",
          prompt: "Listen and type what you hear",
          answer: "おはよう",
          phonetic: "ohayou",
          owner: "mock-user",
        },
        {
          id: "q-2",
          prompt: "Listen and type what you hear",
          answer: "おやすみ",
          phonetic: "oyasumi",
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
      blockData: ["q-1", "q-2"],
      preview: {
        questionCount: 2,
        prompt: "Listen to the audio and type what you hear",
        answerCount: 2,
        caseSensitive: false,
        allowMultipleAttempts: true,
        inputMethods: ["text"],
        promptMethods: ["audio"],
      },
      message: "Custom answer block ready to insert",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Custom answer validation with audio prompts. Uses the actual CustomAnswerComponent from the editor.",
      },
    },
  },
};

export const ContentBlock = {
  args: {
    toolOutput: {
      success: true,
      action: "insert_editor_block",
      blockType: "content",
      blockData: {
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
                  text: "Hiragana (ひらがな) is one of the three writing systems used in Japanese. It consists of 46 basic characters, each representing a syllable.",
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
                  text: "Why Learn Hiragana First?",
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
                  format: 1,
                  mode: "normal",
                  style: "",
                  text: "Foundation for reading",
                  type: "text",
                  version: 1,
                },
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: " — Most Japanese textbooks use hiragana for grammatical particles and verb endings.",
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
                  format: 1,
                  mode: "normal",
                  style: "",
                  text: "Pronunciation guide",
                  type: "text",
                  version: 1,
                },
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: " — Each character maps to exactly one sound.",
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
      },
      preview: {
        title: "Introduction to Hiragana",
        contentType: "explanation",
        nodeCount: 5,
        excerpt: "An introduction to hiragana with reasons to learn it first",
      },
      message: "Content block ready to insert",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Rich text content rendered in a read-only Lexical editor with headings, bold text, and paragraphs. This is for non-interactive content blocks.",
      },
    },
  },
};

export const AllBlockTypes = {
  render: () => {
    // Seed mock data for blocks that need it
    seedMockWords([
      {
        id: "word-aka",
        phrase: "赤",
        phonetic: "aka",
        definition: "red",
        owner: "mock-user",
      },
      {
        id: "word-ao",
        phrase: "青",
        phonetic: "ao",
        definition: "blue",
        owner: "mock-user",
      },
      {
        id: "word-midori",
        phrase: "緑",
        phonetic: "midori",
        definition: "green",
        owner: "mock-user",
      },
    ]);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          maxWidth: "600px",
        }}
      >
        <BlockInsertPreview
          toolOutput={{
            success: true,
            action: "insert_editor_block",
            blockType: "quiz",
            blockData: [
              {
                id: "q1-a",
                answer: "か (ka)",
                question: 'Which character is "ka"?',
                correct: true,
              },
              {
                id: "q1-b",
                answer: "き (ki)",
                question: 'Which character is "ka"?',
                correct: false,
              },
              {
                id: "q1-c",
                answer: "く (ku)",
                question: 'Which character is "ka"?',
                correct: false,
              },
            ],
            preview: { title: "Quick Quiz", questionCount: 1, totalPoints: 1 },
            message: "Quiz ready",
          }}
          onInsertBlock={(type, data) => console.log("Insert:", type, data)}
          onReject={() => console.log("Rejected quiz")}
        />

        <BlockInsertPreview
          toolOutput={{
            success: true,
            action: "insert_editor_block",
            blockType: "meaning-association",
            blockData: ["word-aka", "word-ao", "word-midori"],
            preview: {
              wordCount: 3,
              instructions: "Match colors",
              modes: ["learn", "easy"],
            },
            message: "Matching ready",
          }}
          onInsertBlock={(type, data) => console.log("Insert:", type, data)}
          onReject={() => console.log("Rejected matching")}
        />

        <BlockInsertPreview
          toolOutput={{
            success: true,
            action: "insert_editor_block",
            blockType: "content",
            blockData: {
              root: {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Sample Content",
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
                        text: "This is a content block rendered in a read-only Lexical editor.",
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
            },
            preview: {
              title: "Sample Content",
              contentType: "explanation",
              nodeCount: 2,
            },
            message: "Content ready",
          }}
          onInsertBlock={(type, data) => console.log("Insert:", type, data)}
          onReject={() => console.log("Rejected content")}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "All block types rendered together to show the variety of interactive content the AI can generate for the Lexical editor.",
      },
    },
  },
};
