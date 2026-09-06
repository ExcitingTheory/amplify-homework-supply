/**
 * @fileoverview Storybook stories demonstrating audio and drawing answer types for vocabulary
 * Shows how to create vocabulary exercises that accept voice recordings and drawings as answers
 */

import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode } from "@lexical/rich-text";

import AnswerPlugin, { AnswerNode } from "./AnswerPlugin";
import {
  seedMockUnit,
  seedMockWords,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";
import { AudioPlayerProvider } from "../context/AudioPlayerContext";
import { expect } from "storybook/test";

export default {
  title: "✏️ Lesson Editor/Content Blocks/Answer (Audio & Drawing)",
  component: AnswerPlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockWords([
        {
          id: "vocab-word-1",
          phrase: "こんにちは",
          pronunciation: "konnichiwa",
          definition: "Hello",
          audio: [
            "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
          ],
          definitionAudio: [
            "/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3",
          ],
          identityId: "mock-identity-id",
          _version: 1,
          owner: "mock-user-sub",
        },
        {
          id: "vocab-word-2",
          phrase: "ありがとう",
          pronunciation: "arigatou",
          definition: "Thank you",
          audio: ["/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3"],
          definitionAudio: [
            "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
          ],
          identityId: "mock-identity-id",
          _version: 1,
          owner: "mock-user-sub",
        },
        {
          id: "vocab-word-3",
          phrase: "さようなら",
          pronunciation: "sayounara",
          definition: "Goodbye",
          audio: [
            "/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3",
          ],
          definitionAudio: [
            "/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3",
          ],
          identityId: "mock-identity-id",
          _version: 1,
          owner: "mock-user-sub",
        },
        {
          id: "vocab-word-4",
          phrase: "犬",
          pronunciation: "inu",
          definition: "Dog",
          audio: [
            "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
          ],
          definitionAudio: [
            "/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3",
          ],
          identityId: "mock-identity-id",
          _version: 1,
          owner: "mock-user-sub",
        },
        {
          id: "vocab-word-5",
          phrase: "猫",
          pronunciation: "neko",
          definition: "Cat",
          audio: ["/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3"],
          definitionAudio: [
            "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
          ],
          identityId: "mock-identity-id",
          _version: 1,
          owner: "mock-user-sub",
        },
      ]);
      seedMockUnit(
        {
          id: "mock-unit-id",
          name: "Answer Audio Drawing Unit",
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
        },
        {
          words: [
            { id: "vocab-word-1" },
            { id: "vocab-word-2" },
            { id: "vocab-word-3" },
            { id: "vocab-word-4" },
            { id: "vocab-word-5" },
          ],
        },
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    unitId: "mock-unit-id",
    initializeMockData: false,
    docs: {
      description: {
        component:
          "Examples of vocabulary exercises that accept audio recordings and drawings as answers.",
      },
    },
  },
};

const editorConfig = {
  namespace: "AudioDrawingAnswerExample",
  theme: {
    paragraph: "editor-paragraph",
    heading: {
      h1: "editor-heading-h1",
      h2: "editor-heading-h2",
      h3: "editor-heading-h3",
    },
  },
  onError: (error) => console.error(error),
  nodes: [HeadingNode, AnswerNode],
};

const ReadOnlyTemplate = ({ editorState, wordIDs = [] }) => {
  const initialConfig = {
    ...editorConfig,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    editable: false,
  };

  return (
    <AudioPlayerProvider>
      <LexicalComposer initialConfig={initialConfig}>
        <div
          style={{
            padding: "2rem",
            maxWidth: "900px",
            margin: "0 auto",
            backgroundColor: "#f5f5f5",
            minHeight: "100vh",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "2rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  style={{
                    minHeight: "400px",
                    outline: "none",
                    padding: "1rem",
                  }}
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AnswerPlugin />
          </div>
        </div>
      </LexicalComposer>
    </AudioPlayerProvider>
  );
};

// Audio pronunciation exercise - students hear or see the word and record pronunciation
const audioPronunciationState = {
  root: {
    children: [
      {
        children: [
          {
            text: "Japanese Pronunciation Practice",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            text: "Record yourself pronouncing these Japanese words:",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "paragraph",
        version: 1,
      },
      {
        type: "answer",
        version: 1,
        wordIDs: ["vocab-word-1", "vocab-word-2", "vocab-word-3"],
        requestDefinition: false,
        allowedInput: ["audio"],
        promptMethod: ["phrase", "pronunciation"],
      },
    ],
    direction: "ltr",
    type: "root",
    version: 1,
  },
};

// Drawing vocabulary - students draw what the word means
const drawingVocabState = {
  root: {
    children: [
      {
        children: [
          {
            text: "Visual Vocabulary Exercise",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            text: "Draw a picture representing each word:",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "paragraph",
        version: 1,
      },
      {
        type: "answer",
        version: 1,
        wordIDs: ["vocab-word-4", "vocab-word-5"],
        requestDefinition: false,
        allowedInput: ["writing"],
        promptMethod: ["definition"],
      },
    ],
    direction: "ltr",
    type: "root",
    version: 1,
  },
};

// Multi-modal vocabulary - text, audio, or drawing
const multiModalVocabState = {
  root: {
    children: [
      {
        children: [
          {
            text: "Flexible Vocabulary Response",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            text: "Provide the translation using your preferred method (text, voice, or drawing):",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "paragraph",
        version: 1,
      },
      {
        type: "answer",
        version: 1,
        wordIDs: ["vocab-word-1", "vocab-word-2"],
        requestDefinition: true,
        allowedInput: ["text", "audio", "writing"],
        promptMethod: ["phrase", "pronunciation"],
      },
    ],
    direction: "ltr",
    type: "root",
    version: 1,
  },
};

// Listening comprehension - audio prompt, audio response
const listeningComprehensionState = {
  root: {
    children: [
      {
        children: [
          {
            text: "Listening Comprehension",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            text: "Listen to the word and record yourself saying it:",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "paragraph",
        version: 1,
      },
      {
        type: "answer",
        version: 1,
        wordIDs: ["vocab-word-3", "vocab-word-4", "vocab-word-5"],
        requestDefinition: false,
        allowedInput: ["audio"],
        promptMethod: ["audio"],
      },
    ],
    direction: "ltr",
    type: "root",
    version: 1,
  },
};

// Definition to drawing - show definition, draw the word
const definitionToDrawingState = {
  root: {
    children: [
      {
        children: [
          {
            text: "Illustrate the Definitions",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            text: "Read the definition and create a sketch that represents it:",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        type: "paragraph",
        version: 1,
      },
      {
        type: "answer",
        version: 1,
        wordIDs: ["vocab-word-2", "vocab-word-4"],
        requestDefinition: false,
        allowedInput: ["writing"],
        promptMethod: ["definition"],
      },
    ],
    direction: "ltr",
    type: "root",
    version: 1,
  },
};

export const AudioPronunciation = {
  render: () => (
    <ReadOnlyTemplate
      editorState={audioPronunciationState}
      wordIDs={["vocab-word-1", "vocab-word-2", "vocab-word-3"]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Pronunciation practice where students record themselves saying vocabulary words. Shows phrase and pronunciation as prompts, accepts audio recordings with waveform visualization and AI verification.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[contenteditable]");
    expect(editor).not.toBeNull();
    expect(editor.getAttribute("contenteditable")).toBe("false");
  },
};

export const DrawingVocabulary = {
  render: () => (
    <ReadOnlyTemplate
      editorState={drawingVocabState}
      wordIDs={["vocab-word-4", "vocab-word-5"]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Visual learning exercise where students draw what the word means. Shows definition as prompt, accepts drawings via Excalidraw with AI-powered image verification.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[contenteditable]");
    expect(editor).not.toBeNull();
    expect(editor.getAttribute("contenteditable")).toBe("false");
  },
};

export const MultiModalVocabulary = {
  render: () => (
    <ReadOnlyTemplate
      editorState={multiModalVocabState}
      wordIDs={["vocab-word-1", "vocab-word-2"]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Flexible vocabulary exercise accepting text, audio, or drawing responses. Students choose their preferred input method based on learning style or question requirements.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[contenteditable]");
    expect(editor).not.toBeNull();
    expect(editor.getAttribute("contenteditable")).toBe("false");
  },
};

export const ListeningComprehension = {
  render: () => (
    <ReadOnlyTemplate
      editorState={listeningComprehensionState}
      wordIDs={["vocab-word-3", "vocab-word-4", "vocab-word-5"]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Listening and speaking exercise. Students hear the audio prompt and record their pronunciation. Perfect for language learning and accent training.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[contenteditable]");
    expect(editor).not.toBeNull();
    expect(editor.getAttribute("contenteditable")).toBe("false");
  },
};

export const DefinitionToDrawing = {
  render: () => (
    <ReadOnlyTemplate
      editorState={definitionToDrawingState}
      wordIDs={["vocab-word-2", "vocab-word-4"]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Creative exercise where students read a definition and illustrate it. Combines reading comprehension with visual expression.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[contenteditable]");
    expect(editor).not.toBeNull();
    expect(editor.getAttribute("contenteditable")).toBe("false");
  },
};
