/**
 * @fileoverview Storybook stories demonstrating audio and drawing answer types for vocabulary
 * Shows how to create vocabulary exercises that accept voice recordings and drawings as answers
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode } from '@lexical/rich-text';

import AnswerPlugin, { AnswerNode } from './AnswerPlugin';
import { seedMockUnit, seedMockWords } from '../../../../.storybook/__mocks__/aws-amplify-datastore';
import { AudioPlayerProvider } from '../context/AudioPlayerContext';
import { UnitProvider } from '../../../context/unitContext';

// Seed mock vocabulary words for all stories
seedMockWords([
  {
    id: 'vocab-word-1',
    phrase: 'こんにちは',
    phonetic: 'konnichiwa',
    definition: 'Hello',
    audio: ['public/audio/konnichiwa.mp3'],
    definitionAudio: ['public/audio/hello.mp3'],
    identityId: 'mock-identity-id',
    _version: 1,
    owner: 'mock-user-sub',
  },
  {
    id: 'vocab-word-2',
    phrase: 'ありがとう',
    phonetic: 'arigatou',
    definition: 'Thank you',
    audio: ['public/audio/arigatou.mp3'],
    definitionAudio: ['public/audio/thankyou.mp3'],
    identityId: 'mock-identity-id',
    _version: 1,
    owner: 'mock-user-sub',
  },
  {
    id: 'vocab-word-3',
    phrase: 'さようなら',
    phonetic: 'sayounara',
    definition: 'Goodbye',
    audio: ['public/audio/sayounara.mp3'],
    definitionAudio: ['public/audio/goodbye.mp3'],
    identityId: 'mock-identity-id',
    _version: 1,
    owner: 'mock-user-sub',
  },
  {
    id: 'vocab-word-4',
    phrase: '犬',
    phonetic: 'inu',
    definition: 'Dog',
    audio: ['public/audio/inu.mp3'],
    definitionAudio: ['public/audio/dog.mp3'],
    identityId: 'mock-identity-id',
    _version: 1,
    owner: 'mock-user-sub',
  },
  {
    id: 'vocab-word-5',
    phrase: '猫',
    phonetic: 'neko',
    definition: 'Cat',
    audio: ['public/audio/neko.mp3'],
    definitionAudio: ['public/audio/cat.mp3'],
    identityId: 'mock-identity-id',
    _version: 1,
    owner: 'mock-user-sub',
  },
]);

export default {
  title: 'Components/Answer/Audio and Drawing',
  component: AnswerPlugin,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Examples of vocabulary exercises that accept audio recordings and drawings as answers.',
      },
    },
  },
};

const editorConfig = {
  namespace: 'AudioDrawingAnswerExample',
  theme: {
    paragraph: 'editor-paragraph',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
  },
  onError: (error) => console.error(error),
  nodes: [HeadingNode, AnswerNode],
};

const ReadOnlyTemplate = ({ editorState, wordIDs = [] }) => {
  const initialConfig = {
    ...editorConfig,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    editable: false
  };

  // Use the preview's default unit ID
  seedMockUnit({
    id: 'mock-unit-id',
    name: 'Answer Audio Drawing Unit',
    data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
    wordIDs: wordIDs,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
    <AudioPlayerProvider>
      <UnitProvider id="mock-unit-id">
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ 
            padding: '2rem',
            maxWidth: '900px',
            margin: '0 auto',
            backgroundColor: '#f5f5f5',
            minHeight: '100vh'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable 
                    style={{
                      minHeight: '400px',
                      outline: 'none',
                      padding: '1rem'
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
      </UnitProvider>
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
            text: 'Japanese Pronunciation Practice',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            text: 'Record yourself pronouncing these Japanese words:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'answer',
        version: 1,
        wordIDs: ['vocab-word-1', 'vocab-word-2', 'vocab-word-3'],
        requestDefinition: false,
        allowedInput: ['audio'],
        promptMethod: ['phrase', 'pronunciation'],
      },
    ],
    direction: 'ltr',
    type: 'root',
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
            text: 'Visual Vocabulary Exercise',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            text: 'Draw a picture representing each word:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'answer',
        version: 1,
        wordIDs: ['vocab-word-4', 'vocab-word-5'],
        requestDefinition: false,
        allowedInput: ['writing'],
        promptMethod: ['definition'],
      },
    ],
    direction: 'ltr',
    type: 'root',
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
            text: 'Flexible Vocabulary Response',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            text: 'Provide the translation using your preferred method (text, voice, or drawing):',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'answer',
        version: 1,
        wordIDs: ['vocab-word-1', 'vocab-word-2'],
        requestDefinition: true,
        allowedInput: ['text', 'audio', 'writing'],
        promptMethod: ['phrase', 'pronunciation'],
      },
    ],
    direction: 'ltr',
    type: 'root',
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
            text: 'Listening Comprehension',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            text: 'Listen to the word and record yourself saying it:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'answer',
        version: 1,
        wordIDs: ['vocab-word-3', 'vocab-word-4', 'vocab-word-5'],
        requestDefinition: false,
        allowedInput: ['audio'],
        promptMethod: ['audio'],
      },
    ],
    direction: 'ltr',
    type: 'root',
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
            text: 'Illustrate the Definitions',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'heading',
        version: 1,
        tag: 'h2',
      },
      {
        children: [
          {
            text: 'Read the definition and create a sketch that represents it:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'answer',
        version: 1,
        wordIDs: ['vocab-word-2', 'vocab-word-4'],
        requestDefinition: false,
        allowedInput: ['writing'],
        promptMethod: ['definition'],
      },
    ],
    direction: 'ltr',
    type: 'root',
    version: 1,
  },
};

export const AudioPronunciation = {
  render: () => <ReadOnlyTemplate editorState={audioPronunciationState} wordIDs={['vocab-word-1', 'vocab-word-2', 'vocab-word-3']} />,
  parameters: {
    docs: {
      description: {
        story: 'Pronunciation practice where students record themselves saying vocabulary words. Shows phrase and pronunciation as prompts, accepts audio recordings with waveform visualization and AI verification.',
      },
    },
  },
};

export const DrawingVocabulary = {
  render: () => <ReadOnlyTemplate editorState={drawingVocabState} wordIDs={['vocab-word-4', 'vocab-word-5']} />,
  parameters: {
    docs: {
      description: {
        story: 'Visual learning exercise where students draw what the word means. Shows definition as prompt, accepts drawings via Excalidraw with AI-powered image verification.',
      },
    },
  },
};

export const MultiModalVocabulary = {
  render: () => <ReadOnlyTemplate editorState={multiModalVocabState} wordIDs={['vocab-word-1', 'vocab-word-2']} />,
  parameters: {
    docs: {
      description: {
        story: 'Flexible vocabulary exercise accepting text, audio, or drawing responses. Students choose their preferred input method based on learning style or question requirements.',
      },
    },
  },
};

export const ListeningComprehension = {
  render: () => <ReadOnlyTemplate editorState={listeningComprehensionState} wordIDs={['vocab-word-3', 'vocab-word-4', 'vocab-word-5']} />,
  parameters: {
    docs: {
      description: {
        story: 'Listening and speaking exercise. Students hear the audio prompt and record their pronunciation. Perfect for language learning and accent training.',
      },
    },
  },
};

export const DefinitionToDrawing = {
  render: () => <ReadOnlyTemplate editorState={definitionToDrawingState} wordIDs={['vocab-word-2', 'vocab-word-4']} />,
  parameters: {
    docs: {
      description: {
        story: 'Creative exercise where students read a definition and illustrate it. Combines reading comprehension with visual expression.',
      },
    },
  },
};

// Feature showcase component
const FeatureShowcase = () => (
  <div style={{
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <h1>Answer Plugin: Audio & Drawing Features</h1>
    
    <section style={{ marginBottom: '3rem' }}>
      <h2>📚 Vocabulary-Based Exercises</h2>
      <p>The Answer Plugin uses Word entities from your vocabulary database to create flexible learning exercises:</p>
      <ul>
        <li><strong>Word IDs:</strong> References vocabulary entries from the dictionary/Word model</li>
        <li><strong>Flexible Prompting:</strong> Show phrase, pronunciation, definition, or audio</li>
        <li><strong>Request Definition:</strong> Toggle to ask for translation vs pronunciation</li>
        <li><strong>Multiple Input Types:</strong> Text, audio recording, or drawing responses</li>
      </ul>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>🎤 Audio Features for Vocabulary</h2>
      <p>Record pronunciation and get AI-powered feedback:</p>
      <ul>
        <li><strong>Live Waveform:</strong> Real-time visualization while recording</li>
        <li><strong>Whisper Transcription:</strong> Automatic speech-to-text conversion</li>
        <li><strong>Pronunciation Checking:</strong> AI compares transcription to expected word</li>
        <li><strong>Waveform Playback:</strong> Static waveform preview for review</li>
        <li><strong>Private Storage:</strong> Audio files stored with S3 private access level</li>
      </ul>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>✏️ Drawing Features for Vocabulary</h2>
      <p>Visual learning with Excalidraw-powered sketching:</p>
      <ul>
        <li><strong>Hover Activation:</strong> Drawing canvas appears on mouse hover</li>
        <li><strong>Auto-save:</strong> Saves when mouse leaves the canvas area</li>
        <li><strong>S3 Storage:</strong> All drawings upload to S3 with private access level</li>
        <li><strong>GPT-4 Vision:</strong> AI analyzes and verifies visual answers</li>
        <li><strong>Persistent Data:</strong> Both PNG and Excalidraw JSON data saved</li>
      </ul>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>⚙️ Configuration for Answer Plugin</h2>
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '1.5rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <pre>{`// Create answer field for vocabulary words
const node = $createAnswerNode(
  ['vocab-word-1', 'vocab-word-2'], // word IDs from dictionary
  false,                             // requestDefinition (true = ask for definition, false = ask for phrase)
  ['audio', 'writing'],              // allowed input methods
  ['phrase', 'pronunciation']        // prompt method (what to show/play)
);

// Allowed Input Options:
// - 'text'    : Text input field
// - 'audio'   : Voice recording with waveform
// - 'writing' : Drawing canvas (Excalidraw)

// Prompt Method Options:
// - 'phrase'        : Show the word/phrase
// - 'pronunciation' : Show pronunciation guide
// - 'definition'    : Show the definition
// - 'audio'         : Play audio of the word

// Request Definition:
// - false : Student provides the phrase/word
// - true  : Student provides the definition`}</pre>
      </div>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>🆚 Answer vs CustomAnswer</h2>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Feature</th>
            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>AnswerNode</th>
            <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>CustomAnswerNode</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Data Source</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}><strong>Word IDs</strong> (vocabulary)</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}><strong>Question IDs</strong> (custom questions)</td>
          </tr>
          <tr style={{ backgroundColor: '#fafafa' }}>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Context Lookup</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>dictionary[wordID]</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>questionBank[questionID]</td>
          </tr>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Use Case</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Vocabulary translation/pronunciation</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Custom Q&A with prompts</td>
          </tr>
          <tr style={{ backgroundColor: '#fafafa' }}>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Input Types</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>text, audio, writing</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>text, audio, writing</td>
          </tr>
          <tr>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Storage</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Both use private S3 for audio/large images</td>
            <td style={{ padding: '12px', border: '1px solid #ddd' }}>Both use private S3 for audio/large images</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>📊 Storage & Privacy</h2>
      <div style={{
        backgroundColor: '#e8f5e9',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #4caf50'
      }}>
        <strong>User Submission Storage:</strong>
        <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          <li>Audio files: <code>private/{`{identityId}`}/user-submissions/{`{gradeId}`}/{`{nodeKey}`}/</code></li>
          <li>Drawing files: Saved to S3 with private access level</li>
          <li>File tracking: All uploads tracked in <code>grade.files[]</code> array</li>
          <li>Teacher access: Via GraphQL query with authorization checks</li>
        </ul>
      </div>
    </section>
  </div>
);

export const FeatureDocumentation = {
  render: () => <FeatureShowcase />,
  parameters: {
    docs: {
      description: {
        story: 'Complete feature documentation and configuration guide for vocabulary exercises with audio and drawing input types.',
      },
    },
  },
};
