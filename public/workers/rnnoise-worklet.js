/**
 * RNNoise AudioWorkletProcessor
 *
 * Wraps the @jitsi/rnnoise-wasm ML noise suppression model in a Web Audio
 * AudioWorkletProcessor. Handles:
 * - Frame buffering (128-sample Web Audio quantum → 480-sample RNNoise frames)
 * - Sample rate conversion (resamples to/from 48 kHz if context rate differs)
 * - WASM loading via synchronous inlined binary (rnnoise-sync.js)
 *
 * Registered as 'rnnoise-processor' for use with AudioWorkletNode.
 */

// Import the synchronous RNNoise module (WASM inlined as base64)
importScripts('./rnnoise-sync.js');

const RNNOISE_SAMPLE_RATE = 48000;
const RNNOISE_FRAME_SIZE = 480; // 10ms at 48kHz

class RNNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._initialized = false;
    this._rnnoise = null;
    this._state = null;
    this._inputBuffer = new Float32Array(RNNOISE_FRAME_SIZE);
    this._outputBuffer = new Float32Array(RNNOISE_FRAME_SIZE);
    this._inputOffset = 0;
    this._outputOffset = 0;
    this._outputReady = new Float32Array(0);
    this._resampleRatio = 1;

    this._init();
  }

  _init() {
    try {
      // rnnoise-sync.js exposes a global `createRNNoise` or similar factory
      if (typeof createRNNoise !== 'undefined') {
        const module = createRNNoise();
        this._rnnoise = module;
        this._state = module._rnnoise_create();
        this._initialized = true;
      } else if (typeof RNNoiseModule !== 'undefined') {
        // Alternative export name
        const module = RNNoiseModule();
        this._rnnoise = module;
        this._state = module._rnnoise_create();
        this._initialized = true;
      } else {
        console.warn('[rnnoise-worklet] RNNoise module not available');
      }
    } catch (err) {
      console.warn('[rnnoise-worklet] Failed to initialize RNNoise:', err);
    }
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!this._initialized || !input || !input[0]) {
      // Pass through if not initialized
      if (input && output) {
        for (let ch = 0; ch < output.length; ch++) {
          if (input[ch]) {
            output[ch].set(input[ch]);
          }
        }
      }
      return true;
    }

    // Process mono (channel 0) — RNNoise is mono only
    const inputChannel = input[0];
    const outputChannel = output[0];
    const contextSampleRate = sampleRate; // global in AudioWorkletGlobalScope

    this._resampleRatio = RNNOISE_SAMPLE_RATE / contextSampleRate;

    // Resample input to 48kHz if needed, buffer, process, resample back
    const resampled = this._resampleTo48k(inputChannel);

    // Feed resampled samples into the frame buffer
    const processed = this._processFrames(resampled);

    // Resample processed output back to context sample rate
    const outputSamples = this._resampleFromf48k(processed, inputChannel.length);

    // Write to output
    if (outputSamples.length >= outputChannel.length) {
      outputChannel.set(outputSamples.subarray(0, outputChannel.length));
    } else {
      outputChannel.set(outputSamples);
    }

    // Copy mono result to other channels
    for (let ch = 1; ch < output.length; ch++) {
      output[ch].set(outputChannel);
    }

    return true;
  }

  _processFrames(samples) {
    const results = [];

    for (let i = 0; i < samples.length; i++) {
      this._inputBuffer[this._inputOffset++] = samples[i] * 32768; // RNNoise expects int16 range

      if (this._inputOffset >= RNNOISE_FRAME_SIZE) {
        // Process one frame
        const inputPtr = this._rnnoise._malloc(RNNOISE_FRAME_SIZE * 4);
        const outputPtr = this._rnnoise._malloc(RNNOISE_FRAME_SIZE * 4);

        this._rnnoise.HEAPF32.set(this._inputBuffer, inputPtr >> 2);
        this._rnnoise._rnnoise_process_frame(this._state, outputPtr, inputPtr);

        const outputFrame = new Float32Array(
          this._rnnoise.HEAPF32.buffer,
          outputPtr,
          RNNOISE_FRAME_SIZE
        );

        for (let j = 0; j < RNNOISE_FRAME_SIZE; j++) {
          results.push(outputFrame[j] / 32768); // Convert back to float [-1, 1]
        }

        this._rnnoise._free(inputPtr);
        this._rnnoise._free(outputPtr);
        this._inputOffset = 0;
      }
    }

    return new Float32Array(results);
  }

  /**
   * Simple linear interpolation resampling to 48kHz.
   */
  _resampleTo48k(input) {
    if (this._resampleRatio === 1) return input;

    const outputLength = Math.round(input.length * this._resampleRatio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIdx = i / this._resampleRatio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;

      if (idx + 1 < input.length) {
        output[i] = input[idx] * (1 - frac) + input[idx + 1] * frac;
      } else {
        output[i] = input[Math.min(idx, input.length - 1)];
      }
    }

    return output;
  }

  /**
   * Resample from 48kHz back to context sample rate.
   */
  _resampleFromf48k(input, targetLength) {
    if (this._resampleRatio === 1) return input;

    const output = new Float32Array(targetLength);
    const ratio = input.length / targetLength;

    for (let i = 0; i < targetLength; i++) {
      const srcIdx = i * ratio;
      const idx = Math.floor(srcIdx);
      const frac = srcIdx - idx;

      if (idx + 1 < input.length) {
        output[i] = input[idx] * (1 - frac) + input[idx + 1] * frac;
      } else {
        output[i] = input[Math.min(idx, input.length - 1)];
      }
    }

    return output;
  }
}

registerProcessor('rnnoise-processor', RNNoiseProcessor);
