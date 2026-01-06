/**
 * @fileoverview Storybook stories for RecordingStudio3
 * Demonstrates script-based dialogue recording with TTS and locked tracks
 */

import React from 'react';
import RecordingStudio3 from './RecordingStudio3';
import FilesContext from '../context/fileContext';
import { DemoBanner } from '../../.storybook/components/DemoBanner';

/**
 * Mock Data for RecordingStudio3 Stories
 * 
 * Available mock utilities:
 * - generateMockWaveform(length): Creates realistic waveform data arrays
 * - createMockAudioBlob(): Returns mock audio blob for testing
 * - mockFilesContext: Complete FilesContext mock with upload functionality
 * 
 * Available mock scripts:
 * - mockConversationScript: Basic coffee shop dialogue (no takes)
 * - mockWordScript: Japanese vocabulary with locked tracks
 * - mockQuestionScript: Quiz Q&A with locked tracks
 * - mockScriptWithTakes: Full recording session with multiple takes, both TTS and human
 * 
 * Each mock script includes:
 * - metadata (title, scene, date, version)
 * - speakers (with voice selections and descriptions)
 * - dialogue (with direction, emotion, timing, takes)
 * - cinematicMetadata on takes (scene, direction, emotion context)
 */

// Mock waveform data generator
const generateMockWaveform = (length = 100) => {
  return Array.from({ length }, () => Math.random() * 0.8 + 0.1);
};

// Mock audio blob
const createMockAudioBlob = () => {
  return new Blob(['mock audio data'], { type: 'audio/mpeg' });
};

// Mock FilesContext value
const mockFilesContext = {
  session: {
    identityId: 'us-east-1:mock-identity-123',
    username: 'demo-user',
  },
  files: [],
  uploadFile: async (file) => {
    console.log('Mock upload:', file.name);
    return {
      path: `protected/${file.name}`,
      key: `protected/${file.name}`,
    };
  },
};

// Mock script data - Coffee Shop Conversation
const mockConversationScript = {
  metadata: {
    title: 'Coffee Shop Conversation',
    scene: 'INT. COFFEE SHOP - MORNING',
    date: '2026-01-04',
    version: '1.0',
  },
  speakers: {
    alice: {
      name: 'Alice',
      voice: 'nova',
      description: '30s, energetic, professional',
    },
    bob: {
      name: 'Bob',
      voice: 'onyx',
      description: '40s, laid-back, friendly',
    },
  },
  dialogue: [
    {
      id: 1,
      speaker: 'alice',
      text: 'Hello, how are you doing today?',
      timing: { start: 0.0, end: 3.5 },
      direction: 'entering, slightly out of breath',
      emotion: 'cheerful',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 2,
      speaker: 'bob',
      text: "I'm doing well, thanks for asking.",
      timing: { start: 3.5, end: 6.2 },
      direction: 'looks up from newspaper',
      emotion: 'warm',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 3,
      speaker: 'bob',
      text: 'What brings you here?',
      timing: { start: 7.0, end: 8.5 },
      direction: 'pauses, sets down newspaper',
      emotion: 'curious',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 4,
      speaker: 'alice',
      text: 'Just needed a break from work.',
      timing: { start: 9.0, end: 12.0 },
      direction: 'sighs, pulls out chair',
      emotion: 'tired but relieved',
      takes: [],
      activeTakeIndex: null,
    },
  ],
};

// Mock script for vocabulary (Word model)
const mockWordScript = {
  metadata: {
    title: 'Japanese Greetings - こんにちは',
    scene: 'Vocabulary Practice',
    date: '2026-01-04',
    version: '1.0',
  },
  speakers: {
    phrase_track: {
      name: 'Phrase (こんにちは)',
      voice: 'shimmer',
      description: 'Japanese pronunciation',
    },
    definition_track: {
      name: 'Definition',
      voice: 'alloy',
      description: 'English explanation',
    },
  },
  dialogue: [
    {
      id: 1,
      speaker: 'phrase_track',
      text: 'こんにちは',
      timing: { start: 0.0, end: 2.0 },
      direction: 'clear pronunciation',
      emotion: 'neutral',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 2,
      speaker: 'definition_track',
      text: 'Hello. Good afternoon.',
      timing: { start: 2.5, end: 4.5 },
      direction: 'clear enunciation',
      emotion: 'neutral',
      takes: [],
      activeTakeIndex: null,
    },
  ],
};

