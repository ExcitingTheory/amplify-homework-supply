import React, { useState } from 'react';
import RecordingStudioEnhanced from './RecordingStudioEnhanced';
import { Box, Typography } from '@mui/material';

export default {
    title: 'Components/RecordingStudioEnhanced',
    component: RecordingStudioEnhanced,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Enhanced multi-track recording studio with audio filters, voice selection, and advanced editing capabilities.',
            },
        },
    },
};

const Template = (args) => (
    <Box sx={{ height: '100vh', p: 2 }}>
        <RecordingStudioEnhanced {...args} />
    </Box>
);

export const Default = Template.bind({});
Default.args = {
    gradeId: 'test-grade-123',
    nodeKey: 'recording-practice',
    metadata: {
        exercise: 'Pronunciation practice',
        language: 'French',
    },
};
Default.parameters = {
    docs: {
        description: {
            story: 'Default recording studio with all features enabled. Try adding tracks, recording audio, and applying filters.',
        },
    },
};

export const WithRecording = () => {
    const [recordings, setRecordings] = useState([]);

    const handleRecordingComplete = (recording) => {
        console.log('Recording completed:', recording);
        setRecordings([...recordings, recording]);
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <RecordingStudioEnhanced
                    gradeId="test-grade-123"
                    nodeKey="recording-practice"
                    onRecordingComplete={handleRecordingComplete}
                />
            </Box>
            
            {recordings.length > 0 && (
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Completed Recordings: {recordings.length}
                    </Typography>
                    {recordings.map((rec, idx) => (
                        <Typography key={idx} variant="caption" display="block">
                            Recording {idx + 1}: {rec.trackName || 'Unknown'}
                        </Typography>
                    ))}
                </Box>
            )}
        </Box>
    );
};
WithRecording.parameters = {
    docs: {
        description: {
            story: 'Recording studio with callback to handle completed recordings. Shows how to integrate with parent components.',
        },
    },
};

export const FeatureShowcase = () => (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h3" gutterBottom>
            RecordingStudioEnhanced Features
        </Typography>

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            🎛️ Audio Filters Toolbar
        </Typography>
        <Typography paragraph>
            Professional audio processing filters including:
        </Typography>
        <ul>
            <li><strong>Noise Reduction:</strong> Remove background noise (light/medium/heavy)</li>
            <li><strong>Speech Enhancement:</strong> Optimize for speech clarity, presence, or broadcast quality</li>
            <li><strong>Pop/Click Removal:</strong> Clean up pops and clicks from recordings</li>
            <li><strong>High-Pass Filter:</strong> Remove low frequencies (rumble, hum)</li>
            <li><strong>Low-Pass Filter:</strong> Remove high frequencies (hiss)</li>
            <li><strong>Normalize:</strong> Balance audio levels automatically</li>
        </ul>

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            🎵 Multi-Track Support
        </Typography>
        <Typography paragraph>
            Create complex audio compositions with multiple tracks:
        </Typography>
        <ul>
            <li>Add unlimited tracks</li>
            <li>Each track has its own voice selection (Whisper TTS)</li>
            <li>Editable prompts for text-to-speech generation</li>
            <li>Horizontal scrolling timeline view</li>
            <li>Visual waveforms for each audio clip</li>
            <li>Easy track selection and management</li>
        </ul>

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            ✂️ Advanced Editing
        </Typography>
        <Typography paragraph>
            Professional editing tools:
        </Typography>
        <ul>
            <li><strong>Cut Function:</strong> Select and remove portions of audio</li>
            <li><strong>Selection Tool:</strong> Precise time-based selection</li>
            <li><strong>Multiple Clips:</strong> Each track can contain multiple audio clips</li>
            <li><strong>Non-destructive:</strong> Original audio preserved</li>
        </ul>

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            🎙️ Voice Options (Whisper TTS)
        </Typography>
        <Typography paragraph>
            Six different voices to choose from:
        </Typography>
        <ul>
            <li><strong>Alloy:</strong> Neutral, balanced voice</li>
            <li><strong>Echo:</strong> Clear, distinctive voice</li>
            <li><strong>Fable:</strong> Expressive storytelling voice</li>
            <li><strong>Onyx:</strong> Deep, authoritative voice</li>
            <li><strong>Nova:</strong> Warm, engaging voice</li>
            <li><strong>Shimmer:</strong> Bright, energetic voice</li>
        </ul>

        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            💡 Usage Tips
        </Typography>
        <ul>
            <li>Click on a track to select it for recording</li>
            <li>Use filters before or after recording</li>
            <li>Enter a prompt and click Generate to create TTS audio</li>
            <li>Scroll horizontally through tracks to see all clips</li>
            <li>Combine recording and TTS in the same project</li>
        </ul>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
                <strong>Try It Out!</strong>
            </Typography>
            <RecordingStudioEnhanced
                gradeId="demo"
                nodeKey="demo-recording"
            />
        </Box>
    </Box>
);
FeatureShowcase.parameters = {
    docs: {
        description: {
            story: 'Comprehensive feature showcase and documentation for the RecordingStudioEnhanced component.',
        },
    },
};

export const ConversationExample = Template.bind({});
ConversationExample.args = {
    gradeId: 'conversation-practice',
    nodeKey: 'dialogue-123',
    metadata: {
        type: 'conversation',
        participants: ['Student', 'Teacher'],
        language: 'Spanish',
    },
};
ConversationExample.parameters = {
    docs: {
        description: {
            story: 'Example setup for creating conversations with different voices on different tracks. Perfect for dialogue practice.',
        },
    },
};
