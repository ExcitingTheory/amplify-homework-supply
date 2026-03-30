import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, IconButton, Typography, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import RecordIcon from '@mui/icons-material/KeyboardVoice';
import StaticWaveform from './StaticWaveform';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { calculateWaveformData } from '../../../utils/calculateWaveformData';
import { uploadStudentSubmission } from '../../../utils/userSubmissionStorage';
import { useTheme } from '@mui/material/styles';
import { hexToRgb } from '../../../utils/hexToRgb';
import FilesContext from '../../../context/fileContext';

/**
 * AudioWaveformPlayer - Complete audio player with waveform visualization and recording
 * 
 * Uses shared audio context to ensure only one audio plays at a time.
 * Displays a static waveform with playback controls and progress tracking.
 * Shows current playback position on the waveform.
 * Can record new audio with real-time waveform visualization.
 * 
 * @param {Object} props
 * @param {string} props.audioUrl - URL of the audio file to play
 * @param {Object} props.file - File object with waveformData (alternative to audioUrl)
 * @param {number[]} props.waveformData - Pre-calculated waveform data
 * @param {number} props.width - Waveform width (default: 600)
 * @param {number} props.height - Waveform height (default: 80)
 * @param {string} props.title - Optional title to display above player
 * @param {boolean} props.showDuration - Show duration time (default: true)
 * @param {boolean} props.enableRecording - Enable recording controls (default: false)
 * @param {string} props.gradeId - Grade ID for upload (required if enableRecording is true)
 * @param {string} props.nodeKey - Node key for upload (required if enableRecording is true)
 * @param {Object} props.metadata - Additional metadata for recording upload
 * @param {Function} props.onRecordingComplete - Callback when recording is complete
 */
