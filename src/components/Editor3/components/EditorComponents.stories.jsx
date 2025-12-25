import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { createEditor } from 'lexical';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import QuizComponent from './QuizComponent';
import AnswerComponent from './AnswerComponent';
import ImageComponent from './ImageComponent';
import MediaPlayerComponent from './MediaPlayerComponent';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-datastore';
import { ImageNode } from './ImageNode';
import LanguageEditorTheme from './LanguageEditorTheme';

// Minimal Lexical config for components that need it
const minimalLexicalConfig = {
  namespace: 'EditorComponentsStory',
  theme: LanguageEditorTheme,
  onError: (error) => console.error(error),
  nodes: [ImageNode, AutoLinkNode, LinkNode],
  editorState: null,
};

// Wrapper for components that need Lexical context
const WithLexical = ({ children }) => (
  <LexicalComposer initialConfig={minimalLexicalConfig}>
    {children}
  </LexicalComposer>
);

export default {
  title: 'Editor/Components',
  parameters: {
    layout: 'padded',
  },
};

// Quiz Component Stories
export const QuizDefault = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Quiz Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <QuizComponent
          nodeKey="quiz-1"
          data={[
            { answer: '3', correct: false },
            { answer: '4', correct: true },
            { answer: '5', correct: false },
            { answer: '6', correct: false },
          ]}
        />
      </UnitProvider>
    );
  },
};

export const QuizMultipleChoice = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Quiz Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <QuizComponent
          nodeKey="quiz-2"
          data={[
            { answer: 'Mercury', correct: true },
            { answer: 'Venus', correct: false },
            { answer: 'Earth', correct: false },
            { answer: 'Mars', correct: false },
          ]}
        />
      </UnitProvider>
    );
  },
};

// Answer Component Stories
export const AnswerInput = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Answer Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <AnswerComponent
          nodeKey="answer-1"
          customPrompt="Enter your response:"
          wordIDs={['word-1']}
          allowedInput={['text', 'audio', 'writing']}
          promptMethod={['text']}
        />
      </UnitProvider>
    );
  },
};

export const AnswerWithValue = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Answer Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <AnswerComponent
          nodeKey="answer-2"
          customPrompt="What is the capital of Japan?"
          wordIDs={['word-2']}
          allowedInput={['text']}
          promptMethod={['text']}
          requestDefinition={false}
        />
      </UnitProvider>
    );
  },
};

// Image Component Stories
export const ImageDefault = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-1"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E400 × 300%3C/text%3E%3C/svg%3E"
            altText="Placeholder image"
            width={400}
            height={300}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
};

export const ImageWithCaption = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    const captionEditor = createEditor({
      namespace: 'ImageCaption',
      theme: LanguageEditorTheme,
      onError: (error) => console.error(error),
      nodes: [AutoLinkNode, LinkNode],
    });
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <div>
            <ImageComponent
              nodeKey="image-2"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23ddd' width='600' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='32' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E600 × 400%3C/text%3E%3C/svg%3E"
              altText="Sample landscape"
              width={600}
              height={400}
              resizable={false}
              showCaption={true}
              caption={captionEditor}
              captionsEnabled={true}
            />
          </div>
        </WithLexical>
      </UnitProvider>
    );
  },
};

export const ImageSmall = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-3"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3E200 × 200%3C/text%3E%3C/svg%3E"
            altText="Small placeholder"
            width={200}
            height={200}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
};

// Media Player Component Stories
export const AudioPlayer = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Media Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <MediaPlayerComponent
          nodeKey="audio-player-1"
          fileIDs={['audio-1']}
        />
      </UnitProvider>
    );
  },
};

export const VideoPlayerComponent = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Media Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    return (
      <UnitProvider id={unitId}>
        <MediaPlayerComponent
          nodeKey="video-player-1"
          fileIDs={['video-1']}
        />
      </UnitProvider>
    );
  },
};
