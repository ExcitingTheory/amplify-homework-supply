import React, { useRef, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'next-i18next';
import { hexToRgb } from '../../../utils/hexToRgb';
import getCachedUrl from '../../../utils/getCachedUrl';
import { calculateWaveformData } from '../../../utils/calculateWaveformData';

/**
 * StaticWaveform - Displays a static amplitude waveform for an audio file
 * Shows the audio amplitude over time without needing playback
 * 
 * @param {Object} props
 * @param {Object} props.file - File object with path, identityId, and optional waveformData
 * @param {number[]} props.waveformData - Pre-calculated waveform data (overrides file calculation)
 * @param {number} props.width - Canvas width (default: 600)
 * @param {number} props.height - Canvas height (default: 100)
 * @param {string} props.backgroundColor - Background color (default: white)
 * @param {boolean} props.showLoading - Show loading indicator (default: true)
 */
export default function StaticWaveform({ 
    file, 
    waveformData: propWaveformData,
    width = 600, 
    height = 100,
    backgroundColor = 'white',
    showLoading = true
}) {
    const { t } = useTranslation('editor.shared');
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const theme = useTheme();
    const mainColor = theme.palette.primary.main;
    const rgbColor = hexToRgb(mainColor);

    useEffect(() => {
        if (!file && !propWaveformData) return;

        const drawWaveform = async () => {
            try {
                setLoading(true);
                setError(null);

                let normalizedData;
                
                // Use pre-calculated data if available
                if (propWaveformData) {
                    normalizedData = propWaveformData;
                } else if (file?.waveformData) {
                    normalizedData = JSON.parse(file.waveformData);
                } else if (file) {
                    // Calculate from audio file
                    const audioUrl = await getCachedUrl(file.path, 'protected', file.identityId);
                    const response = await fetch(audioUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    normalizedData = await calculateWaveformData(arrayBuffer, width);
                } else {
                    throw new Error('No waveform data or file provided');
                }
                
                // Draw the waveform
                const canvas = canvasRef.current;
                if (!canvas) return;
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
                
                // Draw waveform
                const middle = height / 2;
                const samples = normalizedData.length;
                const barWidth = width / samples;
                
                // Check data quality
                const minVal = Math.min(...normalizedData);
                const maxVal = Math.max(...normalizedData);
                const range = maxVal - minVal;
                
                console.warn('🔊 WAVEFORM DEBUG:', {
                    dataLength: normalizedData.length,
                    barWidth,
                    firstValues: normalizedData.slice(0, 5),
                    minValue: minVal,
                    maxValue: maxVal,
                    range,
                    width,
                    height,
                    note: range < 0.2 ? '⚠️ LOW VARIANCE (AGC/compression) - stretching for visibility' : '✅ Good variance'
                });
                
                // Re-normalize if variance is too low (typical of browser microphone recordings with AGC)
                // This stretches the visible waveform without changing the actual audio
                let displayData = normalizedData;
                if (range > 0 && range < 0.2) {
                    displayData = normalizedData.map(val => (val - minVal) / range);
                } else if (range === 0 && maxVal > 0) {
                    // All values identical (e.g. all 1.0) — show flat at half height
                    displayData = normalizedData.map(() => 0.5);
                }
                
                for (let i = 0; i < displayData.length; i++) {
                    const barHeight = displayData[i] * middle;
                    const x = i * barWidth;
                    
                    // Create gradient for visual appeal
                    const intensity = Math.floor(displayData[i] * 155) + 100;
                    ctx.fillStyle = `rgb(${intensity}, ${rgbColor.g}, ${rgbColor.b})`;
                    
                    // Draw from middle outward (symmetric)
                    ctx.fillRect(x, middle - barHeight, barWidth - 0.5, barHeight * 2);
                }
                
                setLoading(false);
                
            } catch (err) {
                console.error('Error drawing waveform:', err);
                // Don't show error for encoding issues in development/storybook
                if (err.name === 'EncodingError') {
                    // Draw a placeholder waveform
                    const canvas = canvasRef.current;
                    if (canvas) {
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(0, 0, width, height);
                        
                        // Draw simple placeholder bars
                        const middle = height / 2;
                        const bars = 50;
                        const barWidth = width / bars;
                        
                        for (let i = 0; i < bars; i++) {
                            const barHeight = Math.random() * middle * 0.7;
                            const x = i * barWidth;
                            ctx.fillStyle = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
                            ctx.fillRect(x, middle - barHeight, barWidth - 1, barHeight * 2);
                        }
                    }
                } else {
                    setError(err.message);
                }
                setLoading(false);
            }
        };

        drawWaveform();
    }, [file, propWaveformData, width, height, backgroundColor, rgbColor.r, rgbColor.g, rgbColor.b]);

    if (error) {
        return (
            <Box sx={{ 
                width, 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid #ccc',
                borderRadius: 1,
                color: 'error.main'
            }}>
                {t('staticWaveform.errorLoading')}
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', width, height }}>
            {loading && showLoading && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1
                }}>
                    <CircularProgress size={30} />
                </Box>
            )}
            <canvas 
                ref={canvasRef}
                style={{
                    display: 'block',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                }}
            />
        </Box>
    );
}
