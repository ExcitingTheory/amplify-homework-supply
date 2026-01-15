/**
 * @fileoverview Storybook stories for RecordingStudio3
 * Demonstrates script-based dialogue recording with TTS and locked tracks
 */

import React from 'react';
import RecordingStudio3 from './RecordingStudio3';
import FilesContext from '../context/fileContext';
import { DemoBanner } from '../../.storybook/components/DemoBanner';
import { KeyboardShortcuts } from '../../.storybook/components/KeyboardShortcuts';
import TutorialBanner from '../../.storybook/components/TutorialBanner';
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

/**
 * Guided Tutorial Demo
 * Step-by-step walkthrough for first-time users
 */
export const GuidedTutorial = () => {
  const [step, setStep] = React.useState(0);
  const [scriptData, setScriptData] = React.useState({
    metadata: {
      title: 'My First Dialogue',
      scene: '',
      date: '2026-01-04',
      version: '1.0',
    },
    speakers: {},
    dialogue: [],
  });

  const tutorialSteps = [
    {
      title: 'Welcome to Recording Studio!',
      description: 'This tutorial will teach you how to create dialogue with audio in just 5 steps.',
      tip: 'Take your time and follow each step carefully.',
    },
    {
      title: 'Step 1: Add a Speaker',
      description: 'Click the "Add Speaker" button to create your first character. Name them TEACHER.',
      tip: 'Speaker names should be in UPPERCASE (like screenplay format).',
    },
    {
      title: 'Step 2: Choose a Voice',
      description: 'Select a voice from the dropdown menu. Try "Nova" for a friendly female voice.',
      tip: 'You can always change the voice later!',
    },
    {
      title: 'Step 3: Add Dialogue',
      description: 'Click "Add Dialogue Line" and select your TEACHER speaker. Type: "Welcome to the class!"',
      tip: 'Keep lines short and natural, like real conversation.',
    },
    {
      title: 'Step 4: Generate Audio',
      description: 'Click the microphone icon 🎤 next to your dialogue line to generate text-to-speech audio.',
      tip: 'This takes a few seconds. Watch for the progress indicator!',
    },
    {
      title: 'Step 5: Play Your Dialogue',
      description: 'Click the play button ▶️ to hear your dialogue! Congratulations! 🎉',
      tip: 'You can edit the text and regenerate audio anytime.',
    },
  ];

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      setStep(tutorialSteps.length); // Mark as completed
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    setStep(tutorialSteps.length); // Skip to completed
  };

  return (
    <FilesContext.Provider value={mockFilesContext}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TutorialBanner
          currentStep={step}
          steps={tutorialSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={handleClose}
          completed={step >= tutorialSteps.length}
        />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <RecordingStudio3
            scriptData={scriptData}
            onScriptChange={setScriptData}
            gradeId="tutorial-session"
            nodeKey="guided-tutorial"
            identityId="us-east-1:mock-identity-123"
            readOnly={false}
          />
        </div>
        <KeyboardShortcuts />
      </div>
    </FilesContext.Provider>
  );
};

GuidedTutorial.parameters = {
  docs: {
    description: {
      story: `
### 🎓 Interactive Tutorial

Perfect for first-time users! Follow the step-by-step guide to create your first dialogue.

**What you'll learn:**
1. How to add speakers/characters
2. How to choose TTS voices
3. How to write dialogue lines
4. How to generate audio
5. How to play and review your work

**Features:**
- ✅ Progress tracking
- ✅ Helpful tips at each step
- ✅ Safe environment to experiment
- ✅ Keyboard shortcuts reference

Click "Next Step" to begin the tutorial!
      `,
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
