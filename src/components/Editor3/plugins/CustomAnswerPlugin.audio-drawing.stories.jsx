/**
 * @fileoverview Storybook stories demonstrating audio and drawing question types
 * Shows how to create questions that accept voice recordings and drawings as answers
 */

import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HeadingNode } from '@lexical/rich-text';

import CustomAnswerPlugin, { CustomAnswerNode } from './CustomAnswerPlugin';
import { seedMockUnit } from '../../../../.storybook/__mocks__/aws-amplify-datastore';

export default {
  title: 'Components/CustomAnswer/Audio and Drawing',
  component: CustomAnswerPlugin,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Examples of custom questions that accept audio recordings and drawings as answers.',
      },
    },
  },
};

const editorConfig = {
  namespace: 'AudioDrawingExample',
  theme: {
    paragraph: 'editor-paragraph',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
  },
  onError: (error) => console.error(error),
  nodes: [HeadingNode, CustomAnswerNode],
};

const ReadOnlyTemplate = ({ editorState, questionIDs = [] }) => {
  const initialConfig = {
    ...editorConfig,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    editable: false
  };

  // Use the preview's default unit ID
  seedMockUnit({
    id: 'mock-unit-id',
    name: 'Audio Drawing Unit',
    data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
    questionIDs: questionIDs,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
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
            <CustomAnswerPlugin />
          </div>
        </div>
      </LexicalComposer>
  );
};

// Audio-only question example
const audioQuestionState = {
  root: {
    children: [
      {
        children: [
          {
            text: 'Pronunciation Practice',
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
            text: 'Record yourself pronouncing the following words:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'custom-answer',
        version: 1,
        ids: ['audio-q1', 'audio-q2'],
        allowedInput: ['audio'],
        promptMethod: ['text'],
      },
    ],
    direction: 'ltr',
    type: 'root',
    version: 1,
  },
};

// Drawing-only question example  
const drawingQuestionState = {
  root: {
    children: [
      {
        children: [
          {
            text: 'Visual Learning Exercise',
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
            text: 'Draw a diagram showing the following concepts:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'custom-answer',
        version: 1,
        ids: ['drawing-q1', 'drawing-q2'],
        allowedInput: ['writing'],
        promptMethod: ['text'],
      },
    ],
    direction: 'ltr',
    type: 'root',
    version: 1,
  },
};

// Multi-modal question (supports all input types)
const multiModalQuestionState = {
  root: {
    children: [
      {
        children: [
          {
            text: 'Flexible Response Exercise',
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
            text: 'Answer using your preferred method (text, voice, or drawing):',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'custom-answer',
        version: 1,
        ids: ['multi-q1'],
        allowedInput: ['text', 'audio', 'writing'],
        promptMethod: ['text'],
      },
    ],
    direction: 'ltr',
    type: 'root',
    version: 1,
  },
};

// Language pronunciation with audio prompt and response
const languageQuestionState = {
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
            text: 'Listen to the audio and repeat what you hear:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'custom-answer',
        version: 1,
        ids: ['lang-audio-q1', 'lang-audio-q2'],
        allowedInput: ['audio'],
        promptMethod: ['audio'],
      },
    ],
    direction: 'ltr',
    type: 'root',
    version: 1,
  },
};

export const AudioOnlyQuestion = {
  render: () => <ReadOnlyTemplate editorState={audioQuestionState} questionIDs={['audio-q1', 'audio-q2']} />,
  parameters: {
    docs: {
      description: {
        story: 'Questions that only accept audio recordings as answers. Students can record their voice, see a live waveform, and submit for AI-powered verification.',
      },
    },
  },
};

export const DrawingOnlyQuestion = {
  render: () => <ReadOnlyTemplate editorState={drawingQuestionState} questionIDs={['drawing-q1', 'drawing-q2']} />,
  parameters: {
    docs: {
      description: {
        story: 'Questions that only accept drawings/sketches as answers. Uses Excalidraw for a full-featured drawing experience with AI-powered image verification.',
      },
    },
  },
};

export const MultiModalQuestion = {
  render: () => <ReadOnlyTemplate editorState={multiModalQuestionState} questionIDs={['multi-q1']} />,
  parameters: {
    docs: {
      description: {
        story: 'Questions that accept multiple input types. Students can choose between text, audio, or drawing based on their preference or the nature of the question.',
      },
    },
  },
};

export const LanguagePronunciation = {
  render: () => <ReadOnlyTemplate editorState={languageQuestionState} questionIDs={['lang-audio-q1', 'lang-audio-q2']} />,
  parameters: {
    docs: {
      description: {
        story: 'Language learning scenario where students listen to audio prompts and record their pronunciation. Perfect for vocabulary and speaking practice.',
      },
    },
  },
};

// Component showcase explaining features
const FeatureShowcase = () => (
  <div style={{
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <h1>Audio & Drawing Question Types</h1>
    
    <section style={{ marginBottom: '3rem' }}>
      <h2>🎤 Audio Questions</h2>
      <p>Audio questions allow students to record their voice as an answer with the following features:</p>
      <ul>
        <li><strong>Live Waveform Visualization:</strong> Real-time frequency display while recording</li>
        <li><strong>Static Waveform Preview:</strong> Beautiful amplitude visualization of the recorded audio</li>
        <li><strong>Automatic Transcription:</strong> Uses Whisper API to convert speech to text</li>
        <li><strong>AI Verification:</strong> GPT models verify pronunciation and content accuracy</li>
        <li><strong>Waveform Storage:</strong> Waveform data saved with audio file for future playback</li>
      </ul>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>✏️ Drawing Questions</h2>
      <p>Drawing questions provide a full sketching interface powered by Excalidraw:</p>
      <ul>
        <li><strong>Hover to Activate:</strong> Drawing interface appears on mouse hover</li>
        <li><strong>Rich Drawing Tools:</strong> Pen, shapes, text, colors, and more</li>
        <li><strong>Auto-save:</strong> Drawing saves automatically when mouse leaves canvas</li>
        <li><strong>S3 Storage:</strong> All drawings upload to S3 with private access level</li>
        <li><strong>GPT-4 Vision:</strong> AI analyzes drawings and provides detailed feedback</li>
        <li><strong>Persistent Storage:</strong> Both PNG image and Excalidraw data saved</li>
      </ul>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2>⚙️ Configuration Options</h2>
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '1.5rem',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <pre>{`// Create a question with specific input types
const node = $createCustomAnswerNode(
  [questionId],
  ['audio', 'writing'], // allowed input methods
  ['prompt-audio']      // how to present prompt
);

// Allowed Input Options:
// - 'text'    : Text input field
// - 'audio'   : Voice recording
// - 'writing' : Drawing canvas

// Prompt Method Options:
// - 'prompt-text'       : Show text prompt
// - 'prompt-audio'      : Play audio prompt
// - 'prompt-both'       : Text + audio
// - 'prompt-definition' : Show definition`}</pre>
      </div>
    </section>

    <section>
      <h2>📊 Recent Updates</h2>
      <div style={{
        backgroundColor: '#e8f5e9',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #4caf50'
      }}>
        <strong>December 2024:</strong> Fixed RecordingStudio2 waveform generation
        <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
          <li>Waveforms now calculate automatically after recording stops</li>
          <li>Static waveform preview displays below recording controls</li>
          <li>Waveform data properly saved to File model for persistence</li>
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
        story: 'Complete feature documentation and configuration guide for audio and drawing question types.',
      },
    },
  },
};

// Mock grade data with completed audio and drawing answers
const mockGradeWithAnswers = {
  id: 'grade-123',
  owner: 'student-user',
  identityId: 'us-east-1:abc-123',
  data: {
    'audio-q1': {
      complete: true,
      userResponse: 'bonjour',
      audioFile: 'user-input-audio/grade-123_audio-q1_1734989234567.mp3',
      attempts: 1,
    },
    'drawing-q1': {
      complete: true,
      drawingData: '{"elements": [], "appState": {}}',
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      attempts: 1,
    },
  },
  feedback: {
    'audio-q1': {
      answer: true,
      reason: 'Perfect pronunciation! Clear and accurate.',
      transcription: 'bonjour',
    },
    'drawing-q1': {
      answer: true,
      reason: 'Great drawing! All required elements are present: roof, walls, door, and windows.',
    },
  },
  files: [
    'user-input-audio/grade-123_audio-q1_1734989234567.mp3',
  ],
  percentComplete: 100,
  accuracy: 1.0,
  complete: true,
};

// State with answered audio question
const answeredAudioQuestionState = {
  root: {
    children: [
      {
        children: [
          {
            text: 'Completed Audio Exercise',
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
            text: 'This shows how an answered audio question appears with waveform and feedback:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'custom-answer',
        version: 1,
        ids: ['audio-q1'],
        allowedInput: ['audio'],
        promptMethod: ['prompt-text'],
      },
    ],
    direction: 'ltr',
    type: 'root',
    version: 1,
  },
};

// State with answered drawing question
const answeredDrawingQuestionState = {
  root: {
    children: [
      {
        children: [
          {
            text: 'Completed Drawing Exercise',
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
            text: 'This shows how an answered drawing question appears with the submitted image and feedback:',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        type: 'paragraph',
        version: 1,
      },
      {
        type: 'custom-answer',
        version: 1,
        ids: ['drawing-q1'],
        allowedInput: ['writing'],
        promptMethod: ['prompt-text'],
      },
    ],
    direction: 'ltr',
    type: 'root',
    version: 1,
  },
};

// Template with mock grade data
const ReadOnlyTemplateWithGrade = ({ editorState, gradeData, questionIDs = [] }) => {
  const initialConfig = {
    ...editorConfig,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    editable: false
  };

  // Use the preview's default unit ID
  seedMockUnit({
    id: 'mock-unit-id',
    name: 'Audio Drawing Unit',
    data: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
    questionIDs: questionIDs,
    _version: 1,
    owner: 'mock-user-sub',
  });

  return (
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
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            borderLeft: '4px solid #2196f3'
          }}>
            <strong>Grade Data Preview:</strong>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <div>✓ Complete: {gradeData.complete ? 'Yes' : 'No'}</div>
              <div>✓ Accuracy: {(gradeData.accuracy * 100).toFixed(0)}%</div>
              <div>✓ Files: {gradeData.files?.length || 0} uploaded</div>
            </div>
          </div>
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
          <CustomAnswerPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

export const AnsweredAudioQuestion = {
  render: () => <ReadOnlyTemplateWithGrade 
    editorState={answeredAudioQuestionState} 
    gradeData={mockGradeWithAnswers}
    questionIDs={['audio-q1']}
  />,
  parameters: {
    docs: {
      description: {
        story: 'Shows a completed audio question with the submitted recording, waveform visualization, and AI feedback. The audio file is tracked in grade.files[] and can be played back.',
      },
    },
  },
};

export const AnsweredDrawingQuestion = {
  render: () => <ReadOnlyTemplateWithGrade 
    editorState={answeredDrawingQuestionState} 
    gradeData={mockGradeWithAnswers}
    questionIDs={['drawing-q1']}
  />,
  parameters: {
    docs: {
      description: {
        story: 'Shows a completed drawing question with the submitted sketch as a PNG image and AI feedback. The drawing data is stored in grade.data and can be reviewed by instructors.',
      },
    },
  },
};
