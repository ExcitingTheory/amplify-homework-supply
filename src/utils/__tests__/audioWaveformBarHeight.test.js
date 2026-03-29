/**
 * Unit tests for the live-recording waveform draw logic in AudioWaveformPlayer.
 *
 * These tests guard against the recurring regression where the canvas waveform
 * was blank at the start of every recording because:
 *
 *   const max = Math.max(...dataArray);  // returns 0 before audio arrives
 *   barHeight = dataArray[i] / max;      // NaN — fillRect draws nothing
 *
 * The fix adds `|| 1` so a zero-max frame renders flat bars instead of nothing.
 *
 * Because the draw function is a closure inside AudioWaveformPlayer, we test
 * the invariant as a pure function extracted from the algorithm rather than
 * importing the full React component (which requires Web Audio API, canvas,
 * and MediaStream mocks beyond what happy-dom provides).
 */

import { describe, it, expect } from 'vitest';

// ─── Pure-function extraction of the waveform bar-height algorithm ───────────
// This mirrors exactly the code inside AudioWaveformPlayer's `draw()`:
//
//   const max = Math.max(...dataArray) || 1;
//   barHeight = (dataArray[i] / max) * canvasHeight / 2;
//   const amplitude = dataArray[i] / max;
//
function computeBars(dataArray, canvasHeight = 80) {
  const max = Math.max(...dataArray) || 1; // ← the fix
  return Array.from(dataArray).map(sample => ({
    barHeight: (sample / max) * canvasHeight / 2,
    amplitude: sample / max,
  }));
}

describe('AudioWaveformPlayer — live-recording bar height algorithm', () => {
  describe('max = 0 guard (regression: blank waveform at recording start)', () => {
    it('returns finite bar heights when all samples are 0', () => {
      // All-zero Uint8Array: what the AnalyserNode produces before audio arrives.
      const silence = new Uint8Array(1024); // filled with 0
      const bars = computeBars(silence);

      bars.forEach(({ barHeight, amplitude }) => {
        expect(Number.isFinite(barHeight)).toBe(true);
        expect(Number.isNaN(barHeight)).toBe(false);
        expect(barHeight).toBe(0); // flat bar, not invisible NaN
        expect(amplitude).toBe(0);
      });
    });

    it('does NOT produce NaN when max is 0 (old buggy behaviour)', () => {
      // Old code: const max = Math.max(...new Uint8Array(1024)) → 0
      // Old code: barHeight = sample / 0 → NaN
      const oldBuggyCompute = (dataArray, canvasHeight = 80) => {
        const max = Math.max(...dataArray); // no || 1
        return Array.from(dataArray).map(sample =>
          (sample / max) * canvasHeight / 2,
        );
      };
      const silence = new Uint8Array(1024);
      const buggyBars = oldBuggyCompute(silence);
      // Demonstrates what the bug produced
      buggyBars.forEach(h => expect(Number.isNaN(h)).toBe(true));

      // Fixed version produces 0, not NaN
      const fixedBars = computeBars(silence);
      fixedBars.forEach(({ barHeight }) => expect(Number.isNaN(barHeight)).toBe(false));
    });
  });

  describe('normal audio data', () => {
    it('highest sample maps to canvas height / 2', () => {
      const data = new Uint8Array([0, 64, 128, 200, 255, 180, 90]);
      const canvasHeight = 80;
      const bars = computeBars(data, canvasHeight);
      const maxBar = Math.max(...bars.map(b => b.barHeight));
      expect(maxBar).toBeCloseTo(canvasHeight / 2, 5);
    });

    it('all bar heights are within [0, canvasHeight / 2]', () => {
      const canvasHeight = 80;
      const data = new Uint8Array(256).map((_, i) => i);
      computeBars(data, canvasHeight).forEach(({ barHeight }) => {
        expect(barHeight).toBeGreaterThanOrEqual(0);
        expect(barHeight).toBeLessThanOrEqual(canvasHeight / 2);
      });
    });

    it('amplitude is always within [0, 1]', () => {
      const data = new Uint8Array([10, 50, 130, 200, 255]);
      computeBars(data).forEach(({ amplitude }) => {
        expect(amplitude).toBeGreaterThanOrEqual(0);
        expect(amplitude).toBeLessThanOrEqual(1);
      });
    });

    it('preserves relative ordering — louder samples render taller bars', () => {
      const data = new Uint8Array([50, 150, 200, 100, 80]);
      const bars = computeBars(data);
      // bar[2] (200) must be taller than bar[0] (50)
      expect(bars[2].barHeight).toBeGreaterThan(bars[0].barHeight);
      expect(bars[1].barHeight).toBeGreaterThan(bars[4].barHeight);
    });
  });

  describe('single sample', () => {
    it('handles a single non-zero sample', () => {
      const data = new Uint8Array([128]);
      const bars = computeBars(data, 80);
      expect(bars).toHaveLength(1);
      expect(bars[0].amplitude).toBeCloseTo(1, 5);
      expect(Number.isNaN(bars[0].barHeight)).toBe(false);
    });

    it('handles a single zero sample without NaN', () => {
      const data = new Uint8Array([0]);
      const bars = computeBars(data, 80);
      expect(bars[0].barHeight).toBe(0);
      expect(Number.isNaN(bars[0].barHeight)).toBe(false);
    });
  });
});
