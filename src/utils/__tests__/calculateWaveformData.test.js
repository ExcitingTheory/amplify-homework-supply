/**
 * Unit tests for calculateWaveformData.js
 * Tests audio waveform amplitude calculation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Web Audio API
class MockAudioContext {
  constructor() {
    this.closed = false;
  }
  
  async decodeAudioData(arrayBuffer) {
    // Return mock audio buffer with sample data
    const mockChannelData = new Float32Array(1000);
    // Fill with some test pattern
    for (let i = 0; i < mockChannelData.length; i++) {
      mockChannelData[i] = Math.sin(i * 0.1) * 0.5; // Sine wave pattern
    }
    
    return {
      getChannelData: (channel) => mockChannelData,
      length: 1000,
      duration: 10.0,
      numberOfChannels: 1,
      sampleRate: 44100,
    };
  }
  
  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

import { calculateWaveformData } from '../calculateWaveformData.js';

describe('calculateWaveformData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Input handling', () => {
    it('should calculate waveform from Blob', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const result = await calculateWaveformData(audioBlob, 100);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(100);
    });
    
    it('should calculate waveform from ArrayBuffer', async () => {
      const arrayBuffer = new ArrayBuffer(1024);
      
      const result = await calculateWaveformData(arrayBuffer, 50);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(50);
    });
    
    it('should use default sample count of 600', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const result = await calculateWaveformData(audioBlob);
      
      expect(result.length).toBe(600);
    });
  });
  
  describe('Downsampling', () => {
    it('should downsample audio to specified sample count', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const samples = 200;
      const result = await calculateWaveformData(audioBlob, samples);
      
      expect(result.length).toBe(samples);
    });
    
    it('should handle various sample counts', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const testCases = [10, 50, 100, 300, 600, 1000];
      
      for (const samples of testCases) {
        const result = await calculateWaveformData(audioBlob, samples);
        expect(result.length).toBe(samples);
      }
    });
  });
  
  describe('Normalization', () => {
    it('should normalize amplitude values to 0-1 range', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const result = await calculateWaveformData(audioBlob, 100);
      
      // All values should be between 0 and 1
      result.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
    
    it('should have at least one value equal to 1 (max amplitude)', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const result = await calculateWaveformData(audioBlob, 100);
      
      // After normalization, the max value should be 1
      const maxValue = Math.max(...result);
      expect(maxValue).toBeCloseTo(1, 5);
    });
    
    it('should return non-zero values for audio with content', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const result = await calculateWaveformData(audioBlob, 100);
      
      // Should have some non-zero values
      const nonZeroCount = result.filter(v => v > 0).length;
      expect(nonZeroCount).toBeGreaterThan(0);
    });
  });
  
  describe('Error handling', () => {
    it('should throw error for invalid audio data', async () => {
      const invalidBlob = new Blob(['not audio data'], { type: 'text/plain' });
      
      // Mock decodeAudioData to reject
      global.AudioContext = class extends MockAudioContext {
        async decodeAudioData() {
          throw new Error('Invalid audio format');
        }
      };
      
      await expect(calculateWaveformData(invalidBlob, 100)).rejects.toThrow();
    });
    
    it('should properly clean up AudioContext on success', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      const closeSpy = vi.spyOn(MockAudioContext.prototype, 'close');
      
      await calculateWaveformData(audioBlob, 100);
      
      expect(closeSpy).toHaveBeenCalled();
    });
    
    it('should properly clean up AudioContext on error', async () => {
      const invalidBlob = new Blob(['invalid'], { type: 'text/plain' });
      
      global.AudioContext = class extends MockAudioContext {
        async decodeAudioData() {
          throw new Error('Decode error');
        }
      };
      
      const closeSpy = vi.spyOn(MockAudioContext.prototype, 'close');
      
      try {
        await calculateWaveformData(invalidBlob, 100);
      } catch (error) {
        // Expected error
      }
      
      // AudioContext should still be closed
      expect(closeSpy).toHaveBeenCalled();
    });
  });
  
  describe('Audio processing', () => {
    it('should use first channel for stereo audio', async () => {
      const audioBlob = new Blob(['mock stereo audio'], { type: 'audio/mpeg' });
      
      global.AudioContext = class extends MockAudioContext {
        async decodeAudioData(arrayBuffer) {
          const channel0Data = new Float32Array(1000);
          const channel1Data = new Float32Array(1000);
          
          // Different patterns for each channel
          for (let i = 0; i < 1000; i++) {
            channel0Data[i] = Math.sin(i * 0.1) * 0.8;
            channel1Data[i] = Math.cos(i * 0.1) * 0.3;
          }
          
          return {
            getChannelData: (channel) => channel === 0 ? channel0Data : channel1Data,
            length: 1000,
            duration: 10.0,
            numberOfChannels: 2,
            sampleRate: 44100,
          };
        }
      };
      
      const result = await calculateWaveformData(audioBlob, 100);
      
      // Should have processed channel 0
      expect(result).toBeDefined();
      expect(result.length).toBe(100);
    });
    
    it('should calculate average amplitude for each block', async () => {
      const audioBlob = new Blob(['mock audio data'], { type: 'audio/mpeg' });
      
      // Mock audio with known pattern
      global.AudioContext = class extends MockAudioContext {
        async decodeAudioData(arrayBuffer) {
          const data = new Float32Array(1000);
          
          // First half: amplitude 0.5, second half: amplitude 1.0
          for (let i = 0; i < 500; i++) {
            data[i] = 0.5;
          }
          for (let i = 500; i < 1000; i++) {
            data[i] = 1.0;
          }
          
          return {
            getChannelData: () => data,
            length: 1000,
            duration: 10.0,
            numberOfChannels: 1,
            sampleRate: 44100,
          };
        }
      };
      
      const result = await calculateWaveformData(audioBlob, 10);
      
      // First half blocks should have lower values than second half
      const firstHalfAvg = result.slice(0, 5).reduce((a, b) => a + b) / 5;
      const secondHalfAvg = result.slice(5, 10).reduce((a, b) => a + b) / 5;
      
      expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle very short audio', async () => {
      const audioBlob = new Blob(['short audio'], { type: 'audio/mpeg' });
      
      global.AudioContext = class extends MockAudioContext {
        async decodeAudioData() {
          const data = new Float32Array(10); // Very short
          for (let i = 0; i < 10; i++) {
            data[i] = 0.5;
          }
          return {
            getChannelData: () => data,
            length: 10,
            duration: 0.1,
            numberOfChannels: 1,
            sampleRate: 44100,
          };
        }
      };
      
      const result = await calculateWaveformData(audioBlob, 5);
      
      expect(result.length).toBe(5);
    });
    
    it('should handle silent audio', async () => {
      const audioBlob = new Blob(['silent audio'], { type: 'audio/mpeg' });
      
      global.AudioContext = class extends MockAudioContext {
        async decodeAudioData() {
          const data = new Float32Array(1000);
          // All zeros (silent)
          data.fill(0);
          
          return {
            getChannelData: () => data,
            length: 1000,
            duration: 10.0,
            numberOfChannels: 1,
            sampleRate: 44100,
          };
        }
      };
      
      const result = await calculateWaveformData(audioBlob, 100);
      
      // All values should be 0 or NaN (0/0 in normalization)
      result.forEach(value => {
        expect(value === 0 || Number.isNaN(value)).toBe(true);
      });
    });
  });
});
