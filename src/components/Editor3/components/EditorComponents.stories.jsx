import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { createEditor } from 'lexical';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { Box } from '@mui/material';
import QuestionBlockRo from './QuizComponent'; // Actual export is QuestionBlockRo
import AnswerComponent from './AnswerComponent';
import ImageComponent from './ImageComponent';
import MediaPlayerComponent from './MediaPlayerComponent';
import { UnitProvider } from '../../../context/unitContext';
import { seedMockUnit, seedMockFiles } from '../../../../.storybook/__mocks__/aws-amplify-datastore';
import { ImageNode } from './ImageNode';
import LanguageEditorTheme from './LanguageEditorTheme';
import { DemoBanner } from '../../../../.storybook/components/DemoBanner';

/**
 * Mock Media Assets for Editor Components
 * 
 * Real audio, video, and image files from /mocks directory served via /story-mocks
 * 
 * Audio Files:
 * - cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3
 * - descent-whoosh-long-cinematic-sound-effect-405921.mp3
 * - sound-design-elements-sfx-ps-022-302865.mp3
 * 
 * Video Files:
 * - 326739_medium.mp4
 * 
 * Image Files:
 * - animals-10008941_1280.jpg
 * - piano-10046998_1280.jpg
 * - abstract-10055158_640.jpg
 * - meerkat-10071273_1280.png
 * - beef-9706049_1280.jpg
 * - namibia-9992336_1280.jpg
 * - rhinoceros-10074916_1280.jpg
 * - sand-4753305_1280.jpg
 * - pattern-9842070_640.png
 * - cormorant-8489010_640.jpg
 */

