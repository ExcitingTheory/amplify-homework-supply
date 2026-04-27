/**
 * Unit tests for OfflineChatEngine — heuristic grading and prompt building.
 *
 * Tests the pure exported functions (gradeAnswerHeuristic, buildOfflineSystemPrompt)
 * without requiring any AI backend.
 */

import { describe, it, expect } from 'vitest';
import {
  gradeAnswerHeuristic,
  buildOfflineSystemPrompt,
} from '../../src/offline/OfflineChatEngine';

describe('OfflineChatEngine', () => {
  describe('gradeAnswerHeuristic', () => {
    it('returns 0 for empty student answer', () => {
      const result = gradeAnswerHeuristic('photosynthesis is the process of converting light to energy', '');
      expect(result.score).toBe(0);
      expect(result.accurate).toBe(false);
      expect(result.feedback).toContain('provide an answer');
      expect(result.gradedOffline).toBe(true);
    });

    it('returns 100 for exact match', () => {
      const result = gradeAnswerHeuristic('photosynthesis', 'photosynthesis');
      expect(result.score).toBe(100);
      expect(result.accurate).toBe(true);
      expect(result.gradedOffline).toBe(true);
    });

    it('returns 100 for exact match (case-insensitive)', () => {
      const result = gradeAnswerHeuristic('Photosynthesis', 'photosynthesis');
      expect(result.score).toBe(100);
      expect(result.accurate).toBe(true);
    });

    it('gives high score for answer with most keywords present', () => {
      const expected = 'photosynthesis converts light energy into chemical energy in plants';
      const student = 'photosynthesis is how plants convert light into chemical energy';
      const result = gradeAnswerHeuristic(expected, student);
      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it('gives low score for answer with few matching keywords', () => {
      const expected = 'photosynthesis converts light energy into chemical energy in plants';
      const student = 'I like dogs and cats';
      const result = gradeAnswerHeuristic(expected, student);
      expect(result.score).toBeLessThan(50);
      expect(result.accurate).toBe(false);
    });

    it('suggests missing keywords in feedback for inaccurate answers', () => {
      const expected = 'mitochondria are the powerhouse of the cell producing ATP';
      const student = 'cells have parts';
      const result = gradeAnswerHeuristic(expected, student);
      expect(result.accurate).toBe(false);
      // Feedback should mention missing key ideas
      expect(result.feedback.toLowerCase()).toMatch(/key ideas|complete|review/);
    });

    it('handles punctuation gracefully', () => {
      const result = gradeAnswerHeuristic("it's a process!", "its a process");
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('buildOfflineSystemPrompt', () => {
    it('includes the unit name', () => {
      const prompt = buildOfflineSystemPrompt({
        unitName: 'Biology 101',
        vocabulary: [],
        questions: [],
      });
      expect(prompt).toContain('Biology 101');
    });

    it('includes vocabulary (up to 15 items)', () => {
      const vocab = Array.from({ length: 20 }, (_, i) => ({
        phrase: `word${i}`,
        definition: `def${i}`,
      }));
      const prompt = buildOfflineSystemPrompt({
        unitName: 'Test',
        vocabulary: vocab,
        questions: [],
      });
      // Should contain first 15 but not all 20
      expect(prompt).toContain('word0');
      expect(prompt).toContain('word14');
      expect(prompt).not.toContain('word15');
    });

    it('includes student accuracy when provided', () => {
      const prompt = buildOfflineSystemPrompt({
        unitName: 'Test',
        vocabulary: [],
        questions: [],
        gradeAccuracy: 72,
      });
      expect(prompt).toContain('72%');
    });

    it('truncates student memory to 500 chars', () => {
      const longMemory = 'A'.repeat(1000);
      const prompt = buildOfflineSystemPrompt({
        unitName: 'Test',
        vocabulary: [],
        questions: [],
        studentMemory: longMemory,
      });
      // The prompt should contain at most 500 chars of memory
      const memoryMatch = prompt.match(/Student notes: (A+)/);
      expect(memoryMatch).toBeTruthy();
      expect(memoryMatch![1].length).toBe(500);
    });

    it('includes Socratic tutoring guidelines', () => {
      const prompt = buildOfflineSystemPrompt({
        unitName: 'Test',
        vocabulary: [],
        questions: [],
      });
      expect(prompt.toLowerCase()).toContain('socratic');
      expect(prompt).toContain('150 words');
    });

    it('includes unit description when provided', () => {
      const prompt = buildOfflineSystemPrompt({
        unitName: 'Physics',
        unitDescription: 'Newton\'s laws of motion',
        vocabulary: [],
        questions: [],
      });
      expect(prompt).toContain("Newton's laws of motion");
    });
  });
});
