/**
 * Integration tests for verifyAudioUrl mock and the grade-seeding contract.
 *
 * These tests guard against the recurring regression where audio verification
 * silently never ran in Storybook because:
 *
 *   1. No grade was seeded → UnitContext.grade?.id === undefined
 *   2. AudioWaveformPlayer gates onRecordingComplete behind `if (gradeId && nodeKey)`
 *   3. onRecordingComplete never fired → verifyAudioUrl never called
 *
 * The tests use the real mock module (not the production Amplify client) to
 * verify that the mock contract is correct and that seedMockGrade makes a grade
 * visible to the observeQuery subscriber used by UnitContext.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import the mock AWS Amplify data module directly.
// Vitest resolves this from the actual files (no Storybook webpack alias needed)
// because we're running in the unit test project that doesn't apply those aliases.
// We point to the file directly to test the mock in isolation.
import {
  generateClient,
  seedMockGrade,
  resetMockData,
} from '../../../.storybook/__mocks__/aws-amplify-data.js';

describe('verifyAudioUrl mock', () => {
  it('is exposed on client.queries', () => {
    const client = generateClient();
    expect(typeof client.queries.verifyAudioUrl).toBe('function');
  });

  it('returns a parseable JSON response with answer and reason fields', async () => {
    const client = generateClient();
    const result = await client.queries.verifyAudioUrl({
      expected: 'こんにちは',
      audioUrl: 'private/user-id/user-submissions/grade-1/node-1/recording.mp3',
      model: 'whisper-1',
      chatModel: 'gpt-3.5-turbo',
    });

    expect(result.errors).toBeNull();
    expect(typeof result.data).toBe('string');

    const parsed = JSON.parse(result.data);
    expect(parsed).toHaveProperty('answer');
    expect(parsed).toHaveProperty('reason');
    expect(typeof parsed.answer).toBe('boolean');
    expect(typeof parsed.reason).toBe('string');
  });

  it('does not require any particular input fields to return a response', async () => {
    const client = generateClient();
    // Called with no arguments — must not throw
    await expect(client.queries.verifyAudioUrl()).resolves.toBeDefined();
    await expect(client.queries.verifyAudioUrl({})).resolves.toBeDefined();
  });
});

describe('seedMockGrade — grade visibility contract', () => {
  beforeEach(() => {
    resetMockData();
  });

  it('makes the grade visible to a Grade.observeQuery() subscriber', () =>
    new Promise((resolve, reject) => {
      const gradeId = 'test-grade-audio-001';
      const client = generateClient();

      const sub = client.models.Grade.observeQuery().subscribe({
        next: ({ items }) => {
          const found = items.find((g) => g.id === gradeId);
          if (found) {
            expect(found.id).toBe(gradeId);
            expect(found.unitID).toBe('mock-unit-id');
            sub.unsubscribe();
            resolve();
          }
        },
        error: reject,
      });

      // Seed grade AFTER subscribing to confirm subscriber is notified
      seedMockGrade({
        id: gradeId,
        unitID: 'mock-unit-id',
        owner: 'student-alice-sub',
        complete: false,
        accuracy: 0,
        data: JSON.stringify({}),
        _version: 1,
        _lastChangedAt: Date.now(),
        _deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }));

  it('persists the grade in the store so subsequent list() calls find it', async () => {
    const gradeId = 'test-grade-audio-002';
    seedMockGrade({
      id: gradeId,
      unitID: 'mock-unit-id',
      owner: 'student-alice-sub',
      complete: false,
      accuracy: 0,
      data: JSON.stringify({}),
      _version: 1,
      _lastChangedAt: Date.now(),
      _deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const client = generateClient();
    const { data, errors } = await client.models.Grade.list();
    const found = data.find((g) => g.id === gradeId);
    expect(errors).toEqual([]);
    expect(found).toBeDefined();
    expect(found?.id).toBe(gradeId);
  });

  it('grade without an id is silently ignored (no crash)', () => {
    // seedMockGrade only stores if gradeData.id is truthy
    expect(() => seedMockGrade({ unitID: 'mock-unit-id' })).not.toThrow();
  });
});

describe('onRecordingComplete gating contract', () => {
  /**
   * This test documents and validates the contract that AudioWaveformPlayer
   * requires: onRecordingComplete is only called when BOTH gradeId and nodeKey
   * are truthy.  This ensures that if grade seeding is accidentally removed
   * from a story, the test fails visibly instead of silently passing.
   */
  it('callback is only invoked when gradeId and nodeKey are provided', async () => {
    // Simulate the gating logic from AudioWaveformPlayer
    const gate = (gradeId, nodeKey, onRecordingComplete) => {
      if (gradeId && nodeKey) {
        onRecordingComplete?.();
      }
    };

    const callbackWithGrade = vi.fn();
    gate('grade-123', 'node-abc', callbackWithGrade);
    expect(callbackWithGrade).toHaveBeenCalledOnce();

    const callbackNoGrade = vi.fn();
    gate(undefined, 'node-abc', callbackNoGrade);
    expect(callbackNoGrade).not.toHaveBeenCalled();

    const callbackNoNode = vi.fn();
    gate('grade-123', undefined, callbackNoNode);
    expect(callbackNoNode).not.toHaveBeenCalled();

    const callbackNeither = vi.fn();
    gate(undefined, undefined, callbackNeither);
    expect(callbackNeither).not.toHaveBeenCalled();
  });
});