// Mock file records for media components pointing to actual files in mocks/
const MOCK_MEDIA_FILES = [
  {
    id: 'audio-whoosh-1',
    name: 'Cinematic Whoosh Transition',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Cinematic sci-fi whoosh sound effect',
    mimeType: 'audio/mpeg',
    level: 'PUBLIC',
    path: '/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3',
    duration: 2.8,
    size: 45678,
    generated: false,
    waveformData: JSON.stringify([0.1, 0.3, 0.5, 0.7, 0.9, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1]),
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
    _version: 1,
  },
  {
    id: 'audio-whoosh-2',
    name: 'Long Cinematic Descent Whoosh',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Long cinematic whoosh sound effect',
    mimeType: 'audio/mpeg',
    level: 'PUBLIC',
    path: '/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3',
    duration: 4.5,
    size: 72345,
    generated: false,
    waveformData: JSON.stringify([0.2, 0.4, 0.6, 0.8, 1.0, 0.9, 0.7, 0.5, 0.3, 0.1]),
    createdAt: '2026-01-19T14:30:00.000Z',
    updatedAt: '2026-01-19T14:30:00.000Z',
    _version: 1,
  },
  {
    id: 'audio-sfx',
    name: 'Sound Design Elements SFX',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Sound design elements and effects',
    mimeType: 'audio/mpeg',
    level: 'PUBLIC',
    path: '/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3',
    duration: 3.2,
    size: 51234,
    generated: false,
    waveformData: JSON.stringify([0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.2]),
    createdAt: '2026-01-18T09:15:00.000Z',
    updatedAt: '2026-01-18T09:15:00.000Z',
    _version: 1,
  },
  {
    id: 'video-demo',
    name: 'Demo Video',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Sample video for demonstration',
    mimeType: 'video/mp4',
    level: 'PUBLIC',
    path: '/story-mocks/326739_medium.mp4',
    duration: 15.0,
    size: 1234567,
    generated: false,
    createdAt: '2026-01-17T11:00:00.000Z',
    updatedAt: '2026-01-17T11:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-animals',
    name: 'Animals in Nature',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Wildlife image for lessons',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/animals-10008941_1280.jpg',
    size: 234567,
    generated: false,
    thumbnail: '/story-mocks/animals-10008941_1280.jpg',
    createdAt: '2026-01-16T08:00:00.000Z',
    updatedAt: '2026-01-16T08:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-piano',
    name: 'Piano Keys',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Piano keyboard image',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/piano-10046998_1280.jpg',
    size: 345678,
    generated: false,
    thumbnail: '/story-mocks/piano-10046998_1280.jpg',
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-abstract',
    name: 'Abstract Pattern',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Abstract artistic pattern',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/abstract-10055158_640.jpg',
    size: 123456,
    generated: false,
    thumbnail: '/story-mocks/abstract-10055158_640.jpg',
    createdAt: '2026-01-14T16:00:00.000Z',
    updatedAt: '2026-01-14T16:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-meerkat',
    name: 'Meerkat PNG',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Meerkat image with transparency',
    mimeType: 'image/png',
    level: 'PUBLIC',
    path: '/story-mocks/meerkat-10071273_1280.png',
    size: 456789,
    generated: false,
    thumbnail: '/story-mocks/meerkat-10071273_1280.png',
    createdAt: '2026-01-13T14:00:00.000Z',
    updatedAt: '2026-01-13T14:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-beef',
    name: 'Beef Image',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Beef meat for food education',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/beef-9706049_1280.jpg',
    size: 234567,
    generated: false,
    thumbnail: '/story-mocks/beef-9706049_1280.jpg',
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-01-12T10:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-namibia',
    name: 'Namibia Landscape',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Desert landscape from Namibia',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/namibia-9992336_1280.jpg',
    size: 345678,
    generated: false,
    thumbnail: '/story-mocks/namibia-9992336_1280.jpg',
    createdAt: '2026-01-11T09:00:00.000Z',
    updatedAt: '2026-01-11T09:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-rhinoceros',
    name: 'Rhinoceros',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Rhinoceros wildlife photography',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/rhinoceros-10074916_1280.jpg',
    size: 456789,
    generated: false,
    thumbnail: '/story-mocks/rhinoceros-10074916_1280.jpg',
    createdAt: '2026-01-10T15:00:00.000Z',
    updatedAt: '2026-01-10T15:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-sand',
    name: 'Sand Texture',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Sand dunes texture pattern',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/sand-4753305_1280.jpg',
    size: 234567,
    generated: false,
    thumbnail: '/story-mocks/sand-4753305_1280.jpg',
    createdAt: '2026-01-09T11:00:00.000Z',
    updatedAt: '2026-01-09T11:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-pattern',
    name: 'Geometric Pattern',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Geometric pattern design',
    mimeType: 'image/png',
    level: 'PUBLIC',
    path: '/story-mocks/pattern-9842070_640.png',
    size: 123456,
    generated: false,
    thumbnail: '/story-mocks/pattern-9842070_640.png',
    createdAt: '2026-01-08T13:00:00.000Z',
    updatedAt: '2026-01-08T13:00:00.000Z',
    _version: 1,
  },
  {
    id: 'image-cormorant',
    name: 'Cormorant Bird',
    owner: 'mock-user-id',
    identityId: 'us-east-1:mock-identity',
    description: 'Cormorant bird photography',
    mimeType: 'image/jpeg',
    level: 'PUBLIC',
    path: '/story-mocks/cormorant-8489010_640.jpg',
    size: 156789,
    generated: false,
    thumbnail: '/story-mocks/cormorant-8489010_640.jpg',
    createdAt: '2026-01-07T12:00:00.000Z',
    updatedAt: '2026-01-07T12:00:00.000Z',
    _version: 1,
  },
];

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
  title: '📚 Creating Lessons/Editor Components',
  parameters: {
    layout: 'padded',
    disableUnitContext: true, // Stories provide their own UnitProvider
    disableDictionaryContext: true, // Not needed for these component demos
    docs: {
      description: {
        component: `
Individual Lexical editor node components used for educational content.

## Custom Nodes
These components are Lexical nodes that can be inserted into the editor:

- **QuizComponent**: Multiple choice questions with 2-4 answer options
- **AnswerComponent**: Short answer inputs with text/audio/writing support
- **ImageComponent**: Resizable images with optional captions
- **MediaPlayerComponent**: Audio and video playback with controls

All components integrate with the UnitContext for grading and data persistence.
        `.trim(),
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box>
        <DemoBanner>
          Editor components use mocked DataStore and Unit context.
        </DemoBanner>
        <Story />
      </Box>
    ),
  ],
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
        <QuestionBlockRo
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
  parameters: {
    docs: {
      description: {
        story: 'Basic multiple choice quiz with numeric answers. The correct answer is "4".',
      },
    },
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
        <QuestionBlockRo
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
  parameters: {
    docs: {
      description: {
        story: 'Multiple choice quiz with text answers. Question: "Which planet is closest to the Sun?"',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: 'Short answer input supporting text, audio recording, and handwriting. Students can respond in multiple formats.',
      },
    },
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
  parameters: {
    docs: {
      description: {
        story: 'Text-only answer input with a custom question prompt.',
      },
    },
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
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-animals')]);
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-1"
            src="/story-mocks/animals-10008941_1280.jpg"
            altText="Wildlife animals in nature"
            width={640}
            height={360}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic image node displaying wildlife animals.',
      },
    },
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
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-piano')]);
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
              src="/story-mocks/piano-10046998_1280.jpg"
              altText="Piano keyboard"
              width={640}
              height={360}
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
  parameters: {
    docs: {
      description: {
        story: 'Image with an editable caption field. Captions support rich text formatting.',
      },
    },
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
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-meerkat')]);
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-3"
            src="/story-mocks/meerkat-10071273_1280.png"
            altText="Meerkat standing"
            width={320}
            height={320}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Smaller image showing a meerkat. Images can be any size and aspect ratio.',
      },
    },
  },
};

