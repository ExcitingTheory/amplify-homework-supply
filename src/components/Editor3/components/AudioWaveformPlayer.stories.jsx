/**
 * @fileoverview Storybook stories for AudioWaveformPlayer component
 * Demonstrates audio playback with waveform visualization
 */

import React from 'react';
import { userEvent, within, waitFor, expect } from 'storybook/test';
import AudioWaveformPlayer from './AudioWaveformPlayer';
import { Box } from '@mui/material';
import { MOCK_AUDIO_BASE64, mockWaveformData } from '../../../../.storybook/__mocks__/media';


export default {
  title: 'Components/AudioWaveformPlayer',
  component: AudioWaveformPlayer,
  parameters: {    layout: 'padded',
    docs: {
      description: {
        component: 'Complete audio player with waveform visualization, playback controls, and progress tracking.',
      },
    },
  },
};

export const WithWaveformData = {
  args: {
    audioUrl: MOCK_AUDIO_BASE64,
    waveformData: mockWaveformData,
    width: 600,
    height: 80,
    title: 'Sample Audio with Waveform',
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Audio player with pre-calculated waveform data and playable audio.',
      },
    },
  },
};

export const CompactPlayer = {
  args: {
    audioUrl: MOCK_AUDIO_BASE64,
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
    audioUrl: MOCK_AUDIO_BASE64,
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
    audioUrl: MOCK_AUDIO_BASE64,
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
      audioUrl={MOCK_AUDIO_BASE64}
      waveformData={mockWaveformData}
      width={300}
      height={50}
      title="Small (300x50)"
      showDuration={false}
    />
    <AudioWaveformPlayer
      audioUrl={MOCK_AUDIO_BASE64}
      waveformData={mockWaveformData}
      width={450}
      height={70}
      title="Medium (450x70)"
    />
    <AudioWaveformPlayer
      audioUrl={MOCK_AUDIO_BASE64}
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
          audioUrl={MOCK_AUDIO_BASE64}
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

export const WithRecording = {
  args: {
    enableRecording: true,
    width: 600,
    height: 80,
    title: 'Record Your Audio',
    showDuration: true,
    gradeId: 'test-grade-123',
    nodeKey: 'test-node-key',
    metadata: {
      phrase: 'Hello',
      definition: 'A greeting',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Player with recording enabled. Click the microphone icon to start recording, then stop to save. The recording will automatically calculate waveform data and upload if gradeId and nodeKey are provided.',
      },
    },
  },
};

export const RecordingWithCallback = () => {
  const [recordedFiles, setRecordedFiles] = React.useState([]);
  
  const handleRecordingComplete = (file, uploadResult) => {
    console.log('Recording complete:', file, uploadResult);
    setRecordedFiles([...recordedFiles, { file, uploadResult }]);
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <AudioWaveformPlayer
        enableRecording={true}
        width={600}
        height={80}
        title="Record Your Pronunciation"
        showDuration={true}
        gradeId="test-grade-123"
        nodeKey="pronunciation-practice"
        metadata={{
          phrase: 'こんにちは',
          definition: 'Hello (Japanese)',
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
      story: 'Example with recording callback to track recorded files. The callback receives the file metadata and upload result.',
    },
  },
};

RecordingWithCallback.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  
  // Wait for component to load
  await waitFor(() => {
    const recordButton = canvasElement.querySelector('[title=\"Start recording\"]');
    return recordButton !== null;
  }, { timeout: 2000 });

  // Click the record button to start recording
  const recordButton = canvasElement.querySelector('[title=\"Start recording\"]');
  if (recordButton) {
    await userEvent.click(recordButton);
    
    // Wait for recording to start (look for stop button or recording indicator)
    await waitFor(() => {
      const recordingIndicator = canvasElement.querySelector('[title=\"Stop recording\"]');
      const recordingText = canvasElement.textContent.includes('Recording');
      return recordingIndicator !== null || recordingText;
    }, { timeout: 2000 });
    
    // Wait a moment to simulate recording
    await waitFor(() => true, { timeout: 2000 });
    
    // Click stop button
    const stopButton = canvasElement.querySelector('[title=\"Stop recording\"]');
    if (stopButton) {
      await userEvent.click(stopButton);
      
      // Wait for waveform to be calculated and displayed
      await waitFor(() => {
        const playButton = canvasElement.querySelector('[aria-label=\"Play\"]');
        return playButton !== null;
      }, { timeout: 3000 });
      
      // Click play to test the recorded audio
      const playButton = canvasElement.querySelector('[aria-label=\"Play\"]');
      if (playButton) {
        await userEvent.click(playButton);
        
        // Wait a moment
        await waitFor(() => true, { timeout: 1000 });
        
        // Click pause
        const pauseButton = canvasElement.querySelector('[aria-label=\"Pause\"]');
        if (pauseButton) {
          await userEvent.click(pauseButton);
        }
      }
      
      // Test the seek slider
      const slider = canvasElement.querySelector('input[type=\"range\"], [role=\"slider\"]');
      if (slider) {
        await userEvent.click(slider);
      }
    }
  }
};

export const RecordingOnly = {
  args: {
    enableRecording: true,
    width: 600,
    height: 80,
    title: 'Recording Only Mode',
    showDuration: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Recording-only mode without gradeId/nodeKey. Recording will be calculated but not uploaded. Useful for testing or preview scenarios.',
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
