/**
 * Audio level monitoring utility for detecting microphone input levels.
 *
 * Provides RMS and peak level calculation from an AnalyserNode,
 * with configurable thresholds for "too low" detection.
 *
 * Usage:
 *   const monitor = createAudioLevelMonitor(analyserNode, { onLevel });
 *   monitor.start();
 *   // later...
 *   monitor.stop();
 */

/**
 * @typedef {Object} AudioLevelData
 * @property {number} rms - Root mean square level (0–1, where 1 = max amplitude)
 * @property {number} peak - Peak sample value (0–1)
 * @property {number} db - RMS level in decibels (approx –100 to 0)
 * @property {boolean} tooLow - True when the level is below the configured threshold
 * @property {boolean} silent - True when effectively no signal is detected
 */

/**
 * @typedef {Object} AudioLevelMonitorOptions
 * @property {number} [lowThresholdDb=-50] - dB level below which audio is "too low"
 * @property {number} [silenceThresholdDb=-70] - dB level below which audio is "silent"
 * @property {number} [intervalMs=100] - How often to sample levels (ms)
 * @property {(data: AudioLevelData) => void} onLevel - Callback fired each interval
 */

/**
 * Create an audio level monitor attached to an existing AnalyserNode.
 *
 * @param {AnalyserNode} analyser - Web Audio AnalyserNode already connected to a source.
 * @param {AudioLevelMonitorOptions} options
 * @returns {{ start: () => void, stop: () => void, getLevel: () => AudioLevelData }}
 */
export function createAudioLevelMonitor(analyser, options = {}) {
  const {
    lowThresholdDb = -50,
    silenceThresholdDb = -70,
    intervalMs = 100,
    onLevel,
  } = options;

  let rafId = null;
  let lastSample = 0;
  let running = false;

  // Use time-domain data for accurate RMS calculation
  const bufferLength = analyser.fftSize;
  const dataArray = new Float32Array(bufferLength);

  /** Calculate current level from the analyser */
  function sampleLevel() {
    analyser.getFloatTimeDomainData(dataArray);

    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < bufferLength; i++) {
      const sample = dataArray[i];
      sumSquares += sample * sample;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
    }

    const rms = Math.sqrt(sumSquares / bufferLength);
    // Convert to dB (avoid log(0))
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;

    return {
      rms,
      peak,
      db,
      tooLow: db < lowThresholdDb,
      silent: db < silenceThresholdDb,
    };
  }

  /** Animation-frame loop throttled to intervalMs */
  function tick(timestamp) {
    if (!running) return;

    if (timestamp - lastSample >= intervalMs) {
      lastSample = timestamp;
      const level = sampleLevel();
      if (onLevel) onLevel(level);
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    lastSample = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return { start, stop, getLevel: sampleLevel };
}

/**
 * Convert a linear RMS value (0–1) to a 0–100 percentage suitable for a meter.
 * Uses a logarithmic scale so quiet signals are still visible.
 *
 * @param {number} rms - Linear RMS (0–1)
 * @param {number} [floor=-60] - dB value that maps to 0%
 * @returns {number} 0–100
 */
export function rmsToPercent(rms, floor = -60) {
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  if (db <= floor) return 0;
  // Linear mapping from floor..0 dB → 0..100 %
  return Math.min(100, ((db - floor) / -floor) * 100);
}
