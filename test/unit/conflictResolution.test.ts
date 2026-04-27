/**
 * Unit tests for conflictResolution — grade merge and version conflict handling.
 *
 * These are pure functions (resolveGradeConflict) so no mocking needed.
 */

import { describe, it, expect } from 'vitest';
import { resolveGradeConflict } from '../../src/offline/conflictResolution';

describe('conflictResolution', () => {
  describe('resolveGradeConflict', () => {
    it('preserves student answers from local data', () => {
      const local = {
        'block-1': { userAnswer: 'local answer', complete: true, accuracy: 90 },
      };
      const server = {
        'block-1': { userAnswer: 'server answer', complete: false, accuracy: 80, instructorNote: 'good' },
      };

      const result = resolveGradeConflict(local, server);
      expect(result.resolved).toBe(true);
      expect(result.strategy).toBe('local-wins');
      expect(result.mergedData!['block-1'].userAnswer).toBe('local answer');
      expect(result.mergedData!['block-1'].complete).toBe(true);
      // Server-only fields preserved
      expect(result.mergedData!['block-1'].instructorNote).toBe('good');
    });

    it('keeps local-only blocks', () => {
      const local = {
        'block-1': { userAnswer: 'answer', complete: true, accuracy: 85 },
        'block-new': { userAnswer: 'new block', complete: true, accuracy: 100 },
      };
      const server = {
        'block-1': { userAnswer: 'old', complete: false, accuracy: 70 },
      };

      const result = resolveGradeConflict(local, server);
      expect(result.mergedData!['block-new']).toBeDefined();
      expect(result.mergedData!['block-new'].gradedOffline).toBe(true);
    });

    it('flags for instructor review when offline score differs by >15 points', () => {
      const local = {
        'block-1': { userAnswer: 'my answer', complete: true, accuracy: 95, gradedOffline: true },
      };
      const server = {
        'block-1': { userAnswer: 'old', complete: false, accuracy: 70 },
      };

      const result = resolveGradeConflict(local, server);
      expect(result.requiresInstructorReview).toBe(true);
      expect(result.mergedData!['block-1'].serverScore).toBe(70);
      expect(result.mergedData!['block-1'].offlineScore).toBe(95);
    });

    it('does NOT flag for review when score difference is <=15 points', () => {
      const local = {
        'block-1': { userAnswer: 'my answer', complete: true, accuracy: 80, gradedOffline: true },
      };
      const server = {
        'block-1': { userAnswer: 'old', complete: false, accuracy: 75 },
      };

      const result = resolveGradeConflict(local, server);
      expect(result.requiresInstructorReview).toBe(false);
    });

    it('handles empty server data', () => {
      const local = {
        'block-1': { userAnswer: 'answer', complete: true, accuracy: 100 },
      };
      const server = {};

      const result = resolveGradeConflict(local, server);
      expect(result.resolved).toBe(true);
      expect(result.mergedData!['block-1']).toBeDefined();
    });

    it('handles empty local data', () => {
      const local = {};
      const server = {
        'block-1': { userAnswer: 'server answer', complete: true, accuracy: 90 },
      };

      const result = resolveGradeConflict(local, server);
      expect(result.resolved).toBe(true);
      // Server data preserved as base
      expect(result.mergedData!['block-1'].userAnswer).toBe('server answer');
    });

    it('preserves offline grading flag', () => {
      const local = {
        'block-1': { userAnswer: 'answer', complete: true, accuracy: 88, gradedOffline: true },
      };
      const server = {
        'block-1': { userAnswer: 'old', complete: false, accuracy: 85 },
      };

      const result = resolveGradeConflict(local, server);
      expect(result.mergedData!['block-1'].gradedOffline).toBe(true);
      expect(result.mergedData!['block-1'].accuracy).toBe(88);
    });
  });
});
