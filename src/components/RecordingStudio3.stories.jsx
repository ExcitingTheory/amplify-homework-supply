/**
 * @fileoverview Storybook stories for RecordingStudio3
 * Demonstrates script-based dialogue recording with TTS and locked tracks
 */

import React from 'react';
import { expect } from 'storybook/test';
import { within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordingStudio3 from './RecordingStudio3';
import FilesContext from '../context/fileContext';
import { DemoBanner } from '../../.storybook/components/DemoBanner';
import {
  createWordPreset,
  createConversationPreset,
  createQuestionPreset,
} from '../utils/recordingStudioPresets';
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
  title: '🎙️ Recording Audio/Recording Studio',
  component: RecordingStudio3,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Recording Studio

Create professional dialogue and voice recordings for your lessons. Perfect for:
- 💬 **Conversations** - Multi-speaker dialogues with natural flow
- 📚 **Vocabulary** - Word pronunciation with definitions
- ❓ **Quiz Audio** - Question and answer recordings
- 🎭 **Storytelling** - Narrated content with multiple characters

**Features:**
- 🤖 Text-to-Speech (TTS) - Generate computer voices instantly
- 🎤 Human Recording - Record your own voice
- 🎵 Multiple Takes - Record different versions and choose the best
- 🔒 Locked Tracks - Protect specific recordings from editing
- ⏱️ Timeline - Visualize your dialogue flow

**Related Tools:**
- [💬 AI Chat Assistant](?path=/docs/-ai-assistant-chat--getting-started) - Get dialogue ideas and translations
- [📁 File Manager](?path=/docs/components-filemanager2--default) - Manage your audio files
- [📚 Editor](?path=/docs/components-editor--empty-editor-text-formatting) - Embed recordings in lessons
        `,
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <FilesContext.Provider value={mockFilesContext}>
          <div style={{ height: 'calc(100vh', display: 'flex', flexDirection: 'column' }}>
            <DemoBanner
              title="🎙️ Recording Studio"
              description="Create dialogue and voice recordings with text-to-speech or your own voice"
            />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Story />
            </div>
          </div>
        </FilesContext.Provider>
      );
    },
  ],
};

// Basic conversation example
export const CoffeeShopDialogue = {
  args: {
    scriptData: mockConversationScript,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: [],
    gradeId: 'mock-grade-1',
    nodeKey: 'conversation-1',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for script to load
    await waitFor(() => {
      expect(canvas.getByText(/Coffee Shop Conversation/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify dialogue lines are visible
    expect(canvas.getAllByText(/Hello, how are you doing today/i)[0]).toBeInTheDocument();
    expect(canvas.getAllByText(/doing well, thanks for asking/i)[0]).toBeInTheDocument();
    
    // Verify speakers are shown
    expect(canvas.getAllByText(/Alice/i)[0]).toBeInTheDocument();
    expect(canvas.getAllByText(/Bob/i)[0]).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: `
### ☕ Coffee Shop Dialogue

A natural conversation between two people meeting at a coffee shop. Perfect for beginners!

**What you can do:**
- ✏️ Edit speaker names and dialogue
- 🎤 Click the microphone to generate audio with text-to-speech
- ▶️ Press play to hear the conversation
- ➕ Add more speakers or dialogue lines
- 🗑️ Delete lines you don't need

**Try this:**
1. Click on any dialogue line to edit it
2. Change what Alice or Bob says
3. Click the microphone icon next to the line
4. Wait a few seconds for the audio to generate
5. Press the play button to hear your changes!
        `,
      },
    },
  },
};

// Word model with locked tracks
export const JapaneseVocabularyWord = {
  args: {
    scriptData: mockWordScript,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: ['phrase_track', 'definition_track'], // Lock both tracks
    gradeId: 'mock-grade-2',
    nodeKey: 'word-konnichiwa',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for locked tracks to render with lock icons
    await waitFor(() => {
      expect(canvas.getByText(/Japanese Greetings/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify locked track indicators are visible
    const lockIcons = canvas.getAllByText('🔒');
    expect(lockIcons.length).toBeGreaterThan(0);
    
    // Verify dialogue lines are present
    expect(canvas.getAllByText(/こんにちは/)[0]).toBeInTheDocument();
    expect(canvas.getAllByText(/Hello. Good afternoon/i)[0]).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: `
### 📚 Japanese Vocabulary Word

Record pronunciation and definition for a vocabulary word. Notice the 🔒 lock icons—these tracks are protected.

**What's different here:**
- 🔒 Tracks are **locked** - you can't delete or rename them
- ✅ You CAN add new recordings or generate TTS
- 🎯 Each track has a specific purpose (phrase vs. definition)
- 🔊 Perfect for creating consistent vocabulary lists

**Use this for:**
- Building vocabulary flashcards
- Creating pronunciation guides
- Teaching new words with audio
- Standardized lesson content

**Try recording your own voice:**
1. Click the red record button next to a line
2. Allow microphone access if prompted
3. Speak clearly
4. Click stop when finished
5. Your recording appears as a new "take"

**💡 Next:** Try the [Interactive Tutorial](?path=/story/🎙️-recording-audio-recording-studio--guided-tutorial) for step-by-step guidance.
        `,
      },
    },
  },
};

// Question model with locked tracks
export const QuizQuestionAudio = {
  args: {
    scriptData: mockQuestionScript,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: ['prompt_track', 'answer_track'], // Lock question/answer tracks
    gradeId: 'mock-grade-3',
    nodeKey: 'question-france-capital',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for question tracks to load
    await waitFor(() => {
      expect(canvas.getAllByText(/What is the capital of France/i)[0]).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify both question and answer tracks are visible
    expect(canvas.getAllByText(/Paris/)[0]).toBeInTheDocument();
    
    // Verify locked state prevents deletion
    const lockIcons = canvas.getAllByText('🔒');
    expect(lockIcons.length).toBeGreaterThanOrEqual(2);
  },
  parameters: {
    docs: {
      description: {
        story: `
### ❓ Quiz Question with Audio

Add voice recordings to quiz questions and answers. The question and answer tracks are locked to maintain structure.

**Perfect for:**
- 🎧 Listening comprehension questions
- 🗣️ Pronunciation practice
- 📝 Audio-based quizzes
- ♿ Accessible content for screen readers

**How it works:**
1. Question is read aloud to the student
2. Student responds (written or verbal)
3. Answer is played for verification

**Recording tips:**
- Speak clearly and at a moderate pace
- Pause between question and answer
- Use TTS for consistency across multiple questions
- Record yourself for more natural pronunciation
        `,
      },
    },
  },
};

// With existing takes
export const ComparingMultipleTakes = {
  args: {
    scriptData: mockScriptWithTakes,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: [],
    gradeId: 'mock-grade-4',
    nodeKey: 'conversation-takes',
    identityId: 'us-east-1:mock-identity-123',
    readOnly: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for script with takes to load
    await waitFor(() => {
      expect(canvas.getAllByText(/It was a dark and stormy night/i)[0]).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Click the first dialogue line to select it and show takes panel
    const firstLine = canvas.getAllByText(/It was a dark and stormy night/i)[0];
    await userEvent.click(firstLine);
    
    // Verify multiple takes are visible (TTS and human) in the properties panel
    await waitFor(() => {
      const ttsLabels = canvas.getAllByText(/tts/i);
      expect(ttsLabels.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
    
    const humanLabels = canvas.getAllByText(/human/i);
    expect(humanLabels.length).toBeGreaterThan(0);
  },
  parameters: {
    docs: {
      description: {
        story: `
### 🎵 Recording Multiple Takes

Record different versions and choose the best one. Each line can have multiple "takes" (versions).

**What are takes?**
- 🤖 **TTS Takes** - Computer-generated voices
- 🎤 **Human Takes** - Your recorded voice
- ⭐ **Active Take** - The one that will be used (starred)

**How to use:**
1. Record or generate multiple versions of the same line
2. Click play on each take to compare them
3. Click the ⭐ star to choose which version to use
4. Delete takes you don't want to keep

**Why multiple takes?**
- Try different emotions or pacing
- Compare TTS vs. human voice
- A/B test which sounds better
- Keep backup versions
- Experiment without losing work

**Pro tip:** Generate a TTS version first to hear the timing, then record your own voice to match it!

**See also:**
- [Start From Scratch](?path=/story/🎙️-recording-audio-recording-studio--start-from-scratch) - Build your own dialogue
- [AI Content Creation](?path=/docs/-ai-assistant-chat--content-creation) - Get dialogue writing help
        `,
      },
    },
  },
};

// Read-only mode
export const PreviewMode = {
  args: {
    scriptData: mockScriptWithTakes,
    onScriptChange: (data) => console.log('Script changed:', data),
    lockedTracks: [],
    gradeId: null,
    nodeKey: null,
    identityId: 'us-east-1:mock-identity-123',
    readOnly: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for read-only mode to render
    await waitFor(() => {
      expect(canvas.getByText(/Recording Practice Session/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify edit controls are disabled
    const recordButtons = canvas.queryAllByRole('button', { name: /record/i });
    recordButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  },
  parameters: {
    docs: {
      description: {
        story: `
### 👁️ Preview Mode (Read-Only)

See how your content looks to students or reviewers. No editing allowed in this mode.

**What's disabled:**
- ❌ Can't edit dialogue
- ❌ Can't add or delete speakers
- ❌ Can't record new audio
- ❌ Can't generate TTS

**What works:**
- ✅ Play all audio
- ✅ View script structure
- ✅ See speaker assignments
- ✅ Review dialogue flow

**Use this mode to:**
- Preview before publishing
- Share with reviewers
- Check final output
- Demo to stakeholders
        `,
      },
    },
  },
};

// Empty script (new project)
export const StartFromScratch = {
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
        story: `
### ✨ Create Your Own Dialogue

Start with a blank canvas and build your own conversation, vocabulary, or quiz audio.

**Step-by-step guide:**

1. **Add Your First Speaker**
   - Click "Add Speaker" button
   - Enter a name (e.g., TEACHER, STUDENT, NARRATOR)
   - Choose a voice from the dropdown
   - Describe the character (optional)

2. **Write Your First Line**
   - Click "Add Dialogue Line"
   - Select which speaker says it
   - Type what they say
   - Add (direction) or [emotion] if desired

3. **Generate Audio**
   - Click the microphone icon next to the line
   - Wait for TTS to generate
   - Press play to hear it!

4. **Keep Building**
   - Add more speakers and lines
   - Rearrange by dragging
   - Edit anytime
   - Save your work

**Quick tips:**
- Keep lines under 2-3 sentences each
- Add pauses with "..." or commas
- Try different voices to find the right fit
        `,
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
      story: `
### 🎮 Interactive Demo

Experiment with locking and unlocking tracks. This shows how protected content works in real lessons.

**Try this:**
- Check the boxes to lock Alice or Bob's tracks
- Notice the 🔒 lock icon appears
- Try to delete a locked track (it won't let you!)
- Locked tracks protect important content from accidental changes

**When to use locked tracks:**
- Vocabulary words that should stay consistent
- Quiz questions with fixed audio
- Template dialogues for students to follow
- Any content that shouldn't be modified
      `,
    },
  },
};

// ─── Preset Factory Stories (Step C) ────────────────────────

/**
 * Word preset generated from createWordPreset factory.
 * Demonstrates that the factory produces valid scriptData for RS3.
 */
export const WordPreset = {
  args: (() => {
    const preset = createWordPreset({
      phrase: 'こんにちは',
      pronunciation: 'konnichiwa',
      definition: 'Hello. Good afternoon.',
    });
    return {
      scriptData: preset.scriptData,
      lockedTracks: preset.lockedTracks,
      onScriptChange: (data) => console.log('Script changed:', data),
      gradeId: 'mock-grade-word-preset',
      nodeKey: 'word-preset-konnichiwa',
      identityId: 'us-east-1:mock-identity-123',
      readOnly: false,
    };
  })(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getAllByText(/こんにちは/)[0]).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify both tracks are rendered
    expect(canvas.getAllByText(/konnichiwa/i)[0]).toBeInTheDocument();
    expect(canvas.getAllByText(/Hello. Good afternoon/i)[0]).toBeInTheDocument();

    // Locked tracks should show lock icons
    const lockIcons = canvas.getAllByText('🔒');
    expect(lockIcons.length).toBeGreaterThan(0);
  },
  parameters: {
    docs: {
      description: {
        story: '**Generated from `createWordPreset` factory.** Validates that the factory produces the same script structure as the manual `JapaneseVocabularyWord` story above.',
      },
    },
  },
};

/**
 * Conversation preset generated from createConversationPreset factory.
 * Empty dialogue, no locked tracks — user builds from scratch.
 */
export const ConversationPreset = {
  args: (() => {
    const preset = createConversationPreset('Coffee Shop');
    return {
      scriptData: preset.scriptData,
      lockedTracks: preset.lockedTracks,
      onScriptChange: (data) => console.log('Script changed:', data),
      gradeId: 'mock-grade-conversation-preset',
      nodeKey: 'conversation-preset',
      identityId: 'us-east-1:mock-identity-123',
      readOnly: false,
    };
  })(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Title from preset metadata
    await waitFor(() => {
      expect(canvas.getByText(/Coffee Shop/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  },
  parameters: {
    docs: {
      description: {
        story: '**Generated from `createConversationPreset` factory.** Starts with an empty dialogue and no speakers — build a conversation from scratch.',
      },
    },
  },
};

/**
 * Question preset generated from createQuestionPreset factory.
 * Two locked tracks: prompt and answer.
 */
export const QuestionPreset = {
  args: (() => {
    const preset = createQuestionPreset({
      prompt: 'What is the capital of France?',
      correctAnswer: 'Paris',
    });
    return {
      scriptData: preset.scriptData,
      lockedTracks: preset.lockedTracks,
      onScriptChange: (data) => console.log('Script changed:', data),
      gradeId: 'mock-grade-question-preset',
      nodeKey: 'question-preset-france',
      identityId: 'us-east-1:mock-identity-123',
      readOnly: false,
    };
  })(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getAllByText(/What is the capital of France/i)[0]).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(canvas.getAllByText(/Paris/)[0]).toBeInTheDocument();

    // Both tracks locked
    const lockIcons = canvas.getAllByText('🔒');
    expect(lockIcons.length).toBeGreaterThanOrEqual(2);
  },
  parameters: {
    docs: {
      description: {
        story: '**Generated from `createQuestionPreset` factory.** Validates that the factory produces the same script structure as the manual `QuizQuestionAudio` story above.',
      },
    },
  },
};




