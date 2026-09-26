/**
 * @fileoverview Storybook stories for AudioWaveformPlayer component
 * Demonstrates audio playback with waveform visualization
 */

import React from "react";
import { userEvent, within, waitFor, expect } from "storybook/test";
import { AudioPlayerProvider } from "../context/AudioPlayerContext";
import AudioWaveformPlayer from "./AudioWaveformPlayer";
import { Box } from "@mui/material";
import { MOCK_AUDIO_URL_1 } from "../../../../.storybook/__mocks__/media";
import { AUDIO_WAVEFORM_PLAYER_DEFAULTS } from "../../../utils/waveformDefaults";

export default {
  title: "✏️ Lesson Editor/Media/Audio Waveform Player",
  component: AudioWaveformPlayer,
  decorators: [
    (Story) => (
      <AudioPlayerProvider>
        <Story />
      </AudioPlayerProvider>
    ),
  ],
  parameters: {
    layout: "padded",
    // AudioPlayerProvider is required for this component
    disableUnitContext: true,
    disableSectionContext: true,
    disableDictionaryContext: true,
    docs: {
      description: {
        component:
          "Complete audio player with waveform visualization, an optional prompt, playback controls, and progress tracking.",
      },
    },
  },
};

export const WithWaveformData = {
  args: {
    ...AUDIO_WAVEFORM_PLAYER_DEFAULTS,
    audioUrl: MOCK_AUDIO_URL_1,
    prompt: "Listen carefully, then repeat the phrase.",
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Audio player with pre-calculated waveform data and playable audio.",
      },
    },
  },
};

export const CompactPlayer = {
  args: {
    audioUrl: MOCK_AUDIO_URL_1,
    width: 400,
    height: 60,
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Smaller, more compact version suitable for inline use or sidebars.",
      },
    },
  },
};

export const WithPrompt = {
  args: {
    ...AUDIO_WAVEFORM_PLAYER_DEFAULTS,
    audioUrl: MOCK_AUDIO_URL_1,
    prompt: "How would you pronounce this phrase in a formal conversation?",
    promptDefinition:
      "A polite greeting used when addressing someone formally.",
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Player with an optional prompt panel between the waveform and playback controls.",
      },
    },
  },
};

export const WithAudioPrompt = {
  args: {
    ...AUDIO_WAVEFORM_PLAYER_DEFAULTS,
    enableRecording: true,
    prompt: "Listen, then record your answer.",
    promptAudioUrl: MOCK_AUDIO_URL_1,
    promptDefinition: "こんばんは — a greeting used in the evening.",
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Recording player with a full-width prompt band containing text, a word definition, and playable prompt audio.",
      },
    },
  },
};

export const NoDuration = {
  args: {
    ...AUDIO_WAVEFORM_PLAYER_DEFAULTS,
    audioUrl: MOCK_AUDIO_URL_1,
    showDuration: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Player without time display for a cleaner look.",
      },
    },
  },
};

export const VariousSizes = () => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
    <AudioWaveformPlayer
      audioUrl={MOCK_AUDIO_URL_1}
      width={300}
      height={50}
      title="Small (300x50)"
      showDuration={false}
    />
    <AudioWaveformPlayer
      audioUrl={MOCK_AUDIO_URL_1}
      width={450}
      height={70}
      title="Medium (450x70)"
    />
    <AudioWaveformPlayer
      audioUrl={MOCK_AUDIO_URL_1}
      width={700}
      height={100}
      title="Large (700x100)"
    />
  </Box>
);

VariousSizes.parameters = {
  docs: {
    description: {
      story:
        "Comparison of different player sizes to find the right fit for your use case.",
    },
  },
};

export const MultiplePlayersInList = () => {
  const recordings = [
    {
      id: 1,
      title: 'Pronunciation Practice - "Hello"',
    },
    {
      id: 2,
      title: 'Pronunciation Practice - "Goodbye"',
    },
    {
      id: 3,
      title: 'Pronunciation Practice - "Thank you"',
    },
  ];

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 700 }}
    >
      {recordings.map((recording) => (
        <AudioWaveformPlayer
          key={recording.id}
          audioUrl={MOCK_AUDIO_URL_1}
          width={600}
          height={70}
          title={recording.title}
        />
      ))}
    </Box>
  );
};

MultiplePlayersInList.parameters = {
  docs: {
    description: {
      story:
        "Example of displaying multiple audio recordings in a list format, useful for reviewing student submissions.",
    },
  },
};

export const NoAudioSource = {
  args: { ...AUDIO_WAVEFORM_PLAYER_DEFAULTS },
  parameters: {
    docs: {
      description: {
        story:
          "Shows error state when no audio source or waveform data is provided.",
      },
    },
  },
};

export const WithRecording = {
  args: {
    ...AUDIO_WAVEFORM_PLAYER_DEFAULTS,
    enableRecording: true,
    title: "Record Your Audio",
    showDuration: true,
    gradeId: "test-grade-123",
    nodeKey: "test-node-key",
    metadata: {
      phrase: "Hello",
      definition: "A greeting",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Player with recording enabled. Click the microphone icon to start recording, then stop to save. The recording will automatically calculate waveform data and upload if gradeId and nodeKey are provided.",
      },
    },
  },
};

