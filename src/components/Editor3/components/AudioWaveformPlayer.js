import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StaticWaveform from './StaticWaveform';
import { useAudioPlayer } from '../context/AudioPlayerContext';

/**
 * AudioWaveformPlayer - Complete audio player with waveform visualization
 * 
 * Uses shared audio context to ensure only one audio plays at a time.
 * Displays a static waveform with playback controls and progress tracking.
 * Shows current playback position on the waveform.
 * 
 * @param {Object} props
 * @param {string} props.audioUrl - URL of the audio file to play
 * @param {Object} props.file - File object with waveformData (alternative to audioUrl)
 * @param {number[]} props.waveformData - Pre-calculated waveform data
 * @param {number} props.width - Waveform width (default: 600)
 * @param {number} props.height - Waveform height (default: 80)
 * @param {string} props.title - Optional title to display above player
 * @param {boolean} props.showDuration - Show duration time (default: true)
 */
export default function AudioWaveformPlayer({
    audioUrl,
    file,
    waveformData,
    width = 600,
    height = 80,
    title,
    showDuration = true
}) {
    const audioPlayer = useAudioPlayer();
    const [localTime, setLocalTime] = useState(0);
    const [localDuration, setLocalDuration] = useState(0);
    const [localProgress, setLocalProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [blobUrl, setBlobUrl] = useState(null);
    const [isSeeking, setIsSeeking] = useState(false);

    // Create blob URL only once from file
    useEffect(() => {
        if (file && !audioUrl) {
            const url = URL.createObjectURL(file);
            setBlobUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setBlobUrl(null);
            };
        }
    }, [file, audioUrl]);

    // Use audioUrl if provided, otherwise use blob URL
    const sourceUrl = audioUrl || blobUrl;

    // Check if this player is currently active
    const isActive = audioPlayer.currentSource === sourceUrl;
    const isPlaying = isActive && audioPlayer.isPlaying;

    // Subscribe to audio player events
    useEffect(() => {
        if (!sourceUrl) return;

        const listener = {
            onTimeUpdate: (time) => {
                if (isActive && !isSeeking) {
                    setLocalTime(time);
                    const newProgress = (time / localDuration) * 100;
                    setLocalProgress(isNaN(newProgress) || !isFinite(newProgress) ? 0 : newProgress);
                }
            },
            onDurationChange: (dur) => {
                if (isActive) {
                    setLocalDuration(dur);
                }
            },
            onEnded: () => {
                if (isActive) {
                    setLocalTime(0);
                    setLocalProgress(0);
                }
            },
            onCanPlay: () => {
                if (isActive) {
                    setIsReady(true);
                }
            },
            onError: () => {
                if (isActive) {
                    setIsReady(false);
                }
            }
        };

        return audioPlayer.subscribe(listener);
    }, [sourceUrl, isActive, audioPlayer, localDuration, isSeeking]);

    // Load source when component mounts or URL changes
    useEffect(() => {
        if (sourceUrl) {
            console.log('[AudioWaveformPlayer] Loading source:', sourceUrl.substring(0, 50) + '...');
            setIsReady(false);
            audioPlayer.loadSource(sourceUrl);
        }
    }, [sourceUrl, audioPlayer]);

    const togglePlayPause = async () => {
        if (!sourceUrl || !isReady) {
            console.warn('Audio not ready to play');
            return;
        }

        if (isPlaying) {
            audioPlayer.pause();
        } else {
            await audioPlayer.play(sourceUrl);
        }
    };

    const handleSliderChange = (event, newValue) => {
        // Update progress while dragging without seeking
        setIsSeeking(true);
        setLocalProgress(newValue);
        // Update time display immediately for visual feedback
        const newTime = (newValue / 100) * localDuration;
        setLocalTime(newTime);
    };

    const handleSeek = (event, newValue) => {
        // Prevent event propagation to other sliders
        event.stopPropagation();
        
        if (!isActive || !localDuration) {
            setIsSeeking(false);
            return;
        }

        const newTime = (newValue / 100) * localDuration;
        audioPlayer.seek(newTime);
        setLocalProgress(newValue);
        setIsSeeking(false);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!sourceUrl && !file && !waveformData) {
        return (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                No audio source provided
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'background.paper',
            maxWidth: width + 100
        }}>
            {/* Title */}
            {title && (
                <Typography variant="subtitle2" color="text.secondary">
                    {title}
                </Typography>
            )}

            {/* Waveform with progress overlay */}
            <Box sx={{ position: 'relative' }}>
                <StaticWaveform
                    file={file}
                    waveformData={waveformData}
                    width={width}
                    height={height}
                    showLoading={false}
                />
                
                {/* Progress overlay */}
                {localDuration > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'primary.main',
                            opacity: 0.2,
                            pointerEvents: 'none',
                            transformOrigin: 'left',
                            transform: `scaleX(${localProgress / 100})`,
                            willChange: 'transform'
                        }}
                    />
                )}
            </Box>

            {/* Playback controls */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <IconButton
                    onClick={togglePlayPause}
                    color="primary"
                    disabled={!sourceUrl || !isReady}
                    size="small"
                >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                {/* Progress slider */}
                <Slider
                    value={isNaN(localProgress) || !isFinite(localProgress) ? 0 : localProgress}
                    onChange={handleSliderChange}
                    onChangeCommitted={handleSeek}
                    aria-label="Audio progress"
                    disabled={!sourceUrl || localDuration === 0 || !isActive}
                    sx={{ flexGrow: 1 }}
                />

                {/* Time display */}
                {showDuration && (
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, textAlign: 'right' }}>
                        {formatTime(localTime)} / {formatTime(localDuration)}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