export default function AudioWaveformPlayer({
    audioUrl,
    file,
    waveformData,
    width = 600,
    height = 100,
    title,
    showDuration = true,
    enableRecording = false,
    gradeId,
    nodeKey,
    metadata = {},
    onRecordingComplete
}) {
    const { t } = useTranslation('editor.shared');
    const theme = useTheme();
    const mainColor = theme.palette.primary.main;
    const rgbColor = hexToRgb(mainColor);
    const _r = rgbColor.r;
    const _g = rgbColor.g;
    const _b = rgbColor.b;
    
    const audioPlayer = useAudioPlayer();
    
    // Playback state
    const [localTime, setLocalTime] = useState(0);
    const [localDuration, setLocalDuration] = useState(0);
    const [localProgress, setLocalProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [blobUrl, setBlobUrl] = useState(null);
    const [isSeeking, setIsSeeking] = useState(false);
    
    // Recording state
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordedWaveformData, setRecordedWaveformData] = useState(null);
    const [pendingRecordingStart, setPendingRecordingStart] = useState(false);
    
    // Mic preview state (hover to show room noise)
    const [previewing, setPreviewing] = useState(false);
    const previewStreamRef = useRef(null);
    const previewAudioCtxRef = useRef(null);
    const previewAnalyserRef = useRef(null);
    const previewRafRef = useRef(null);
    
    // Refs
    const loadedSourceRef = useRef(null);
    const currentTimeRef = useRef(0);
    const displayTimeRef = useRef(0);
    const lastFrameTimeRef = useRef(performance.now());
    const recordingCanvasRef = useRef(null);
    const mediaStreamRef = useRef(null);
    
    // Context
    const filesContext = useContext(FilesContext);
    const identityId = filesContext?.session?.identityId;

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
    
    // Create blob URL for recorded audio
    const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
    useEffect(() => {
        if (audioBlob) {
            const url = URL.createObjectURL(audioBlob);
            setRecordedBlobUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setRecordedBlobUrl(null);
            };
        }
    }, [audioBlob]);

    // Local audio element for recording playback (bypasses shared context)
    const localAudioRef = useRef(null);
    const [localIsPlaying, setLocalIsPlaying] = useState(false);

    useEffect(() => {
        if (!recordedBlobUrl) {
            localAudioRef.current = null;
            return;
        }
        const audio = new Audio(recordedBlobUrl);
        localAudioRef.current = audio;

        const onMeta = () => {
            const dur = audio.duration;
            if (!isNaN(dur) && isFinite(dur)) {
                setLocalDuration(dur);
                setIsReady(true);
            }
        };
        const onEnded = () => {
            setLocalIsPlaying(false);
            setLocalTime(0);
            setLocalProgress(0);
            currentTimeRef.current = 0;
            displayTimeRef.current = 0;
        };
        const onPlay = () => setLocalIsPlaying(true);
        const onPause = () => setLocalIsPlaying(false);

        audio.addEventListener('loadedmetadata', onMeta);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('loadedmetadata', onMeta);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.pause();
            audio.src = '';
            localAudioRef.current = null;
            setLocalIsPlaying(false);
        };
    }, [recordedBlobUrl]);

    // Use audioUrl if provided, otherwise use blob URL, otherwise use recorded blob URL
    const sourceUrl = audioUrl || blobUrl || recordedBlobUrl;
    const useLocalAudio = !!recordedBlobUrl;

    // Check if this player is currently active
    const isActive = useLocalAudio ? !!localAudioRef.current : audioPlayer.currentSource === sourceUrl;
    const isPlaying = useLocalAudio ? localIsPlaying : (isActive && audioPlayer.isPlaying);

    // Subscribe to shared audio player events (only for non-recording sources)
    useEffect(() => {
        if (!sourceUrl || useLocalAudio) return;

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
    }, [sourceUrl, isActive, useLocalAudio, audioPlayer, isSeeking]);

    // Continuous animation loop for smooth progress updates
    useEffect(() => {
        // Don't update if we're seeking - let the slider control the state
        if (!isActive || !isPlaying || isSeeking || localDuration === 0) {
            return;
        }

        const audioElement = useLocalAudio ? localAudioRef.current : audioPlayer.audioElement;
        const initialTime = audioElement ? audioElement.currentTime : 0;
        displayTimeRef.current = initialTime;
        currentTimeRef.current = initialTime;
        
        console.log('[AudioWaveformPlayer] Starting animation from time:', initialTime, 'duration:', localDuration);
        
        lastFrameTimeRef.current = performance.now();
        
        let rafId;
        const updateProgress = () => {
            // Read directly from the audio element for accurate position
            const time = audioElement ? audioElement.currentTime : displayTimeRef.current;
            displayTimeRef.current = time;
            currentTimeRef.current = time;
            
            setLocalTime(time);
            const newProgress = Math.min((time / localDuration) * 100, 100);
            setLocalProgress(newProgress);
            
            rafId = requestAnimationFrame(updateProgress);
        };

        rafId = requestAnimationFrame(updateProgress);

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [isActive, isPlaying, isSeeking, localDuration, useLocalAudio]);

    // Load source into shared audio context (only for non-recording sources)
    useEffect(() => {
        if (useLocalAudio) return; // Recording uses its own Audio element
        if (sourceUrl && loadedSourceRef.current !== sourceUrl) {
            loadedSourceRef.current = sourceUrl;
            setIsReady(false);
            audioPlayer.loadSource(sourceUrl);
        }
    }, [sourceUrl, useLocalAudio, audioPlayer]);

    const togglePlayPause = useCallback(async () => {
        // Use local audio for recording playback
        if (useLocalAudio && localAudioRef.current) {
            if (localIsPlaying) {
                localAudioRef.current.pause();
            } else {
                try {
                    await localAudioRef.current.play();
                } catch (err) {
                    console.error('[AudioWaveformPlayer] Error playing recording:', err);
                }
            }
            return;
        }

        if (!sourceUrl) return;
        if (isPlaying) {
            audioPlayer.pause();
        } else {
            await audioPlayer.play(sourceUrl);
        }
    }, [sourceUrl, isPlaying, localIsPlaying, useLocalAudio, audioPlayer]);

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
        if (useLocalAudio && localAudioRef.current) {
            localAudioRef.current.currentTime = newTime;
        } else {
            audioPlayer.seek(newTime);
        }
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

    // Stop mic preview helper
    const stopPreview = useCallback(() => {
        if (previewRafRef.current) {
            cancelAnimationFrame(previewRafRef.current);
            previewRafRef.current = null;
        }
        if (previewAudioCtxRef.current) {
            previewAudioCtxRef.current.close();
            previewAudioCtxRef.current = null;
        }
        previewAnalyserRef.current = null;
        // Only stop tracks if we're not handing off to recording
        if (previewStreamRef.current && !recording) {
            previewStreamRef.current.getTracks().forEach(track => track.stop());
            previewStreamRef.current = null;
        }
        setPreviewing(false);
    }, [recording]);

    // Hover: start mic preview to show room noise
    const handleMouseEnter = useCallback(async () => {
        // Only preview when in recording mode with no content and not already active
        if (!enableRecording || recording || audioBlob || sourceUrl || waveformData || file || previewing) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            previewStreamRef.current = stream;
            
            const audioCtx = new AudioContext();
            previewAudioCtxRef.current = audioCtx;
            const src = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            src.connect(analyser);
            previewAnalyserRef.current = analyser;
            
            setPreviewing(true);
        } catch (err) {
            console.warn('[AudioWaveformPlayer] Mic preview denied:', err);
        }
    }, [enableRecording, recording, audioBlob, sourceUrl, waveformData, file, previewing]);

    const handleMouseLeave = useCallback(() => {
        if (recording || !previewing) return;
        stopPreview();
    }, [recording, previewing, stopPreview]);

    // Draw live mic preview on canvas
    useEffect(() => {
        const canvas = recordingCanvasRef.current;
        const analyser = previewAnalyserRef.current;
        if (!canvas || !previewing || !analyser || recording) return;
        
        const canvasCtx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let active = true;
        
        const drawPreview = () => {
            if (!active) return;
            previewRafRef.current = requestAnimationFrame(drawPreview);
            
            analyser.getByteFrequencyData(dataArray);
            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            const targetSamples = canvas.width;
            const barWidth = canvas.width / targetSamples;
            const middle = canvas.height / 2;
            const max = Math.max(...dataArray) || 1;
            const binSize = Math.floor(bufferLength / targetSamples);
            
            for (let i = 0; i < targetSamples; i++) {
                let sum = 0;
                const start = i * binSize;
                for (let j = start; j < start + binSize && j < bufferLength; j++) {
                    sum += dataArray[j];
                }
                const amplitude = (sum / binSize) / max;
                const barHeight = amplitude * middle;
                const x = i * barWidth;
                const intensity = Math.floor(amplitude * 155) + 100;
                canvasCtx.fillStyle = `rgb(${intensity},${_g},${_b})`;
                canvasCtx.fillRect(x, middle - barHeight, barWidth - 0.5, barHeight * 2);
            }
        };
        
        drawPreview();
        
        return () => {
            active = false;
            if (previewRafRef.current) {
                cancelAnimationFrame(previewRafRef.current);
                previewRafRef.current = null;
            }
        };
    }, [previewing, recording, _g, _b]);

    // Recording functions
    const startRecording = useCallback(async () => {
        try {
            let stream;
            // Reuse preview stream if available, otherwise request new one
            if (previewStreamRef.current && previewStreamRef.current.active) {
                stream = previewStreamRef.current;
                // Stop preview drawing but keep the stream
                if (previewRafRef.current) {
                    cancelAnimationFrame(previewRafRef.current);
                    previewRafRef.current = null;
                }
                if (previewAudioCtxRef.current) {
                    previewAudioCtxRef.current.close();
                    previewAudioCtxRef.current = null;
                }
                previewAnalyserRef.current = null;
                setPreviewing(false);
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            mediaStreamRef.current = stream;
            setPendingRecordingStart(true);
            setRecording(true);
        } catch (error) {
            console.error('[AudioWaveformPlayer] Error starting recording:', error);
        }
    }, []);
    
    // Idle state: draw a flat center line (canvas looks "off")
    useEffect(() => {
        const canvas = recordingCanvasRef.current;
        if (!canvas || recording || audioBlob || sourceUrl || waveformData || file || previewing) {
            return;
        }
        
        if (!enableRecording) {
            return;
        }
        
        const canvasCtx = canvas.getContext('2d');
        // White background
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Single flat line at center using theme color
        const middle = canvas.height / 2;
        canvasCtx.fillStyle = `rgb(${_r}, ${_g}, ${_b})`;
        canvasCtx.fillRect(0, middle, canvas.width, 1);
    }, [recording, audioBlob, sourceUrl, waveformData, file, enableRecording, previewing, _r, _g, _b]);
    
    // Effect to handle recording setup once canvas is available
    useEffect(() => {
        if (!pendingRecordingStart || !recording || !recordingCanvasRef.current || !mediaStreamRef.current) {
            return;
        }
        
        setPendingRecordingStart(false);
        const stream = mediaStreamRef.current;
        
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        recorder.start();
        const audioChunks = [];

        // Setup real-time waveform visualization
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
    
        const canvas = recordingCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Track if we should keep drawing
        let isRecording = true;

        recorder.addEventListener("dataavailable", (event) => {
            audioChunks.push(event.data);
        });
        
        recorder.addEventListener("stop", async () => {
            isRecording = false;
            audioContext.close();
            // Use the recorder's actual mimeType so decodeAudioData gets a valid container
            const actualMimeType = recorder.mimeType || 'audio/webm';
            const blob = new Blob(audioChunks, { type: actualMimeType });
            setAudioBlob(blob);
            
            // Calculate waveform data (non-blocking — failures don't prevent upload/callback)
            let waveform = null;
            try {
                waveform = await calculateWaveformData(blob, width);
                setRecordedWaveformData(waveform);
                console.log('[AudioWaveformPlayer] Calculated waveform for recording');
            } catch (waveformError) {
                console.warn('[AudioWaveformPlayer] Waveform calculation failed (continuing):', waveformError);
            }
            
            let savedFile = null;
            let uploadResult = null;
            
            // Upload if gradeId and nodeKey are provided
            if (gradeId && nodeKey) {
                try {
                    console.log('[AudioWaveformPlayer] Uploading recording...');
                    uploadResult = await uploadStudentSubmission({
                        file: blob,
                        gradeId: gradeId,
                        nodeKey: nodeKey,
                        fileType: 'mp3',
                        metadata: {
                            ...(waveform ? { waveformData: JSON.stringify(waveform) } : {}),
                            ...metadata
                        }
                    });
                    console.log('[AudioWaveformPlayer] Upload successful:', uploadResult);
                    
                    // Save file metadata using Gen2 client
                    const { getAmplifyClient } = await import('../../../utils/amplifyClient');
                    const { getCurrentUser } = await import('aws-amplify/auth');
                    const client = getAmplifyClient();
                    
                    // Get current user for owner field
                    const { username: owner } = await getCurrentUser();
                    
                    const { data: newFile, errors: fileErrors } = await client.models.File.create({
                        path: uploadResult.path,
                        owner,
                        identityId,
                        name: uploadResult.filename,
                        size: blob.size,
                        mimeType: actualMimeType,
                        level: 'PRIVATE',
                        ...(waveform ? { waveformData: JSON.stringify(waveform) } : {}),
                    });
                    
                    if (fileErrors?.length > 0 || !newFile) {
                        console.error('[AudioWaveformPlayer] Error creating File record:', fileErrors);
                    } else {
                        savedFile = newFile;
                        console.log('[AudioWaveformPlayer] Saved file metadata:', newFile);
                    }
                } catch (uploadError) {
                    console.error('[AudioWaveformPlayer] Upload/save error (continuing):', uploadError);
                }
            }
            
            // Always call onRecordingComplete so the story/UI gets feedback
            if (onRecordingComplete) {
                const waveformJson = waveform ? JSON.stringify(waveform) : null;
                onRecordingComplete(
                    savedFile || { path: URL.createObjectURL(blob), ...(waveformJson ? { waveformData: waveformJson } : {}) },
                    uploadResult
                );
            }
        });

        // Real-time waveform drawing - use local variable instead of state
        const draw = () => {
            if (!isRecording) return;
            requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);
            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            // Match StaticWaveform: downsample analyser data to canvas.width bins,
            // use barWidth - 0.5 actual width, symmetric drawing from center
            const targetSamples = canvas.width;
            const barWidth = canvas.width / targetSamples;
            const middle = canvas.height / 2;

            // Prevent division by zero when analyser returns silence (all zeros)
            const max = Math.max(...dataArray) || 1;

            // Downsample frequency data to targetSamples bins
            const binSize = Math.floor(bufferLength / targetSamples);

            for (let i = 0; i < targetSamples; i++) {
                // Average the frequency bins for this sample
                let sum = 0;
                const start = i * binSize;
                for (let j = start; j < start + binSize && j < bufferLength; j++) {
                    sum += dataArray[j];
                }
                const amplitude = (sum / binSize) / max;
                const barHeight = amplitude * middle;
                const x = i * barWidth;

                // Match StaticWaveform color: intensity varies red channel
                const intensity = Math.floor(amplitude * 155) + 100;
                canvasCtx.fillStyle = `rgb(${intensity},${_g},${_b})`;

                // Draw from middle outward (symmetric) - matches StaticWaveform exactly
                canvasCtx.fillRect(x, middle - barHeight, barWidth - 0.5, barHeight * 2);
            }
        };

        console.log('[AudioWaveformPlayer] Starting real-time waveform visualization');
        draw();
    }, [pendingRecordingStart, recording, width, _g, _b, gradeId, nodeKey, metadata, identityId, onRecordingComplete]);

    const stopRecording = useCallback(() => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setRecording(false);
            setMediaRecorder(null);
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        // Also clean up any leftover preview resources
        if (previewStreamRef.current) {
            previewStreamRef.current.getTracks().forEach(track => track.stop());
            previewStreamRef.current = null;
        }
    }, [mediaRecorder]);

    if (!sourceUrl && !file && !waveformData && !enableRecording) {
        return (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                {t('audioWaveformPlayer.noAudioSource')}
            </Box>
        );
    }

    return (
        <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
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
            }}
        >
            {/* Title */}
            {title && (
                <Typography variant="subtitle2" color="text.secondary">
                    {title}
                </Typography>
            )}

            {/* Waveform with progress overlay */}
            <Box sx={{ position: 'relative', borderRadius: 1, width: '100%' }}>
                {/* Show static waveform when not recording and we have data */}
                {!recording && (waveformData || file) && !audioBlob && (
                    <>
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
                    </>
                )}
                
                {/* Canvas - shown for idle animation OR recording */}
                {enableRecording && !waveformData && !file && !audioBlob && (
                    <canvas
                        ref={recordingCanvasRef}
                        width={width}
                        height={height}
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            width: `${width}px`,
                            height: `${height}px`,
                            display: 'block'
                        }}
                    />
                )}
                
                {/* Recorded audio waveform with progress overlay */}
                {audioBlob && recordedWaveformData && !recording && (
                    <>
                        <StaticWaveform
                            waveformData={recordedWaveformData}
                            width={width}
                            height={height}
                            showLoading={false}
                        />
                        
                        {/* Progress overlay for recorded audio */}
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
                    </>
                )}
            </Box>

            {/* Playback and Recording controls */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                {/* Left side: Record/Stop button OR Play/Pause button */}
                <Box sx={{ minWidth: 40, display: 'flex', justifyContent: 'center' }}>
                    {enableRecording && !audioBlob && !sourceUrl && !recording && (
                        <IconButton
                            onClick={startRecording}
                            color="primary"
                            size="small"
                            title="Start recording"
                        >
                            <RecordIcon />
                        </IconButton>
                    )}
                    
                    {recording && (
                        <IconButton
                            onClick={stopRecording}
                            color="error"
                            size="small"
                            title="Stop recording"
                        >
                            <StopIcon />
                        </IconButton>
                    )}
                    
                    {/* Playback controls - show for existing audio or recorded audio */}
                    {(sourceUrl || audioBlob) && !recording && (
                        <IconButton
                            onClick={togglePlayPause}
                            color="primary"
                            disabled={!sourceUrl && !audioBlob}
                            size="small"
                        >
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                    )}
                </Box>

                {/* Center: Progress slider OR Recording indicator */}
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    {!recording && (sourceUrl || audioBlob) && (
                        <Slider
                            value={isNaN(localProgress) || !isFinite(localProgress) ? 0 : localProgress}
                            min={0}
                            max={100}
                            onChange={handleSliderChange}
                            onChangeCommitted={handleSeek}
                            aria-label="Audio progress"
                            disabled={false}
                            track="normal"
                            size="small"
                            sx={{ width: '100%' }}
                        />
                    )}
                    
                    {recording && (
                        <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                            ● Recording...
                        </Typography>
                    )}
                    
                    {/* Empty space when not recording and no audio */}
                    {!recording && !sourceUrl && !audioBlob && (
                        <Box sx={{ width: '100%' }} />
                    )}
                </Box>

                {/* Right side: Time display */}
                <Box sx={{ minWidth: 80, textAlign: 'right' }}>
                    {showDuration && !recording && (sourceUrl || audioBlob) && (
                        <Typography variant="caption" color="text.secondary">
                            {formatTime(localTime)} / {formatTime(localDuration)}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