// Mock script for Question model
const mockQuestionScript = {
  metadata: {
    title: 'Geography Question - France',
    scene: 'Quiz Practice',
    date: '2026-01-04',
    version: '1.0',
  },
  speakers: {
    prompt_track: {
      name: 'Question Prompt',
      voice: 'fable',
      description: 'Quiz host voice',
    },
    answer_track: {
      name: 'Answer',
      voice: 'nova',
      description: 'Response voice',
    },
  },
  dialogue: [
    {
      id: 1,
      speaker: 'prompt_track',
      text: 'What is the capital of France?',
      timing: { start: 0.0, end: 2.5 },
      direction: 'questioning tone',
      emotion: 'inquisitive',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 2,
      speaker: 'answer_track',
      text: 'Paris',
      timing: { start: 3.0, end: 4.0 },
      direction: 'confident',
      emotion: 'assured',
      takes: [],
      activeTakeIndex: null,
    },
  ],
};

// Mock script with existing takes
const mockScriptWithTakes = {
  metadata: {
    title: 'Recording Practice Session',
    scene: 'INT. RECORDING BOOTH - DAY',
    date: '2026-01-04',
    version: '1.0',
  },
  speakers: {
    narrator: {
      name: 'Narrator',
      voice: 'fable',
      description: 'British, authoritative',
    },
    character: {
      name: 'Character',
      voice: 'nova',
      description: 'Young, expressive',
    },
  },
  dialogue: [
    {
      id: 1,
      speaker: 'narrator',
      text: 'It was a dark and stormy night.',
      timing: { start: 0.0, end: 3.0 },
      direction: 'dramatic pause',
      emotion: 'mysterious',
      takes: [
        {
          id: Date.now() - 5000,
          type: 'tts',
          audioBlob: null,
          audioPath: 'protected/narrator-take1.mp3',
          waveformData: generateMockWaveform(150),
          duration: 3.0,
          file: {
            key: 'protected/narrator-take1.mp3',
            level: 'protected',
            identityId: 'us-east-1:mock-identity-123',
            type: 'audio/mpeg',
            size: 48000,
          },
          cinematicMetadata: {
            scene: 'INT. RECORDING BOOTH - DAY',
            direction: 'dramatic pause',
            emotion: 'mysterious',
          },
          createdAt: new Date(Date.now() - 5000).toISOString(),
        },
        {
          id: Date.now() - 3000,
          type: 'human',
          audioBlob: null,
          audioPath: 'protected/narrator-take2.mp3',
          waveformData: generateMockWaveform(150),
          duration: 2.8,
          file: {
            key: 'protected/narrator-take2.mp3',
            level: 'protected',
            identityId: 'us-east-1:mock-identity-123',
            type: 'audio/mpeg',
            size: 44800,
          },
          cinematicMetadata: {
            scene: 'INT. RECORDING BOOTH - DAY',
            direction: 'dramatic pause',
            emotion: 'mysterious',
          },
          createdAt: new Date(Date.now() - 3000).toISOString(),
        },
      ],
      activeTakeIndex: 1, // Human recording is active
    },
    {
      id: 2,
      speaker: 'character',
      text: 'Did someone say something about a storm?',
      timing: { start: 3.5, end: 6.0 },
      direction: 'looking out window',
      emotion: 'concerned',
      takes: [
        {
          id: Date.now() - 2000,
          type: 'tts',
          audioBlob: null,
          audioPath: 'protected/character-take1.mp3',
          waveformData: generateMockWaveform(120),
          duration: 2.5,
          file: {
            key: 'protected/character-take1.mp3',
            level: 'protected',
            identityId: 'us-east-1:mock-identity-123',
            type: 'audio/mpeg',
            size: 40000,
          },
          cinematicMetadata: {
            scene: 'INT. RECORDING BOOTH - DAY',
            direction: 'looking out window',
            emotion: 'concerned',
          },
          createdAt: new Date(Date.now() - 2000).toISOString(),
        },
      ],
      activeTakeIndex: 0,
    },
    {
      id: 3,
      speaker: 'narrator',
      text: 'The rain pounded against the windows.',
      timing: { start: 6.5, end: 9.0 },
      direction: '',
      emotion: 'ominous',
      takes: [],
      activeTakeIndex: null,
    },
  ],
};

