import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const loadedSourceRef = useRef(null);
    const currentTimeRef = useRef(0);
    const displayTimeRef = useRef(0);
    const lastFrameTimeRef = useRef(performance.now());

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
                    currentTimeRef.current = time;
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
                    currentTimeRef.current = 0;
                    displayTimeRef.current = 0;
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
    }, [sourceUrl, isActive, audioPlayer, isSeeking]);

    // Continuous animation loop for smooth progress updates
    useEffect(() => {
        // Don't update if we're seeking - let the slider control the state
        if (!isActive || !isPlaying || isSeeking || localDuration === 0) {
            return;
        }

        // Initialize displayTime to current audio position when playback starts
        // Read directly from the audio element for the most accurate current time
        const audioElement = audioPlayer.audioElement;
        const initialTime = audioElement ? audioElement.currentTime : (audioPlayer.currentTime || 0);
        displayTimeRef.current = initialTime;
        currentTimeRef.current = initialTime;
        
        console.log('[AudioWaveformPlayer] Starting animation from time:', initialTime, 'duration:', localDuration);
        
        // Reset frame time when starting animation
        lastFrameTimeRef.current = performance.now();
        
        let rafId;
        const updateProgress = (timestamp) => {
            const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000; // Convert to seconds
            lastFrameTimeRef.current = timestamp;
            
            // Clamp deltaTime to prevent huge jumps (e.g., when tab is backgrounded)
            const clampedDelta = Math.min(deltaTime, 0.1);
            
            // Predict next position based on playback (assuming 1x speed)
            displayTimeRef.current += clampedDelta;
            
            // Update currentTimeRef from audio element periodically
            if (audioElement) {
                currentTimeRef.current = audioElement.currentTime;
            }
            
            // Check for large jumps (seeks) and snap immediately
            const targetTime = currentTimeRef.current;
            const drift = targetTime - displayTimeRef.current;
            
            if (Math.abs(drift) > 0.5) {
                // Large difference - snap to correct position (likely a seek)
                displayTimeRef.current = targetTime;
            }
            
            const time = displayTimeRef.current;
            setLocalTime(time);
            const newProgress = Math.min((time / localDuration) * 100, 100);
            console.log('[AudioWaveformPlayer] Updating progress:', newProgress, 'time:', time);
            setLocalProgress(newProgress);
            
            rafId = requestAnimationFrame(updateProgress);
        };

        rafId = requestAnimationFrame(updateProgress);

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [isActive, isPlaying, isSeeking, localDuration]);

    // Load source when component mounts or URL changes
    useEffect(() => {
        if (sourceUrl && loadedSourceRef.current !== sourceUrl) {
            console.log('[AudioWaveformPlayer] Loading source:', sourceUrl.substring(0, 50) + '...');
            setIsReady(false);
            audioPlayer.loadSource(sourceUrl);
            loadedSourceRef.current = sourceUrl;
        }
    }, [sourceUrl, audioPlayer]);

    const togglePlayPause = useCallback(async () => {
        if (!sourceUrl || !isReady) {
            console.warn('Audio not ready to play');
            return;
        }

        if (isPlaying) {
            audioPlayer.pause();
        } else {
            await audioPlayer.play(sourceUrl);
        }
    }, [sourceUrl, isReady, isPlaying, audioPlayer]);

    const handleSliderChange = useCallback((event, newValue) => {
        // Mark that we're seeking to prevent animation loop from updating
        if (!isSeeking) {
            setIsSeeking(true);
        }
        // Update progress while dragging without seeking
        setLocalProgress(newValue);
        // Update time display immediately for visual feedback
        const newTime = (newValue / 100) * localDuration;
        setLocalTime(newTime);
        displayTimeRef.current = newTime;
    }, [localDuration, isSeeking]);

    const handleSeek = useCallback((event, newValue) => {
        // Prevent event propagation to other sliders
        event.stopPropagation();
        
        if (!isActive || !localDuration) {
            setIsSeeking(false);
            return;
        }

        const newTime = (newValue / 100) * localDuration;
        audioPlayer.seek(newTime);
        setLocalProgress(newValue);
        // Update refs so animation continues from new position
        currentTimeRef.current = newTime;
        displayTimeRef.current = newTime;
        setIsSeeking(false);
    }, [isActive, localDuration, audioPlayer]);

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
            width: '100%',
            maxWidth: 'max-content'
        }}>
            {/* Title */}
            {title && (
                <Typography variant="subtitle2" color="text.secondary">
                    {title}
                </Typography>
            )}

            {/* Waveform with progress overlay */}
            <Box sx={{ position: 'relative', borderRadius: 1, width: '100%' }}>
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
                            transform: `scaleX(${Math.min(localProgress / 100, 1)})`,
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
                    min={0}
                    max={100}
                    onChange={handleSliderChange}
                    onChangeCommitted={handleSeek}
                    aria-label="Audio progress"
                    disabled={false}
                    // disabled={!sourceUrl || localDuration === 0}
                    // sx={{ 
                    //     flexGrow: 1,
                    //     '& .MuiSlider-thumb': {
                    //         transition: 'none', // Disable transition for smoother updates
                    //     },
                    //     '& .MuiSlider-track': {
                    //         transition: 'none',
                    //     }
                    // }}
                    track="normal"
                    size="small"
                />

                {/* Debug display */}
                <Typography variant="caption" sx={{ position: 'absolute', top: 0, left: 0, color: 'red' }}>
                    {localProgress.toFixed(2)}%
                </Typography>

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
