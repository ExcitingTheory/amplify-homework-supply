/**
 * Unit tests for computeDisplayWaveform.js
 *
 * These tests guard against the recurring regression where microphone recordings
 * with AGC compression (low dynamic range) were displayed at max amplitude because
 * the scaling branch was a no-op (`val / 1.0`).
 */

import { describe, it, expect } from 'vitest';
import { computeDisplayWaveform } from '../computeDisplayWaveform.js';

// Helpers
const uniformData = (value, length = 100) => Array(length).fill(value);
const range = (data) => Math.max(...data) - Math.min(...data);
const mean = (data) => data.reduce((a, b) => a + b, 0) / data.length;

describe('computeDisplayWaveform', () => {
  describe('edge cases', () => {
    it('returns an empty array for empty input', () => {
      expect(computeDisplayWaveform([])).toEqual([]);
    });

    it('returns an empty array for null/undefined input', () => {
      expect(computeDisplayWaveform(null)).toEqual([]);
      expect(computeDisplayWaveform(undefined)).toEqual([]);
    });

    it('returns a copy of all-zero data unchanged', () => {
      const zeros = uniformData(0, 50);
      const result = computeDisplayWaveform(zeros);
      expect(result).toEqual(zeros);
      // Must be a copy, not the same reference
      expect(result).not.toBe(zeros);
    });
  });

  // ─── High dynamic range ───────────────────────────────────────────────────
  describe('high dynamic range (range > 0.15) — stretches to full 0–1', () => {
    it('min value maps to 0 and max value maps to 1', () => {
      const data = [0.1, 0.3, 0.7, 0.9, 0.5]; // range = 0.8
      const result = computeDisplayWaveform(data);
      expect(Math.min(...result)).toBeCloseTo(0, 5);
      expect(Math.max(...result)).toBeCloseTo(1, 5);
    });

    it('preserves relative ordering of samples', () => {
      const data = [0.1, 0.5, 0.3, 0.8, 0.2];
      const result = computeDisplayWaveform(data);
      // If input[i] > input[j], output[i] must be > output[j]
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data.length; j++) {
          if (data[i] > data[j]) expect(result[i]).toBeGreaterThan(result[j]);
          if (data[i] < data[j]) expect(result[i]).toBeLessThan(result[j]);
        }
      }
    });

    it('all output values stay within [0, 1]', () => {
      const data = Array.from({ length: 100 }, (_, i) => i / 99);
      computeDisplayWaveform(data).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });
  });

  // ─── Low dynamic range ───────────────────────────────────────────────────
  describe('low dynamic range (range ≤ 0.15) — AGC-compressed microphone', () => {
    it('does NOT return a no-op (val / 1.0) — bars must not all be near 1.0', () => {
      // calculateWaveformData normalises to max=1.0. A compressed mic produces
      // values like 0.90–1.00 (range ≈ 0.10). The old buggy code returned
      // them unchanged, making every bar appear maxed-out.
      const compressedData = Array.from({ length: 100 }, () => 0.90 + Math.random() * 0.10);
      const result = computeDisplayWaveform(compressedData);
      // Mean bar height should be comfortably below the canvas midpoint (< 0.6)
      expect(mean(result)).toBeLessThan(0.6);
    });

    it('targets mean bar height ≈ 40 % of canvas height', () => {
      // Flat signal at max amplitude (worst case for the old no-op bug)
      const flatMax = uniformData(1.0, 200);
      const result = computeDisplayWaveform(flatMax);
      // Allow ±5 % tolerance around the 0.40 target
      expect(mean(result)).toBeGreaterThanOrEqual(0.35);
      expect(mean(result)).toBeLessThanOrEqual(0.45);
    });

    it('scales uniformly compressed data to less than half height', () => {
      // Simulate a typical AGC mic: values clustered at 0.92–0.98
      const data = Array.from({ length: 100 }, (_, i) => 0.92 + (i % 7) * 0.01);
      const result = computeDisplayWaveform(data);
      expect(mean(result)).toBeLessThan(0.5);
    });

    it('all output values remain within [0, 1]', () => {
      const compressedData = uniformData(0.95, 100);
      computeDisplayWaveform(compressedData).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });

    it('does not crash when all values are identical (mean === max)', () => {
      const uniform = uniformData(0.5, 50);
      expect(() => computeDisplayWaveform(uniform)).not.toThrow();
    });
  });

  // ─── Boundary between modes ───────────────────────────────────────────────
  describe('range boundary (0.15 threshold)', () => {
    it('uses stretch mode when range is just above 0.15', () => {
      const data = [0.3, 0.46]; // range = 0.16
      const result = computeDisplayWaveform(data);
      expect(Math.min(...result)).toBeCloseTo(0, 5);
      expect(Math.max(...result)).toBeCloseTo(1, 5);
    });

    it('uses scale mode when range is just at 0.15 (boundary is exclusive)', () => {
      // range = 0.15 exactly → low dynamic range branch
      const data = Array.from({ length: 50 }, (_, i) =>
        0.85 + (i / 49) * 0.15,
      );
      const result = computeDisplayWaveform(data);
      // In scale mode, max should NOT reach 1.0
      expect(mean(result)).toBeLessThan(0.6);
    });
  });
});
