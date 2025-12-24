/**
 * Calculate waveform amplitude data from an audio blob or buffer
 * Returns normalized amplitude data that can be stored in the database
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
        
        // Downsample the data
        for (let i = 0; i < samples; i++) {
            const blockStart = blockSize * i;
            let sum = 0;
            
            // Get the average amplitude for this block
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[blockStart + j]);
            }
            
            filteredData.push(sum / blockSize);
        }
        
        // Normalize the data to 0-1 range
        const maxAmplitude = Math.max(...filteredData);
        const normalizedData = filteredData.map(n => n / maxAmplitude);
        
        // Clean up
        audioContext.close();
        
        return normalizedData;
        
    } catch (error) {
        console.error('Error calculating waveform data:', error);
        throw error;
    }
}