export const ImageAbstract = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-abstract')]);
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-abstract-1"
            src="/story-mocks/abstract-10055158_640.jpg"
            altText="Colorful abstract pattern"
            width={640}
            height={427}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Abstract pattern image for visual interest and decoration.',
      },
    },
  },
};

export const ImageRhinoceros = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-rhinoceros')]);
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-rhino-1"
            src="/story-mocks/rhinoceros-10074916_1280.jpg"
            altText="Rhinoceros in the wild"
            width={960}
            height={640}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Wildlife photography of a rhinoceros. Great for biology or nature lessons.',
      },
    },
  },
};

export const ImageNamibia = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-namibia')]);
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-namibia-1"
            src="/story-mocks/namibia-9992336_1280.jpg"
            altText="Desert landscape in Namibia"
            width={960}
            height={640}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Stunning desert landscape from Namibia. Ideal for geography lessons.',
      },
    },
  },
};

export const ImagePattern = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-pattern')]);
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-pattern-1"
            src="/story-mocks/pattern-9842070_640.png"
            altText="Geometric pattern"
            width={640}
            height={427}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Geometric pattern design. PNG format with transparency support.',
      },
    },
  },
};

export const ImageCormorant = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Image Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'image-cormorant')]);
    return (
      <UnitProvider id={unitId}>
        <WithLexical>
          <ImageComponent
            nodeKey="image-cormorant-1"
            src="/story-mocks/cormorant-8489010_640.jpg"
            altText="Cormorant bird"
            width={640}
            height={427}
            resizable={false}
          />
        </WithLexical>
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Cormorant bird photography. Perfect for ornithology or biology content.',
      },
    },
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
    // Seed audio file
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'audio-whoosh-1')]);
    return (
      <UnitProvider id={unitId}>
        <MediaPlayerComponent
          nodeKey="audio-player-1"
          fileIDs={['audio-whoosh-1']}
        />
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player for cinematic whoosh sound effect. Supports waveform visualization and playback controls.',
      },
    },
  },
};

export const AudioPlayerLongWhoosh = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Media Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    // Seed audio file
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'audio-whoosh-2')]);
    return (
      <UnitProvider id={unitId}>
        <MediaPlayerComponent
          nodeKey="audio-player-2"
          fileIDs={['audio-whoosh-2']}
        />
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player for long cinematic descent whoosh. Demonstrates longer duration audio.',
      },
    },
  },
};

export const AudioPlayerSFX = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Media Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    // Seed audio file
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'audio-sfx')]);
    return (
      <UnitProvider id={unitId}>
        <MediaPlayerComponent
          nodeKey="audio-player-3"
          fileIDs={['audio-sfx']}
        />
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player for sound design elements. Multiple audio files can be used in lessons.',
      },
    },
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
    // Seed video file
    seedMockFiles([MOCK_MEDIA_FILES.find(f => f.id === 'video-demo')]);
    return (
      <UnitProvider id={unitId}>
        <MediaPlayerComponent
          nodeKey="video-player-1"
          fileIDs={['video-demo']}
        />
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Video player for demonstration video. Supports standard video controls.',
      },
    },
  },
};

export const AudioMultipleTracks = {
  render: () => {
    const unitId = 'story-unit-id-' + Math.random();
    seedMockUnit({
      id: unitId,
      name: 'Media Story Unit',
      data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
      _version: 1,
      owner: 'mock-user-sub',
    });
    // Seed multiple audio files
    seedMockFiles([
      MOCK_MEDIA_FILES.find(f => f.id === 'audio-whoosh-1'),
      MOCK_MEDIA_FILES.find(f => f.id === 'audio-whoosh-2'),
      MOCK_MEDIA_FILES.find(f => f.id === 'audio-sfx'),
    ]);
    return (
      <UnitProvider id={unitId}>
        <MediaPlayerComponent
          nodeKey="audio-player-multi"
          fileIDs={['audio-whoosh-1', 'audio-whoosh-2', 'audio-sfx']}
        />
      </UnitProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player with multiple sound files. Users can switch between different audio tracks.',
      },
    },
  },
};