export const RecordingWithCallback = () => {
  const [recordedFiles, setRecordedFiles] = React.useState([]);

  const handleRecordingComplete = (file, uploadResult) => {
    console.log("Recording complete:", file, uploadResult);
    setRecordedFiles([...recordedFiles, { file, uploadResult }]);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <AudioWaveformPlayer
        {...AUDIO_WAVEFORM_PLAYER_DEFAULTS}
        enableRecording={true}
        title="Record Your Pronunciation"
        showDuration={true}
        gradeId="test-grade-123"
        nodeKey="pronunciation-practice"
        metadata={{
          phrase: "こんにちは",
          definition: "Hello (Japanese)",
        }}
        onRecordingComplete={handleRecordingComplete}
      />

      {recordedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <h4>Recorded Files:</h4>
          <ul>
            {recordedFiles.map((item, i) => (
              <li key={i}>
                {item.file.name} - {item.file.size} bytes
              </li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );
};

RecordingWithCallback.parameters = {
  docs: {
    description: {
      story:
        "Example with recording callback to track recorded files. The callback receives the file metadata and upload result.",
    },
  },
};

RecordingWithCallback.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // Headless test browsers have no real microphone — substitute a synthetic
  // tone stream so getUserMedia() succeeds and recording can actually start.
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const micDestination = audioCtx.createMediaStreamDestination();
  oscillator.connect(micDestination);
  oscillator.start();
  navigator.mediaDevices.getUserMedia = async () => micDestination.stream;

  try {
    // Wait for component to load
    await waitFor(
      () => {
        const recordButton = canvasElement.querySelector(
          '[title=\"Start recording\"]',
        );
        return recordButton !== null;
      },
      { timeout: 2000 },
    );

    // Click the record button to start recording
    const recordButton = canvasElement.querySelector(
      '[title=\"Start recording\"]',
    );
    if (recordButton) {
      await userEvent.click(recordButton);

      // Wait for recording to start (stop button becomes enabled once recording is active)
      await waitFor(
        () => {
          const stopButton = canvasElement.querySelector(
            '[title=\"Stop recording\"]',
          );
          return stopButton !== null && !stopButton.disabled;
        },
        { timeout: 3000 },
      );

      // Wait a moment to simulate recording
      await waitFor(() => true, { timeout: 2000 });

      // Click stop button
      const stopButton = canvasElement.querySelector(
        '[title=\"Stop recording\"]',
      );
      if (stopButton) {
        await userEvent.click(stopButton);

        // Wait for waveform to be calculated and displayed
        await waitFor(
          () => {
            const playButton = canvasElement.querySelector(
              '[aria-label=\"Play\"]',
            );
            return playButton !== null;
          },
          { timeout: 3000 },
        );

        // Click play to test the recorded audio
        const playButton = canvasElement.querySelector('[aria-label=\"Play\"]');
        if (playButton) {
          await userEvent.click(playButton);

          // Wait a moment
          await waitFor(() => true, { timeout: 1000 });

          // Click pause
          const pauseButton = canvasElement.querySelector(
            '[aria-label=\"Pause\"]',
          );
          if (pauseButton) {
            await userEvent.click(pauseButton);
          }
        }

        // Test the seek slider
        const slider = canvasElement.querySelector(
          'input[type=\"range\"], [role=\"slider\"]',
        );
        if (slider) {
          await userEvent.click(slider);
        }
      }
    }
  } finally {
    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    oscillator.stop();
    await audioCtx.close();
  }
};

export const RecordingOnly = {
  args: {
    ...AUDIO_WAVEFORM_PLAYER_DEFAULTS,
    enableRecording: true,
    title: "Recording Only Mode",
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Recording-only mode without gradeId/nodeKey. Recording will be calculated but not uploaded. Useful for testing or preview scenarios.",
      },
    },
  },
};

const UsageExample = () => (
  <Box sx={{ p: 3, maxWidth: 800 }}>
    <h2>Usage Examples</h2>

    <h3>Basic Usage with Waveform Data</h3>
    <pre
      style={{
        backgroundColor: "#f5f5f5",
        padding: "1rem",
        borderRadius: "4px",
        overflow: "auto",
      }}
    >
      {`import AudioWaveformPlayer from './components/AudioWaveformPlayer';

// With pre-calculated waveform data
<AudioWaveformPlayer
  title="Student Recording"
/>
`}
    </pre>

    <h3>With File Object</h3>
    <pre
      style={{
        backgroundColor: "#f5f5f5",
        padding: "1rem",
        borderRadius: "4px",
        overflow: "auto",
      }}
    >
      {`// With File model object (from DataStore)
<AudioWaveformPlayer
  file={fileObject}
/>
`}
    </pre>

    <h3>With Direct Audio URL</h3>
    <pre
      style={{
        backgroundColor: "#f5f5f5",
        padding: "1rem",
        borderRadius: "4px",
        overflow: "auto",
      }}
    >
      {`// With audio URL and separate waveform
<AudioWaveformPlayer
  audioUrl="https://example.com/audio.mp3"
  title="Playable Recording"
/>
`}
    </pre>

    <h3>Features</h3>
    <ul>
      <li>✅ Beautiful static waveform visualization</li>
      <li>✅ Play/pause controls</li>
      <li>✅ Progress bar with seeking</li>
      <li>✅ Time display (current/total)</li>
      <li>✅ Progress overlay on waveform</li>
      <li>✅ Responsive sizing</li>
      <li>✅ Works with File objects, URLs, or Blob data</li>
    </ul>

    <h3>Integration with RecordingStudio2</h3>
    <p>
      This component pairs perfectly with RecordingStudio2. After a student
      records audio, RecordingStudio2 generates the waveform data, which can
      then be displayed using AudioWaveformPlayer for playback review.
    </p>
  </Box>
);

export const Documentation = {
  render: () => <UsageExample />,
  parameters: {
    docs: {
      description: {
        story: "Complete usage documentation and code examples.",
      },
    },
  },
};
