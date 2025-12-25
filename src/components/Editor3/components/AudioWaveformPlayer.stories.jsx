/**
 * @fileoverview Storybook stories for AudioWaveformPlayer component
 * Demonstrates audio playback with waveform visualization
 */

import React from 'react';
import AudioWaveformPlayer from './AudioWaveformPlayer';
import { Box } from '@mui/material';

export default {
  title: 'Components/AudioWaveformPlayer',
  component: AudioWaveformPlayer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Complete audio player with waveform visualization, playback controls, and progress tracking.',
      },
    },
  },
};

// Mock waveform data (simulates an audio waveform)
const mockWaveformData = Array.from({ length: 600 }, (_, i) => {
  // Create a realistic-looking waveform with varying amplitudes
  const position = i / 600;
  const envelope = Math.sin(position * Math.PI); // Fade in/out at edges
  const detail = Math.sin(i * 0.1) * 0.3 + Math.sin(i * 0.05) * 0.2;
  return Math.max(0, Math.min(1, envelope * (0.5 + detail)));
});

export const WithWaveformData = {
  args: {
    waveformData: mockWaveformData,
    width: 600,
    height: 80,
    title: 'Sample Audio with Waveform',
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player with pre-calculated waveform data. Shows static visualization since no actual audio is loaded.',
      },
    },
  },
};

export const CompactPlayer = {
  args: {
    waveformData: mockWaveformData,
    width: 400,
    height: 60,
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Smaller, more compact version suitable for inline use or sidebars.',
      },
    },
  },
};

export const WithTitle = {
  args: {
    waveformData: mockWaveformData,
    width: 600,
    height: 80,
    title: 'Student Recording - December 24, 2025',
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with a title displayed above the waveform.',
      },
    },
  },
};

export const NoDuration = {
  args: {
    waveformData: mockWaveformData,
    width: 600,
    height: 80,
    showDuration: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Player without time display for a cleaner look.',
      },
    },
  },
};

export const VariousSizes = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <AudioWaveformPlayer
      waveformData={mockWaveformData}
      width={300}
      height={50}
      title="Small (300x50)"
      showDuration={false}
    />
    <AudioWaveformPlayer
      waveformData={mockWaveformData}
      width={450}
      height={70}
      title="Medium (450x70)"
    />
    <AudioWaveformPlayer
      waveformData={mockWaveformData}
      width={700}
      height={100}
      title="Large (700x100)"
    />
  </Box>
);

VariousSizes.parameters = {
  docs: {
    description: {
      story: 'Comparison of different player sizes to find the right fit for your use case.',
    },
  },
};

export const MultiplePlayersInList = () => {
  const recordings = [
    { id: 1, title: 'Pronunciation Practice - "Hello"', waveform: mockWaveformData },
    { id: 2, title: 'Pronunciation Practice - "Goodbye"', waveform: mockWaveformData.map(v => v * 0.8) },
    { id: 3, title: 'Pronunciation Practice - "Thank you"', waveform: mockWaveformData.map(v => v * 1.2) },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 700 }}>
      {recordings.map((recording) => (
        <AudioWaveformPlayer
          key={recording.id}
          waveformData={recording.waveform}
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
      story: 'Example of displaying multiple audio recordings in a list format, useful for reviewing student submissions.',
    },
  },
};

export const NoAudioSource = {
  args: {
    width: 600,
    height: 80,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows error state when no audio source or waveform data is provided.',
      },
    },
  },
};

const UsageExample = () => (
  <Box sx={{ p: 3, maxWidth: 800 }}>
    <h2>Usage Examples</h2>
    
    <h3>Basic Usage with Waveform Data</h3>
    <pre style={{
      backgroundColor: '#f5f5f5',
      padding: '1rem',
      borderRadius: '4px',
      overflow: 'auto'
    }}>
{`import AudioWaveformPlayer from './components/AudioWaveformPlayer';

// With pre-calculated waveform data
<AudioWaveformPlayer
  waveformData={waveformArray}
  width={600}
  height={80}
  title="Student Recording"
/>
`}
    </pre>

    <h3>With File Object</h3>
    <pre style={{
      backgroundColor: '#f5f5f5',
      padding: '1rem',
      borderRadius: '4px',
      overflow: 'auto'
    }}>
{`// With File model object (from DataStore)
<AudioWaveformPlayer
  file={fileObject}
  width={600}
  height={80}
/>
`}
    </pre>

    <h3>With Direct Audio URL</h3>
    <pre style={{
      backgroundColor: '#f5f5f5',
      padding: '1rem',
      borderRadius: '4px',
      overflow: 'auto'
    }}>
{`// With audio URL and separate waveform
<AudioWaveformPlayer
  audioUrl="https://example.com/audio.mp3"
  waveformData={waveformArray}
  width={600}
  height={80}
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
      This component pairs perfectly with RecordingStudio2. After a student records audio,
      RecordingStudio2 generates the waveform data, which can then be displayed using
      AudioWaveformPlayer for playback review.
    </p>
  </Box>
);

export const Documentation = {
  render: () => <UsageExample />,
  parameters: {
    docs: {
      description: {
        story: 'Complete usage documentation and code examples.',
      },
    },
  },
};
