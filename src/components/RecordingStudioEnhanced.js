import React, { useState, useRef, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Toolbar,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Card,
    CardContent,
    TextField,
    Divider,
    Tooltip,
    Slider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import RecordIcon from '@mui/icons-material/KeyboardVoice';
import StopIcon from '@mui/icons-material/Stop';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import FilterListIcon from '@mui/icons-material/FilterList';

import AudioWaveformPlayer from './Editor3/components/AudioWaveformPlayer';
import { calculateWaveformData } from '../utils/calculateWaveformData';
import { uploadStudentSubmission } from '../utils/userSubmissionStorage';
import getCachedUrl from '../utils/getCachedUrl';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Enhanced Recording Studio with:
 * - Audio filtering toolbar (noise reduction, pop/click removal, speech enhancement)
 * - Cut functionality for audio editing
 * - Multiple tracks with different voices
 * - Horizontal scrolling track viewer
 * - Editable prompts per track
 * - Waveform visualization
 */
export default function RecordingStudioEnhanced({
    gradeId,
    nodeKey,
    onRecordingComplete,
    metadata = {},
}) {
    const theme = useTheme();
    
    // Tracks state - each track can have multiple audio clips
    const [tracks, setTracks] = useState([
        {
            id: 1,
            name: 'Track 1',
            voice: 'alloy', // Whisper TTS voice
            prompt: '',
            clips: [], // Array of { id, audioBlob, waveformData, startTime, duration }
        },
    ]);
    const [selectedTrackId, setSelectedTrackId] = useState(1);
    
    // Audio filters state
    const [filters, setFilters] = useState({
        noiseReduction: 'none', // 'none', 'light', 'medium', 'heavy'
        popClickRemoval: false,
        speechEnhancement: 'none', // 'none', 'clarity', 'presence', 'broadcast'
        highPassFilter: false, // Remove low frequencies
        lowPassFilter: false, // Remove high frequencies
        normalize: false, // Normalize audio levels
    });
    
    // Recording state
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [mediaStream, setMediaStream] = useState(null);
    
    // Playback state
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // Selection for cut function
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);
    
    // Refs
    const trackContainerRef = useRef(null);
    const audioContextRef = useRef(null);
    
    // Available Whisper voices
    const whisperVoices = [
        { value: 'alloy', label: 'Alloy' },
        { value: 'echo', label: 'Echo' },
        { value: 'fable', label: 'Fable' },
        { value: 'onyx', label: 'Onyx' },
        { value: 'nova', label: 'Nova' },
        { value: 'shimmer', label: 'Shimmer' },
    ];
    
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    
    // Add new track
    const handleAddTrack = () => {
        const newTrack = {
            id: Date.now(),
            name: `Track ${tracks.length + 1}`,
            voice: 'alloy',
            prompt: '',
            clips: [],
        };
        setTracks([...tracks, newTrack]);
    };
    
    // Delete track
    const handleDeleteTrack = (trackId) => {
        if (tracks.length === 1) {
            alert('Cannot delete the last track');
            return;
        }
        setTracks(tracks.filter(t => t.id !== trackId));
        if (selectedTrackId === trackId) {
            setSelectedTrackId(tracks[0].id);
        }
    };
    
    // Update track property
    const updateTrack = (trackId, updates) => {
        setTracks(tracks.map(t => 
            t.id === trackId ? { ...t, ...updates } : t
        ));
    };
    
    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);
            
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            
            const audioChunks = [];
            
            recorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                
                // Apply filters to the recorded audio
                const processedBlob = await applyFilters(audioBlob, filters);
                
                // Calculate waveform
                const waveform = await calculateWaveformData(processedBlob, 600);
                
                // Add clip to selected track
                const newClip = {
                    id: Date.now(),
                    audioBlob: processedBlob,
                    waveformData: waveform,
                    startTime: 0, // Will be calculated based on track content
                    duration: 0, // Will be calculated from audio
                };
                
                const updatedClips = [...selectedTrack.clips, newClip];
                updateTrack(selectedTrackId, { clips: updatedClips });
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
            };
            
            recorder.start();
            setRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    };
    
    // Stop recording
    const stopRecording = () => {
        if (mediaRecorder && recording) {
            mediaRecorder.stop();
            setRecording(false);
        }
    };
    
    // Apply audio filters (simplified version - would need Web Audio API for real implementation)
    const applyFilters = async (audioBlob, filters) => {
        // This is a placeholder. Real implementation would use Web Audio API
        // to apply actual filters like:
        // - BiquadFilterNode for high/low pass filters
        // - DynamicsCompressorNode for normalization
        // - Custom noise gate for noise reduction
        // - etc.
        
        console.log('Applying filters:', filters);
        
        // For now, just return the original blob
        // TODO: Implement actual audio filtering
        return audioBlob;
    };
    
    // Cut selected portion of audio
    const handleCut = () => {
        if (selectionStart === null || selectionEnd === null) {
            alert('Please select a portion of audio to cut');
            return;
        }
        
        // TODO: Implement actual cutting logic using Web Audio API
        console.log('Cutting from', selectionStart, 'to', selectionEnd);
        
        // Reset selection
        setSelectionStart(null);
        setSelectionEnd(null);
    };
    
    // Generate audio from prompt using TTS
    const handleGenerateFromPrompt = async (trackId) => {
        const track = tracks.find(t => t.id === trackId);
        if (!track || !track.prompt.trim()) {
            alert('Please enter a prompt for this track');
            return;
        }
        
        try {
            // TODO: Call OpenAI TTS API with track.voice and track.prompt
            console.log('Generating audio:', {
                voice: track.voice,
                prompt: track.prompt,
            });
            
            // Placeholder - would need to implement actual API call
            alert('Text-to-speech generation not yet implemented');
            
        } catch (error) {
            console.error('Error generating audio:', error);
            alert('Failed to generate audio from prompt');
        }
    };
    
    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            {/* Toolbar with filters */}
            <Toolbar
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <Typography variant="subtitle2" sx={{ mr: 2 }}>
                    Audio Filters
                </Typography>
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Noise Reduction</InputLabel>
                    <Select
                        value={filters.noiseReduction}
                        label="Noise Reduction"
                        onChange={(e) => setFilters({ ...filters, noiseReduction: e.target.value })}
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="heavy">Heavy</MenuItem>
                    </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Speech Enhancement</InputLabel>
                    <Select
                        value={filters.speechEnhancement}
                        label="Speech Enhancement"
                        onChange={(e) => setFilters({ ...filters, speechEnhancement: e.target.value })}
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="clarity">Clarity</MenuItem>
                        <MenuItem value="presence">Presence</MenuItem>
                        <MenuItem value="broadcast">Broadcast</MenuItem>
                    </Select>
                </FormControl>
                
                <Tooltip title="Remove pops and clicks">
                    <Button
                        size="small"
                        variant={filters.popClickRemoval ? 'contained' : 'outlined'}
                        onClick={() => setFilters({ ...filters, popClickRemoval: !filters.popClickRemoval })}
                    >
                        Pop/Click
                    </Button>
                </Tooltip>
                
                <Tooltip title="High-pass filter (remove low frequencies)">
                    <Button
                        size="small"
                        variant={filters.highPassFilter ? 'contained' : 'outlined'}
                        onClick={() => setFilters({ ...filters, highPassFilter: !filters.highPassFilter })}
                    >
                        HPF
                    </Button>
                </Tooltip>
                
                <Tooltip title="Low-pass filter (remove high frequencies)">
                    <Button
                        size="small"
                        variant={filters.lowPassFilter ? 'contained' : 'outlined'}
                        onClick={() => setFilters({ ...filters, lowPassFilter: !filters.lowPassFilter })}
                    >
                        LPF
                    </Button>
                </Tooltip>
                
                <Tooltip title="Normalize audio levels">
                    <Button
                        size="small"
                        variant={filters.normalize ? 'contained' : 'outlined'}
                        onClick={() => setFilters({ ...filters, normalize: !filters.normalize })}
                    >
                        Normalize
                    </Button>
                </Tooltip>
                
                <Divider orientation="vertical" flexItem />
                
                <Tooltip title="Cut selected audio">
                    <span>
                        <IconButton
                            onClick={handleCut}
                            disabled={selectionStart === null || selectionEnd === null}
                            color="primary"
                        >
                            <ContentCutIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Toolbar>
            
            {/* Recording controls */}
            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    {!recording ? (
                        <IconButton
                            onClick={startRecording}
                            color="error"
                            size="large"
                        >
                            <RecordIcon />
                        </IconButton>
                    ) : (
                        <IconButton
                            onClick={stopRecording}
                            color="primary"
                            size="large"
                        >
                            <StopIcon />
                        </IconButton>
                    )}
                    
                    <Typography variant="body2">
                        {recording ? 'Recording...' : 'Click to record'}
                    </Typography>
                    
                    <Box sx={{ flexGrow: 1 }} />
                    
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddTrack}
                        variant="outlined"
                        size="small"
                    >
                        Add Track
                    </Button>
                </Box>
            </Box>
            
            {/* Multi-track viewer with horizontal scrolling */}
            <Box
                ref={trackContainerRef}
                sx={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: '60vh',
                    bgcolor: 'background.paper',
                    p: 2,
                }}
            >
                {tracks.map((track) => (
                    <Card
                        key={track.id}
                        sx={{
                            mb: 2,
                            border: 2,
                            borderColor: selectedTrackId === track.id ? 'primary.main' : 'transparent',
                        }}
                        onClick={() => setSelectedTrackId(track.id)}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                <TextField
                                    label="Track Name"
                                    value={track.name}
                                    onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                                    size="small"
                                    sx={{ width: 150 }}
                                />
                                
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Voice</InputLabel>
                                    <Select
                                        value={track.voice}
                                        label="Voice"
                                        onChange={(e) => updateTrack(track.id, { voice: e.target.value })}
                                    >
                                        {whisperVoices.map(voice => (
                                            <MenuItem key={voice.value} value={voice.value}>
                                                {voice.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                
                                <TextField
                                    label="Prompt for TTS"
                                    value={track.prompt}
                                    onChange={(e) => updateTrack(track.id, { prompt: e.target.value })}
                                    multiline
                                    size="small"
                                    sx={{ flexGrow: 1 }}
                                    placeholder="Enter text to generate speech..."
                                />
                                
                                <Button
                                    onClick={() => handleGenerateFromPrompt(track.id)}
                                    variant="contained"
                                    size="small"
                                    disabled={!track.prompt.trim()}
                                >
                                    Generate
                                </Button>
                                
                                <IconButton
                                    onClick={() => handleDeleteTrack(track.id)}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                            
                            {/* Track waveform - horizontal scrolling */}
                            <Box
                                sx={{
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    whiteSpace: 'nowrap',
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 1,
                                    minHeight: 100,
                                    bgcolor: 'background.default',
                                }}
                            >
                                {track.clips.length === 0 ? (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'inline-block', lineHeight: '80px' }}
                                    >
                                        No audio clips yet. Record or generate audio to add to this track.
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: 'inline-flex', gap: 1 }}>
                                        {track.clips.map((clip) => (
                                            <Box
                                                key={clip.id}
                                                sx={{
                                                    display: 'inline-block',
                                                    verticalAlign: 'top',
                                                }}
                                            >
                                                <AudioWaveformPlayer
                                                    waveformData={clip.waveformData}
                                                    width={300}
                                                    height={80}
                                                    showDuration={true}
                                                />
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
            
            {/* Information panel */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                    <strong>Tips:</strong> Use filters to clean up background noise and enhance speech.
                    Click on a track to select it for recording. Generated audio will be appended to the selected track.
                    Drag to select portions of audio and use the cut button to remove them.
                </Typography>
            </Box>
        </Box>
    );
}
