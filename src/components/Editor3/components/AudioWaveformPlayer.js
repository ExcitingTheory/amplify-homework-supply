import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Typography, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StaticWaveform from './StaticWaveform';

/**
 * AudioWaveformPlayer - Complete audio player with waveform visualization
 * 
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
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);

    // Use audioUrl if provided, otherwise try to get from file
    const sourceUrl = audioUrl || (file ? URL.createObjectURL(file) : null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const updateDuration = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (event, newValue) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = (newValue / 100) * duration;
        audio.currentTime = newTime;
        setProgress(newValue);
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

            {/* Hidden audio element */}
            {sourceUrl && (
                <audio ref={audioRef} src={sourceUrl} preload="metadata" />
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
                {duration > 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: 'primary.main',
                            opacity: 0.2,
                            pointerEvents: 'none',
                            transition: 'width 0.1s linear'
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
                    disabled={!sourceUrl}
                    size="small"
                >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>

                {/* Progress slider */}
                <Slider
                    value={progress}
                    onChange={handleSeek}
                    aria-label="Audio progress"
                    disabled={!sourceUrl || duration === 0}
                    sx={{ flexGrow: 1 }}
                />

                {/* Time display */}
                {showDuration && (
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, textAlign: 'right' }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
