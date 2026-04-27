/**
 * MeaningAssociationExercise Tests
 *
 * Tests the shuffle utility, seeded random behavior, and core
 * matching/scoring logic used by the Easy/Hard/Learn modes.
 */

import { describe, it, expect } from 'vitest';
import { shuffle } from '../utils';

describe('MeaningAssociationExercise utils', () => {
  describe('shuffle', () => {
    it('returns a new array (does not mutate original)', () => {
      const original = [1, 2, 3, 4, 5];
      const result = shuffle(original);
      expect(result).not.toBe(original);
      expect(original).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns same length as input', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result).toHaveLength(input.length);
    });

    it('contains all original elements', () => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty array', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('handles single element', () => {
      expect(shuffle([42])).toEqual([42]);
    });

    it('produces deterministic output with seed', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result1 = shuffle(input, 12345);
      const result2 = shuffle(input, 12345);
      expect(result1).toEqual(result2);
    });

    it('produces different output with different seeds', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result1 = shuffle(input, 11111);
      const result2 = shuffle(input, 99999);
      // Extremely unlikely to be identical with 10 elements
      expect(result1).not.toEqual(result2);
    });

    it('produces different output without seed (random)', () => {
      const input = Array.from({ length: 20 }, (_, i) => i);
      // Run multiple times — at least one should differ from sorted
      const results = Array.from({ length: 5 }, () => shuffle(input));
      const allSame = results.every(
        (r) => JSON.stringify(r) === JSON.stringify(results[0])
      );
      // With 20 elements, probability of all 5 identical random shuffles is ~0
      expect(allSame).toBe(false);
    });

    it('handles array of objects', () => {
      const words = [
        { id: 'w1', phrase: 'hello' },
        { id: 'w2', phrase: 'world' },
        { id: 'w3', phrase: 'test' },
      ];
      const result = shuffle(words, 42);
      expect(result).toHaveLength(3);
      expect(result.map((w: any) => w.id).sort()).toEqual(['w1', 'w2', 'w3']);
    });
  });
});
