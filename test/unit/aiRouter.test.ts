/**
 * Unit tests for AIRouter — transparent routing between cloud and on-device AI.
 *
 * Tests the routing logic: online → cloud message, offline → on-device,
 * offline + no model → heuristic fallback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the OfflineChatEngine
const mockIsAvailable = vi.fn();
const mockChat = vi.fn();
const mockGradeAnswer = vi.fn();

vi.mock('../../src/offline/OfflineChatEngine', () => ({
  offlineChatEngine: {
    isAvailable: () => mockIsAvailable(),
    chat: (...args: any[]) => mockChat(...args),
    gradeAnswer: (...args: any[]) => mockGradeAnswer(...args),
  },
  gradeAnswerHeuristic: vi.fn((expected: string, student: string) => ({
    score: expected === student ? 100 : 50,
    feedback: 'heuristic',
    accurate: expected === student,
    gradedOffline: true,
  })),
}));

describe('AIRouter', () => {
  let router: typeof import('../../src/offline/AIRouter');
  let originalOnLine: boolean;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    originalOnLine = navigator.onLine;
    router = await import('../../src/offline/AIRouter');
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true, configurable: true });
    router.aiRouter.configure({});
  });

  describe('getCurrentBackend', () => {
    it('returns "cloud" when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      const backend = await router.aiRouter.getCurrentBackend();
      expect(backend).toBe('cloud');
    });

    it('returns "on-device" when offline and model available', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      mockIsAvailable.mockResolvedValue(true);
      const backend = await router.aiRouter.getCurrentBackend();
      expect(backend).toBe('on-device');
    });

    it('returns "heuristic" when offline and no model', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      mockIsAvailable.mockResolvedValue(false);
      const backend = await router.aiRouter.getCurrentBackend();
      expect(backend).toBe('heuristic');
    });

    it('returns "on-device" when preferOffline is set', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      router.aiRouter.configure({ preferOffline: true });
      mockIsAvailable.mockResolvedValue(true);
      const backend = await router.aiRouter.getCurrentBackend();
      expect(backend).toBe('on-device');
    });
  });

  describe('chat', () => {
    it('yields cloud message when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      const messages = [{ role: 'user' as const, content: 'hello' }];
      const context = { unitName: 'Test', vocabulary: [], questions: [] };

      const chunks: string[] = [];
      for await (const chunk of router.aiRouter.chat(messages, context)) {
        chunks.push(chunk);
      }
      expect(chunks.join('')).toContain('online');
    });

    it('delegates to offlineChatEngine when offline + available', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      mockIsAvailable.mockResolvedValue(true);

      async function* fakeChat() {
        yield 'Hello ';
        yield 'from offline!';
      }
      mockChat.mockReturnValue(fakeChat());

      const messages = [{ role: 'user' as const, content: 'hello' }];
      const context = { unitName: 'Test', vocabulary: [], questions: [] };

      const chunks: string[] = [];
      for await (const chunk of router.aiRouter.chat(messages, context)) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(['Hello ', 'from offline!']);
    });

    it('yields unavailable message when offline + no model', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      mockIsAvailable.mockResolvedValue(false);

      const messages = [{ role: 'user' as const, content: 'hello' }];
      const context = { unitName: 'Test', vocabulary: [], questions: [] };

      const chunks: string[] = [];
      for await (const chunk of router.aiRouter.chat(messages, context)) {
        chunks.push(chunk);
      }
      expect(chunks.join('')).toContain('offline');
    });
  });

  describe('gradeAnswer', () => {
    it('uses offlineChatEngine when available', async () => {
      mockIsAvailable.mockResolvedValue(true);
      mockGradeAnswer.mockResolvedValue({
        score: 85, feedback: 'Good!', accurate: true, gradedOffline: true,
      });

      const result = await router.aiRouter.gradeAnswer({
        studentAnswer: 'photosynthesis',
        expectedAnswer: 'photosynthesis',
        prompt: 'What process converts light to energy?',
        type: 'word',
      });
      expect(result.score).toBe(85);
      expect(mockGradeAnswer).toHaveBeenCalled();
    });

    it('falls back to heuristic when no model available', async () => {
      mockIsAvailable.mockResolvedValue(false);

      const result = await router.aiRouter.gradeAnswer({
        studentAnswer: 'test',
        expectedAnswer: 'test',
        prompt: 'What?',
        type: 'word',
      });
      expect(result.gradedOffline).toBe(true);
    });
  });
});
