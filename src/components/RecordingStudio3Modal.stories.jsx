/**
 * @fileoverview Storybook stories for RecordingStudio3Modal
 * Demonstrates the fullscreen modal wrapper with preset-aware save flows
 */

import React, { useState } from "react";
import { expect, fn } from "storybook/test";
import { within, waitFor } from "storybook/test";
import { userEvent } from "storybook/test";
import RecordingStudio3Modal from "./RecordingStudio3Modal";
import FilesContext from "../context/fileContext";
import { DemoBanner } from "../../.storybook/components/DemoBanner";
import {
  createWordPreset,
  createConversationPreset,
  createQuestionPreset,
} from "../utils/recordingStudioPresets";

// ─── Mock Helpers ───────────────────────────────────────────

const generateMockWaveform = (length = 100) => {
  return Array.from({ length }, () => Math.random() * 0.8 + 0.1);
};

const mockFilesContext = {
  session: {
    identityId: "us-east-1:mock-identity-123",
    username: "demo-user",
  },
  files: [],
  uploadFile: async (file) => {
    console.log("Mock upload:", file.name);
    return { path: `/story-mocks/${file.name}`, key: file.name };
  },
};

// Preset instances for stories
const wordPreset = createWordPreset({
  phrase: "こんにちは",
  pronunciation: "konnichiwa",
  definition: "Hello. Good afternoon.",
});

const conversationPreset = createConversationPreset("Coffee Shop");

const questionPreset = createQuestionPreset({
  prompt: "What is the capital of France?",
  correctAnswer: "Paris",
});

// Script with existing takes (for confirmation preview testing)
const wordPresetWithTakes = createWordPreset({
  phrase: "agua",
  pronunciation: "agua",
  definition: "water",
});
wordPresetWithTakes.scriptData.dialogue[0].takes = [
  {
    id: Date.now() - 5000,
    type: "tts",
    audioBlob: null,
    audioPath:
      "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
    waveformData: generateMockWaveform(100),
    duration: 1.5,
    file: {
      key: "cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
      path: "/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3",
      level: "public",
      type: "audio/mpeg",
    },
    createdAt: new Date(Date.now() - 5000).toISOString(),
  },
];
wordPresetWithTakes.scriptData.dialogue[0].activeTakeIndex = 0;
// definition_track has no take → triggers "missing audio" warning

// Conversation with some recorded lines
const conversationWithTakes = createConversationPreset("Recorded Session", [
  { id: "teacher", name: "Teacher", voice: "nova" },
  { id: "student", name: "Student", voice: "echo" },
]);
conversationWithTakes.scriptData.dialogue = [
  {
    id: 1,
    speaker: "teacher",
    text: "Good morning, class!",
    timing: { start: 0, end: 2 },
    direction: "enthusiastic",
    emotion: "cheerful",
    takes: [
      {
        id: Date.now() - 3000,
        type: "human",
        audioBlob: null,
        audioPath:
          "/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3",
        waveformData: generateMockWaveform(120),
        duration: 2.0,
        file: {
          key: "descent-whoosh-long-cinematic-sound-effect-405921.mp3",
          path: "/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3",
          level: "public",
          type: "audio/mpeg",
        },
        createdAt: new Date(Date.now() - 3000).toISOString(),
      },
    ],
    activeTakeIndex: 0,
  },
  {
    id: 2,
    speaker: "student",
    text: "Good morning!",
    timing: { start: 2.5, end: 4 },
    direction: "",
    emotion: "neutral",
    takes: [],
    activeTakeIndex: null,
  },
];

// ─── Story Config ───────────────────────────────────────────