export default {
  title: 'Components/RecordingStudio3',
  component: RecordingStudio3,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Advanced dialogue recording studio with script management, TTS generation, and multiple takes per line. Supports locked tracks for model-bound recordings.',
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <FilesContext.Provider value={mockFilesContext}>
          <DemoBanner
            title="Recording Studio 3.0"
            description="Script-based dialogue editor with TTS generation and human recordings"
          />
          <Story />
        </FilesContext.Provider>
      );
    },
  ],
};

// Basic conversation example
export const Conversation = {
  args: {
    scriptData: mockConversationScript,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: [],
    gradeId: 'mock-grade-1',
    nodeKey: 'conversation-1',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic conversation script with multiple speakers. All tracks can be edited, deleted, and reordered.',
      },
    },
  },
};

// Word model with locked tracks
export const WordVocabulary = {
  args: {
    scriptData: mockWordScript,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: ['phrase_track', 'definition_track'], // Lock both tracks
    gradeId: 'mock-grade-2',
    nodeKey: 'word-konnichiwa',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Vocabulary word recording with locked tracks. Tracks cannot be deleted or renamed, but you can add new takes. Perfect for Word model integration.',
      },
    },
  },
};

// Question model with locked tracks
export const QuestionPractice = {
  args: {
    scriptData: mockQuestionScript,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: ['prompt_track', 'answer_track'], // Lock question/answer tracks
    gradeId: 'mock-grade-3',
    nodeKey: 'question-france-capital',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Quiz question with locked prompt and answer tracks. Users can only add recordings/TTS to existing tracks. Perfect for Question model integration.',
      },
    },
  },
};

// With existing takes
export const WithMultipleTakes = {
  args: {
    scriptData: mockScriptWithTakes,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: [],
    gradeId: 'mock-grade-4',
    nodeKey: 'conversation-takes',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Script with multiple takes per line. Shows TTS-generated and human-recorded takes. Click the star to set the active take.',
      },
    },
  },
};

// Read-only mode
export const ReadOnly = {
  args: {
    scriptData: mockScriptWithTakes,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: [],
    gradeId: null,
    nodeKey: null,
    identityId: 'us-east-1:mock-identity-123',
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only mode for reviewing scripts. All editing controls are disabled.',
      },
    },
  },
};

// Empty script (new project)
export const EmptyScript = {
  args: {
    scriptData: {
      metadata: {
        title: 'New Recording',
        scene: '',
        date: '2026-01-04',
        version: '1.0',
      },
      speakers: {},
      dialogue: [],
    },
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: [],
    gradeId: 'mock-grade-5',
    nodeKey: 'new-project',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Start from scratch. Add speakers and dialogue lines to build your script.',
      },
    },
  },
};

