/**
 * @fileoverview Core audio filter chain utility for RecordingStudio3
 *
 * Applies a set of named audio filters to an AudioBuffer using an
 * OfflineAudioContext. Used by both the filter panel (listen-side) and
 * pre-submission cleanup (record-side).
 *
 * Chain order: highpass (de-rumble) → highpass (pop) → RNNoise worklet
 * (noise cancel) → compressor → peaking EQ (presence) → normalize → destination
 */

export type FilterName =
  | 'derumble'
  | 'pop'
  | 'noiscancel'
  | 'compress'
  | 'presence'
  | 'normalize';

/**
 * Apply audio processing filters to a buffer via OfflineAudioContext.
 *
 * @param buffer - Source AudioBuffer to process
 * @param activeFilters - Set of filter names to apply
 * @returns Processed AudioBuffer
 */
export async function applyAudioFilters(
  buffer: AudioBuffer,
  activeFilters: Set<string>,
): Promise<AudioBuffer> {
  if (activeFilters.size === 0) return buffer;

  const { numberOfChannels, length, sampleRate } = buffer;
  const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

  // Source node
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  // Build the node chain
  let currentNode: AudioNode = source;

  // 1. De-rumble — highpass @ 80 Hz
  if (activeFilters.has('derumble')) {
    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 80;
    hp.Q.value = 0.7;
    currentNode.connect(hp);
    currentNode = hp;
  }

  // 2. Pop filter — highpass @ 120 Hz + fast compressor
  if (activeFilters.has('pop')) {
    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 120;
    hp.Q.value = 1.2;
    currentNode.connect(hp);
    currentNode = hp;

    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.value = -30;
    comp.ratio.value = 8;
    comp.attack.value = 0.003;
    comp.release.value = 0.1;
    currentNode.connect(comp);
    currentNode = comp;
  }

  // 3. Noise cancel — RNNoise via AudioWorklet
  if (activeFilters.has('noisecancel')) {
    try {
      await offlineCtx.audioWorklet.addModule('/workers/rnnoise-worklet.js');
      const rnnoiseNode = new AudioWorkletNode(offlineCtx, 'rnnoise-processor');
      currentNode.connect(rnnoiseNode);
      currentNode = rnnoiseNode;
    } catch (err) {
      // Fallback: skip RNNoise if AudioWorklet is unavailable or WASM fails to load
      console.warn('[applyAudioFilters] RNNoise unavailable, skipping noise cancel:', err);
    }
  }

  // 4. Compress — dynamics compressor
  if (activeFilters.has('compress')) {
    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.1;
    currentNode.connect(comp);
    currentNode = comp;
  }

  // 5. Presence — peaking EQ @ 3 kHz
  if (activeFilters.has('presence')) {
    const eq = offlineCtx.createBiquadFilter();
    eq.type = 'peaking';
    eq.frequency.value = 3000;
    eq.Q.value = 1.5;
    eq.gain.value = 3;
    currentNode.connect(eq);
    currentNode = eq;
  }

  // Connect final node to destination
  currentNode.connect(offlineCtx.destination);

  // Render
  source.start(0);
  const renderedBuffer = await offlineCtx.startRendering();

  // 6. Normalize to -3 dBFS peak (post-render, in-place)
  if (activeFilters.has('normalize')) {
    return normalizeBuffer(renderedBuffer, -3);
  }

  return renderedBuffer;
}

/**
 * Normalize an AudioBuffer to a target peak level in dBFS.
 * Modifies channel data in-place and returns the same buffer.
 */
function normalizeBuffer(buffer: AudioBuffer, targetDbfs: number): AudioBuffer {
  const targetAmplitude = Math.pow(10, targetDbfs / 20);

  // Find current peak across all channels
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }

  if (peak === 0) return buffer; // Silent audio — nothing to normalize

  const gain = targetAmplitude / peak;

  // Apply gain to all channels
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] *= gain;
    }
  }

  return buffer;
}
