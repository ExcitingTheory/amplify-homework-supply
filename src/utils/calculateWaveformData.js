/**
 * Calculate waveform amplitude data from an audio blob or buffer.
 * Returns normalized amplitude data that can be stored in the database.
 * 
 * DO NOT MODIFY the algorithm or normalization without testing visual output
 * across different audio sources (recordings, uploaded files, silence).
 *
 * ALGORITHM:
 *   1. Decode audio via AudioContext.decodeAudioData (first channel only).
 *   2. Divide PCM samples into `samples` equal blocks.
 *   3. For each block compute RMS amplitude: sqrt(mean(sample²)).
 *   4. Apply min-max normalization → output in [0, 1].
 *
 * RMS amplitude reflects perceived loudness. Min-max normalization stretches
 * the data to fill the full 0-1 range, producing visible waveform variation
 * even for AGC-compressed microphone recordings where absolute amplitude
 * is nearly constant across blocks.
 *
 * @param {Blob|ArrayBuffer} audioSource - Audio blob or array buffer
 * @param {number} samples - Number of data points to generate (default: 600)
 * @returns {Promise<number[]>} Array of normalized amplitude values (0-1)
 */
export async function calculateWaveformData(audioSource, samples = 600) {
    try {
        // Convert blob to array buffer if needed
        let arrayBuffer;
        if (audioSource instanceof Blob) {
            arrayBuffer = await audioSource.arrayBuffer();
        } else {
            arrayBuffer = audioSource;
        }
        
        // Create audio context and decode
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the raw audio data (use first channel if stereo)
        const rawData = audioBuffer.getChannelData(0);
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];
        
        // Downsample using RMS amplitude per block
        // RMS produces visible variation even when AGC keeps peak levels flat
        for (let i = 0; i < samples; i++) {
            const blockStart = blockSize * i;
            let sumSq = 0;
            
            for (let j = 0; j < blockSize; j++) {
                const val = rawData[blockStart + j];
                sumSq += val * val;
            }
            
            filteredData.push(Math.sqrt(sumSq / blockSize));
        }
        
        // Min-max normalization to 0-1 range
        // This stretches the data to fill the full visual range, so even
        // AGC-compressed recordings with narrow absolute amplitude show
        // meaningful waveform shape
        const minAmplitude = Math.min(...filteredData);
        const maxAmplitude = Math.max(...filteredData);
        const range = maxAmplitude - minAmplitude;
        
        let normalizedData;
        if (range > 0) {
            normalizedData = filteredData.map(n => (n - minAmplitude) / range);
        } else if (maxAmplitude > 0) {
            // All values identical but non-zero — show flat at 0.5
            normalizedData = filteredData.map(() => 0.5);
        } else {
            // All silence
            normalizedData = filteredData;
        }
        
        // Clean up
        audioContext.close();
        
        return normalizedData;
        
    } catch (error) {
        console.error('Error calculating waveform data:', error);
        throw error;
    }
}

/**
 * Same as calculateWaveformData but also returns the AudioBuffer duration.
 * Useful when the source (e.g. MediaRecorder WebM) lacks reliable duration metadata.
 *
 * @param {Blob|ArrayBuffer} audioSource - Audio blob or array buffer
 * @param {number} samples - Number of data points to generate (default: 600)
 * @returns {Promise<{ waveformData: number[], duration: number }>}
 */
export async function calculateWaveformDataWithDuration(audioSource, samples = 600) {
    let arrayBuffer;
    if (audioSource instanceof Blob) {
        arrayBuffer = await audioSource.arrayBuffer();
    } else {
        arrayBuffer = audioSource;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;

    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];

    for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let sumSq = 0;
        for (let j = 0; j < blockSize; j++) {
            const val = rawData[blockStart + j];
            sumSq += val * val;
        }
        filteredData.push(Math.sqrt(sumSq / blockSize));
    }

    const minAmplitude = Math.min(...filteredData);
    const maxAmplitude = Math.max(...filteredData);
    const range = maxAmplitude - minAmplitude;

    let normalizedData;
    if (range > 0) {
        normalizedData = filteredData.map(n => (n - minAmplitude) / range);
    } else if (maxAmplitude > 0) {
        normalizedData = filteredData.map(() => 0.5);
    } else {
        normalizedData = filteredData;
    }

    audioContext.close();

    return { waveformData: normalizedData, duration };
}