// Interactive example with state management
export const Interactive = () => {
  const [scriptData, setScriptData] = React.useState(mockConversationScript);
  const [lockedTracks, setLockedTracks] = React.useState([]);

  return (
    <div>
      <div style={{ padding: 16, background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
        <label>
          <input
            type="checkbox"
            checked={lockedTracks.includes('alice')}
            onChange={(e) => {
              if (e.target.checked) {
                setLockedTracks([...lockedTracks, 'alice']);
              } else {
                setLockedTracks(lockedTracks.filter(t => t !== 'alice'));
              }
            }}
          />
          {' '}Lock Alice track
        </label>
        {' '}
        <label>
          <input
            type="checkbox"
            checked={lockedTracks.includes('bob')}
            onChange={(e) => {
              if (e.target.checked) {
                setLockedTracks([...lockedTracks, 'bob']);
              } else {
                setLockedTracks(lockedTracks.filter(t => t !== 'bob'));
              }
            }}
          />
          {' '}Lock Bob track
        </label>
      </div>
      <RecordingStudio3
        scriptData={scriptData}
        onScriptChange={setScriptData}
        lockedTracks={lockedTracks}
        gradeId="mock-grade-interactive"
        nodeKey="interactive-demo"
        identityId="us-east-1:mock-identity-123"
        readOnly={false}
      />
    </div>
  );
};

Interactive.parameters = {
  docs: {
    description: {
      story: 'Interactive demo showing locked track functionality. Toggle checkboxes to lock/unlock speaker tracks.',
    },
  },
};

/**
 * Script Editor Demo
 * Demonstrates the Lexical-based screenplay editor with undo/redo history
 */
export const ScriptEditorDemo = () => {
  const [scriptData, setScriptData] = React.useState({
    metadata: {
      title: 'Scene Writing Workshop',
      scene: 'INT. LIBRARY - AFTERNOON',
      date: '2026-01-04',
      version: '1.0',
    },
    speakers: {
      teacher: {
        name: 'Teacher',
        voice: 'nova',
        description: '50s, patient, encouraging',
      },
      student: {
        name: 'Student',
        voice: 'echo',
        description: '20s, curious, engaged',
      },
    },
    dialogue: [
      {
        id: 1,
        speaker: 'teacher',
        text: 'Let me show you how to format a screenplay.',
        timing: { start: 0, end: 0 },
        direction: 'gesturing to whiteboard',
        emotion: 'enthusiastic',
        takes: [],
        activeTakeIndex: null,
      },
      {
        id: 2,
        speaker: 'student',
        text: 'This is really helpful, thank you!',
        timing: { start: 0, end: 0 },
        direction: 'taking notes',
        emotion: 'grateful',
        takes: [],
        activeTakeIndex: null,
      },
    ],
  });

  const [updateLog, setUpdateLog] = React.useState([]);

  const handleScriptUpdate = (data) => {
    setScriptData(data);
    setUpdateLog(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type: 'SCRIPT_UPDATED',
      speakers: Object.keys(data.speakers).length,
      dialogue: data.dialogue.length,
    }].slice(-5));
  };

  return (
    <FilesContext.Provider value={mockFilesContext}>
      <DemoBanner>
        <strong>Script Editor Demo:</strong> Edit the screenplay naturally with Ctrl+Z/Ctrl+Y undo/redo.
        Format: SPEAKER (direction) [emotion] followed by indented dialogue.
      </DemoBanner>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: 16, background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Update Log:</strong>
          </div>
          {updateLog.length === 0 ? (
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              No updates yet - try editing the script!
            </div>
          ) : (
            updateLog.map((log, i) => (
              <div key={i} style={{ fontSize: '0.85em', color: '#555', marginBottom: 4 }}>
                [{log.timestamp}] {log.type}: {log.speakers} speakers, {log.dialogue} lines
              </div>
            ))
          )}
          <div style={{ marginTop: 12, fontSize: '0.85em', color: '#666' }}>
            <strong>Screenplay Format Guide:</strong><br />
            • Speaker names in UPPERCASE<br />
            • Add (direction) in parentheses after name<br />
            • Add [emotion] in brackets for mood<br />
            • Indent dialogue with 2 spaces<br />
            • Press Ctrl+Z to undo, Ctrl+Y to redo
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <RecordingStudio3
            scriptData={scriptData}
            onScriptChange={handleScriptUpdate}
            onUpdateData={(update) => {
              console.log('Script update:', update);
            }}
            gradeId="mock-grade-script-editor"
            nodeKey="script-editor-demo"
            identityId="us-east-1:mock-identity-456"
            readOnly={false}
          />
        </div>
      </div>
    </FilesContext.Provider>
  );
};

ScriptEditorDemo.parameters = {
  docs: {
    description: {
      story: 'Demonstrates the Lexical-based screenplay editor with natural editing, undo/redo history, and automatic parsing of screenplay formatting.',
    },
  },
};