export default {
  title: "🎙️ Recording Studio/Recording Studio Modal",
  component: RecordingStudio3Modal,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# Recording Studio Modal

Fullscreen modal wrapper for RecordingStudio3. Used in both **Dictionary** and **Editor** workflows.

**Features:**
- 🖥️ Fullscreen dialog with app bar controls
- ✅ Confirmation preview before saving
- ⚠️ Missing-audio warnings with "Generate TTS" option
- 🔒 Preset-aware save (word → Word model fields, conversation → File records)
- 🚫 Unsaved-changes guard on cancel

**Presets:**
- \`word\` — Two locked tracks (phrase + definition) for vocabulary
- \`conversation\` — Open-ended dialogue for editor content
- \`question\` — Two locked tracks (prompt + answer) for quizzes
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <FilesContext.Provider value={mockFilesContext}>
        <DemoBanner
          title="🎙️ Recording Studio Modal"
          description="Fullscreen modal wrapper — interactions trigger save/cancel flows"
        />
        <Story />
      </FilesContext.Provider>
    ),
  ],
  argTypes: {
    preset: {
      control: { type: "select" },
      options: ["word", "conversation", "question"],
    },
    open: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
};

// ─── Stories ────────────────────────────────────────────────

/** Word preset with locked phrase/definition tracks */
export const WordPreset = {
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(async (payload) => {
      console.log("Save payload (word):", payload);
    }),
    title: "Audio Studio — こんにちは",
    preset: "word",
    scriptData: wordPreset.scriptData,
    lockedTracks: wordPreset.lockedTracks,
    identityId: { id: "us-east-1:mock-identity-123" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    // Modal should be open with title
    await waitFor(
      () => {
        expect(canvas.getByText(/Audio Studio/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // RS3 renders inside with word data
    await waitFor(
      () => {
        expect(canvas.getAllByText(/こんにちは/)[0]).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Done button should be visible
    expect(canvas.getByText(/Done/i)).toBeInTheDocument();
  },
};

/** Conversation preset with no locked tracks */
export const ConversationPreset = {
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(async (payload) => {
      console.log("Save payload (conversation):", payload);
    }),
    title: "Record Conversation — Coffee Shop",
    preset: "conversation",
    scriptData: conversationPreset.scriptData,
    lockedTracks: conversationPreset.lockedTracks,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    await waitFor(
      () => {
        expect(canvas.getByText(/Record Conversation/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Empty conversation starts with no dialogue lines
    expect(canvas.getByText(/Done/i)).toBeInTheDocument();
  },
};

/** Question preset with locked prompt/answer tracks */
export const QuestionPreset = {
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(async (payload) => {
      console.log("Save payload (question):", payload);
    }),
    title: "Audio Studio — Geography Quiz",
    preset: "question",
    scriptData: questionPreset.scriptData,
    lockedTracks: questionPreset.lockedTracks,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    await waitFor(
      () => {
        expect(canvas.getByText(/Audio Studio/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    await waitFor(
      () => {
        expect(
          canvas.getAllByText(/What is the capital of France/i)[0],
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(canvas.getAllByText(/Paris/)[0]).toBeInTheDocument();
  },
};

/** Shows confirmation preview with per-line summary and missing-take warning */
export const ConfirmationPreview = () => {
  const [open, setOpen] = useState(true);

  return (
    <RecordingStudio3Modal
      open={open}
      onClose={() => setOpen(false)}
      onSave={async (payload) => {
        console.log("Save confirmed:", payload);
        setOpen(false);
      }}
      title="Audio Studio — agua"
      preset="word"
      scriptData={wordPresetWithTakes.scriptData}
      lockedTracks={wordPresetWithTakes.lockedTracks}
    />
  );
};
ConfirmationPreview.parameters = {
  docs: {
    description: {
      story: `Click **Done** in the AppBar to see the confirmation preview with:
- Per-line audio status (✅ recorded / ⚠️ missing)
- Summary chips (speakers, takes, lines with audio)
- Missing-audio warning alert with "Generate Missing" button
- Back to Studio / Confirm & Save actions`,
    },
  },
};

/** Read-only mode — all controls disabled */
export const ReadOnly = {
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(),
    title: "Review Recording — agua",
    preset: "word",
    scriptData: wordPresetWithTakes.scriptData,
    lockedTracks: wordPresetWithTakes.lockedTracks,
    readOnly: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    await waitFor(
      () => {
        expect(canvas.getByText(/Review Recording/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Done button should be disabled in read-only mode
    const doneButton = canvas.getByText(/Done/i).closest("button");
    expect(doneButton).toBeDisabled();
  },
};

/** Conversation with some recorded takes — shows mixed state in preview */
export const ConversationWithRecordedTakes = {
  args: {
    open: true,
    onClose: fn(),
    onSave: fn(async (payload) => {
      console.log("Conversation save:", payload);
    }),
    title: "Record Conversation — Recorded Session",
    preset: "conversation",
    scriptData: conversationWithTakes.scriptData,
    lockedTracks: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    await waitFor(
      () => {
        expect(canvas.getAllByText(/Good morning/i)[0]).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

/** Modal is closed — nothing renders */
export const Closed = {
  args: {
    open: false,
    onClose: fn(),
    onSave: fn(),
    title: "Should Not Be Visible",
    preset: "word",
    scriptData: wordPreset.scriptData,
    lockedTracks: wordPreset.lockedTracks,
  },
};

/** Interactive demo with open/close toggle */
export const Interactive = () => {
  const [open, setOpen] = useState(false);
  const [lastPayload, setLastPayload] = useState(null);

  const preset = createConversationPreset("Interactive Demo", [
    { id: "speaker_a", name: "Speaker A", voice: "nova" },
    { id: "speaker_b", name: "Speaker B", voice: "onyx" },
  ]);

  return (
    <div style={{ padding: 24 }}>
      <button
        onClick={() => setOpen(true)}
        style={{ fontSize: 16, padding: "8px 16px" }}
      >
        Open Recording Studio Modal
      </button>

      {lastPayload && (
        <pre
          style={{
            marginTop: 16,
            background: "#f5f5f5",
            padding: 16,
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          {JSON.stringify(lastPayload, null, 2)}
        </pre>
      )}

      <RecordingStudio3Modal
        open={open}
        onClose={() => setOpen(false)}
        onSave={async (payload) => {
          setLastPayload(payload);
          setOpen(false);
        }}
        title="Interactive Demo — Conversation"
        preset="conversation"
        scriptData={preset.scriptData}
        lockedTracks={preset.lockedTracks}
      />
    </div>
  );
};
Interactive.parameters = {
  docs: {
    description: {
      story:
        "Click the button to open the modal. Add speakers, write dialogue, record audio, then click Done → Confirm & Save to see the payload.",
    },
  },
};
